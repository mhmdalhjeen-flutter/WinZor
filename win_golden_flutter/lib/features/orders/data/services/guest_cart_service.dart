import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../models/cart_models.dart';
import '../repositories/orders_repository.dart';

/// Local cart for guests — persisted in Hive until login merges to the server.
class GuestCartService {
  GuestCartService._();

  static CartModel load() {
    final raw = LocalCacheService.getData(CacheKeys.guestCart);
    if (raw is! Map) return const CartModel();
    return _cartFromMap(Map<String, dynamic>.from(raw));
  }

  static Future<void> save(CartModel cart) async {
    await LocalCacheService.save(CacheKeys.guestCart, _cartToMap(cart));
  }

  static Future<void> clear() async {
    await LocalCacheService.remove(CacheKeys.guestCart);
  }

  static Future<CartModel> addItem({
    required String itemId,
    required String itemType,
    required int quantity,
    required String name,
    required double unitPrice,
    required String currency,
    String? imageUrl,
    required String storeId,
    String storeName = '',
    String? storeImageUrl,
  }) async {
    var cart = load();
    final qty = quantity.clamp(1, 99);
    final sid = storeId.isNotEmpty ? storeId : 'unknown';

    final containers = cart.containers.map((c) {
      if (c.storeId != sid) return c;
      final items = [...c.items];
      final idx = items.indexWhere(
        (i) => i.itemId == itemId && i.itemType == itemType,
      );
      if (idx >= 0) {
        final existing = items[idx];
        final newQty = (existing.quantity + qty).clamp(1, 99);
        items[idx] = CartLineItem(
          itemId: existing.itemId,
          itemType: existing.itemType,
          name: existing.name,
          quantity: newQty,
          unitPrice: existing.unitPrice,
          lineTotal: existing.unitPrice * newQty,
          imageUrl: existing.imageUrl,
          currency: existing.currency,
        );
      } else {
        items.add(CartLineItem(
          itemId: itemId,
          itemType: itemType,
          name: name,
          quantity: qty,
          unitPrice: unitPrice,
          lineTotal: unitPrice * qty,
          imageUrl: imageUrl,
          currency: currency,
        ));
      }
      return _recomputeContainer(c.copyWith(items: items));
    }).toList();

    if (!containers.any((c) => c.storeId == sid)) {
      containers.add(_recomputeContainer(CartStoreContainer(
        id: 'guest_$sid',
        storeId: sid,
        storeName: storeName.isNotEmpty ? storeName : 'متجر',
        storeImageUrl: storeImageUrl,
        items: [
          CartLineItem(
            itemId: itemId,
            itemType: itemType,
            name: name,
            quantity: qty,
            unitPrice: unitPrice,
            lineTotal: unitPrice * qty,
            imageUrl: imageUrl,
            currency: currency,
          ),
        ],
      )));
    }

    cart = _recomputeCart(CartModel(containers: containers));
    await save(cart);
    return cart;
  }

