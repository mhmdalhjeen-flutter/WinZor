import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/models/hierarchy_node.dart';
import '../../../core/widgets/hierarchy_select.dart';

enum SearchMode { region, offer }

class HomeSearchCards extends StatefulWidget {
  final List<HierarchyNode> regionTree;
  final List<String> regionPath;
  final Function(List<String>) onRegionPathChange;
  final bool regionsLoading;
  
  final List<HierarchyNode> categoryTree;
  final List<String> categoryPath;
  final Function(List<String>) onCategoryPathChange;
  final bool categoriesLoading;

  final VoidCallback onSearchTriggered;

  const HomeSearchCards({
    super.key,
    required this.regionTree,
    required this.regionPath,
    required this.onRegionPathChange,
    this.regionsLoading = false,
    required this.categoryTree,
    required this.categoryPath,
    required this.onCategoryPathChange,
    this.categoriesLoading = false,
    required this.onSearchTriggered,
  });

  @override
  State<HomeSearchCards> createState() => _HomeSearchCardsState();
}

class _HomeSearchCardsState extends State<HomeSearchCards> {
  SearchMode? activeMode;
  bool searchOpen = false;
  final TextEditingController _searchController = TextEditingController();

  void _toggleMode(SearchMode mode) {
    setState(() {
      activeMode = activeMode == mode ? null : mode;
      searchOpen = false;
    });
  }

  void _toggleSearch() {
    setState(() {
      searchOpen = !searchOpen;
      activeMode = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: _buildModeCard(
                        mode: SearchMode.region,
                        icon: Icons.location_on_outlined,
                        label: 'فلترة العروض\n(حسب المنطقة)',
                        iconBg: const Color(0xFFD1FAE5),
                        iconColor: const Color(0xFF059669),
                        activeColor: const Color(0xFF34D399).withOpacity(0.5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildModeCard(
                        mode: SearchMode.offer,
                        icon: Icons.local_offer_outlined,
                        label: 'تصنيف العروض\n(حسب النوع)',
                        iconBg: const Color(0xFFEDE9FE),
                        iconColor: const Color(0xFF7C3AED),
                        activeColor: const Color(0xFFA78BFA).withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _buildSearchToggleButton(),
            ],
          ),
          
          if (searchOpen) _buildSearchPanel(),
          
          if (activeMode == SearchMode.region) _buildRegionPanel(),
          
          if (activeMode == SearchMode.offer) _buildOfferPanel(),
        ],
      ),
    );
  }

  Widget _buildModeCard({
    required SearchMode mode,
    required IconData icon,
    required String label,
    required Color iconBg,
    required Color iconColor,
    required Color activeColor,
  }) {
    final bool isActive = activeMode == mode;

    return GestureDetector(
      onTap: () => _toggleMode(mode),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? activeColor : const Color(0xFFF3F4F6),
            width: isActive ? 2 : 1,
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
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1F2937),
                height: 1.2,
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchToggleButton() {
    return GestureDetector(
      onTap: _toggleSearch,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 60,
        height: 75,
        decoration: BoxDecoration(
          color: searchOpen ? const Color(0xFF7C3AED) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: searchOpen ? const Color(0xFF7C3AED) : const Color(0xFFF3F4F6),
            width: searchOpen ? 2 : 1,
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              searchOpen ? Icons.close : Icons.search,
              color: searchOpen ? Colors.white : const Color(0xFF7C3AED),
              size: 20,
            ),
            const SizedBox(height: 4),
            Text(
              'بحث',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: searchOpen ? Colors.white : const Color(0xFF1F2937),
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchPanel() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEDE9FE)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                const Icon(Icons.search, color: Color(0xFF8B5CF6), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'ابحث عن عروض، منتجات، متاجر...',
                      hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontWeight: FontWeight.bold),
                      border: InputBorder.none,
                    ),
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          // Search results would go here
        ],
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
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                setState(() => activeMode = null);
                widget.onSearchTriggered();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('عرض العروض', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfferPanel() {
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
            tree: widget.categoryTree,
            pathIds: widget.categoryPath,
            onPathChange: widget.onCategoryPathChange,
            loading: widget.categoriesLoading,
            firstPlaceholder: 'كل التصنيفات',
            showPath: false,
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                setState(() => activeMode = null);
                widget.onSearchTriggered();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('عرض العروض', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }
}
