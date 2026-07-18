enum ReelItemType { category, offer, product }

/// Unified reel viewer entry — offer, product, or category intro (matches React __itemType).
class ReelViewerItem {
  final ReelItemType type;
  final String id;
  final Map<String, dynamic> raw;

  const ReelViewerItem({
    required this.type,
    required this.id,
    required this.raw,
  });

  String get title {
    if (type == ReelItemType.category) {
      return raw['__categoryName']?.toString() ?? '';
    }
    if (type == ReelItemType.product) {
      return raw['name']?.toString() ?? '';
    }
    return raw['title']?.toString() ?? '';
  }

  String? get categoryName => raw['__categoryName']?.toString();
  String? get categoryIcon => raw['__categoryIcon']?.toString();

  Map<String, dynamic>? get store {
    final s = raw['store'];
    if (s is Map) return Map<String, dynamic>.from(s);
    return null;
  }

  String? get storeId {
    final s = store;
    if (s != null) return (s['_id'] ?? s['id'])?.toString();
    return raw['store']?.toString();
  }

  factory ReelViewerItem.category({
    required String categoryId,
    required String categoryName,
    String? categoryIcon,
  }) {
    return ReelViewerItem(
      type: ReelItemType.category,
      id: 'category-$categoryId',
      raw: {
        '_id': 'category-$categoryId',
        '__itemType': 'category',
        '__categoryId': categoryId,
        '__categoryName': categoryName,
        '__categoryIcon': categoryIcon,
      },
    );
  }

  factory ReelViewerItem.offer(Map<String, dynamic> offer, {String? categoryName, String? categoryId}) {
    final id = (offer['_id'] ?? offer['id'] ?? '').toString();
    return ReelViewerItem(
      type: ReelItemType.offer,
      id: id,
      raw: {
        ...offer,
        '__itemType': 'offer',
        if (categoryName != null) '__categoryName': categoryName,
        if (categoryId != null) '__categoryId': categoryId,
      },
    );
  }

  factory ReelViewerItem.product(Map<String, dynamic> product, {String? categoryName, String? categoryId}) {
    final id = (product['_id'] ?? product['id'] ?? '').toString();
    return ReelViewerItem(
      type: ReelItemType.product,
      id: id,
      raw: {
        ...product,
        '__itemType': 'product',
        if (categoryName != null) '__categoryName': categoryName,
        if (categoryId != null) '__categoryId': categoryId,
      },
    );
  }
}

class ReelViewerState {
  final List<ReelViewerItem> items;
  final int initialIndex;

  const ReelViewerState({
    required this.items,
    required this.initialIndex,
  });
}

/// React `buildMultiCategoryViewerState` — flatten reels into one vertical list.
ReelViewerState buildMultiCategoryViewerState(
  List<dynamic> reels, {
  required int reelIndex,
  required int offerIndex,
  int? productIndex,
}) {
  final safeReels = reels.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  final items = <ReelViewerItem>[];

  for (final reel in safeReels) {
    final categoryId = (reel['categoryId'] ?? reel['categoryName'] ?? '').toString();
    final categoryName = reel['categoryName']?.toString() ?? 'تصنيف';
    final categoryIcon = reel['categoryIcon']?.toString();

    items.add(ReelViewerItem.category(
      categoryId: categoryId,
      categoryName: categoryName,
      categoryIcon: categoryIcon,
    ));

    for (final rawOffer in (reel['offers'] as List? ?? [])) {
      if (rawOffer is! Map) continue;
      items.add(ReelViewerItem.offer(
        Map<String, dynamic>.from(rawOffer),
        categoryName: categoryName,
        categoryId: categoryId,
      ));
    }

    for (final rawProduct in (reel['products'] as List? ?? [])) {
      if (rawProduct is! Map) continue;
      items.add(ReelViewerItem.product(
        Map<String, dynamic>.from(rawProduct),
        categoryName: categoryName,
        categoryId: categoryId,
      ));
    }
  }

  var initialIndex = 0;
  for (var i = 0; i < reelIndex && i < safeReels.length; i++) {
    final r = safeReels[i];
    initialIndex += 1 +
        ((r['offers'] as List?)?.length ?? 0) +
        ((r['products'] as List?)?.length ?? 0);
  }

  if (productIndex != null && reelIndex < safeReels.length) {
    final r = safeReels[reelIndex];
    initialIndex += 1 + ((r['offers'] as List?)?.length ?? 0) + productIndex;
  } else if (reelIndex < safeReels.length) {
    initialIndex += 1 + offerIndex;
  }

  if (items.isEmpty) {
    return const ReelViewerState(items: [], initialIndex: 0);
  }

  return ReelViewerState(
    items: items,
    initialIndex: initialIndex.clamp(0, items.length - 1),
  );
}

int findReelIndex(List<dynamic> reels, Map<String, dynamic> reel) {
  final key = reel['categoryId'] ?? reel['categoryName'];
  return reels.indexWhere((r) {
    if (r is! Map) return false;
    return (r['categoryId'] ?? r['categoryName']) == key;
  });
}
