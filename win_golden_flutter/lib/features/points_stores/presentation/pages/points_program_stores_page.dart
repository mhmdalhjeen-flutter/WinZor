import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/hierarchy_select.dart';
import '../providers/points_stores_providers.dart';
import '../widgets/points_store_card.dart';
import '../../utils/points_program_filters.dart';

/// React `PointsProgramStores.jsx` — `/stores/points`
class PointsProgramStoresPage extends ConsumerStatefulWidget {
  const PointsProgramStoresPage({super.key});

  @override
  ConsumerState<PointsProgramStoresPage> createState() =>
      _PointsProgramStoresPageState();
}

class _PointsProgramStoresPageState
    extends ConsumerState<PointsProgramStoresPage> {
  Timer? _debounce;
  late final TextEditingController _searchCtrl;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(
      text: ref.read(pointsSearchQueryProvider),
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    ref.read(pointsSearchQueryProvider.notifier).state = value;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      ref.read(pointsDebouncedQueryProvider.notifier).state = value.trim();
    });
  }

  @override
  Widget build(BuildContext context) {
    final regionPath = ref.watch(pointsRegionPathProvider);
    final categoryPath = ref.watch(pointsCategoryPathProvider);
    final regionsAsync = ref.watch(pointsRegionsTreeProvider);
    final categoriesAsync = ref.watch(pointsCategoriesTreeProvider);
    final storesAsync = ref.watch(pointsProgramStoresProvider);

    // Keep hierarchy paths valid
    final regionTree = regionsAsync.valueOrNull ?? [];
    final categoryTree = categoriesAsync.valueOrNull ?? [];
    if (regionPath.isNotEmpty &&
        regionTree.isNotEmpty &&
        !hierarchyPathStillValid(regionTree, regionPath)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(pointsRegionPathProvider.notifier).state = [];
      });
    }
    if (categoryPath.isNotEmpty &&
        categoryTree.isNotEmpty &&
        !hierarchyPathStillValid(categoryTree, categoryPath)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(pointsCategoryPathProvider.notifier).state = [];
      });
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(pointsProgramStoresProvider);
            await ref.read(pointsProgramStoresProvider.future);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/');
                          }
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFFF3F4F6)),
                        ),
                        icon: const Icon(LucideIcons.chevronRight, size: 20),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'المتاجر المشاركة في برنامج النقاط',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFF111827),
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'اعثر على جميع المتاجر التي تمنح نقاطاً عند الشراء.',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Cairo',
                          color: Color(0xFF6B7280),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFF3F4F6)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        onChanged: _onSearchChanged,
                        controller: _searchCtrl,
                        decoration: InputDecoration(
                          hintText: 'ابحث باسم المتجر...',
                          hintStyle: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                          prefixIcon:
                              const Icon(LucideIcons.search, size: 18),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Row(
                        children: [
                          Icon(LucideIcons.mapPin,
                              size: 13, color: Color(0xFF6B7280)),
                          SizedBox(width: 4),
                          Text(
                            'فلترة حسب المنطقة',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      HierarchySelect(
                        tree: regionTree,
                        pathIds: regionPath,
                        onPathChange: (path) => ref
                            .read(pointsRegionPathProvider.notifier)
                            .state = path,
                        loading: regionsAsync.isLoading,
                        allowAllAtRoot: true,
                        firstPlaceholder: 'كل المناطق',
                        optionalPlaceholder: 'منطقة أدق (اختياري)',
                        showPath: false,
                      ),
                      const SizedBox(height: 14),
                      const Row(
                        children: [
                          Icon(LucideIcons.tag,
                              size: 13, color: Color(0xFF6B7280)),
                          SizedBox(width: 4),
                          Text(
                            'فلترة حسب نوع المتجر',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      HierarchySelect(
                        tree: categoryTree,
                        pathIds: categoryPath,
                        onPathChange: (path) => ref
                            .read(pointsCategoryPathProvider.notifier)
                            .state = path,
                        loading: categoriesAsync.isLoading,
                        allowAllAtRoot: true,
                        firstPlaceholder: 'كل التصنيفات',
                        optionalPlaceholder: 'تصنيف أدق (اختياري)',
                        showPath: false,
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ...storesAsync.when(
                loading: () => [
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ],
                error: (e, _) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'تعذّر تحميل المتاجر',
                            style: TextStyle(
                              color: Colors.red,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          TextButton(
                            onPressed: () =>
                                ref.invalidate(pointsProgramStoresProvider),
                            child: const Text(
                              'إعادة المحاولة',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                data: (data) {
                  final apiTotal =
                      int.tryParse(data['total']?.toString() ?? '') ?? 0;
                  final regionsRaw = data['regions'] is List
                      ? data['regions'] as List
                      : <dynamic>[];
                  final filtered = filterPointsProgramRegions(
                    regionsRaw,
                    categoryPath,
                    categoryTree,
                  );
                  final visibleCount = countPointsProgramStores(filtered);
                  final hasCategoryFilter = categoryPath.isNotEmpty;

                  if (apiTotal == 0) {
                    return [
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: Column(
                            children: [
                              Text(
                                'لا متاجر مطابقة',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                              SizedBox(height: 6),
                              Text(
                                'جرّب تغيير البحث أو المنطقة',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ];
                  }

                  if (visibleCount == 0) {
                    return [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            children: [
                              const Text(
                                'لا متاجر مطابقة',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                hasCategoryFilter
                                    ? 'لا توجد متاجر في هذا التصنيف — جرّب تصنيفاً آخر أو أزل الفلتر'
                                    : 'جرّب تغيير البحث أو المنطقة',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ];
                  }

                  return [
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final region = filtered[index];
                          final regionName =
                              region['regionName']?.toString() ?? '';
                          final groups = region['parentGroups'] is List
                              ? region['parentGroups'] as List
                              : <dynamic>[];

                          return Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(LucideIcons.chevronLeft,
                                        size: 18, color: AppColors.primary),
                                    const SizedBox(width: 4),
                                    Text(
                                      regionName,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'Cairo',
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ...groups.whereType<Map>().map((group) {
                                  final parentCategory =
                                      group['parentCategory']?.toString() ??
                                          '';
                                  final sections = group['sections'] is List
                                      ? group['sections'] as List
                                      : <dynamic>[];
                                  return Padding(
                                    padding: const EdgeInsets.only(
                                        bottom: 16, right: 8),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.only(
                                              right: 10),
                                          decoration: const BoxDecoration(
                                            border: Border(
                                              right: BorderSide(
                                                color: Color(0x4DDC2626),
                                                width: 4,
                                              ),
                                            ),
                                          ),
                                          child: Text(
                                            parentCategory,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w900,
                                              fontFamily: 'Cairo',
                                              color: Color(0xFF1F2937),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        ...sections
                                            .whereType<Map>()
                                            .map((section) {
                                          final sectionName = section[
                                                      'categoryName']
                                                  ?.toString() ??
                                              '';
                                          final isFallback =
                                              section['isParentFallback'] ==
                                                  true;
                                          final stores =
                                              section['stores'] is List
                                                  ? section['stores'] as List
                                                  : <dynamic>[];
                                          return Padding(
                                            padding: const EdgeInsets.only(
                                                bottom: 12, right: 8),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                if (!isFallback &&
                                                    sectionName !=
                                                        parentCategory)
                                                  Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            bottom: 8),
                                                    child: Text(
                                                      sectionName,
                                                      style: const TextStyle(
                                                        fontSize: 13,
                                                        fontWeight:
                                                            FontWeight.w900,
                                                        fontFamily: 'Cairo',
                                                        color:
                                                            Color(0xFF4B5563),
                                                      ),
                                                    ),
                                                  ),
                                                ...stores
                                                    .whereType<Map>()
                                                    .map((store) {
                                                  return Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            bottom: 12),
                                                    child: PointsStoreCard(
                                                      store: Map<String,
                                                              dynamic>.from(
                                                          store),
                                                    ),
                                                  );
                                                }),
                                              ],
                                            ),
                                          );
                                        }),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ),
                          );
                        },
                        childCount: filtered.length,
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 40)),
                  ];
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
