import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_brand_assets.dart';
import '../onboarding/onboarding_target.dart';
import '../onboarding/onboarding_targets.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/notifications/presentation/providers/notifications_providers.dart';
import '../../features/chat/presentation/providers/chat_providers.dart';
import '../../features/honor/presentation/widgets/points_balance_sheet.dart';
import '../../features/profile/data/models/user_center_models.dart';
import '../../features/profile/presentation/providers/user_center_providers.dart';

class AppHeader extends ConsumerWidget implements PreferredSizeWidget {
  final bool isAuth;
  const AppHeader({super.key, this.isAuth = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final showAuth = isAuth && auth.isAuth;
    final notifAsync = showAuth ? ref.watch(unreadNotificationsCountProvider) : null;
    final notifCount = notifAsync?.asData?.value ?? 0;
    final chatAsync = showAuth ? ref.watch(unreadChatCountProvider) : null;
    final chatCount = chatAsync?.asData?.value ?? 0;

    return AppBar(
      title: showAuth ? _buildAuthTitle() : _buildLogoTitle(),
      actions: showAuth
          ? [_buildAuthHeaderIcons(context, ref, notifCount, chatCount)]
          : _buildGuestActions(context),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(0.8),
        child: Container(
          color: const Color(0xFFE5E7EB),
          height: 0.8,
        ),
      ),
    );
  }

