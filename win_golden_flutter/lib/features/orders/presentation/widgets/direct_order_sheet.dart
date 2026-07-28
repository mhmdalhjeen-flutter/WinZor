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
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../../verification/utils/verification_gate_config.dart';
import '../providers/orders_providers.dart';

Future<void> showDirectOrderSheet({
  required BuildContext context,
  required WidgetRef ref,
  required String itemId,
  required String itemType,
  required String title,
  required double unitPrice,
  required String currency,
  String? imageUrl,
  String? storeName,
  int? maxQuantity,
}) async {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return _DirectOrderSheet(
        itemId: itemId,
        itemType: itemType,
        title: title,
        unitPrice: unitPrice,
        currency: currency,
        imageUrl: imageUrl,
        storeName: storeName,
        maxQuantity: maxQuantity,
      );
    },
  );
}

class _DirectOrderSheet extends ConsumerStatefulWidget {
  final String itemId;
  final String itemType;
  final String title;
  final double unitPrice;
  final String currency;
  final String? imageUrl;
  final String? storeName;
  final int? maxQuantity;

  const _DirectOrderSheet({
    required this.itemId,
    required this.itemType,
    required this.title,
    required this.unitPrice,
    required this.currency,
    this.imageUrl,
    this.storeName,
    this.maxQuantity,
  });

  @override
  ConsumerState<_DirectOrderSheet> createState() => _DirectOrderSheetState();
}

class _DirectOrderSheetState extends ConsumerState<_DirectOrderSheet> {
  int _quantity = 1;
  bool _submitting = false;
  bool _success = false;

  int get _maxQty {
    final m = widget.maxQuantity;
    if (m != null && m > 0) return m.clamp(1, 99);
    return 99;
  }

  double get _total => widget.unitPrice * _quantity;

  Future<void> _submit() async {
    if (_submitting || _success) return;

    ref.read(authGateProvider.notifier).runWithAuth(
          () => ref.read(verificationGateProvider.notifier).runWithVerification(
                _performSubmit,
                cartVerification,
              ),
          message: AuthGateMessages.addToCart,
        );
  }

  Future<void> _performSubmit() async {
    if (_submitting || _success) return;
    setState(() => _submitting = true);
    
    final result = await ref.read(ordersActionsProvider).addItemToCart(
          itemId: widget.itemId,
          itemType: widget.itemType,
          quantity: _quantity,
        );
    
    if (!mounted) return;

    if (!result.ok) {
      setState(() => _submitting = false);
      
      // إذا كان الخطأ يتطلب تحقق (Verification)
      if (result.code == 'VERIFICATION_REQUIRED') {
         ref.read(verificationGateProvider.notifier).runWithVerification(
           () => _performSubmit(), 
           cartVerification
         );
         return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message, style: const TextStyle(fontFamily: 'Cairo'))),
      );
      return;
    }

    setState(() {
      _submitting = false;
      _success = true;
    });
    
    if (!mounted) return;
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.message,
          style: const TextStyle(fontFamily: 'Cairo'),
        ),
        action: SnackBarAction(
          label: 'السلة',
          onPressed: () => context.push('/cart'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        top: false,
        child: _success
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  SizedBox(height: 24),
                  Icon(LucideIcons.checkCircle2, size: 48, color: Color(0xFF22C55E)),
                  SizedBox(height: 12),
                  Text('تمت إضافة العنصر إلى السلة.', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                  SizedBox(height: 24),
                ],
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFE5E7EB), borderRadius: BorderRadius.circular(4)))),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Expanded(child: Text('طلب مباشر', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo'))),
                      IconButton(onPressed: _submitting ? null : () => Navigator.pop(context), icon: const Icon(LucideIcons.x)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: 64, height: 64,
                          child: widget.imageUrl != null
                              ? CachedNetworkImage(imageUrl: widget.imageUrl!, fit: BoxFit.cover)
                              : Container(color: const Color(0xFFF3F4F6), child: const Icon(LucideIcons.image, color: Colors.grey)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 14)),
                            if (widget.storeName != null) Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontFamily: 'Cairo')),
                            Text(CurrencyUtils.formatPrice(widget.unitPrice, widget.currency), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text('الكمية', style: TextStyle(fontWeight: FontWeight.w800, fontFamily: 'Cairo', fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _QtyBtn(icon: LucideIcons.minus, enabled: !_submitting && _quantity > 1, onTap: () => setState(() => _quantity--)),
                      SizedBox(width: 48, child: Text('$_quantity', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 18))),
                      _QtyBtn(icon: LucideIcons.plus, enabled: !_submitting && _quantity < _maxQty, onTap: () => setState(() => _quantity++)),
                      const Spacer(),
                      Text('الإجمالي: ${CurrencyUtils.formatPrice(_total, widget.currency)}', style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo', color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                      child: _submitting
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                          : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                Icon(LucideIcons.send, size: 18),
                                SizedBox(width: 8),
                                Text('اشتري الآن', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                            ]),
                    ),
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
  const _QtyBtn({required this.icon, required this.enabled, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Material(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(10), child: InkWell(onTap: enabled ? onTap : null, borderRadius: BorderRadius.circular(10), child: SizedBox(width: 36, height: 36, child: Icon(icon, size: 16, color: enabled ? const Color(0xFF111827) : const Color(0xFFD1D5DB)))));
  }
}
