/// Stable Hive keys for offline cache (bounded — not full DB).
abstract final class CacheKeys {
  static const regionsTree = 'regions_tree';
  static String categories(String type) => 'categories_$type';

  static String reels({String? regionId, String? categoryId}) =>
      'reels_${regionId ?? 'all'}_${categoryId ?? 'all'}';

  static String storesBrowse({String? query, String? regionId, String? categoryId}) =>
      'stores_browse_${query ?? ''}_${regionId ?? 'all'}_${categoryId ?? 'all'}';

  static String storeDetail(String id) => 'store_detail_$id';
  static String offerDetail(String id) => 'offer_detail_$id';
  static String productDetail(String id) => 'product_detail_$id';

  static const userProfile = 'user_profile';
  static const userCenterData = 'user_center_data';
  static const recentPointSources = 'recent_point_sources';
  static const unreadNotifications = 'unread_notifications_count';
  static const unreadChat = 'unread_chat_count';

  static const recentOffers = 'recent_offers';
  static const recentProducts = 'recent_products';
  static const visitedStores = 'visited_stores';
  static const guestCart = 'guest_cart';
}
