import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/hierarchy_select.dart';
import '../../../../core/widgets/store_card.dart';
import '../../../explore/data/models/store_model.dart';
import '../../../explore/presentation/widgets/store_region_suggestion.dart';
import '../../utils/points_program_filters.dart';
import '../providers/points_stores_providers.dart';

/// React `StoreQuickSearch.jsx` — `/stores/search`
class StoreQuickSearchPage extends ConsumerStatefulWidget {
  const StoreQuickSearchPage({super.key});

  @override
  ConsumerState<StoreQuickSearchPage> createState() =>
      _StoreQuickSearchPageState();
}

class _StoreQuickSearchPageState extends ConsumerState<StoreQuickSearchPage> {
  Timer? _debounce;
  late final TextEditingController _searchCtrl;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(
      text: ref.read(quickSearchQueryProvider),
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    ref.read(quickSearchQueryProvider.notifier).state = value;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(quickSearchDebouncedQueryProvider.notifier).state =
          value.trim();
    });
  }

  void _clear() {
    _searchCtrl.clear();
    ref.read(quickSearchQueryProvider.notifier).state = '';
    ref.read(quickSearchDebouncedQueryProvider.notifier).state = '';
    ref.read(quickSearchRegionPathProvider.notifier).state = [];
    ref.read(quickSearchCategoryPathProvider.notifier).state = [];
  }

  StoreModel? _parseStore(Map store) {
    try {
      return StoreModel.fromJson(Map<String, dynamic>.from(store));
    } catch (_) {
      final id = (store['_id'] ?? store['id'] ?? '').toString();
      if (id.isEmpty) return null;
      return StoreModel(
        id: id,
        name: (store['name'] ?? '').toString(),
        description: store['description']?.toString(),
        category: store['category']?.toString(),
        categoryId: store['categoryId']?.toString(),
        region: store['region']?.toString(),
        subRegion: store['subRegion']?.toString(),
        logo: store['logo']?.toString(),
        coverImage: store['coverImage']?.toString(),
        isVerifiedStore: store['isVerifiedStore'] == true,
        ratingAvg:
            double.tryParse(store['ratingAvg']?.toString() ?? '') ?? 0,
        ratingCount:
            int.tryParse(store['ratingCount']?.toString() ?? '') ?? 0,
        customersCount:
            int.tryParse(store['customersCount']?.toString() ?? '') ?? 0,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final regionPath = ref.watch(quickSearchRegionPathProvider);
    final categoryPath = ref.watch(quickSearchCategoryPathProvider);
    final regionsAsync = ref.watch(pointsRegionsTreeProvider);
    final categoriesAsync = ref.watch(pointsCategoriesTreeProvider);
    final dataAsync = ref.watch(storesByRegionsProvider);

    final regionTree = regionsAsync.valueOrNull ?? [];
    final categoryTree = categoriesAsync.valueOrNull ?? [];
    final query = ref.watch(quickSearchDebouncedQueryProvider);
    final hasActiveSearch =
        query.isNotEmpty || regionPath.isNotEmpty || categoryPath.isNotEmpty;

    if (regionPath.isNotEmpty &&
        regionTree.isNotEmpty &&
        !hierarchyPathStillValid(regionTree, regionPath)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(quickSearchRegionPathProvider.notifier).state = [];
      });
    }
    if (categoryPath.isNotEmpty &&
        categoryTree.isNotEmpty &&
        !hierarchyPathStillValid(categoryTree, categoryPath)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(quickSearchCategoryPathProvider.notifier).state = [];
      });
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(storesByRegionsProvider);
            await ref.read(storesByRegionsProvider.future);
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
                            context.go('/explore');
                          }
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFFF3F4F6)),
                        ),
                        icon: const Icon(LucideIcons.chevronRight, size: 20),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'البحث السريع عن متجر',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            color: Color(0xFF111827),
                          ),
                        ),
                      ),
                      if (hasActiveSearch)
                        TextButton(
                          onPressed: _clear,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F3FF),
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(
                                  color: const Color(0xFFDDD6FE)),
                            ),
                            child: const Text(
                              'إلغاء البحث',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                color: Color(0xFF6D28D9),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
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
                          controller: _searchCtrl,
                          onChanged: _onSearchChanged,
                          decoration: InputDecoration(
                            hintText: 'اسم المتجر...',
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
                        const SizedBox(height: 12),
                        HierarchySelect(
                          tree: regionTree,
                          pathIds: regionPath,
                          onPathChange: (path) => ref
                              .read(quickSearchRegionPathProvider.notifier)
                              .state = path,
                          loading: regionsAsync.isLoading,
                          allowAllAtRoot: true,
                          firstPlaceholder: 'كل المناطق',
                          optionalPlaceholder: 'منطقة أدق (اختياري)',
                          showPath: false,
                        ),
                        const SizedBox(height: 12),
                        HierarchySelect(
                          tree: categoryTree,
                          pathIds: categoryPath,
                          onPathChange: (path) => ref
                              .read(quickSearchCategoryPathProvider.notifier)
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
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ...dataAsync.when(
                loading: () => [
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ],
                error: (_, __) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: TextButton(
                        onPressed: () =>
                            ref.invalidate(storesByRegionsProvider),
                        child: const Text(
                          'تعذّر تحميل المتاجر — إعادة المحاولة',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
                data: (data) {
                  final regions = data['regions'] is List
                      ? data['regions'] as List
                      : <dynamic>[];
                  final suggestion = data['suggestion'];

                  bool hasVisible = false;
                  for (final block in regions) {
                    if (block is! Map) continue;
                    final stores = block['stores'];
                    if (stores is List && stores.isNotEmpty) {
                      hasVisible = true;
                      break;
                    }
                    final subs = block['subRegions'];
                    if (subs is List) {
                      for (final sub in subs) {
                        if (sub is Map &&
                            sub['stores'] is List &&
                            (sub['stores'] as List).isNotEmpty) {
                          hasVisible = true;
                          break;
                        }
                      }
                    }
                    if (hasVisible) break;
                  }

                  if (!hasVisible && suggestion != null) {
                    return [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: StoreRegionSuggestion(
                            suggestion: suggestion is Map
                                ? Map<String, dynamic>.from(suggestion)
                                : <String, dynamic>{},
                            onApply: (id) {
                              if (id.isEmpty) return;
                              ref
                                  .read(quickSearchRegionPathProvider.notifier)
                                  .state = [id];
                            },
                          ),
                        ),
                      ),
                    ];
                  }

                  if (!hasVisible) {
                    return [
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: Text(
                            'لا متاجر مطابقة — جرّب تغيير المنطقة أو نوع المتجر',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                      ),
                    ];
                  }

                  return [
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final block = regions[index];
                          if (block is! Map) return const SizedBox.shrink();
                          final region = block['region'];
                          final regionName = region is Map
                              ? (region['name']?.toString() ?? '')
                              : '';
                          final stores = block['stores'] is List
                              ? block['stores'] as List
                              : <dynamic>[];
                          final subRegions = block['subRegions'] is List
                              ? block['subRegions'] as List
                              : <dynamic>[];

                          return Padding(
                            padding:
                                const EdgeInsets.fromLTRB(16, 0, 16, 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  regionName,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                if (stores.isNotEmpty)
                                  SizedBox(
                                    height: 260,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      itemCount: stores.length,
                                      itemBuilder: (context, i) {
                                        final raw = stores[i];
                                        if (raw is! Map) {
                                          return const SizedBox.shrink();
                                        }
                                        final model = _parseStore(raw);
                                        if (model == null) {
                                          return const SizedBox.shrink();
                                        }
                                        return StoreCard(store: model);
                                      },
                                    ),
                                  ),
                                ...subRegions.whereType<Map>().map((sub) {
                                  final subRegion = sub['region'];
                                  final subName = subRegion is Map
                                      ? (subRegion['name']?.toString() ??
                                          '')
                                      : '';
                                  final subStores = sub['stores'] is List
                                      ? sub['stores'] as List
                                      : <dynamic>[];
                                  if (subStores.isEmpty) {
                                    return const SizedBox.shrink();
                                  }
                                  return Padding(
                                    padding: const EdgeInsets.only(
                                        top: 12, right: 12),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          subName,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w900,
                                            fontFamily: 'Cairo',
                                            color: Color(0xFF6B7280),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        SizedBox(
                                          height: 260,
                                          child: ListView.builder(
                                            scrollDirection:
                                                Axis.horizontal,
                                            itemCount: subStores.length,
                                            itemBuilder: (context, i) {
                                              final raw = subStores[i];
                                              if (raw is! Map) {
                                                return const SizedBox
                                                    .shrink();
                                              }
                                              final model =
                                                  _parseStore(raw);
                                              if (model == null) {
                                                return const SizedBox
                                                    .shrink();
                                              }
                                              return StoreCard(
                                                  store: model);
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                                if (stores.isEmpty &&
                                    !subRegions.any((s) =>
                                        s is Map &&
                                        s['stores'] is List &&
                                        (s['stores'] as List)
                                            .isNotEmpty))
                                  const Padding(
                                    padding: EdgeInsets.only(top: 4),
                                    child: Text(
                                      'لا متاجر في هذه المنطقة',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF9CA3AF),
                                        fontFamily: 'Cairo',
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                        childCount: regions.length,
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