  /// Soft red + blue + green wavy gradient, matching React points celebration bg.
  Widget _buildPointsBadge(Map<String, dynamic>? user) {
    final points = user?['points'] ?? 0;
    return Container(
      constraints: const BoxConstraints(maxHeight: 42),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.55)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        gradient: const LinearGradient(
          begin: Alignment(-1.0, -0.8),
          end: Alignment(1.0, 1.0),
          colors: [
            Color(0xFFFECDD3), // soft red / rose
            Color(0xFFBFDBFE), // soft blue
            Color(0xFFBBF7D0), // soft green
            Color(0xFFFDE68A),
            Color(0xFFFBCFE8),
          ],
          stops: [0.0, 0.28, 0.52, 0.78, 1.0],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            left: -8,
            bottom: -10,
            child: Container(
              width: 40,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFEF4444).withOpacity(0.18),
              ),
            ),
          ),
          Positioned(
            right: -6,
            top: -8,
            child: Container(
              width: 36,
              height: 26,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF3B82F6).withOpacity(0.2),
              ),
            ),
          ),
          Positioned(
            right: 28,
            bottom: -6,
            child: Container(
              width: 28,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF22C55E).withOpacity(0.14),
              ),
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white.withOpacity(0.5)),
                ),
                clipBehavior: Clip.antiAlias,
                child: const BrandLogo.compact(width: 28, height: 28),
              ),
              const SizedBox(width: 6),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'تسوق واربح',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F2937),
                      fontFamily: 'Cairo',
                      height: 1.1,
                    ),
                  ),
                  Text(
                    '$points',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                      height: 1.1,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.add_circle, color: AppColors.primary, size: 16),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLogoTitle() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: const BrandLogo.compact(width: 36, height: 36),
        ),
        const SizedBox(width: 8),
        const Text(
          'Win GoldenStore',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: AppColors.textMain,
          ),
        ),
      ],
    );
  }

  Widget _buildAuthTitle() {
    return const BrandLogo.compact(width: 36, height: 36);
  }

  Widget _buildAuthHeaderIcons(
    BuildContext context,
    WidgetRef ref,
    int notifCount,
    int chatCount,
  ) {
    final auth = ref.watch(authProvider);

    return OnboardingTarget(
      targetKey: OnboardingTargets.headerIcons,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () => showPointsBalanceSheet(context),
            child: _buildPointsBadge(auth.user),
          ),
          const SizedBox(width: 4),
          _buildIconButton(
            context,
            Icons.notifications_none,
            const Color(0xFFDC2626),
            const Color(0xFFFFF1F2),
            const Color(0xFFFEE2E2),
            notifCount,
            onTap: () => context.push('/notifications'),
          ),
          _buildIconButton(
            context,
            LucideIcons.shoppingCart,
            const Color(0xFFD97706),
            const Color(0xFFFFFBEB),
            const Color(0xFFFED7AA),
            0,
            onTap: () => context.push('/orders'),
          ),
          _buildIconButton(
            context,
            LucideIcons.messageCircle,
            const Color(0xFF2563EB),
            const Color(0xFFF0F9FF),
            const Color(0xFFBFDBFE),
            chatCount,
            filled: true,
            onTap: () => context.push('/chat'),
          ),
          _buildMoreButton(context, ref),
          const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildIconButton(
    BuildContext context,
    IconData icon,
    Color iconColor,
    Color bgFrom,
    Color bgTo,
    int badge, {
    VoidCallback? onTap,
    bool filled = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2.0),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.all(4),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [bgFrom, bgTo.withOpacity(0.85)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white.withOpacity(0.6)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 22,
                  fill: filled ? 0.2 : 0.0,
                ),
              ),
            ),
            if (badge > 0)
              Positioned(
                top: -2,
                left: -2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text(
                    badge > 99 ? '99+' : badge.toString(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMoreButton(BuildContext context, WidgetRef ref) {
    final settings =
        ref.watch(platformSettingsProvider).asData?.value ??
            const PlatformSettings();

    return PopupMenuButton<String>(
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onSelected: (value) async {
        switch (value) {
          case 'favorites':
            context.push('/favorites');
            break;
          case 'wheel':
            context.push('/wheel');
            break;
          case 'competitions':
            context.push('/competitions');
            break;
          case 'honor':
            context.push('/honor');
            break;
          case 'pointsStores':
            context.push('/stores/points');
            break;
          case 'chests':
            context.push('/chests');
            break;
          case 'center':
            context.go('/center');
            break;
          case 'logout':
            await ref.read(authProvider.notifier).logout();
            if (context.mounted) context.go('/login');
            break;
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'favorites',
          child: _MoreItem(icon: LucideIcons.heart, label: 'المفضلة', color: Color(0xFFDB2777)),
        ),
        if (settings.showWheelInHeader)
          const PopupMenuItem(
            value: 'wheel',
            child: _MoreItem(icon: LucideIcons.circleDot, label: 'عجلة الحظ', color: Color(0xFFDB2777)),
          ),
        if (settings.showCompetitions)
          const PopupMenuItem(
            value: 'competitions',
            child: _MoreItem(icon: LucideIcons.medal, label: 'مسابقات', color: Color(0xFF7C3AED)),
          ),
        const PopupMenuItem(
          value: 'honor',
          child: _MoreItem(icon: LucideIcons.trophy, label: 'لوحة الشرف', color: Color(0xFFB45309)),
        ),
        const PopupMenuItem(
          value: 'pointsStores',
          child: _MoreItem(icon: LucideIcons.store, label: 'متاجر النقاط', color: Color(0xFF4F46E5)),
        ),
        if (settings.showRewards)
          const PopupMenuItem(
            value: 'chests',
            child: _MoreItem(icon: LucideIcons.gift, label: 'صناديق الجوائز', color: Color(0xFFD97706)),
          ),
        const PopupMenuItem(
          value: 'center',
          child: _MoreItem(icon: LucideIcons.settings, label: 'الإعدادات', color: Color(0xFF475569)),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem(
          value: 'logout',
          child: _MoreItem(icon: LucideIcons.logOut, label: 'تسجيل الخروج', color: Color(0xFFDC2626)),
        ),
      ],
      child: Container(
          margin: const EdgeInsets.only(left: 4),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'المزيد',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2937),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: const Center(
                  child: Text(
                    '+',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
    );
  }

  List<Widget> _buildGuestActions(BuildContext context) {
    return [
      TextButton(
        onPressed: () => context.push('/register'),
        child: const Text(
          'إنشاء حساب',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w900,
            fontSize: 11,
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.only(right: 8.0, left: 8.0),
        child: ElevatedButton(
          onPressed: () => context.push('/login'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            minimumSize: const Size(0, 36),
          ),
          child: const Text(
            'دخول',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
          ),
        ),
      ),
    ];
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _MoreItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MoreItem({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 10),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
