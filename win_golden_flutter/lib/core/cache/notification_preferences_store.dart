import 'local_cache_service.dart';

/// Local notification preference toggles (frontend-only, no backend changes).
class NotificationPreferencesStore {
  NotificationPreferencesStore._();

  static const _prefix = 'notif_pref_';

  static const types = <String, String>{
    'orders': 'الطلبات',
    'order_status': 'حالة الطلب',
    'offers': 'العروض',
    'store_announcements': 'إعلانات المتاجر',
    'marketplace': 'السوق',
    'points': 'النقاط',
    'competitions': 'المسابقات',
    'rewards': 'الجوائز',
    'general': 'إشعارات عامة',
  };

  static bool isEnabled(String type) {
    return LocalCacheService.getBoolSetting('$_prefix$type', defaultValue: true);
  }

  static Future<void> setEnabled(String type, bool enabled) async {
    await LocalCacheService.setBoolSetting('$_prefix$type', enabled);
  }

  static Map<String, bool> all() {
    return {for (final t in types.keys) t: isEnabled(t)};
  }
}
