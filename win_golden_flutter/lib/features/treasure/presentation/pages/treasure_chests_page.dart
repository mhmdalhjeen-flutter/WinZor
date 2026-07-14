import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/treasure_box_model.dart';
import '../providers/treasure_providers.dart';
import '../widgets/chest_result_dialog.dart';

/// React `TreasureChests.jsx` — `/chests`
class TreasureChestsPage extends ConsumerWidget {
  const TreasureChestsPage({super.key});

  static const _styleColors = [
    [Color(0xFFB45309), Color(0xFF78350F)],
    [Color(0xFF94A3B8), Color(0xFF475569)],
    [Color(0xFFFACC15), Color(0xFFEA580C)],
  ];
  static const _styleIcons = ['📦', '🥈', '🏆'];

  void _onOpenClick(
    BuildContext context,
    WidgetRef ref,
    String boxId,
  ) {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      context.push('/login');
      return;
    }
    ref.read(verificationGateProvider.notifier).runWithVerification(
          () => _open(context, ref, boxId),
        );
  }

  Future<void> _open(
    BuildContext context,
    WidgetRef ref,
    String boxId,
  ) async {
    final outcome = await ref.read(treasureActionsProvider).openBox(boxId);
    if (!context.mounted) return;

    if (outcome.error != null) {
      final gate = ref.read(verificationGateProvider.notifier);
      if (gate.handleApiVerificationError(
        null,
        () => _open(context, ref, boxId),
        explicitCode: outcome.code,
      )) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            outcome.error!,
            style: const TextStyle(fontFamily: 'Cairo'),
          ),
        ),
      );
      return;
    }

    if (outcome.result != null) {
      await showChestResultDialog(
        context: context,
        result: outcome.result!,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: ElevatedButton(
              onPressed: () => context.push('/login'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text(
                'تسجيل الدخول',
                style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ),
      );
    }

    final boxesAsync = ref.watch(availableTreasureBoxesProvider);
    final openingId = ref.watch(treasureOpeningIdProvider);
    final energy = auth.user?['energy'] ?? 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(availableTreasureBoxesProvider);
            await ref.read(availableTreasureBoxesProvider.future);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/center');
                          }
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFFF3F4F6)),
                        ),
                        icon: const Icon(LucideIcons.chevronRight, size: 20),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'صناديق الجوائز',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                color: Color(0xFF1F2937),
                              ),
                            ),
                            Text(
                              'تصفّح الصناديق — الفتح يتطلب توثيق',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Cairo',
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.sparkles,
                                size: 16, color: AppColors.primary, fill: 1),
                            const SizedBox(width: 6),
                            Text(
                              '$energy طاقة',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              ...boxesAsync.when(
                loading: () => [
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(height: 10),
                          Text(
                            'جاري تحميل الصناديق...',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                error: (_, __) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'تعذّر تحميل الصناديق',
                              style: TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            TextButton(
                              onPressed: () =>
                                  ref.invalidate(availableTreasureBoxesProvider),
                              child: const Text(
                                'إعادة المحاولة',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
                data: (boxes) {
                  if (boxes.isEmpty) {
                    return [
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(28),
                              border:
                                  Border.all(color: const Color(0xFFF3F4F6)),
                            ),
                            child: const Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.gift,
                                    size: 48, color: Color(0xFFE5E7EB)),
                                SizedBox(height: 12),
                                Text(
                                  'لا توجد صناديق متاحة حالياً',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ];
                  }

                  return [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final box = boxes[index];
                            final colors =
                                _styleColors[index % _styleColors.length];
                            final icon =
                                _styleIcons[index % _styleIcons.length];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: _ChestCard(
                                box: box,
                                colors: colors,
                                icon: icon,
                                opening: openingId == box.id,
                                onOpen: () => _onOpenClick(context, ref, box.id),
                              ),
                            );
                          },
                          childCount: boxes.length,
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 32),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(24),
                            border:
                                Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDBEAFE),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(LucideIcons.gift,
                                    color: Color(0xFF2563EB), size: 24),
                              ),
                              const SizedBox(width: 14),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'كيف تعمل الصناديق؟',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'Cairo',
                                        color: Color(0xFF1E3A8A),
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'يمكنك مشاهدة الصناديق بعد تسجيل الدخول. فتح الصندوق يتطلب توثيق الحساب عند تفعيله من المنصة. المكافآت تُضاف إلى مخزن بطاقاتك.',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'Cairo',
                                        color: Color(0xFF1D4ED8),
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ];
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChestCard extends StatelessWidget {
  final TreasureBoxModel box;
  final List<Color> colors;
  final String icon;
  final bool opening;
  final VoidCallback onOpen;

  const _ChestCard({
    required this.box,
    required this.colors,
    required this.icon,
    required this.opening,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: colors.last.withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      box.title,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      box.typeLabel,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Cairo',
                        color: Colors.white.withOpacity(0.7),
                        letterSpacing: 1.2,
                      ),
                    ),
                    if (box.description != null &&
                        box.description!.trim().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        box.description!,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Cairo',
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                    if (box.storeName != null &&
                        box.storeName!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'برعاية ${box.storeName}',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Cairo',
                          color: Colors.white.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Text(icon, style: const TextStyle(fontSize: 44)),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.trophy,
                    size: 16, color: Color(0xFFFDE047)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    box.costLabel,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      color: Colors.white,
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: opening ? null : onOpen,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF111827),
                    disabledBackgroundColor: Colors.white70,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 4,
                  ),
                  child: opening
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'افتح الآن',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
