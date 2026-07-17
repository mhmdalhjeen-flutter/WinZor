import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class PublishOption {
  final String id;
  final String transactionType;
  final String label;
  final String description;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;

  const PublishOption({
    required this.id,
    required this.transactionType,
    required this.label,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
  });
}

final List<PublishOption> publishOptions = [
  const PublishOption(
    id: 'sell',
    transactionType: 'sell',
    label: 'نشر عنصر للبيع',
    description: 'بيع منتج أو غرض مباشرة',
    icon: LucideIcons.tag,
    iconColor: Color(0xFF059669),
    iconBg: Color(0xFFD1FAE5),
  ),
  const PublishOption(
    id: 'exchange',
    transactionType: 'exchange',
    label: 'نشر عنصر للبيع أو البدل',
    description: 'متاح للبيع أو المقايضة',
    icon: LucideIcons.repeat,
    iconColor: Color(0xFF0D9488),
    iconBg: Color(0xFFCCFBF1),
  ),
  const PublishOption(
    id: 'rent',
    transactionType: 'rent',
    label: 'نشر عنصر للإيجار',
    description: 'عقار، مركبة أو أي أصل للإيجار',
    icon: LucideIcons.home,
    iconColor: Color(0xFF2563EB),
    iconBg: Color(0xFFDBEAFE),
  ),
  const PublishOption(
    id: 'wanted',
    transactionType: 'custom',
    label: 'نشر طلب (مطلوب)',
    description: 'أبحث عن منتج أو خدمة',
    icon: LucideIcons.megaphone,
    iconColor: Color(0xFFEA580C),
    iconBg: Color(0xFFFFEDD5),
  ),
];

class PublishBottomSheet extends StatelessWidget {
  final Function(String) onSelect;

  const PublishBottomSheet({
    super.key,
    required this.onSelect,
  });

  static void show(BuildContext context, Function(String) onSelect) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => PublishBottomSheet(onSelect: onSelect),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE5E7EB),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'بيع أو نشر',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                      fontFamily: 'Cairo',
                    ),
                  ),
                  Text(
                    'اختر نوع الإعلان',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade400,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.x, size: 18),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFFF3F4F6),
                  padding: const EdgeInsets.all(8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...publishOptions.map((opt) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: InkWell(
                  onTap: () {
                    Navigator.pop(context);
                    onSelect(opt.transactionType);
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: opt.iconBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(opt.icon, color: opt.iconColor, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                opt.label,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF111827),
                                  fontFamily: 'Cairo',
                                ),
                              ),
                              Text(
                                opt.description,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey.shade400,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )),
        ],
      ),
    );
  }
}
