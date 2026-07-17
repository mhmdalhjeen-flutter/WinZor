import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../../core/widgets/hierarchy_select.dart';
import '../../../../core/theme/app_colors.dart';

class QuickSearchDrawer extends StatelessWidget {
  final List<HierarchyNode> regionTree;
  final List<String> regionPath;
  final Function(List<String>) onRegionPathChange;
  final bool regionsLoading;
  
  final List<HierarchyNode> categoryTree;
  final List<String> categoryPath;
  final Function(List<String>) onCategoryPathChange;
  final bool categoriesLoading;

  final VoidCallback onApply;

  const QuickSearchDrawer({
    super.key,
    required this.regionTree,
    required this.regionPath,
    required this.onRegionPathChange,
    required this.regionsLoading,
    required this.categoryTree,
    required this.categoryPath,
    required this.onCategoryPathChange,
    required this.categoriesLoading,
    required this.onApply,
  });

  static void show(BuildContext context, QuickSearchDrawer drawer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => drawer,
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeFilterCount = (regionPath.isNotEmpty ? 1 : 0) + (categoryPath.isNotEmpty ? 1 : 0);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.slidersHorizontal, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'بحث سريع',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                      ),
                      Text(
                        activeFilterCount > 0 ? '$activeFilterCount فلتر نشط' : 'اختر المنطقة أو نوع المتجر',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, fontFamily: 'Cairo'),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.x, size: 20, color: Colors.grey),
                style: IconButton.styleFrom(backgroundColor: const Color(0xFFF3F4F6)),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Filters
          const Text(
            'حسب المنطقة',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563), fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 8),
          HierarchySelect(
            tree: regionTree,
            pathIds: regionPath,
            onPathChange: onRegionPathChange,
            loading: regionsLoading,
            firstPlaceholder: 'كل المناطق',
            showPath: false,
          ),
          const SizedBox(height: 20),
          const Text(
            'نوع المتجر',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563), fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 8),
          HierarchySelect(
            tree: categoryTree,
            pathIds: categoryPath,
            onPathChange: onCategoryPathChange,
            loading: categoriesLoading,
            firstPlaceholder: 'كل التصنيفات',
            showPath: false,
          ),

          const SizedBox(height: 32),
          
          // Apply Button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                onApply();
                Navigator.pop(context);
              },
              child: const Text('تطبيق الفلاتر', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            ),
          ),
        ],
      ),
    );
  }
}
