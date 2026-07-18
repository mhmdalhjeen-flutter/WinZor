import '../cache/local_cache_service.dart';

/// Persists onboarding completion flags (Hive app_settings box).
class OnboardingStorage {
  static const mainTourKey = 'win_golden_app_onboarding_v1';
  static const marketplaceTourKey = 'win_golden_marketplace_onboarding_v1';

  static bool isMainTourComplete() =>
      LocalCacheService.getBoolSetting(mainTourKey);

  static bool isMarketplaceTourComplete() =>
      LocalCacheService.getBoolSetting(marketplaceTourKey);

  static Future<void> markMainTourComplete() =>
      LocalCacheService.setBoolSetting(mainTourKey, true);

  static Future<void> markMarketplaceTourComplete() =>
      LocalCacheService.setBoolSetting(marketplaceTourKey, true);

  static Future<void> resetAll() async {
    await LocalCacheService.removeSetting(mainTourKey);
    await LocalCacheService.removeSetting(marketplaceTourKey);
  }
}
