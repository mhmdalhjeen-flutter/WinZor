import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';
import '../utils/hierarchy_utils.dart';
import '../theme/app_colors.dart';

class HierarchySelect extends StatelessWidget {
  final List<HierarchyNode> tree;
  final List<String> pathIds;
  final Function(List<String>) onPathChange;
  final bool loading;
  final String? error;
  final VoidCallback? onRetry;
  final bool allowAllAtRoot;
  final String firstPlaceholder;
  final String optionalPlaceholder;
  final bool showPath;

  const HierarchySelect({
    super.key,
    required this.tree,
    required this.pathIds,
    required this.onPathChange,
    this.loading = false,
    this.error,
    this.onRetry,
    this.allowAllAtRoot = true,
    this.firstPlaceholder = 'الكل',
    this.optionalPlaceholder = 'اختياري — مستوى أدق',
    this.showPath = true,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Column(
        children: List.generate(2, (index) => _buildLoadingPlaceholder()),
      );
    }

    if (error != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.05),
          border: Border.all(color: Colors.red.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'تعذّر التحميل',
              style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
            ),
            if (onRetry != null)
              TextButton(
                onPressed: onRetry,
                child: const Text('إعادة', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w900)),
              ),
          ],
        ),
      );
    }

    if (tree.isEmpty) {
      return const Text(
        'لا توجد خيارات متاحة',
        style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold),
      );
    }

    final rows = HierarchyUtils.buildHierarchyRows(tree, pathIds);
    final labels = HierarchyUtils.pathToLabels(tree, pathIds);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...rows.map((row) => _buildDropdown(row)),
        if (showPath && labels.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'المسار: ${labels.join(' › ')}',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildDropdown(HierarchyRow row) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            isExpanded: true,
            value: row.selectedId,
            hint: Text(
              row.level == 0 && allowAllAtRoot ? firstPlaceholder : optionalPlaceholder,
              style: const TextStyle(color: AppColors.textMuted, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            items: [
              DropdownMenuItem<String>(
                value: null,
                child: Text(
                  row.level == 0 && allowAllAtRoot ? firstPlaceholder : optionalPlaceholder,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ),
              ...row.items.map((item) => DropdownMenuItem<String>(
                value: item.id,
                child: Text(
                  item.icon != null ? '${item.icon} ${item.name}' : item.name,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              )),
            ],
            onChanged: (value) {
              if (row.level == 0 && value == null && allowAllAtRoot) {
                onPathChange([]);
              } else {
                onPathChange(HierarchyUtils.setHierarchyPath(pathIds, row.level, value));
              }
            },
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingPlaceholder() {
    return Container(
      height: 40,
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}
