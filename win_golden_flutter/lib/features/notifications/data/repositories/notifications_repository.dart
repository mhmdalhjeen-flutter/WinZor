import '../../../../core/api/api_client.dart';
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
        .toList();
  }

  Future<int> getUnreadCount() async {
    final response = await _apiClient.dio.get('/notifications/unread-count');
    final data = response.data;
    if (data is Map) {
      final count = data['count'];
      if (count is int) return count;
      return int.tryParse(count?.toString() ?? '') ?? 0;
    }
    return 0;
  }

  Future<void> markRead(String id) async {
    await _apiClient.dio.patch('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _apiClient.dio.patch('/notifications/read-all');
  }
}
