import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../features/auth/presentation/providers/auth_gate_provider.dart';
import '../../features/auth/utils/auth_gate_messages.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/profile/data/models/user_center_models.dart';
import '../../features/profile/presentation/providers/user_center_providers.dart';
import 'referral_cards_sheet.dart';

import 'smooth_bottom_sheet.dart';

class MoreMenuSheet extends ConsumerWidget {
  const MoreMenuSheet({super.key});

  static Future<void> show(BuildContext context, WidgetRef ref) {
    return showSmoothBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const MoreMenuSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings =
        ref.watch(platformSettingsProvider).asData?.value ??
            const PlatformSettings();
    final auth = ref.watch(authProvider);
    final referralCode = auth.user?['referralCode']?.toString();

    final items = <_MoreTile>[
      _MoreTile(
        icon: LucideIcons.heart,
        label: 'المفضلة',
        colors: const [Color(0xFFFDF2F8), Color(0xFFDB2777)],
        onTap: () => context.push('/favorites'),
      ),
      _MoreTile(
        icon: LucideIcons.gift,
        label: 'كروت مجانية',
        colors: const [Color(0xFFFFFBEB), Color(0xFFD97706)],
        onTap: () {
          if (!auth.isAuth) {
            ref.read(authGateProvider.notifier).runWithAuth(
                  () => showReferralCardsSheet(context, referralCode: referralCode),
                  message: AuthGateMessages.referral,
                );
            return;
          }
          showReferralCardsSheet(context, referralCode: referralCode);
        },
      ),
      if (settings.showWheelInHeader)
        _MoreTile(
          icon: LucideIcons.circleDot,
          label: 'عجلة الحظ',
          colors: const [Color(0xFFFDF2F8), Color(0xFFDB2777)],
          onTap: () => context.push('/wheel'),
        ),
      if (settings.showCompetitions)
        _MoreTile(
          icon: LucideIcons.medal,
          label: 'مسابقات',
          colors: const [Color(0xFFF5F3FF), Color(0xFF7C3AED)],
          onTap: () => context.push('/competitions'),
        ),
      _MoreTile(
        icon: LucideIcons.trophy,
        label: 'لوحة الشرف',
        colors: const [Color(0xFFFFFBEB), Color(0xFFB45309)],
        onTap: () => context.push('/honor'),
      ),
      _MoreTile(
        icon: LucideIcons.store,
        label: 'متاجر النقاط',
        colors: const [Color(0xFFEEF2FF), Color(0xFF4F46E5)],
        onTap: () => context.push('/stores/points'),
      ),
      if (settings.showRewards)
        _MoreTile(
          icon: LucideIcons.gift,
          label: 'صناديق الجوائز',
          colors: const [Color(0xFFFFFBEB), Color(0xFFD97706)],
          onTap: () => context.push('/chests'),
        ),
      _MoreTile(
        icon: LucideIcons.settings,
        label: 'الإعدادات',
        colors: const [Color(0xFFF8FAFC), Color(0xFF475569)],
        onTap: () => context.push('/settings'),
      ),
      if (auth.isAuth)
        _MoreTile(
          icon: LucideIcons.logOut,
          label: 'تسجيل الخروج',
          colors: const [Color(0xFFFEF2F2), Color(0xFFDC2626)],
          onTap: () async {
            await ref.read(authProvider.notifier).logout();
            if (context.mounted) context.go('/');
          },
        )
      else
        _MoreTile(
          icon: LucideIcons.logIn,
          label: 'تسجيل الدخول',
          colors: const [Color(0xFFEFF6FF), Color(0xFF2563EB)],
          onTap: () => context.push('/login'),
        ),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE5E7EB),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'المزيد',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                  color: Color(0xFF111827),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.x, size: 18, color: Color(0xFF6B7280)),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFFF3F4F6),
                  minimumSize: const Size(32, 32),
                  padding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.92,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.pop(context);
                    item.onTap();
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Ink(
                    decoration: BoxDecoration(
                      color: const Color(0xFFFAFAFA),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: item.colors[0],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(item.icon, size: 18, color: item.colors[1]),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item.label,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            color: Color(0xFF374151),
                            height: 1.15,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _MoreTile {
  final IconData icon;
  final String label;
  final List<Color> colors;
  final VoidCallback onTap;

  const _MoreTile({
    required this.icon,
    required this.label,
    required this.colors,
    required this.onTap,
  });
}
