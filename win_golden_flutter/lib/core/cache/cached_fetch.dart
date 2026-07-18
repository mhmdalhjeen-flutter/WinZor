import 'dart:async';
import 'local_cache_service.dart';

class CachedFetch {
  CachedFetch._();

  static final Set<String> _inFlight = {};

  static Future<T> load<T>({
    required String key,
    required Future<T> Function() network,
    required T Function(dynamic raw) fromCache,
    required dynamic Function(T value) toCache,
    Duration staleAfter = const Duration(minutes: 10),
    bool forceNetwork = false,
    void Function(T fresh)? onBackgroundRefresh,
  }) async {
    final cachedRaw = LocalCacheService.get(key);

    if (!forceNetwork && cachedRaw != null) {
      final cached = fromCache(cachedRaw);
      unawaited(
        _refreshIfNeeded(
          key: key,
          staleAfter: staleAfter,
          network: network,
          toCache: toCache,
          onBackgroundRefresh: onBackgroundRefresh,
        ),
      );
      return cached;
    }

    try {
      final fresh = await network();
      await LocalCacheService.save(key, toCache(fresh));
      return fresh;
    } catch (e) {
      if (cachedRaw != null) return fromCache(cachedRaw);
      rethrow;
    }
  }

  static Future<void> _refreshIfNeeded<T>({
    required String key,
    required Duration staleAfter,
    required Future<T> Function() network,
    required dynamic Function(T value) toCache,
    void Function(T fresh)? onBackgroundRefresh,
  }) async {
    if (_inFlight.contains(key)) return;
    if (!LocalCacheService.isStale(key, staleAfter)) return;

    _inFlight.add(key);
    try {
      final fresh = await network();
      await LocalCacheService.save(key, toCache(fresh));
      if (onBackgroundRefresh != null) {
        onBackgroundRefresh(fresh);
      }
    } catch (_) {
    } finally {
      _inFlight.remove(key);
    }
  }
}
