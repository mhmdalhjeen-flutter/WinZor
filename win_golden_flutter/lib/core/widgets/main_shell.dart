import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/notifications/presentation/widgets/notification_listener_host.dart';
import '../onboarding/onboarding_tour_host.dart';
import 'app_header.dart';
import 'bottom_nav_bar.dart';

class MainShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({
    super.key,
    required this.navigationShell,
  });

  bool get _isOnHomeTab => navigationShell.currentIndex == 0;

  void _handleBack(BuildContext context) {
    final router = GoRouter.of(context);

    // Prefer popping pushed routes (store detail, reels, chat, etc.)
    if (router.canPop()) {
      router.pop();
      return;
    }

    // On another bottom-nav tab → return to Home (do not exit)
    if (!_isOnHomeTab) {
      navigationShell.goBranch(0);
      return;
    }

    // Already on Home with nothing to pop → exit app
    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuth = ref.watch(authProvider).isAuth;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _handleBack(context);
      },
      child: NotificationListenerHost(
        child: Stack(
          children: [
            Scaffold(
              appBar: AppHeader(isAuth: isAuth),
              body: navigationShell,
              bottomNavigationBar: isAuth
                  ? BottomNavBar(navigationShell: navigationShell)
                  : null,
            ),
            if (isAuth)
              Positioned.fill(
                child: OnboardingTourHost(navigationShell: navigationShell),
              ),
          ],
        ),
      ),
    );
  }
}
