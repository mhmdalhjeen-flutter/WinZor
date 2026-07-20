import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../onboarding/onboarding_target.dart';
import '../onboarding/onboarding_targets.dart';
import '../../features/profile/data/models/user_center_models.dart';
import '../../features/profile/presentation/providers/user_center_providers.dart';

class BottomNavBar extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const BottomNavBar({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings =
        ref.watch(platformSettingsProvider).asData?.value ??
            const PlatformSettings();

    // Shell branch indices must stay stable (StatefulShellRoute).
    final items = <_NavSpec>[
      const _NavSpec(
        index: 0,
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: 'الرئيسية',
      ),
      const _NavSpec(
        index: 1,
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        label: 'المتاجر',
      ),
      if (settings.showMarketplace)
        const _NavSpec(
          index: 2,
          icon: Icons.shopping_bag_outlined,
          activeIcon: Icons.shopping_bag,
          label: 'السوق',
        ),
      if (settings.showRewards)
        const _NavSpec(
          index: 3,
          icon: Icons.card_giftcard_outlined,
          activeIcon: Icons.card_giftcard,
          label: 'الجوائز',
        ),
      const _NavSpec(
        index: 4,
        icon: Icons.stars_outlined,
        activeIcon: Icons.stars,
        label: 'نقاطي',
        isSpecial: true,
      ),
    ];

    // If admin hid the current branch, return to Home (same as removing nav entry).
    final current = navigationShell.currentIndex;
    final visibleIndexes = items.map((e) => e.index).toSet();
    if (!visibleIndexes.contains(current)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) navigationShell.goBranch(0);
      });
    }

    return OnboardingTarget(
      targetKey: OnboardingTargets.bottomNav,
      child: Container(
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
              for (final item in items)
                _buildNavItem(context, item),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, _NavSpec item) {
    final bool isActive = navigationShell.currentIndex == item.index;

    final navBody = GestureDetector(
      onTap: () => navigationShell.goBranch(
        item.index,
        initialLocation: item.index == navigationShell.currentIndex,
      ),
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
              color: item.isSpecial && isActive
                  ? Colors.amber.withOpacity(0.1)
                  : isActive
                      ? AppColors.primary.withOpacity(0.1)
                      : Colors.transparent,
              border: item.isSpecial && isActive
                  ? Border.all(color: Colors.amber.withOpacity(0.6), width: 1)
                  : null,
              gradient: item.isSpecial && isActive
                  ? const LinearGradient(
                      colors: [
                        Color(0xFFF5F3FF),
                        Color(0xFFFFFBEB),
                        Color(0xFFFEF2F2)
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
            ),
            child: Icon(
              isActive ? item.activeIcon : item.icon,
              size: 24,
              color: isActive ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            item.label,
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
    );

    return Expanded(
      child: item.index == 0
          ? OnboardingTarget(
              targetKey: OnboardingTargets.bottomNavHome,
              child: navBody,
            )
          : navBody,
    );
  }
}

class _NavSpec {
  final int index;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSpecial;

  const _NavSpec({
    required this.index,
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.isSpecial = false,
  });
}
