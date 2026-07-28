import '../../../../core/api/api_client.dart';
import '../models/cart_models.dart';
import '../models/order_models.dart';

class OrdersRepository {
  final ApiClient _apiClient;

  OrdersRepository(this._apiClient);

  CartModel _cartFromResponse(dynamic data) {
    if (data is Map) return CartModel.fromJson(Map<String, dynamic>.from(data));
    return const CartModel();
  }

  Future<List<OrderModel>> getMyOrders() async {
    final response = await _apiClient.dio.get('/orders/my');
    final data = response.data;
    final list = data is Map ? data['orders'] as List? : null;
    return (list ?? [])
        .whereType<Map>()
        .map((e) => OrderModel.fromJson(Map<String, dynamic>.from(e)))
        .where((o) => o.id.isNotEmpty)
        .toList();
  }

  Future<List<OrderModel>> getOrderHistory() async {
    final response = await _apiClient.dio.get('/orders/my/history');
    final data = response.data;
    final list = data is Map ? data['orders'] as List? : null;
    return (list ?? [])
        .whereType<Map>()
        .map((e) => OrderModel.fromJson(Map<String, dynamic>.from(e)))
        .where((o) => o.id.isNotEmpty)
        .toList();
  }

  Future<OrderModel?> getOrderDetail(String orderId) async {
    final response = await _apiClient.dio.get('/orders/$orderId');
    final data = response.data;
    if (data is Map && data['order'] is Map) {
      return OrderModel.fromJson(Map<String, dynamic>.from(data['order'] as Map));
    }
    return null;
  }

  Future<CartModel> getCart() async {
    final response = await _apiClient.dio.get('/cart');
    return _cartFromResponse(response.data);
  }

  Future<CartModel> addToCart({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    final response = await _apiClient.dio.post(
      '/cart/add',
      data: {
        'itemId': itemId,
        'itemType': itemType,
        'quantity': quantity.clamp(1, 99),
      },
    );
    return _cartFromResponse(response.data);
  }

  Future<CartModel> updateCartItem({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    final response = await _apiClient.dio.patch(
      '/cart/update',
      data: {'itemId': itemId, 'itemType': itemType, 'quantity': quantity},
    );
    return _cartFromResponse(response.data);
  }

  Future<CartModel> removeFromCart({
    required String itemId,
    required String itemType,
  }) async {
    final response = await _apiClient.dio.delete(
      '/cart/remove',
      data: {'itemId': itemId, 'itemType': itemType},
    );
    return _cartFromResponse(response.data);
  }

  Future<Map<String, dynamic>> confirmStoreOrder({
    required String storeId,
    String? customerNotes,
  }) async {
    final response = await _apiClient.dio.post(
      '/cart/containers/$storeId/confirm',
      data: {if (customerNotes != null) 'customerNotes': customerNotes},
    );
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'message': 'تم إرسال طلبك — بانتظار تأكيد صاحب المحل'};
  }

  Future<Map<String, dynamic>> checkoutAll() async {
    final response = await _apiClient.dio.post('/cart/checkout');
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'message': 'تم إرسال طلباتك — بانتظار تأكيد أصحاب المحلات'};
  }

  Future<void> cancelOrder(String orderId) async {
    await _apiClient.dio.patch('/orders/$orderId/cancel');
  }

  Future<({CartModel cart, String message})> addItemToCart({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    final response = await _apiClient.dio.post(
      '/cart/add',
      data: {
        'itemId': itemId,
        'itemType': itemType,
        'quantity': quantity.clamp(1, 99),
      },
    );
    final data = response.data;
    final cart = _cartFromResponse(data);
    final message = data is Map
        ? data['message']?.toString() ?? 'تمت إضافة العنصر إلى السلة.'
        : 'تمت إضافة العنصر إلى السلة.';
    return (cart: cart, message: message);
  }
}
