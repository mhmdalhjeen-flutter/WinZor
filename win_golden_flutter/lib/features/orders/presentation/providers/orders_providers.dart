import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/order_models.dart';
import '../../data/repositories/orders_repository.dart';

final ordersRepositoryProvider = Provider((ref) {
  return OrdersRepository(ref.watch(apiClientProvider));
});

final myOrdersProvider =
    FutureProvider.autoDispose<List<OrderModel>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return [];
  return ref.watch(ordersRepositoryProvider).getMyOrders();
});

final placeOrderBusyProvider = StateProvider<bool>((ref) => false);

class OrdersActions {
  final Ref ref;
  OrdersActions(this.ref);

  OrdersRepository get _repo => ref.read(ordersRepositoryProvider);

  /// Returns null on success (optional server message available via side-channel),
  /// or error message string on failure.
  Future<({bool ok, String message, String? code})> placeDirectOrder({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    ref.read(placeOrderBusyProvider.notifier).state = true;
    try {
      final res = await _repo.placeDirectOrder(
        itemId: itemId,
        itemType: itemType,
        quantity: quantity,
      );
      ref.invalidate(myOrdersProvider);
      return (
        ok: true,
        message: res['message']?.toString() ??
            'تم إرسال طلبك — بانتظار تأكيد صاحب المحل',
        code: null,
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map) {
        return (
          ok: false,
          message: data['message']?.toString() ?? 'تعذّر إرسال الطلب',
          code: data['code']?.toString(),
        );
      }
      return (ok: false, message: 'تعذّر إرسال الطلب', code: null);
    } catch (_) {
      return (ok: false, message: 'تعذّر إرسال الطلب', code: null);
    } finally {
      ref.read(placeOrderBusyProvider.notifier).state = false;
    }
  }

  Future<String?> cancelOrder(String orderId) async {
    try {
      await _repo.cancelOrder(orderId);
      ref.invalidate(myOrdersProvider);
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      return 'تعذّر الإلغاء';
    } catch (_) {
      return 'تعذّر الإلغاء';
    }
  }
}

final ordersActionsProvider = Provider((ref) => OrdersActions(ref));
