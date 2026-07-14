class BazaarListingModel {
  final String id;
  final String title;
  final String? description;
  final double price;
  final String currency;
  final String condition; // used, new
  final String category;
  final List<String> images;
  final int mainImageIndex;
  final String transactionType; // sell, exchange, rent, custom
  final String status; // pending, approved, rejected, expired
  final String? contactPhone;
  final bool freeDelivery;
  final List<String> keywords;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final bool isFavorited;
  final bool isVisible;
  final String? adminReviewNote;
  final dynamic seller; // User object or ID (React: listing.seller)
  final dynamic user; // legacy alias some payloads may use
  final dynamic regionId;
  final dynamic subRegionId;

  BazaarListingModel({
    required this.id,
    required this.title,
    this.description,
    required this.price,
    required this.currency,
    required this.condition,
    required this.category,
    required this.images,
    this.mainImageIndex = 0,
    required this.transactionType,
    required this.status,
    this.contactPhone,
    this.freeDelivery = false,
    this.keywords = const [],
    this.createdAt,
    this.expiresAt,
    this.isFavorited = false,
    this.isVisible = false,
    this.adminReviewNote,
    this.seller,
    this.user,
    this.regionId,
    this.subRegionId,
  });

  String? get sellerId {
    final raw = seller ?? user;
    if (raw == null) return null;
    if (raw is Map) return (raw['_id'] ?? raw['id'])?.toString();
    return raw.toString();
  }

  /// Browse responses expose `mainImage` instead of full `images[]` — support both.
  factory BazaarListingModel.fromJson(Map<String, dynamic> json) {
    List<String> images = [];
    final rawImages = json['images'];
    if (rawImages is List && rawImages.isNotEmpty) {
      images = rawImages.map((e) => e.toString()).where((e) => e.isNotEmpty).toList();
    } else if (json['mainImage'] != null && json['mainImage'].toString().isNotEmpty) {
      images = [json['mainImage'].toString()];
    }

    final adminReview = json['adminReview'];
    String? note;
    if (adminReview is Map) {
      note = adminReview['note']?.toString();
    }

    return BazaarListingModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse('${json['price']}') ?? 0,
      currency: (json['currency'] ?? 'ILS').toString(),
      condition: (json['condition'] ?? 'used').toString(),
      category: (json['category'] ?? '').toString(),
      images: images,
      mainImageIndex: (json['mainImageIndex'] is num) ? (json['mainImageIndex'] as num).toInt() : 0,
      transactionType: (json['transactionType'] ?? 'sell').toString(),
      status: (json['status'] ?? 'pending').toString(),
      contactPhone: json['contactPhone']?.toString(),
      freeDelivery: json['freeDelivery'] == true,
      keywords: (json['keywords'] is List)
          ? (json['keywords'] as List).map((e) => e.toString()).toList()
          : const [],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt'].toString()) : null,
      isFavorited: json['isFavorited'] == true || json['favorited'] == true,
      isVisible: json['isVisible'] == true,
      adminReviewNote: note?.isNotEmpty == true ? note : null,
      seller: json['seller'],
      user: json['user'],
      regionId: json['regionId'],
      subRegionId: json['subRegionId'],
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'price': price,
        'currency': currency,
        'condition': condition,
        'category': category,
        'images': images,
        'mainImageIndex': mainImageIndex,
        'transactionType': transactionType,
        'status': status,
        'contactPhone': contactPhone,
        'freeDelivery': freeDelivery,
        'keywords': keywords,
        'createdAt': createdAt?.toIso8601String(),
        'expiresAt': expiresAt?.toIso8601String(),
        'isFavorited': isFavorited,
        'isVisible': isVisible,
        'adminReview': adminReviewNote != null ? {'note': adminReviewNote} : null,
        'seller': seller,
        'user': user,
        'regionId': regionId,
        'subRegionId': subRegionId,
      };
}
