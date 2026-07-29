import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/cart_models.dart';
import '../../data/models/order_models.dart';
import '../../data/repositories/orders_repository.dart';
import '../../data/services/guest_cart_service.dart';
import '../widgets/order_verification_dialog.dart';

final ordersRepositoryProvider = Provider((ref) {
  return OrdersRepository(ref.watch(apiClientProvider));
});

final myOrdersProvider =
    FutureProvider.autoDispose<List<OrderModel>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return [];
  return ref.watch(ordersRepositoryProvider).getMyOrders();
});

final orderHistoryProvider =
    FutureProvider.autoDispose<List<OrderModel>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return [];
  return ref.watch(ordersRepositoryProvider).getOrderHistory();
});

final cartControllerProvider =
    AsyncNotifierProvider<CartController, CartModel>(CartController.new);

/// Derived helpers for header badge & summary bar.
final cartItemCountProvider = Provider<int>((ref) {
  return ref.watch(cartControllerProvider).maybeWhen(
        data: (cart) => cart.totalQuantity,
        orElse: () => 0,
      );
});

final cartHasItemsProvider = Provider<bool>((ref) {
  return ref.watch(cartItemCountProvider) > 0;
});

class CartController extends AsyncNotifier<CartModel> {
  @override
  Future<CartModel> build() async {
    ref.listen(authProvider, (previous, next) {
      if (!next.isAuth) {
        state = AsyncData(GuestCartService.load());
      } else if (previous?.isAuth != true) {
        _onLoggedIn();
      }
    });

    final auth = ref.watch(authProvider);
    if (!auth.isAuth) return GuestCartService.load();
    return ref.read(ordersRepositoryProvider).getCart();
  }

  Future<void> _onLoggedIn() async {
    try {
      await GuestCartService.mergeToServer(ref.read(ordersRepositoryProvider));
      state = await AsyncValue.guard(
        () => ref.read(ordersRepositoryProvider).getCart(),
      );
    } catch (_) {
      ref.invalidateSelf();
    }
  }

  void applyCart(CartModel cart) {
    state = AsyncData(cart);
  }

  Future<void> refreshCart() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      state = AsyncData(GuestCartService.load());
      return;
    }
    state = await AsyncValue.guard(
      () => ref.read(ordersRepositoryProvider).getCart(),
    );
  }
}

final placeOrderBusyProvider = StateProvider<bool>((ref) => false);

class OrdersActions {
  final Ref ref;
  OrdersActions(this.ref);

  OrdersRepository get _repo => ref.read(ordersRepositoryProvider);
  CartController get _cart => ref.read(cartControllerProvider.notifier);

