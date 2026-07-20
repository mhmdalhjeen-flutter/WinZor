import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/onboarding/onboarding_target.dart';
import '../../../../core/onboarding/onboarding_targets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/hierarchy_select.dart';
import '../providers/home_providers.dart';

enum SearchMode { region, offer }

class HomeSearchCards extends ConsumerStatefulWidget {
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
  ConsumerState<HomeSearchCards> createState() => _HomeSearchCardsState();
}

class _HomeSearchCardsState extends ConsumerState<HomeSearchCards> {
  SearchMode? activeMode;
  bool searchOpen = false;
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  bool _loading = false;
  String? _error;
  List<dynamic> _offers = [];
  List<dynamic> _products = [];
  List<dynamic> _stores = [];
  String _lastQ = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

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
      if (!searchOpen) {
        _offers = [];
        _products = [];
        _stores = [];
        _error = null;
        _lastQ = '';
      }
    });
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _runSearch(value);
    });
  }

  Future<void> _runSearch(String raw) async {
    final q = raw.trim();
    if (q.length < 2) {
      setState(() {
        _offers = [];
        _products = [];
        _stores = [];
        _loading = false;
        _error = null;
        _lastQ = q;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _lastQ = q;
    });
    try {
      final result = await ref.read(homeRepositoryProvider).universalSearch(q);
      if (!mounted || _lastQ != q) return;
      setState(() {
        _offers = result.offers;
        _products = result.products;
        _stores = result.stores;
        _loading = false;
      });
    } catch (_) {
      if (!mounted || _lastQ != q) return;
      setState(() {
        _loading = false;
        _error = 'تعذّر البحث';
      });
    }
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
                child: OnboardingTarget(
                  targetKey: OnboardingTargets.filters,
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
    final isActive = activeMode == mode;
    return GestureDetector(
      onTap: () => _toggleMode(mode),
      child: Container(
        constraints: const BoxConstraints(minHeight: 68),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? activeColor : const Color(0xFFF3F4F6),
            width: isActive ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 15, color: iconColor),
            ),
            const SizedBox(height: 4),
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
    );
  }

  Widget _buildSearchToggleButton() {
    return GestureDetector(
      onTap: _toggleSearch,
      child: Container(
        width: 60,
        constraints: const BoxConstraints(minHeight: 68),
        decoration: BoxDecoration(
          color: searchOpen ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: searchOpen ? AppColors.primary : const Color(0xFFF3F4F6),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              searchOpen ? Icons.close : Icons.search,
              color: searchOpen ? Colors.white : AppColors.primary,
              size: 18,
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
    final hasQuery = _searchController.text.trim().length >= 2;
    final hasResults = _offers.isNotEmpty || _products.isNotEmpty || _stores.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(top: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEDE9FE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                const Icon(Icons.search, color: AppColors.violet, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onQueryChanged,
                    decoration: const InputDecoration(
                      hintText: 'ابحث عن عروض، منتجات، متاجر...',
                      border: InputBorder.none,
                    ),
                  ),
                ),
                if (_loading) const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ),
          ),
          if (hasResults) ...[
            if (_offers.isNotEmpty) _section('عروض', _offers, (m) {
              final map = Map<String, dynamic>.from(m);
              return (
                title: map['title']?.toString() ?? '',
                subtitle: map['store']?['name']?.toString(),
                image: resolveOfferImage(map),
                onTap: () => context.push('/offer/${map['_id'] ?? map['id']}'),
              );
            }),
            if (_products.isNotEmpty) _section('منتجات', _products, (m) {
              final map = Map<String, dynamic>.from(m);
              return (
                title: map['name']?.toString() ?? '',
                subtitle: map['store']?['name']?.toString(),
                image: resolveProductImage(map),
                onTap: () => context.push('/product/${map['_id'] ?? map['id']}'),
              );
            }),
            if (_stores.isNotEmpty) _section('متاجر', _stores, (m) {
              final map = Map<String, dynamic>.from(m);
              return (
                title: map['name']?.toString() ?? '',
                subtitle: map['region']?.toString(),
                image: resolveStoreLogo(map),
                onTap: () => context.push('/store/${map['_id'] ?? map['id']}'),
              );
            }),
          ]
        ],
      ),
    );
  }

  Widget _section(String title, List items, dynamic mapItem) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.grey)),
        ),
        ...items.map((raw) {
          final item = mapItem(raw);
          return ListTile(
            leading: item.image != null ? Image.network(item.image!, width: 40) : const Icon(Icons.image),
            title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w900)),
            subtitle: Text(item.subtitle ?? ''),
            onTap: item.onTap,
          );
        }),
      ],
    );
  }

  Widget _buildRegionPanel() {
    return _filterPanel(
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
          ElevatedButton(
            onPressed: () {
              setState(() => activeMode = null);
              widget.onSearchTriggered();
            },
            child: const Text('عرض العروض'),
          ),
        ],
      ),
    );
  }

  Widget _buildOfferPanel() {
    return _filterPanel(
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
          ElevatedButton(
            onPressed: () {
              setState(() => activeMode = null);
              widget.onSearchTriggered();
            },
            child: const Text('عرض العروض'),
          ),
        ],
      ),
    );
  }

  Widget _filterPanel({required Widget child}) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: child,
    );
  }
}
