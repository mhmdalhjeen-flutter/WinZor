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
import '../../features/notifications/presentation/widgets/notification_panel.dart';
import '../../features/orders/presentation/providers/orders_providers.dart';
import 'more_menu_sheet.dart';

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
    final cartCount = showAuth ? ref.watch(cartItemCountProvider) : 0;

    return AppBar(
      toolbarHeight: 56,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      backgroundColor: Colors.transparent,
      flexibleSpace: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.centerRight,
            end: Alignment.centerLeft,
            colors: [
              Color(0xFFE8F5EE),
              Color(0xFFF0F9F4),
              Color(0xFFFEF9E7),
              Color(0xFFFDF6E3),
            ],
            stops: [0.0, 0.38, 0.72, 1.0],
          ),
          border: Border(
            bottom: BorderSide(color: Color(0xFFE8E4DA), width: 0.6),
          ),
        ),
      ),
      title: showAuth ? _buildAuthTitle() : _buildLogoTitle(),
      actions: showAuth
          ? [_buildAuthHeaderIcons(context, ref, notifCount, chatCount, cartCount)]
          : _buildGuestActions(context),
    );
  }

  /// Compact points badge — smaller than previous header widget.
  Widget _buildPointsBadge(Map<String, dynamic>? user) {
    final points = user?['points'] ?? 0;
    return Container(
      constraints: const BoxConstraints(maxHeight: 32),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.6)),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFBBF7D0),
            Color(0xFFFDE68A),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.stars_rounded, color: Color(0xFF059669), size: 12),
          const SizedBox(width: 3),
          Text(
            '$points',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
              height: 1,
            ),
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
    return const BrandLogo.compact(width: 44, height: 44);
  }

  Widget _buildAuthHeaderIcons(
    BuildContext context,
    WidgetRef ref,
    int notifCount,
    int chatCount,
    int cartCount,
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
            onTap: () => showNotificationPanel(context, ref),
          ),
          _buildIconButton(
            context,
            LucideIcons.shoppingCart,
            const Color(0xFF059669),
            const Color(0xFFECFDF5),
            const Color(0xFFBBF7D0),
            cartCount,
            onTap: () => context.push('/cart'),
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
    return GestureDetector(
      onTap: () => MoreMenuSheet.show(context, ref),
      child: Container(
        margin: const EdgeInsets.only(left: 4),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.55),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE8E4DA)),
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
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(width: 4),
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: const Color(0xFF374151),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Center(
                child: Text(
                  '+',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    height: 1,
                  ),
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
      IconButton(
        onPressed: () => context.push('/cart'),
        icon: const Icon(LucideIcons.shoppingCart, size: 22, color: Color(0xFF374151)),
      ),
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
  Size get preferredSize => const Size.fromHeight(56);
}
