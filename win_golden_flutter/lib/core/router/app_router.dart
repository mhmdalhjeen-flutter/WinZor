import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/change_password_page.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/verify_email_page.dart';
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
import '../../features/competitions/presentation/pages/competitions_page.dart';
import '../../features/competitions/presentation/pages/competition_detail_page.dart';
import '../../features/wheel/presentation/pages/lucky_wheel_page.dart';
import '../../features/wheel/presentation/pages/wheel_wins_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/chat/presentation/pages/chats_page.dart';
import '../../features/orders/presentation/pages/orders_page.dart';
import '../../features/products/presentation/pages/product_detail_page.dart';
import '../../features/favorites/presentation/pages/favorites_page.dart';
import '../../features/treasure/presentation/pages/treasure_chests_page.dart';
import '../../features/honor/presentation/pages/honor_board_page.dart';
import '../../features/points_stores/presentation/pages/points_program_stores_page.dart';
import '../../features/points_stores/presentation/pages/store_quick_search_page.dart';
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
      path: '/profile',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) => '/center',
    ),
    GoRoute(
      path: '/wallet',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) => '/center',
    ),
    GoRoute(
      path: '/personalization',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) => '/center',
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
    GoRoute(
      path: '/forgot-password',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ForgotPasswordPage(),
    ),
    GoRoute(
      path: '/change-password',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ChangePasswordPage(),
    ),
    GoRoute(
      path: '/verify-email',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        return VerifyEmailPage(
          token: state.uri.queryParameters['token'],
          uid: state.uri.queryParameters['uid'],
        );
      },
    ),
    GoRoute(
      path: '/competitions',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CompetitionsPage(),
    ),
    GoRoute(
      path: '/competitions/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return CompetitionDetailPage(id: id);
      },
    ),
    GoRoute(
      path: '/wheel',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const LuckyWheelPage(),
    ),
    GoRoute(
      path: '/spinWheel',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) => '/wheel',
    ),
    GoRoute(
      path: '/inventory',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const WheelWinsPage(),
    ),
    GoRoute(
      path: '/notifications',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const NotificationsPage(),
    ),
    GoRoute(
      path: '/chat',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ChatsPage(),
    ),
    GoRoute(
      path: '/chat/:convId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['convId'];
        return ChatsPage(initialConvId: id);
      },
    ),
    GoRoute(
      path: '/orders',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const OrdersPage(),
    ),
    GoRoute(
      path: '/favorites',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const FavoritesPage(),
    ),
    GoRoute(
      path: '/chests',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const TreasureChestsPage(),
    ),
    GoRoute(
      path: '/honor',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const HonorBoardPage(),
    ),
    GoRoute(
      path: '/stores/points',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const PointsProgramStoresPage(),
    ),
    GoRoute(
      path: '/stores/points-program',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) => '/stores/points',
    ),
    GoRoute(
      path: '/stores/search',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const StoreQuickSearchPage(),
    ),
    // Alias after dedicated `/stores/points|search` routes so they win first.
    GoRoute(
      path: '/stores/:id',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) {
        final id = state.pathParameters['id'];
        if (id == null || id.isEmpty) return '/explore';
        return '/store/$id';
      },
    ),
    GoRoute(
      path: '/cart',
      parentNavigatorKey: _rootNavigatorKey,
      redirect: (context, state) => '/orders',
    ),
    GoRoute(
      path: '/product/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return ProductDetailPage(id: id);
      },
    ),
  ],
);
