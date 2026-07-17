import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../utils/verification_gate_config.dart';

/// React `VerificationPromptModal.jsx`
class VerificationPromptModal extends StatelessWidget {
  final VerificationPromptConfig config;
  final VoidCallback onVerifyNow;
  final VoidCallback onLater;

  const VerificationPromptModal({
    super.key,
    required this.config,
    required this.onVerifyNow,
    required this.onLater,
  });

  static const _allowed = [
    'تصفح الموقع',
    'مشاهدة العروض',
    'مشاهدة المنتجات',
    'مشاهدة المتاجر',
  ];

  @override
  Widget build(BuildContext context) {
    final isCart = config.isCart;
    final title = config.title ??
        (isCart ? 'يجب توثيق الحساب أولاً' : 'وثّق حسابك للمتابعة');
    final message = config.message ??
        (isCart
            ? 'يجب توثيق الحساب أولاً لتتمكن من استخدام هذه الميزة'
            : 'التوثيق اختياري — لكن هذه الميزة تحتاج حساباً موثّقاً لحمايتك ومنع إساءة الاستخدام.');

    final blocked = isCart
        ? const [
            (LucideIcons.shoppingCart, 'إضافة المنتجات إلى السلة'),
            (LucideIcons.package, 'إضافة العروض إلى السلة'),
            (LucideIcons.shoppingBag, 'إتمام الطلبات والشراء'),
          ]
        : const [
            (LucideIcons.ticket, 'إدخال أكواد العروض'),
            (LucideIcons.trophy, 'الاشتراك بالمسابقات والسحوبات'),
            (LucideIcons.shoppingBag, 'نشر إعلاناتك في السوق'),
            (LucideIcons.coins, 'استخدام النقاط والجوائز التفاعلية'),
          ];

    return Material(
      color: Colors.black.withOpacity(0.7),
      child: SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF1E1B4B),
                            AppColors.primary,
                            Color(0xFFF97316),
                          ],
                          begin: Alignment.topRight,
                          end: Alignment.bottomLeft,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            left: 0,
                            top: 0,
                            child: IconButton(
                              onPressed: onLater,
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.white24,
                              ),
                              icon: const Icon(LucideIcons.x,
                                  color: Colors.white, size: 18),
                            ),
                          ),
                          Column(
                            children: [
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(22),
                                ),
                                child: Icon(
                                  isCart
                                      ? LucideIcons.shoppingCart
                                      : LucideIcons.shieldCheck,
                                  color: const Color(0xFFFCD34D),
                                  size: 30,
                                ),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                title,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                message,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Cairo',
                                  color: Colors.white.withOpacity(0.75),
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                        child: Column(
                          children: [
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0FDF4),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: const Color(0xFFDCFCE7)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(LucideIcons.eye,
                                          size: 12, color: Color(0xFF15803D)),
                                      SizedBox(width: 6),
                                      Text(
                                        'متاح لك الآن بدون توثيق',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          fontFamily: 'Cairo',
                                          color: Color(0xFF15803D),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: _allowed
                                        .map(
                                          (t) => Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius:
                                                  BorderRadius.circular(100),
                                            ),
                                            child: Text(
                                              t,
                                              style: const TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w700,
                                                fontFamily: 'Cairo',
                                                color: Color(0xFF166534),
                                              ),
                                            ),
                                          ),
                                        )
                                        .toList(),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            ...blocked.map(
                              (b) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF9FAFB),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                        color: const Color(0xFFF3F4F6)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: AppColors.primary
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Icon(b.$1,
                                            size: 18,
                                            color: AppColors.primary),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          b.$2,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w900,
                                            fontFamily: 'Cairo',
                                            color: Color(0xFF1F2937),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.only(top: 4, bottom: 10),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(LucideIcons.sparkles,
                                      size: 12, color: Color(0xFFD97706)),
                                  SizedBox(width: 4),
                                  Text(
                                    '+5 نقاط مجانية بعد التوثيق',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Cairo',
                                      color: Color(0xFFD97706),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: onVerifyNow,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFDC2626),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'وثّق الآن',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'Cairo',
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      'Verify Now',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'Cairo',
                                        fontSize: 10,
                                        color: Colors.white70,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            SizedBox(
                              width: double.infinity,
                              height: 48,
                              child: OutlinedButton(
                                onPressed: onLater,
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                      color: Color(0xFFF3F4F6), width: 2),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'لاحقاً',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'Cairo',
                                        fontSize: 13,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                    Text(
                                      'Later',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'Cairo',
                                        fontSize: 10,
                                        color: Color(0xFF9CA3AF),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
