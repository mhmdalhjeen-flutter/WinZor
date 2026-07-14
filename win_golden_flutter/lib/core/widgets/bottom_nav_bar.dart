import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';

class BottomNavBar extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const BottomNavBar({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        border: const Border(
          top: BorderSide(color: Color(0xFFE5E7EB), width: 0.8),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                context,
                index: 0,
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'الرئيسية',
              ),
              _buildNavItem(
                context,
                index: 1,
                icon: Icons.storefront_outlined,
                activeIcon: Icons.storefront,
                label: 'المتاجر',
              ),
              _buildNavItem(
                context,
                index: 2,
                icon: Icons.shopping_bag_outlined,
                activeIcon: Icons.shopping_bag,
                label: 'السوق',
              ),
              _buildNavItem(
                context,
                index: 3,
                icon: Icons.card_giftcard_outlined,
                activeIcon: Icons.card_giftcard,
                label: 'الجوائز',
              ),
              _buildNavItem(
                context,
                index: 4,
                icon: Icons.stars_outlined,
                activeIcon: Icons.stars,
                label: 'نقاطي',
                isSpecial: true,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    bool isSpecial = false,
  }) {
    final bool isActive = navigationShell.currentIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => _onTap(context, index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: isSpecial && isActive
                    ? Colors.amber.withOpacity(0.1)
                    : isActive
                        ? AppColors.primary.withOpacity(0.1)
                        : Colors.transparent,
                border: isSpecial && isActive
                    ? Border.all(color: Colors.amber.withOpacity(0.6), width: 1)
                    : null,
                gradient: isSpecial && isActive
                    ? const LinearGradient(
                        colors: [Color(0xFFF5F3FF), Color(0xFFFFFBEB), Color(0xFFFEF2F2)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
              ),
              child: Icon(
                isActive ? activeIcon : icon,
                size: 24,
                color: isActive ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
                color: isActive ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
            if (isActive)
              Container(
                height: 2,
                width: 16,
                margin: const EdgeInsets.only(top: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              )
            else
              const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }

  void _onTap(BuildContext context, int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}
