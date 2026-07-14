import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_brand_assets.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/notifications/presentation/providers/notifications_providers.dart';
import '../../features/chat/presentation/providers/chat_providers.dart';
import '../../features/honor/presentation/widgets/points_balance_sheet.dart';

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
      title: showAuth
          ? GestureDetector(
              onTap: () => showPointsBalanceSheet(context),
              child: _buildPointsBadge(auth.user),
            )
          : _buildLogoTitle(),
      actions: showAuth
          ? _buildAuthActions(context, ref, notifCount, chatCount)
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

  Widget _buildPointsBadge(Map<String, dynamic>? user) {
    final points = user?['points'] ?? 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const BrandLogo.compact(width: 22, height: 22),
          const SizedBox(width: 4),
          Text(
            '$points',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: AppColors.textMain,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.add_circle, color: AppColors.primary, size: 16),
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

  List<Widget> _buildAuthActions(
    BuildContext context,
    WidgetRef ref,
    int notifCount,
    int chatCount,
  ) {
    return [
      _buildIconButton(
        context,
        Icons.notifications_none,
        Colors.red,
        notifCount,
        onTap: () => context.push('/notifications'),
      ),
      _buildIconButton(
        context,
        Icons.favorite_border,
        Colors.pink,
        0,
        onTap: () => context.push('/favorites'),
      ),
      _buildIconButton(
        context,
        Icons.receipt_long_outlined,
        Colors.amber,
        0,
        onTap: () => context.push('/orders'),
      ),
      _buildIconButton(
        context,
        Icons.chat_bubble_outline,
        Colors.blue,
        chatCount,
        onTap: () => context.push('/chat'),
      ),
      _buildMoreButton(context, ref),
      const SizedBox(width: 8),
    ];
  }

  Widget _buildIconButton(
    BuildContext context,
    IconData icon,
    Color color,
    int badge, {
    VoidCallback? onTap,
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
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.6)),
              ),
              child: Icon(icon, color: color, size: 22),
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
    return PopupMenuButton<String>(
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onSelected: (value) async {
        switch (value) {
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
          value: 'wheel',
          child: _MoreItem(icon: LucideIcons.circleDot, label: 'عجلة الحظ', color: Color(0xFFDB2777)),
        ),
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
