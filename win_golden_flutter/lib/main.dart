import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api/api_client.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/startup_splash_gate.dart';
import 'core/cache/local_cache_service.dart';
import 'core/cache/app_image_cache.dart';
import 'core/cache/background_sync_host.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/auth/presentation/widgets/auth_gate_host.dart';
import 'features/verification/presentation/widgets/verification_gate_host.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Local Cache (Hive)
  await LocalCacheService.init();
  AppImageCache.configure();

  final container = ProviderContainer();

  // Match React axios 401 fallback: clear session + go to /login (if not already there).
  ApiClient.onSessionExpired = () {
    final location = appRouter.routerDelegate.currentConfiguration.uri.path;
    if (location.contains('/login')) return;

    container.read(authProvider.notifier).clearLocalSession();
    appRouter.go('/login');
  };

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Win Golden',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AuthGateHost(
            child: VerificationGateHost(
              child: BackgroundSyncHost(
                child: StartupSplashGate(
                  child: child ?? const SizedBox.shrink(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
