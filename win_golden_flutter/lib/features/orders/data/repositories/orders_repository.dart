import '../../../../core/api/api_client.dart';
import '../models/order_models.dart';

/// Orders API + internal cart adapters (never exposed in UI).
/// Matches React `DirectOrderModal`: add → checkout (no cart screen).
class OrdersRepository {
  final ApiClient _apiClient;

  OrdersRepository(this._apiClient);

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

  Future<void> cancelOrder(String orderId) async {
    await _apiClient.dio.patch('/orders/$orderId/cancel');
    // Defense: if an older API still restored items into cart, clear them.
    // Cart is never exposed in the customer UI.
    await _clearCartQuietly();
  }

  /// Internal: clear lingering cart so checkout is single-item only.
  Future<void> _clearCartQuietly() async {
    try {
      await _apiClient.dio.delete('/cart/clear');
    } catch (_) {
      /* empty / unverified — ignore */
    }
  }

  /// Direct order — Product/Offer → quantity → submit (hidden cart APIs).
  Future<Map<String, dynamic>> placeDirectOrder({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    final qty = quantity.clamp(1, 99);
    await _clearCartQuietly();
    await _apiClient.dio.post(
      '/cart/add',
      data: {
        'itemId': itemId,
        'itemType': itemType,
        'quantity': qty,
      },
    );
    final response = await _apiClient.dio.post('/cart/checkout');
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'message': 'تم إرسال طلبك — بانتظار تأكيد صاحب المحل'};
  }
}
