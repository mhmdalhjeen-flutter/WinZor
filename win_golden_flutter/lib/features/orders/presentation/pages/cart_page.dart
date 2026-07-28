import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../auth/presentation/providers/auth_gate_provider.dart';
import '../../../auth/utils/auth_gate_messages.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/cart_models.dart';
import '../providers/orders_providers.dart';
import '../widgets/order_verification_dialog.dart';

class CartPage extends ConsumerStatefulWidget {
  const CartPage({super.key});

  @override
  ConsumerState<CartPage> createState() => _CartPageState();
}

class _CartPageState extends ConsumerState<CartPage> {
  bool _confirmingAll = false;

  Future<void> _confirmStore(CartStoreContainer container) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      ref.read(authGateProvider.notifier).runWithAuth(
            () => _confirmStore(container),
            message: AuthGateMessages.orderConfirm,
          );
      return;
    }

    final notesController = TextEditingController(text: container.customerNotes);
    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'تأكيد طلب المتجر',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              container.storeName,
              style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              CurrencyUtils.formatPrice(container.total, 'ILS'),
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w900,
                color: Color(0xFF059669),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'ملاحظات للمتجر (اختياري)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('تراجع')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
            child: const Text('تأكيد الطلب'),
          ),
        ],
      ),
    );
    if (proceed != true) return;

    final result = await ref.read(ordersActionsProvider).confirmStoreOrder(
          storeId: container.storeId,
          customerNotes: notesController.text.trim(),
          storeLabel: container.storeName,
        );
    if (!mounted) return;
    if (result.ok) {
      if (result.codes.isNotEmpty) {
        await showOrderVerificationDialog(context, codes: result.codes);
      }
      if (!mounted) return;
      context.push('/orders');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result.message, style: const TextStyle(fontFamily: 'Cairo'))),
    );
  }

  Future<void> _confirmAll(CartModel cart) async {
    if (_confirmingAll) return;

    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      ref.read(authGateProvider.notifier).runWithAuth(
            () => _confirmAll(cart),
            message: AuthGateMessages.orderConfirm,
          );
      return;
    }

    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'تأكيد جميع الطلبات',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
        ),
        content: Text(
          'سيتم إرسال ${cart.storeCount} طلب(ات) من ${cart.storeCount} متجر(ات)\n'
          'الإجمالي: ${CurrencyUtils.formatPrice(cart.total, 'ILS')}',
          style: const TextStyle(fontFamily: 'Cairo', height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('تراجع')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
            child: const Text('تأكيد الكل'),
          ),
        ],
      ),
    );
    if (proceed != true) return;

    setState(() => _confirmingAll = true);
    final result = await ref.read(ordersActionsProvider).confirmAllOrders();
    if (!mounted) return;
    setState(() => _confirmingAll = false);
    if (result.ok) {
      if (result.codes.isNotEmpty) {
        await showOrderVerificationDialog(context, codes: result.codes);
      }
      if (!mounted) return;
      context.push('/orders');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result.message, style: const TextStyle(fontFamily: 'Cairo'))),
    );
  }

  Future<void> _deleteContainer(CartStoreContainer container) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('حذف السلة', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
        content: Text(
          'حذف جميع منتجات "${container.storeName}" من السلة؟',
          style: const TextStyle(fontFamily: 'Cairo'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('تراجع')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('حذف', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final err = await ref.read(ordersActionsProvider).deleteStoreContainer(container);
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err, style: const TextStyle(fontFamily: 'Cairo'))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final cartAsync = auth.isAuth
        ? ref.watch(cartControllerProvider)
        : const AsyncValue.data(CartModel());

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      body: SafeArea(
        child: cartAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(
            child: Text('تعذّر تحميل السلة', style: TextStyle(fontFamily: 'Cairo')),
          ),
          data: (cart) {
            if (!cart.hasItems) {
              return Column(
                children: [
                  _CartHeader(onBack: () => context.canPop() ? context.pop() : context.go('/')),
                  Expanded(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(28),
                            ),
                            child: const Icon(LucideIcons.shoppingBag, size: 40, color: Color(0xFF059669)),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'سلتك فارغة',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => context.go('/'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF059669),
                              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            child: const Text('متابعة التسوق', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }

            return Column(
              children: [
                _CartHeader(onBack: () => context.canPop() ? context.pop() : context.go('/')),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () => ref.read(cartControllerProvider.notifier).refreshCart(),
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                      itemCount: cart.containers.length,
                      itemBuilder: (context, index) {
                        final container = cart.containers[index];
                        return FadeInUp(
                          duration: Duration(milliseconds: 280 + index * 60),
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _StoreContainerCard(
                              key: ValueKey(container.id),
                              container: container,
                              onConfirm: () => _confirmStore(container),
                              onDeleteContainer: () => _deleteContainer(container),
                              onUpdateQty: (item, qty) async {
                                final err = await ref.read(ordersActionsProvider).updateCartQuantity(
                                      itemId: item.itemId,
                                      itemType: item.itemType,
                                      quantity: qty,
                                    );
                                if (err != null && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(err, style: const TextStyle(fontFamily: 'Cairo'))),
                                  );
                                }
                              },
                              onRemove: (item) async {
                                final err = await ref.read(ordersActionsProvider).removeCartItem(
                                      itemId: item.itemId,
                                      itemType: item.itemType,
                                    );
                                if (err != null && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(err, style: const TextStyle(fontFamily: 'Cairo'))),
                                  );
                                }
                              },
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                _CartGrandSummary(
                  cart: cart,
                  confirming: _confirmingAll,
                  onConfirmAll: () => _confirmAll(cart),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _CartHeader extends StatelessWidget {
  final VoidCallback onBack;

  const _CartHeader({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFE8E4DA)),
            ),
            icon: const Icon(LucideIcons.chevronRight, size: 20),
          ),
          const SizedBox(width: 8),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFFF59E0B)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.shoppingCart, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'السلة',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StoreContainerCard extends StatelessWidget {
  final CartStoreContainer container;
  final VoidCallback onConfirm;
  final VoidCallback onDeleteContainer;
  final Future<void> Function(CartLineItem item, int qty) onUpdateQty;
  final Future<void> Function(CartLineItem item) onRemove;

  const _StoreContainerCard({
    super.key,
    required this.container,
    required this.onConfirm,
    required this.onDeleteContainer,
    required this.onUpdateQty,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final initial = container.storeName.isNotEmpty ? container.storeName[0] : 'م';

    return AnimatedSize(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
      alignment: Alignment.topCenter,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE8E4DA)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF059669).withOpacity(0.06),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(16, 16, 12, 12),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [Color(0xFFECFDF5), Color(0xFFFFFBEB)],
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Row(
                children: [
                  _StoreAvatar(
                    imageUrl: container.storeImageUrl,
                    initial: initial,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          container.storeName.isNotEmpty ? container.storeName : 'متجر',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          '${container.items.length} منتج',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: onDeleteContainer,
                    icon: const Icon(LucideIcons.trash2, size: 14, color: Color(0xFFEF4444)),
                    label: const Text(
                      'حذف السلة',
                      style: TextStyle(
                        color: Color(0xFFEF4444),
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFF3F4F6)),
            ...container.items.map(
              (item) => _ProductRow(
                key: ValueKey('${item.itemId}-${item.itemType}'),
                item: item,
                onUpdateQty: onUpdateQty,
                onRemove: onRemove,
              ),
            ),
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'إجمالي المتجر',
                        style: TextStyle(fontWeight: FontWeight.w800, fontFamily: 'Cairo'),
                      ),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        child: Text(
                          CurrencyUtils.formatPrice(container.total, 'ILS'),
                          key: ValueKey(container.total),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            color: Color(0xFF059669),
                            fontSize: 17,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 50,
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onConfirm,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text(
                        'تأكيد الطلب',
                        style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 15),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoreAvatar extends StatelessWidget {
  final String? imageUrl;
  final String initial;

  const _StoreAvatar({this.imageUrl, required this.initial});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? CachedNetworkImage(imageUrl: imageUrl!, fit: BoxFit.cover)
          : Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF059669), Color(0xFFF59E0B)],
                ),
              ),
              child: Center(
                child: Text(
                  initial,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    fontSize: 18,
                  ),
                ),
              ),
            ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final CartLineItem item;
  final Future<void> Function(CartLineItem item, int qty) onUpdateQty;
  final Future<void> Function(CartLineItem item) onRemove;

  const _ProductRow({
    super.key,
    required this.item,
    required this.onUpdateQty,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 52,
                height: 52,
                child: item.imageUrl != null
                    ? CachedNetworkImage(imageUrl: item.imageUrl!, fit: BoxFit.cover)
                    : Container(
                        color: const Color(0xFFF3F4F6),
                        child: const Icon(LucideIcons.image, color: Colors.grey, size: 22),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(
                      '${item.quantity} × ${CurrencyUtils.formatPrice(item.unitPrice, item.currency)}',
                      key: ValueKey('${item.quantity}-${item.unitPrice}'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(
                      '= ${CurrencyUtils.formatPrice(item.lineTotal, item.currency)}',
                      key: ValueKey(item.lineTotal),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        color: AppColors.primary,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _QtyBtn(
                      icon: LucideIcons.minus,
                      onTap: () => onUpdateQty(item, item.quantity - 1),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                        child: Text(
                          '${item.quantity}',
                          key: ValueKey(item.quantity),
                          style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                        ),
                      ),
                    ),
                    _QtyBtn(
                      icon: LucideIcons.plus,
                      enabled: item.quantity < 99,
                      onTap: () => onUpdateQty(item, item.quantity + 1),
                    ),
                  ],
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: () => onRemove(item),
                  icon: const Icon(LucideIcons.trash2, size: 16, color: Color(0xFFEF4444)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _QtyBtn({
    required this.icon,
    required this.onTap,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFF3F4F6),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          width: 30,
          height: 30,
          child: Icon(
            icon,
            size: 14,
            color: enabled ? const Color(0xFF111827) : const Color(0xFFD1D5DB),
          ),
        ),
      ),
    );
  }
}

class _CartGrandSummary extends StatelessWidget {
  final CartModel cart;
  final bool confirming;
  final VoidCallback onConfirmAll;

  const _CartGrandSummary({
    required this.cart,
    required this.confirming,
    required this.onConfirmAll,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _SummaryRow(label: 'عدد المتاجر', value: '${cart.storeCount}'),
            const SizedBox(height: 6),
            _SummaryRow(label: 'عدد المنتجات', value: '${cart.totalQuantity}'),
            const SizedBox(height: 6),
            _SummaryRow(
              label: 'الإجمالي الكلي',
              value: CurrencyUtils.formatPrice(cart.total, 'ILS'),
              highlight: true,
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 54,
              width: double.infinity,
              child: ElevatedButton(
                onPressed: confirming ? null : onConfirmAll,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  disabledBackgroundColor: const Color(0xFF059669).withOpacity(0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: confirming
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : const Text(
                        'تأكيد جميع الطلبات',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontWeight: highlight ? FontWeight.w900 : FontWeight.w700,
            fontSize: highlight ? 15 : 13,
            color: highlight ? const Color(0xFF111827) : const Color(0xFF6B7280),
          ),
        ),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: Text(
            value,
            key: ValueKey(value),
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w900,
              fontSize: highlight ? 18 : 14,
              color: highlight ? const Color(0xFF059669) : const Color(0xFF111827),
            ),
          ),
        ),
      ],
    );
  }
}
