import '../../../../core/api/api_client.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/cached_fetch.dart';
import '../../../../core/cache/store_notification_filter.dart';
import '../models/notification_model.dart';

class NotificationsRepository {
  final ApiClient _apiClient;

  NotificationsRepository(this._apiClient);

  Future<List<NotificationModel>> getNotifications({
    Map<String, dynamic>? params,
  }) async {
    final response = await _apiClient.dio.get(
      '/notifications',
      queryParameters: params,
    );
    final data = response.data;
    final list = data is Map ? data['notifications'] as List? : null;
    return (list ?? [])
        .whereType<Map>()
        .map((e) => NotificationModel.fromJson(Map<String, dynamic>.from(e)))
        .where((n) => n.id.isNotEmpty)
        .where(StoreNotificationFilter.shouldDisplay)
        .toList();
  }

  Future<int> getUnreadCount({bool forceNetwork = false}) async {
    return CachedFetch.load<int>(
      key: CacheKeys.unreadNotifications,
      forceNetwork: forceNetwork,
      staleAfter: const Duration(minutes: 3),
      network: () async {
        final response = await _apiClient.dio.get('/notifications/unread-count');
        final data = response.data;
        if (data is Map) {
          final count = data['count'];
          if (count is int) return count;
          return int.tryParse(count?.toString() ?? '') ?? 0;
        }
        return 0;
      },
      fromCache: (raw) {
        if (raw is int) return raw;
        if (raw is Map) {
          final count = raw['count'];
          if (count is int) return count;
          return int.tryParse(count?.toString() ?? '') ?? 0;
        }
        return int.tryParse(raw?.toString() ?? '') ?? 0;
      },
      toCache: (count) => count,
    );
  }

  Future<void> markRead(String id) async {
    await _apiClient.dio.patch('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _apiClient.dio.patch('/notifications/read-all');
  }
}
