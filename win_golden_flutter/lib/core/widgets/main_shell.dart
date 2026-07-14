import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/notifications/presentation/widgets/notification_listener_host.dart';
import 'app_header.dart';
import 'bottom_nav_bar.dart';

class MainShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuth = ref.watch(authProvider).isAuth;

    return NotificationListenerHost(
      child: Scaffold(
        appBar: AppHeader(isAuth: isAuth),
        body: navigationShell,
        bottomNavigationBar: isAuth
            ? BottomNavBar(navigationShell: navigationShell)
            : null,
      ),
    );
  }
}
