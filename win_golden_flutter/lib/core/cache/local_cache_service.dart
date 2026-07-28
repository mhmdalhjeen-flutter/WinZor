import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

import 'cache_keys.dart';

/// Fast local JSON cache + lightweight user settings (Hive).
class LocalCacheService {
  static const String _cacheBoxName = 'app_cache';
  static const String _settingsBoxName = 'app_settings';

  static const int maxRecentOffers = 30;
  static const int maxRecentProducts = 30;
  static const int maxVisitedStores = 20;

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_cacheBoxName);
    await Hive.openBox(_settingsBoxName);
  }

  // ── Data cache ────────────────────────────────────────────────────────────

  static Future<void> save(String key, dynamic data) async {
    final box = Hive.box(_cacheBoxName);
    await box.put(
      key,
      jsonEncode({
        'data': data,
        'savedAt': DateTime.now().millisecondsSinceEpoch,
      }),
    );
  }

  static dynamic getData(String key) {
    final entry = _readEntry(key);
    return entry?['data'];
  }

  /// Backward-compatible read (legacy entries without wrapper).
  static dynamic get(String key) {
    final raw = Hive.box(_cacheBoxName).get(key);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map && decoded.containsKey('data')) {
        return decoded['data'];
      }
      return decoded;
    } catch (_) {
      return null;
    }
  }

  static DateTime? getSavedAt(String key) {
    final ms = _readEntry(key)?['savedAt'];
    if (ms is! int) return null;
    return DateTime.fromMillisecondsSinceEpoch(ms);
  }

  static bool isStale(String key, Duration maxAge) {
    final savedAt = getSavedAt(key);
    if (savedAt == null) return true;
    return DateTime.now().difference(savedAt) > maxAge;
  }

  static Future<void> remove(String key) async {
    await Hive.box(_cacheBoxName).delete(key);
  }

  static Map<String, dynamic>? _readEntry(String key) {
    final raw = Hive.box(_cacheBoxName).get(key);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {}
    return null;
  }

  // ── Recent / visited (bounded LRU) ────────────────────────────────────────

  static Future<void> rememberRecentOffer(Map<String, dynamic> offer) async {
    await _pushBounded(CacheKeys.recentOffers, offer, maxRecentOffers);
  }

  static Future<void> rememberRecentProduct(Map<String, dynamic> product) async {
    await _pushBounded(CacheKeys.recentProducts, product, maxRecentProducts);
  }

  static Future<void> rememberVisitedStore(String storeId, Map<String, dynamic> payload) async {
    final list = List<Map<String, dynamic>>.from(getData(CacheKeys.visitedStores) ?? []);
    list.removeWhere((e) => (e['id'] ?? e['_id'])?.toString() == storeId);
    list.insert(0, {'id': storeId, ...payload});
    if (list.length > maxVisitedStores) {
      list.removeRange(maxVisitedStores, list.length);
    }
    await save(CacheKeys.visitedStores, list);
  }

  static Future<void> _pushBounded(
    String key,
    Map<String, dynamic> item,
    int max,
  ) async {
    final id = (item['_id'] ?? item['id'])?.toString();
    final list = List<Map<String, dynamic>>.from(getData(key) ?? []);
    if (id != null) {
      list.removeWhere((e) => (e['_id'] ?? e['id'])?.toString() == id);
    }
    list.insert(0, item);
    if (list.length > max) list.removeRange(max, list.length);
    await save(key, list);
  }

  // ── Store notification prefs (local — no backend change) ──────────────────

  static Future<void> setStoreNotificationEnabled(String storeId, bool enabled) async {
    final box = Hive.box(_settingsBoxName);
    final prefs = Map<String, dynamic>.from(
      box.get('store_notification_prefs', defaultValue: <String, dynamic>{}),
    );
    if (enabled) {
      prefs[storeId] = true;
    } else {
      prefs.remove(storeId);
    }
    await box.put('store_notification_prefs', prefs);
  }

  static bool isStoreNotificationEnabled(String storeId) {
    final box = Hive.box(_settingsBoxName);
    final prefs = box.get('store_notification_prefs', defaultValue: {});
    if (prefs is! Map) return false;
    return prefs[storeId] == true;
  }

  static List<String> getStoreNotificationEnabledIds() {
    final box = Hive.box(_settingsBoxName);
    final prefs = box.get('store_notification_prefs', defaultValue: {});
    if (prefs is! Map) return [];
    return prefs.entries
        .where((e) => e.value == true)
        .map((e) => e.key.toString())
        .toList();
  }

  static Future<void> toggleStoreNotification(String storeId, bool enabled) =>
      setStoreNotificationEnabled(storeId, enabled);

  static bool isStoreFollowed(String storeId) => isStoreNotificationEnabled(storeId);

  static List<String> getFollowedStoreIds() => getStoreNotificationEnabledIds();

  // ── Onboarding flags ──────────────────────────────────────────────────────

  static bool getBoolSetting(String key, {bool defaultValue = false}) {
    final box = Hive.box(_settingsBoxName);
    final v = box.get(key);
    if (v == null) return defaultValue;
    return v == true;
  }

  static Future<void> setBoolSetting(String key, bool value) async {
    await Hive.box(_settingsBoxName).put(key, value);
  }

  static Future<void> removeSetting(String key) async {
    await Hive.box(_settingsBoxName).delete(key);
  }
}
