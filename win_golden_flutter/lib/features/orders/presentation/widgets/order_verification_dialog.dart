import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class OrderVerificationEntry {
  final String code;
  final String? label;

  const OrderVerificationEntry({required this.code, this.label});
}

/// Shows the private order verification code(s) after customer confirms.
Future<void> showOrderVerificationDialog(
  BuildContext context, {
  required List<OrderVerificationEntry> codes,
}) async {
  if (codes.isEmpty) return;

  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(LucideIcons.shieldCheck, color: Color(0xFF059669)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'رمز التحقق الخاص',
              style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 16),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Your private order verification code is:',
              style: TextStyle(fontFamily: 'Cairo', fontSize: 13, color: Color(0xFF4B5563)),
            ),
            const SizedBox(height: 4),
            const Text(
              'رمز التحقق الخاص بطلبك هو:',
              style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, fontSize: 13),
            ),
            const SizedBox(height: 12),
            ...codes.map((entry) => _CodeBlock(entry: entry)),
            const SizedBox(height: 12),
            const Text(
              'Keep this code safe.\nDo not share it with anyone.\nYou will need this code only when receiving your order.',
              style: TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Color(0xFF6B7280), height: 1.5),
            ),
            const SizedBox(height: 6),
            const Text(
              'احتفظ بهذا الرمز بأمان.\nلا تشاركه مع أحد.\nستحتاج هذا الرمز فقط عند استلام طلبك.',
              style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, fontSize: 12, color: Color(0xFF374151), height: 1.5),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('فهمت', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
        ),
      ],
    ),
  );
}

class _CodeBlock extends StatelessWidget {
  final OrderVerificationEntry entry;

  const _CodeBlock({required this.entry});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (entry.label != null && entry.label!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                entry.label!,
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Color(0xFF6B7280)),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: Text(
                  entry.code,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                    letterSpacing: 2,
                    color: Color(0xFF059669),
                  ),
                ),
              ),
              IconButton(
                tooltip: 'نسخ',
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: entry.code));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تم نسخ الرمز', style: TextStyle(fontFamily: 'Cairo')),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                icon: const Icon(LucideIcons.copy, size: 18, color: Color(0xFF059669)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Compact badge for order cards.
class OrderVerificationBadge extends StatelessWidget {
  final String? code;

  const OrderVerificationBadge({super.key, this.code});

  @override
  Widget build(BuildContext context) {
    if (code == null || code!.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.shieldCheck, size: 14, color: Color(0xFF059669)),
          const SizedBox(width: 6),
          const Text(
            'رمز التحقق: ',
            style: TextStyle(fontFamily: 'Cairo', fontSize: 11, color: Color(0xFF6B7280)),
          ),
          Text(
            code!,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w900,
              fontSize: 13,
              letterSpacing: 1,
              color: Color(0xFF059669),
            ),
          ),
        ],
      ),
    );
  }
}
