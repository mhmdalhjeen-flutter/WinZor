import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/explore/presentation/providers/explore_providers.dart';
import '../../features/home/presentation/providers/home_providers.dart';
import '../../features/notifications/presentation/providers/notifications_providers.dart';
import 'cache_keys.dart';
import 'connectivity_service.dart';
import 'local_cache_service.dart';

/// Lightweight background refresh — only stale / high-value keys.
class BackgroundSyncService {
  BackgroundSyncService(this._ref);

  final Ref _ref;
  bool _running = false;

  Future<void> refreshLightweight({bool force = false}) async {
    if (_running) return;
    final online = await _ref.read(connectivityServiceProvider).isOnline;
    if (!online) return;

    _running = true;
    try {
      final auth = _ref.read(authProvider);
      final homeRepo = _ref.read(homeRepositoryProvider);

      // Home reels — most visible surface
      if (force || LocalCacheService.isStale(CacheKeys.reels(), const Duration(minutes: 5))) {
        await homeRepo.getOffersReels(forceNetwork: true);
        _ref.invalidate(reelsProvider);
      }

      // Categories + regions change rarely
      if (force || LocalCacheService.isStale(CacheKeys.categories('store'), const Duration(hours: 6))) {
        await homeRepo.getCategories('store', forceNetwork: true);
        _ref.invalidate(storeCategoriesProvider);
      }
      if (force || LocalCacheService.isStale(CacheKeys.regionsTree, const Duration(hours: 6))) {
        await homeRepo.getRegions(forceNetwork: true);
        _ref.invalidate(regionsProvider);
      }

      // Stores browse default view
      if (force || LocalCacheService.isStale(CacheKeys.storesBrowse(), const Duration(minutes: 15))) {
        await _ref.read(exploreRepositoryProvider).browseStores(forceNetwork: true);
        _ref.invalidate(storeBrowseProvider);
      }

      if (auth.isAuth) {
        await _refreshAuthLightweight(force);
      }
    } catch (_) {
      // Silent — cached UI stays visible
    } finally {
      _running = false;
    }
  }

  Future<void> _refreshAuthLightweight(bool force) async {
    if (force || LocalCacheService.isStale(CacheKeys.unreadNotifications, const Duration(minutes: 3))) {
      try {
        await _ref.read(notificationsRepositoryProvider).getUnreadCount(forceNetwork: true);
        _ref.invalidate(unreadNotificationsCountProvider);
      } catch (_) {}
    }

    if (force || LocalCacheService.isStale(CacheKeys.userProfile, const Duration(minutes: 10))) {
      try {
        final res = await _ref.read(apiClientProvider).dio.get('/users/me');
        final data = res.data;
        if (data is Map) {
          await LocalCacheService.save(CacheKeys.userProfile, data);
          final user = data['user'] is Map ? data['user'] : data;
          if (user is Map) {
            _ref.read(authProvider.notifier).updateUser(Map<String, dynamic>.from(user));
          }
        }
      } catch (_) {}
    }
  }
}

final backgroundSyncServiceProvider = Provider<BackgroundSyncService>((ref) {
  return BackgroundSyncService(ref);
});