  static Future<CartModel> updateQuantity({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    if (quantity <= 0) {
      return removeItem(itemId: itemId, itemType: itemType);
    }

    var cart = load();
    final containers = <CartStoreContainer>[];

    for (final c in cart.containers) {
      final items = c.items.map((item) {
        if (item.itemId == itemId && item.itemType == itemType) {
          return CartLineItem(
            itemId: item.itemId,
            itemType: item.itemType,
            name: item.name,
            quantity: quantity.clamp(1, 99),
            unitPrice: item.unitPrice,
            lineTotal: item.unitPrice * quantity.clamp(1, 99),
            imageUrl: item.imageUrl,
            currency: item.currency,
          );
        }
        return item;
      }).toList();
      containers.add(_recomputeContainer(c.copyWith(items: items)));
    }

    cart = _recomputeCart(CartModel(containers: containers));
    await save(cart);
    return cart;
  }

  static Future<CartModel> removeItem({
    required String itemId,
    required String itemType,
  }) async {
    var cart = load();
    final containers = <CartStoreContainer>[];

    for (final c in cart.containers) {
      final items = c.items
          .where((i) => !(i.itemId == itemId && i.itemType == itemType))
          .toList();
      if (items.isNotEmpty) {
        containers.add(_recomputeContainer(c.copyWith(items: items)));
      }
    }

    cart = _recomputeCart(CartModel(containers: containers));
    await save(cart);
    return cart;
  }

  static Future<CartModel> deleteContainer(CartStoreContainer container) async {
    var cart = load();
    cart = _recomputeCart(CartModel(
      containers: cart.containers.where((c) => c.id != container.id).toList(),
    ));
    await save(cart);
    return cart;
  }

  /// Pushes guest items to the authenticated server cart, then clears local storage.
  static Future<void> mergeToServer(OrdersRepository repo) async {
    final guest = load();
    if (!guest.hasItems) return;

    for (final container in guest.containers) {
      for (final item in container.items) {
        try {
          await repo.addItemToCart(
            itemId: item.itemId,
            itemType: item.itemType,
            quantity: item.quantity,
          );
        } catch (_) {
          // Best-effort merge — server cart wins on conflicts.
        }
      }
    }
    await clear();
  }

  static CartStoreContainer _recomputeContainer(CartStoreContainer c) {
    final total = c.items.fold<double>(0, (sum, i) => sum + i.lineTotal);
    return CartStoreContainer(
      id: c.id,
      storeId: c.storeId,
      storeName: c.storeName,
      storePhone: c.storePhone,
      storeImageUrl: c.storeImageUrl,
      total: total,
      customerNotes: c.customerNotes,
      items: c.items,
    );
  }

  static CartModel _recomputeCart(CartModel cart) {
    final total = cart.containers.fold<double>(0, (sum, c) => sum + c.total);
    return CartModel(containers: cart.containers, total: total);
  }

  static Map<String, dynamic> _cartToMap(CartModel cart) {
    return {
      'containers': cart.containers.map(_containerToMap).toList(),
      'total': cart.total,
    };
  }

  static Map<String, dynamic> _containerToMap(CartStoreContainer c) {
    return {
      'id': c.id,
      'storeId': c.storeId,
      'storeName': c.storeName,
      'storePhone': c.storePhone,
      'storeImageUrl': c.storeImageUrl,
      'total': c.total,
      'customerNotes': c.customerNotes,
      'items': c.items.map(_itemToMap).toList(),
    };
  }

  static Map<String, dynamic> _itemToMap(CartLineItem i) {
    return {
      'itemId': i.itemId,
      'itemType': i.itemType,
      'name': i.name,
      'quantity': i.quantity,
      'unitPrice': i.unitPrice,
      'lineTotal': i.lineTotal,
      'imageUrl': i.imageUrl,
      'currency': i.currency,
    };
  }

  static CartModel _cartFromMap(Map<String, dynamic> json) {
    final raw = json['containers'];
    final containers = <CartStoreContainer>[];
    if (raw is List) {
      for (final e in raw) {
        if (e is Map) containers.add(_containerFromMap(Map<String, dynamic>.from(e)));
      }
    }
    return CartModel(
      containers: containers,
      total: double.tryParse(json['total']?.toString() ?? '') ?? 0,
    );
  }

  static CartStoreContainer _containerFromMap(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final items = <CartLineItem>[];
    if (rawItems is List) {
      for (final e in rawItems) {
        if (e is Map) items.add(_itemFromMap(Map<String, dynamic>.from(e)));
      }
    }
    return CartStoreContainer(
      id: (json['id'] ?? '').toString(),
      storeId: (json['storeId'] ?? '').toString(),
      storeName: (json['storeName'] ?? '').toString(),
      storePhone: json['storePhone']?.toString(),
      storeImageUrl: json['storeImageUrl']?.toString(),
      total: double.tryParse(json['total']?.toString() ?? '') ?? 0,
      customerNotes: (json['customerNotes'] ?? '').toString(),
      items: items,
    );
  }

  static CartLineItem _itemFromMap(Map<String, dynamic> json) {
    return CartLineItem(
      itemId: (json['itemId'] ?? '').toString(),
      itemType: (json['itemType'] ?? '').toString(),
      name: (json['name'] ?? '—').toString(),
      quantity: int.tryParse(json['quantity']?.toString() ?? '') ?? 1,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '') ?? 0,
      lineTotal: double.tryParse(json['lineTotal']?.toString() ?? '') ?? 0,
      imageUrl: json['imageUrl']?.toString(),
      currency: (json['currency'] ?? 'ILS').toString(),
    );
  }
}

extension _CartStoreContainerCopy on CartStoreContainer {
  CartStoreContainer copyWith({
    String? id,
    String? storeId,
    String? storeName,
    String? storePhone,
    String? storeImageUrl,
    double? total,
    String? customerNotes,
    List<CartLineItem>? items,
  }) {
    return CartStoreContainer(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      storeName: storeName ?? this.storeName,
      storePhone: storePhone ?? this.storePhone,
      storeImageUrl: storeImageUrl ?? this.storeImageUrl,
      total: total ?? this.total,
      customerNotes: customerNotes ?? this.customerNotes,
      items: items ?? this.items,
    );
  }
}
