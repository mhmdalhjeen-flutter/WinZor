import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../../core/widgets/hierarchy_select.dart';
import 'bazaar_constants.dart';

enum MarketplaceFilterMode { region, condition, category }

class MarketplaceFilters extends StatefulWidget {
  final List<HierarchyNode> regionTree;
  final List<String> regionPath;
  final Function(List<String>) onRegionPathChange;
  final bool regionsLoading;
  final String? filterCondition;
  final Function(String?) onFilterConditionChange;
  final String? filterCategory;
  final Function(String?) onFilterCategoryChange;

  const MarketplaceFilters({
    super.key,
    required this.regionTree,
    required this.regionPath,
    required this.onRegionPathChange,
    this.regionsLoading = false,
    this.filterCondition,
    required this.onFilterConditionChange,
    this.filterCategory,
    required this.onFilterCategoryChange,
  });

  @override
  State<MarketplaceFilters> createState() => _MarketplaceFiltersState();
}

class _MarketplaceFiltersState extends State<MarketplaceFilters> {
  MarketplaceFilterMode? _activeMode;

  void _toggleMode(MarketplaceFilterMode mode) {
    setState(() {
      _activeMode = _activeMode == mode ? null : mode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            _buildFilterButton(
              mode: MarketplaceFilterMode.region,
              icon: LucideIcons.mapPin,
              label: 'المنطقة',
              iconBg: const Color(0xFFD1FAE5),
              iconColor: const Color(0xFF059669),
              activeRing: const Color(0xFF34D399).withOpacity(0.5),
              hasValue: widget.regionPath.isNotEmpty,
            ),
            const SizedBox(width: 8),
            _buildFilterButton(
              mode: MarketplaceFilterMode.condition,
              icon: LucideIcons.sparkles,
              label: 'جديد / مستعمل',
              iconBg: const Color(0xFFFEF3C7),
              iconColor: const Color(0xFFD97706),
              activeRing: const Color(0xFFFBBF24).withOpacity(0.5),
              hasValue: widget.filterCondition != null && widget.filterCondition!.isNotEmpty,
            ),
            const SizedBox(width: 8),
            _buildFilterButton(
              mode: MarketplaceFilterMode.category,
              icon: LucideIcons.folderOpen,
              label: 'الفئة',
              iconBg: const Color(0xFFEDE9FE),
              iconColor: const Color(0xFF7C3AED),
              activeRing: const Color(0xFFA78BFA).withOpacity(0.5),
              hasValue: widget.filterCategory != null && widget.filterCategory!.isNotEmpty,
            ),
          ],
        ),
        if (_activeMode == MarketplaceFilterMode.region) _buildRegionPanel(),
        if (_activeMode == MarketplaceFilterMode.condition) _buildConditionPanel(),
        if (_activeMode == MarketplaceFilterMode.category) _buildCategoryPanel(),
      ],
    );
  }

  Widget _buildFilterButton({
    required MarketplaceFilterMode mode,
    required IconData icon,
    required String label,
    required Color iconBg,
    required Color iconColor,
    required Color activeRing,
    required bool hasValue,
  }) {
    final bool isActive = _activeMode == mode;

    return Expanded(
      child: GestureDetector(
        onTap: () => _toggleMode(mode),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: (isActive || hasValue) ? activeRing : const Color(0xFFF3F4F6),
              width: (isActive || hasValue) ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 16),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRegionPanel() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          HierarchySelect(
            tree: widget.regionTree,
            pathIds: widget.regionPath,
            onPathChange: widget.onRegionPathChange,
            loading: widget.regionsLoading,
            firstPlaceholder: 'كل المناطق',
            showPath: false,
          ),
          if (widget.regionPath.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    widget.onRegionPathChange([]);
                    setState(() => _activeMode = null);
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(0xFFF3F4F6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text(
                    'مسح المنطقة',
                    style: TextStyle(color: Color(0xFF4B5563), fontSize: 12, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildConditionPanel() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Column(
        children: [
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 3.5,
            children: [
              _buildChoiceButton(
                label: 'الكل',
                isSelected: widget.filterCondition == null || widget.filterCondition!.isEmpty,
                onTap: () {
                  widget.onFilterConditionChange(null);
                  setState(() => _activeMode = null);
                },
                activeColor: const Color(0xFFD97706),
              ),
              ...BazaarConstants.conditions.map((c) => _buildChoiceButton(
                    label: c['label']!,
                    isSelected: widget.filterCondition == c['value'],
                    onTap: () {
                      widget.onFilterConditionChange(c['value']);
                      setState(() => _activeMode = null);
                    },
                    activeColor: const Color(0xFFD97706),
                  )),
            ],
          ),
          if (widget.filterCondition != null && widget.filterCondition!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10.0),
              child: Text(
                'مفعّل: ${BazaarConstants.getConditionLabel(widget.filterCondition!)}',
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCategoryPanel() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      constraints: const BoxConstraints(maxHeight: 250),
      child: SingleChildScrollView(
        child: Column(
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 3.5,
              children: [
                _buildChoiceButton(
                  label: 'كل الفئات',
                  isSelected: widget.filterCategory == null || widget.filterCategory!.isEmpty,
                  onTap: () {
                    widget.onFilterCategoryChange(null);
                    setState(() => _activeMode = null);
                  },
                  activeColor: const Color(0xFF7C3AED),
                ),
                ...BazaarConstants.categories.map((c) => _buildChoiceButton(
                      label: c['label']!,
                      isSelected: widget.filterCategory == c['value'],
                      onTap: () {
                        widget.onFilterCategoryChange(c['value']);
                        setState(() => _activeMode = null);
                      },
                      activeColor: const Color(0xFF7C3AED),
                    )),
              ],
            ),
            if (widget.filterCategory != null && widget.filterCategory!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10.0),
                child: Text(
                  'مفعّل: ${BazaarConstants.getCategoryLabel(widget.filterCategory!)}',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF7C3AED)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildChoiceButton({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required Color activeColor,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? activeColor : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF374151),
            fontSize: 11,
            fontWeight: FontWeight.w900,
            fontFamily: 'Cairo',
          ),
        ),
      ),
    );
  }
}
