import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/intro/presentation/pages/intro_page.dart';
import '../../features/explore/presentation/pages/explore_page.dart';
import '../../features/explore/presentation/pages/store_detail_page.dart';
import '../../features/offers/presentation/pages/offer_detail_page.dart';
import '../../features/offers/presentation/pages/offer_reel_page.dart';
import '../../features/marketplace/presentation/pages/marketplace_page.dart';
import '../../features/marketplace/presentation/pages/bazaar_detail_page.dart';
import '../../features/marketplace/presentation/pages/marketplace_publish_page.dart';
import '../../features/draws/presentation/pages/draws_page.dart';
import '../../features/profile/presentation/pages/user_center_page.dart';
import '../../features/home/data/models/offer_model.dart';
import '../../features/marketplace/data/models/bazaar_listing_model.dart';
import '../widgets/main_shell.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const HomePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/explore',
              builder: (context, state) => const ExplorePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/marketplace',
              builder: (context, state) => const MarketplacePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/draws',
              builder: (context, state) => const DrawsPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/center',
              builder: (context, state) => const UserCenterPage(),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/store/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return StoreDetailPage(id: id);
      },
    ),
    GoRoute(
      path: '/offer/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return OfferDetailPage(id: id);
      },
    ),
    GoRoute(
      path: '/marketplace/publish',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        final type = extra?['type'] as String? ?? 'sell';
        final editingListing = extra?['editingListing'] as BazaarListingModel?;
        return MarketplacePublishPage(transactionType: type, editingListing: editingListing);
      },
    ),
    GoRoute(
      path: '/marketplace/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return BazaarDetailPage(id: id);
      },
    ),
    GoRoute(
      path: '/reels',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        final offers = extra?['offers'] as List<OfferModel>? ?? [];
        final initialIndex = extra?['initialIndex'] as int? ?? 0;
        return OfferReelPage(offers: offers, initialIndex: initialIndex);
      },
    ),
    GoRoute(
      path: '/intro',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const IntroPage(),
    ),
    GoRoute(
      path: '/login',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const RegisterPage(),
    ),
  ],
);
