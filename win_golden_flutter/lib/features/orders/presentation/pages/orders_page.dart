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

/// Customer orders history only — no cart UI.
class OrdersPage extends ConsumerWidget {
  const OrdersPage({super.key});

  Future<void> _cancel(BuildContext context, WidgetRef ref, String orderId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'إلغاء الطلب',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
        ),
        content: const Text(
          'إلغاء هذا الطلب؟',
          style: TextStyle(fontFamily: 'Cairo'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('تراجع', style: TextStyle(fontFamily: 'Cairo')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'إلغاء الطلب',
              style: TextStyle(fontFamily: 'Cairo', color: Colors.red),
            ),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final err = await ref.read(ordersActionsProvider).cancelOrder(orderId);
    if (!context.mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err, style: const TextStyle(fontFamily: 'Cairo'))),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: ElevatedButton(
              onPressed: () => context.push('/login'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text(
                'تسجيل الدخول',
                style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ),
      );
    }

    final ordersAsync = ref.watch(myOrdersProvider);

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
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/');
                      }
                    },
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFF3F4F6)),
                    ),
                    icon: const Icon(LucideIcons.chevronRight, size: 20),
                  ),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.package, color: AppColors.primary),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'طلباتي النشطة',
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
              child: ordersAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(
                  child: Text(
                    'تعذّر تحميل الطلبات',
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
                data: (orders) {
                  if (orders.isEmpty) {
                    return const Center(
                      child: Text(
                        'لا توجد طلبات',
                        style: TextStyle(
                          color: Color(0xFF9CA3AF),
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () async => ref.invalidate(myOrdersProvider),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                      itemCount: orders.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final order = orders[i];
                        return _OrderCard(
                          order: order,
                          onCancel: order.status == 'pending'
                              ? () => _cancel(context, ref, order.id)
                              : null,
                        );
                      },
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

class _OrderCard extends StatelessWidget {
  final OrderModel order;
  final VoidCallback? onCancel;

  const _OrderCard({required this.order, this.onCancel});

  Color get _statusBg {
    switch (order.status) {
      case 'pending':
        return const Color(0xFFFEF3C7);
      case 'store_accepted':
      case 'confirmed':
        return const Color(0xFFDCFCE7);
      case 'preparing':
        return const Color(0xFFDBEAFE);
      case 'delivered_to_driver':
        return const Color(0xFFE0E7FF);
      default:
        return const Color(0xFFF3F4F6);
    }
  }

  Color get _statusFg {
    switch (order.status) {
      case 'pending':
        return const Color(0xFF92400E);
      case 'store_accepted':
      case 'confirmed':
        return const Color(0xFF166534);
      case 'preparing':
        return const Color(0xFF1D4ED8);
      case 'delivered_to_driver':
        return const Color(0xFF4338CA);
      default:
        return const Color(0xFF4B5563);
    }
  }

  @override
  Widget build(BuildContext context) {
    final label = orderStatusLabels[order.status] ?? order.status;
    final date = order.createdAt != null
        ? DateFormat('yyyy/MM/dd').format(order.createdAt!.toLocal())
        : '';
    final lines =
        order.items.map((i) => '${i.name} ×${i.quantity}').join(' · ');

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.storeName ?? 'متجر',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        fontSize: 14,
                      ),
                    ),
                    if (date.isNotEmpty)
                      Text(
                        date,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9CA3AF),
                          fontFamily: 'Cairo',
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: _statusFg,
                  ),
                ),
              ),
            ],
          ),
          if (lines.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              lines,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6B7280),
                fontFamily: 'Cairo',
              ),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            CurrencyUtils.formatPrice(order.total, order.currency),
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
            ),
          ),
          OrderVerificationBadge(code: order.verificationCode),
          if (order.verificationCode?.isNotEmpty == true)
            TextButton(
              onPressed: () => showOrderVerificationDialog(
                context,
                codes: [OrderVerificationEntry(code: order.verificationCode!, label: order.storeName)],
              ),
              child: const Text(
                'عرض رمز التحقق',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  color: Color(0xFF059669),
                ),
              ),
            ),
          if (onCancel != null)
            TextButton(
              onPressed: onCancel,
              child: const Text(
                'إلغاء الطلب',
                style: TextStyle(
                  color: Color(0xFFEF4444),
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Cairo',
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
