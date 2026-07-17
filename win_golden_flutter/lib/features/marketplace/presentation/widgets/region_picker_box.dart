import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../../core/widgets/hierarchy_select.dart';
import '../../../../core/theme/app_colors.dart';

class RegionPickerBox extends StatelessWidget {
  final List<HierarchyNode> tree;
  final List<String> pathIds;
  final Function(List<String>) onPathChange;
  final bool loading;
  final String? error;
  final VoidCallback? onRetry;
  final String hint;

  const RegionPickerBox({
    super.key,
    required this.tree,
    required this.pathIds,
    required this.onPathChange,
    this.loading = false,
    this.error,
    this.onRetry,
    this.hint = 'اختر المنطقة — كل مستوى يظهر بعد اختيار الذي قبله',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.mapPin, size: 16, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'المنطقة',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF111827),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          HierarchySelect(
            tree: tree,
            pathIds: pathIds,
            onPathChange: onPathChange,
            loading: loading,
            error: error,
            onRetry: onRetry,
            firstPlaceholder: 'الكل — أي منطقة',
            optionalPlaceholder: 'اختياري — منطقة أدق',
            showPath: false,
          ),
          const SizedBox(height: 8),
          Text(
            hint,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade400,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}
