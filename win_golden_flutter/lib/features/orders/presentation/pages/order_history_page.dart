import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/order_models.dart';
import '../providers/orders_providers.dart';
import '../widgets/order_verification_dialog.dart';

class OrderHistoryPage extends ConsumerWidget {
  const OrderHistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        body: Center(
          child: ElevatedButton(
            onPressed: () => context.push('/login'),
            child: const Text('تسجيل الدخول'),
          ),
        ),
      );
    }

    final historyAsync = ref.watch(orderHistoryProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.canPop() ? context.pop() : context.go('/profile'),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFF3F4F6)),
                    ),
                    icon: const Icon(LucideIcons.chevronRight, size: 20),
                  ),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.history, color: AppColors.primary),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'الطلبات السابقة',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: historyAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(
                  child: Text('تعذّر تحميل السجل', style: TextStyle(fontFamily: 'Cairo')),
                ),
                data: (orders) {
                  if (orders.isEmpty) {
                    return const Center(
                      child: Text(
                        'لا توجد طلبات سابقة',
                        style: TextStyle(
                          color: Color(0xFF9CA3AF),
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () async => ref.invalidate(orderHistoryProvider),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                      itemCount: orders.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _HistoryCard(order: orders[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final OrderModel order;

  const _HistoryCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final date = order.createdAt != null
        ? DateFormat('yyyy/MM/dd').format(order.createdAt!.toLocal())
        : '';
    final label = orderStatusLabels[order.status] ?? order.status;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _openDetail(context, order),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF3F4F6)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.storeName ?? 'متجر',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      color: Color(0xFF6366F1),
                    ),
                  ),
                ],
              ),
              if (date.isNotEmpty)
                Text(
                  date,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontFamily: 'Cairo'),
                ),
              const SizedBox(height: 6),
              Text(
                'رقم الطلب: ${order.displayOrderNumber}',
                style: const TextStyle(fontSize: 12, fontFamily: 'Cairo', color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 4),
              Text(
                CurrencyUtils.formatPrice(order.total, order.currency),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
              OrderVerificationBadge(code: order.verificationCode),
            ],
          ),
        ),
      ),
    );
  }

  void _openDetail(BuildContext context, OrderModel order) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.85),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        order.storeName ?? 'تفاصيل الطلب',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                    IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(LucideIcons.x)),
                  ],
                ),
                Text(
                  'رقم الطلب: ${order.displayOrderNumber}',
                  style: const TextStyle(fontFamily: 'Cairo', color: Color(0xFF6B7280)),
                ),
                if (order.verificationCode?.isNotEmpty == true) ...[
                  const SizedBox(height: 12),
                  OrderVerificationBadge(code: order.verificationCode),
                ],
                const SizedBox(height: 16),
                const Text('المنتجات', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                const SizedBox(height: 8),
                ...order.items.map(
                  (i) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      '${i.name} ×${i.quantity} — ${CurrencyUtils.formatPrice(i.price * i.quantity, order.currency)}',
                      style: const TextStyle(fontFamily: 'Cairo', fontSize: 13),
                    ),
                  ),
                ),
                const Divider(height: 24),
                if (order.customerNotes?.isNotEmpty == true) ...[
                  const Text('ملاحظاتك', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                  Text(order.customerNotes!, style: const TextStyle(fontFamily: 'Cairo')),
                  const SizedBox(height: 12),
                ],
                if (order.storeNotes?.isNotEmpty == true) ...[
                  const Text('ملاحظات المتجر', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                  Text(order.storeNotes!, style: const TextStyle(fontFamily: 'Cairo')),
                  const SizedBox(height: 12),
                ],
                const Text('حالة الدفع', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                Text(
                  _paymentLabel(order.paymentStatus),
                  style: const TextStyle(fontFamily: 'Cairo'),
                ),
                const SizedBox(height: 12),
                const Text('مسار الحالة', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                const SizedBox(height: 8),
                ...order.statusTimeline.map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.circle, size: 8, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${orderStatusLabels[e.status] ?? e.status}${e.at != null ? ' — ${DateFormat('yyyy/MM/dd HH:mm').format(e.at!.toLocal())}' : ''}',
                            style: const TextStyle(fontFamily: 'Cairo', fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (order.statusTimeline.isEmpty)
                  Text(
                    orderStatusLabels[order.status] ?? order.status,
                    style: const TextStyle(fontFamily: 'Cairo'),
                  ),
                const SizedBox(height: 16),
                Text(
                  'الإجمالي: ${CurrencyUtils.formatPrice(order.total, order.currency)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: AppColors.primary,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _paymentLabel(String? status) {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'pending':
        return 'قيد المراجعة';
      default:
        return 'غير مدفوع';
    }
  }
}
