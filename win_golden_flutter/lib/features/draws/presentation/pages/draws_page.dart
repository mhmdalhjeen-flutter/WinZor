import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../../verification/utils/verification_api_error.dart';
import '../../data/models/draw_model.dart';
import '../providers/draws_providers.dart';

class DrawsPage extends ConsumerStatefulWidget {
  const DrawsPage({super.key});

  @override
  ConsumerState<DrawsPage> createState() => _DrawsPageState();
}

class _DrawsPageState extends ConsumerState<DrawsPage> {
  String? _toast;

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _toast == msg) setState(() => _toast = null);
    });
  }

  void _onJoinClick(String drawId) {
    ref.read(verificationGateProvider.notifier).runWithVerification(
          () => _join(drawId),
        );
  }

  Future<void> _join(String drawId) async {
    try {
      final result = await ref.read(drawsActionsProvider).join(drawId);
      _showToast(result.message);
    } catch (e) {
      final gate = ref.read(verificationGateProvider.notifier);
      if (gate.handleApiVerificationError(e, () => _join(drawId))) return;
      final msg = VerificationApiError.messageOf(e, 'تعذّر الانضمام للسحب');
      _showToast(msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F5F2),
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'سجّل الدخول لعرض السحوبات',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.push('/login'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text(
                      'تسجيل الدخول',
                      style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final drawsAsync = ref.watch(openDrawsProvider);
    final joiningId = ref.watch(joiningDrawIdProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      body: Stack(
        children: [
          SafeArea(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(openDrawsProvider),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                children: [
                  const Text(
                    'فرصك الذهبية للربح',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'تصفّح السحوبات بحرية — الانضمام يتطلب توثيق الحساب',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF9CA3AF),
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 20),
                  drawsAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (_, __) => _ErrorBox(
                      onRetry: () => ref.invalidate(openDrawsProvider),
                    ),
                    data: (draws) {
                      if (draws.isEmpty) {
                        return const _EmptyBox();
                      }
                      return Column(
                        children: [
                          for (final draw in draws) ...[
                            _DrawCard(
                              draw: draw,
                              joining: joiningId == draw.id,
                              onJoin: () => _onJoinClick(draw.id),
                              onInvite: () => _showToast('شارك رابط المنصة مع أصدقائك!'),
                            ),
                            const SizedBox(height: 16),
                          ],
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  const _VerificationHint(),
                ],
              ),
            ),
          ),
          if (_toast != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 100,
              child: Material(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Text(
                    _toast!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _EmptyBox extends StatelessWidget {
  const _EmptyBox();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: const Column(
        children: [
          Icon(LucideIcons.trophy, size: 48, color: Color(0xFFE5E7EB)),
          SizedBox(height: 12),
          Text(
            'لا توجد سحوبات مفتوحة حالياً',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              color: Color(0xFF6B7280),
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorBox({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFFEE2E2)),
      ),
      child: Column(
        children: [
          const Text(
            'تعذّر تحميل السحوبات',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              color: Color(0xFFDC2626),
              fontFamily: 'Cairo',
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text(
              'إعادة المحاولة',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
                decoration: TextDecoration.underline,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _VerificationHint extends StatelessWidget {
  const _VerificationHint();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFFFEDD5)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.checkCircle2, color: Color(0xFFEA580C), size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'التصفح متاح — التفاعل يحتاج توثيق',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF7C2D12),
                    fontFamily: 'Cairo',
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'يمكنك مشاهدة السحوبات الآن. عند الضغط على «انضم» قد يُطلب توثيق الحساب.',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFC2410C),
                    height: 1.5,
                    fontFamily: 'Cairo',
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

class _DrawCard extends StatelessWidget {
  final DrawModel draw;
  final bool joining;
  final VoidCallback onJoin;
  final VoidCallback onInvite;

  const _DrawCard({
    required this.draw,
    required this.joining,
    required this.onJoin,
    required this.onInvite,
  });

  @override
  Widget build(BuildContext context) {
    final rankLabel = kDrawRankLabels[draw.requiredRank] ??
        draw.requiredRank ??
        'الجميع';
    final remaining = draw.remainingSlots;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(35),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 140,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0x33B91C1C), Color(0xFFE9D5FF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Stack(
              children: [
                const Center(child: Text('🎁', style: TextStyle(fontSize: 56))),
                Positioned(
                  top: 14,
                  right: 14,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.star, size: 12, color: Color(0xFFF97316)),
                        const SizedBox(width: 4),
                        Text(
                          'رتبة $rankLabel',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  draw.name,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
                if (draw.description != null && draw.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    draw.description!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF6B7280),
                      height: 1.5,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        remaining > 0
                            ? 'باقي $remaining مشارك ليكتمل السحب'
                            : 'اكتمل النصاب!',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: Color(0xFF9CA3AF),
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                    const Icon(LucideIcons.users, size: 12, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      '${draw.participantsCount} / ${draw.minParticipants}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: draw.progressPercent / 100,
                    minHeight: 8,
                    backgroundColor: const Color(0xFFF9FAFB),
                    valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: joining ? null : onJoin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: AppColors.primary.withOpacity(0.6),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 4,
                          shadowColor: AppColors.primary.withOpacity(0.3),
                        ),
                        child: joining
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'انضم للسحب الآن',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Cairo',
                                      fontSize: 13,
                                    ),
                                  ),
                                  SizedBox(width: 6),
                                  Icon(LucideIcons.zap, size: 16, color: Colors.white),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onInvite,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: Color(0xFFF3F4F6), width: 2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.share2, size: 16, color: Color(0xFF6B7280)),
                            SizedBox(width: 6),
                            Text(
                              'دعوة',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
