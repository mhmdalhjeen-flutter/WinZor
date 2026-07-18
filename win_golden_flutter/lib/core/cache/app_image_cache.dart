import 'package:flutter_cache_manager/flutter_cache_manager.dart';

class AppImageCache {
  static const String key = 'win_golden_image_cache';

  static final CacheManager instance = CacheManager(
    Config(
      key,
      stalePeriod: const Duration(days: 15),
      maxNrOfCacheObjects: 500,
      repo: JsonCacheInfoRepository(databaseName: key),
      fileService: HttpFileService(),
    ),
  );

  // توفير التسمية التي تطلبها ملفات app_image و reel_slide
  static CacheManager get manager => instance;
  
  static void configure() {
    // تم استدعاؤه في main.dart لتهيئة الإعدادات
  }
}