  Future<({bool ok, String message, String? code})> addItemToCart({
    required String itemId,
    required String itemType,
    required int quantity,
    String name = '—',
    double unitPrice = 0,
    String currency = 'ILS',
    String? imageUrl,
    String storeId = '',
    String storeName = '',
    String? storeImageUrl,
  }) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      final cart = await GuestCartService.addItem(
        itemId: itemId,
        itemType: itemType,
        quantity: quantity,
        name: name,
        unitPrice: unitPrice,
        currency: currency,
        imageUrl: imageUrl,
        storeId: storeId,
        storeName: storeName,
        storeImageUrl: storeImageUrl,
      );
      _cart.applyCart(cart);
      return (ok: true, message: 'تمت إضافة العنصر إلى السلة.', code: null);
    }

    ref.read(placeOrderBusyProvider.notifier).state = true;
    try {
      final result = await _repo.addItemToCart(
        itemId: itemId,
        itemType: itemType,
        quantity: quantity,
      );
      _cart.applyCart(result.cart);
      return (ok: true, message: result.message, code: null);
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map) {
        return (
          ok: false,
          message: data['message']?.toString() ?? 'تعذّر الإضافة للسلة',
          code: data['code']?.toString(),
        );
      }
      return (ok: false, message: 'تعذّر الإضافة للسلة', code: null);
    } catch (_) {
      return (ok: false, message: 'تعذّر الإضافة للسلة', code: null);
    } finally {
      ref.read(placeOrderBusyProvider.notifier).state = false;
    }
  }

  Future<({bool ok, String message, List<OrderVerificationEntry> codes})> confirmStoreOrder({
    required String storeId,
    String? customerNotes,
    String? storeLabel,
  }) async {
    try {
      final res = await _repo.confirmStoreOrder(
        storeId: storeId,
        customerNotes: customerNotes,
      );
      await _cart.refreshCart();
      ref.invalidate(myOrdersProvider);
      final codes = <OrderVerificationEntry>[];
      final order = res['order'];
      final code = res['verificationCode']?.toString() ??
          (order is Map ? order['verificationCode']?.toString() : null);
      if (code != null && code.isNotEmpty) {
        codes.add(OrderVerificationEntry(code: code, label: storeLabel));
      }
      return (
        ok: true,
        message: res['message']?.toString() ?? 'تم إرسال طلبك — بانتظار تأكيد صاحب المحل',
        codes: codes,
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      return (
        ok: false,
        message: data is Map
            ? data['message']?.toString() ?? 'تعذّر تأكيد الطلب'
            : 'تعذّر تأكيد الطلب',
        codes: <OrderVerificationEntry>[],
      );
    } catch (_) {
      return (ok: false, message: 'تعذّر تأكيد الطلب', codes: <OrderVerificationEntry>[]);
    }
  }

  Future<({bool ok, String message, List<OrderVerificationEntry> codes})> confirmAllOrders() async {
    try {
      final res = await _repo.checkoutAll();
      await _cart.refreshCart();
      ref.invalidate(myOrdersProvider);
      final codes = <OrderVerificationEntry>[];
      final rawOrders = res['orders'];
      if (rawOrders is List) {
        for (final o in rawOrders) {
          if (o is! Map) continue;
          final code = o['verificationCode']?.toString();
          if (code != null && code.isNotEmpty) {
            codes.add(OrderVerificationEntry(
              code: code,
              label: o['containerName']?.toString() ?? o['orderNumber']?.toString(),
            ));
          }
        }
      }
      return (
        ok: true,
        message: res['message']?.toString() ?? 'تم إرسال جميع الطلبات',
        codes: codes,
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      return (
        ok: false,
        message: data is Map
            ? data['message']?.toString() ?? 'تعذّر تأكيد الطلبات'
            : 'تعذّر تأكيد الطلبات',
        codes: <OrderVerificationEntry>[],
      );
    } catch (_) {
      return (ok: false, message: 'تعذّر تأكيد الطلبات', codes: <OrderVerificationEntry>[]);
    }
  }

  Future<String?> updateCartQuantity({
    required String itemId,
    required String itemType,
    required int quantity,
  }) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      try {
        final cart = await GuestCartService.updateQuantity(
          itemId: itemId,
          itemType: itemType,
          quantity: quantity,
        );
        _cart.applyCart(cart);
        return null;
      } catch (_) {
        return quantity <= 0 ? 'تعذّر الحذف' : 'تعذّر تحديث الكمية';
      }
    }

    try {
      final CartModel cart;
      if (quantity <= 0) {
        cart = await _repo.removeFromCart(itemId: itemId, itemType: itemType);
      } else {
        cart = await _repo.updateCartItem(
          itemId: itemId,
          itemType: itemType,
          quantity: quantity,
        );
      }
      _cart.applyCart(cart);
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'].toString();
      return quantity <= 0 ? 'تعذّر الحذف' : 'تعذّر تحديث الكمية';
    } catch (_) {
      return quantity <= 0 ? 'تعذّر الحذف' : 'تعذّر تحديث الكمية';
    }
  }

  Future<String?> removeCartItem({
    required String itemId,
    required String itemType,
  }) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      try {
        final cart = await GuestCartService.removeItem(
          itemId: itemId,
          itemType: itemType,
        );
        _cart.applyCart(cart);
        return null;
      } catch (_) {
        return 'تعذّر الحذف';
      }
    }

    try {
      final cart = await _repo.removeFromCart(itemId: itemId, itemType: itemType);
      _cart.applyCart(cart);
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'].toString();
      return 'تعذّر الحذف';
    } catch (_) {
      return 'تعذّر الحذف';
    }
  }

  Future<String?> deleteStoreContainer(CartStoreContainer container) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      try {
        final cart = await GuestCartService.deleteContainer(container);
        _cart.applyCart(cart);
        return null;
      } catch (_) {
        return 'تعذّر حذف السلة';
      }
    }

    try {
      CartModel cart = ref.read(cartControllerProvider).maybeWhen(
            data: (c) => c,
            orElse: () => const CartModel(),
          );
      for (final item in container.items) {
        cart = await _repo.removeFromCart(itemId: item.itemId, itemType: item.itemType);
      }
      _cart.applyCart(cart);
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'].toString();
      return 'تعذّر حذف السلة';
    } catch (_) {
      return 'تعذّر حذف السلة';
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
