import '../../../../core/utils/media_url.dart';

class ProductModel {
  final String id;
  final String name;
  final String? description;
  final double price;
  final String currency;
  final String? image;
  final bool hasImage;
  final double ratingAvg;
  final int ratingCount;
  final String? category;
  final bool isActive;
  final int views;
  final int stock;
  final bool freeDelivery;
  final Map<String, dynamic>? store;

  const ProductModel({
    required this.id,
    required this.name,
    this.description,
    this.price = 0,
    this.currency = 'ILS',
    this.image,
    this.hasImage = false,
    this.ratingAvg = 0,
    this.ratingCount = 0,
    this.category,
    this.isActive = true,
    this.views = 0,
    this.stock = 0,
    this.freeDelivery = false,
    this.store,
  });

  String? get imageUrl {
    return resolveProductImage({
      '_id': id,
      'image': image,
      'hasImage': hasImage,
    });
  }

  String? get storeId {
    final s = store;
    if (s == null) return null;
    return (s['_id'] ?? s['id'])?.toString();
  }

  String? get storeName => store?['name']?.toString();

  String? get storeOwnerId {
    final owner = store?['owner'];
    if (owner is Map) {
      return (owner['_id'] ?? owner['id'])?.toString();
    }
    if (owner != null) return owner.toString();
    return null;
  }

  String? get storeRegion => store?['region']?.toString();

  /// Backend cart rule: stock > 0 = managed inventory; stock == 0 = unlimited (legacy).
  bool get isStockManaged => stock > 0;

  bool get isAvailable => isActive && (!isStockManaged || stock > 0);

  /// Max order qty when stock is managed; otherwise up to 99 (sheet clamp).
  int? get maxOrderQuantity => isStockManaged ? stock : null;

  String get availabilityLabel {
    if (!isActive) return 'غير متاح';
    if (isStockManaged) return 'متوفر ($stock)';
    return 'متوفر';
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? storeMap;
    final rawStore = json['store'];
    if (rawStore is Map) {
      storeMap = Map<String, dynamic>.from(rawStore);
    } else if (rawStore != null) {
      storeMap = {'_id': rawStore.toString()};
    }

    return ProductModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: json['description']?.toString(),
      price: double.tryParse(json['price']?.toString() ?? '') ?? 0,
      currency: (json['currency'] ?? 'ILS').toString(),
      image: json['image']?.toString(),
      hasImage: json['hasImage'] == true ||
          (json['image'] != null && json['image'].toString().isNotEmpty),
      ratingAvg: double.tryParse(json['ratingAvg']?.toString() ?? '') ?? 0,
      ratingCount: int.tryParse(json['ratingCount']?.toString() ?? '') ?? 0,
      category: json['category']?.toString(),
      isActive: json['isActive'] != false,
      views: int.tryParse(json['views']?.toString() ?? '') ?? 0,
      stock: int.tryParse(json['stock']?.toString() ?? '') ?? 0,
      freeDelivery: json['freeDelivery'] == true,
      store: storeMap,
    );
  }
}
