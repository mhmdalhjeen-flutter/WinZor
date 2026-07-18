import '../../features/notifications/data/models/notification_model.dart';
import 'local_cache_service.dart';

/// Store-scoped notifications are filtered locally (no backend change).
abstract final class StoreNotificationFilter {
  static const _alwaysAllowed = {
    'order_point_gift',
    'referral_batch',
    'competition_draw',
    'message',
    'chat',
    'chat_message',
    'order',
    'order_update',
    'wheel',
    'reward',
    'verification',
    'general',
    'system',
    'account',
    'bazaar_listing_approved',
    'bazaar_listing_rejected',
    'bazaar_listing_expired',
    'bazaar_renewal_prompt',
  };

  static const _storeScoped = {
    'new_offer',
    'new_product',
    'store_new_offer',
    'store_new_product',
    'offer_renewed',
    'offer_expiring',
    'offer_expired',
  };

  static bool shouldDisplay(NotificationModel notification) {
    if (_alwaysAllowed.contains(notification.type)) return true;
    if (!_isStoreScoped(notification)) return true;

    final storeId = _extractStoreId(notification);
    if (storeId == null || storeId.isEmpty) return false;
    return LocalCacheService.isStoreNotificationEnabled(storeId);
  }

  static bool _isStoreScoped(NotificationModel n) {
    if (_storeScoped.contains(n.type)) return true;
    if (_extractStoreId(n) == null) return false;
    final t = n.type.toLowerCase();
    return t.contains('offer') || t.contains('product');
  }

  static String? _extractStoreId(NotificationModel n) {
    final d = n.data;
    final raw = d['storeId'] ?? d['store'] ?? d['store_id'];
    if (raw == null) return null;
    if (raw is Map) {
      return (raw['_id'] ?? raw['id'])?.toString();
    }
    return raw.toString();
  }
}
