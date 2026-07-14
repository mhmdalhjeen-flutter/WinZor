import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/wheel_providers.dart';
import '../widgets/wheel_visual.dart';
import '../../data/models/wheel_models.dart';

/// React Inventory page — wheel wins store ("مخزن جوائزي"), required by wheel flow.
class WheelWinsPage extends ConsumerWidget {
  const WheelWinsPage({super.key});

  static const _statusLabels = {
    'pending': 'بانتظار الاستلام',
    'contacted': 'تم التواصل',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغاة',
  };

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

    final winsAsync = ref.watch(wheelWinsProvider);
    final settingsShowWheel = true; // wheel link when empty — React platform setting

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/wheel');
                      }
                    },
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFF3F4F6)),
                    ),
                    icon: const Icon(LucideIcons.chevronRight, size: 20),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'مخزن جوائزي',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(wheelWinsProvider);
                  await ref.read(wheelWinsProvider.future);
                },
                child: winsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => ListView(
                    children: [
                      const SizedBox(height: 80),
                      const Text(
                        'تعذّر تحميل جوائزك',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      TextButton(
                        onPressed: () => ref.invalidate(wheelWinsProvider),
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
                  data: (wins) {
                    if (wins.isEmpty) {
                      return ListView(
                        children: [
                          const SizedBox(height: 80),
                          Icon(LucideIcons.package,
                              size: 64, color: Colors.grey.shade200),
                          const SizedBox(height: 16),
                          Text(
                            settingsShowWheel
                                ? 'مخزنك فارغ — جرّب عجلة الحظ!'
                                : 'مخزنك فارغ',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          if (settingsShowWheel)
                            TextButton(
                              onPressed: () => context.push('/wheel'),
                              child: const Text(
                                'عجلة الحظ',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                        ],
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                      itemCount: wins.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        return _WinCard(
                          win: wins[index],
                          statusLabel: _statusLabels[wins[index].deliveryStatus] ??
                              wins[index].deliveryStatus,
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WinCard extends StatelessWidget {
  final WheelWin win;
  final String statusLabel;

  const _WinCard({required this.win, required this.statusLabel});

  @override
  Widget build(BuildContext context) {
    final color = parseWheelColor(win.prize?.color ?? '#6366F1');
    final date = win.wonAt != null
        ? DateFormat('yyyy/MM/dd').format(win.wonAt!)
        : '—';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(width: 16, color: color),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(18),
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
                              win.prize?.icon ?? '🎁',
                              style: const TextStyle(fontSize: 24),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              win.prizeName,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            Row(
                              children: [
                                const Icon(LucideIcons.clock,
                                    size: 10, color: Color(0xFF9CA3AF)),
                                const SizedBox(width: 4),
                                Text(
                                  date,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF9CA3AF),
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          statusLabel,
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (win.prize?.description != null &&
                      win.prize!.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      win.prize!.description!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
