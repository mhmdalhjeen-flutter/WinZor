class CartLineItem {
  final String itemId;
  final String itemType;
  final String name;
  final int quantity;
  final double unitPrice;
  final double lineTotal;
  final String? imageUrl;
  final String currency;

  const CartLineItem({
    required this.itemId,
    required this.itemType,
    this.name = '—',
    this.quantity = 1,
    this.unitPrice = 0,
    this.lineTotal = 0,
    this.imageUrl,
    this.currency = 'ILS',
  });

  factory CartLineItem.fromJson(Map<String, dynamic> json) {
    final item = json['item'];
    final itemMap = item is Map ? Map<String, dynamic>.from(item) : null;
    final images = itemMap?['images'];
    String? img;
    if (itemMap?['image'] != null) {
      img = itemMap!['image'].toString();
    } else if (images is List && images.isNotEmpty) {
      img = images.first.toString();
    }

    return CartLineItem(
      itemId: (itemMap?['_id'] ?? itemMap?['id'] ?? '').toString(),
      itemType: (json['itemType'] ?? '').toString(),
      name: (itemMap?['name'] ?? itemMap?['title'] ?? '—').toString(),
      quantity: int.tryParse(json['quantity']?.toString() ?? '') ?? 1,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '') ?? 0,
      lineTotal: double.tryParse(json['lineTotal']?.toString() ?? '') ?? 0,
      imageUrl: img,
      currency: (itemMap?['currency'] ?? 'ILS').toString(),
    );
  }
}

class CartStoreContainer {
  final String id;
  final String storeId;
  final String storeName;
  final String? storePhone;
  final String? storeImageUrl;
  final double total;
  final String customerNotes;
  final List<CartLineItem> items;

  const CartStoreContainer({
    required this.id,
    required this.storeId,
    this.storeName = '',
    this.storePhone,
    this.storeImageUrl,
    this.total = 0,
    this.customerNotes = '',
    this.items = const [],
  });

  factory CartStoreContainer.fromJson(Map<String, dynamic> json) {
    final store = json['store'];
    final storeMap = store is Map ? Map<String, dynamic>.from(store) : null;
    final rawItems = json['items'];
    final items = <CartLineItem>[];
    if (rawItems is List) {
      for (final e in rawItems) {
        if (e is Map) items.add(CartLineItem.fromJson(Map<String, dynamic>.from(e)));
      }
    }

    return CartStoreContainer(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      storeId: (storeMap?['_id'] ?? store ?? '').toString(),
      storeName: (json['storeName'] ?? storeMap?['name'] ?? '').toString(),
      storePhone: storeMap?['phone']?.toString(),
      storeImageUrl: storeMap?['image']?.toString() ?? storeMap?['logo']?.toString(),
      total: double.tryParse(json['total']?.toString() ?? '') ?? 0,
      customerNotes: (json['customerNotes'] ?? '').toString(),
      items: items,
    );
  }
}

class CartModel {
  final List<CartStoreContainer> containers;
  final double total;

  const CartModel({this.containers = const [], this.total = 0});

  factory CartModel.fromJson(Map<String, dynamic> json) {
    final raw = json['containers'];
    final containers = <CartStoreContainer>[];
    if (raw is List) {
      for (final e in raw) {
        if (e is Map) {
          containers.add(CartStoreContainer.fromJson(Map<String, dynamic>.from(e)));
        }
      }
    }
    return CartModel(
      containers: containers,
      total: double.tryParse(json['total']?.toString() ?? '') ?? 0,
    );
  }

  /// Total units across all store containers.
  int get totalQuantity => containers.fold(
        0,
        (sum, c) => sum + c.items.fold(0, (s, i) => s + i.quantity),
      );

  int get storeCount => containers.length;

  int get productLineCount =>
      containers.fold(0, (sum, c) => sum + c.items.length);

  bool get hasItems => totalQuantity > 0;
}
