import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../explore/presentation/providers/explore_providers.dart';
import '../../utils/points_program_filters.dart';

final pointsSearchQueryProvider = StateProvider<String>((ref) => '');
final pointsRegionPathProvider = StateProvider<List<String>>((ref) => []);
final pointsCategoryPathProvider = StateProvider<List<String>>((ref) => []);

/// Debounced query holder updated by the page.
final pointsDebouncedQueryProvider = StateProvider<String>((ref) => '');

final pointsProgramStoresProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(exploreRepositoryProvider);
  final regionPath = ref.watch(pointsRegionPathProvider);
  final q = ref.watch(pointsDebouncedQueryProvider);
  final regionId = effectiveHierarchyId(regionPath);

  return repo.pointsProgramStores(query: q, regionId: regionId);
});

final pointsRegionsTreeProvider =
    FutureProvider<List<HierarchyNode>>((ref) async {
  return ref.watch(exploreRepositoryProvider).getRegions();
});

final pointsCategoriesTreeProvider =
    FutureProvider<List<HierarchyNode>>((ref) async {
  return ref.watch(exploreRepositoryProvider).getCategories();
});

// ─── Store Quick Search (`/stores/search`) ───────────────────────────────

final quickSearchQueryProvider = StateProvider<String>((ref) => '');
final quickSearchDebouncedQueryProvider = StateProvider<String>((ref) => '');
final quickSearchRegionPathProvider = StateProvider<List<String>>((ref) => []);
final quickSearchCategoryPathProvider = StateProvider<List<String>>((ref) => []);

final storesByRegionsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(exploreRepositoryProvider);
  final regionPath = ref.watch(quickSearchRegionPathProvider);
  final categoryPath = ref.watch(quickSearchCategoryPathProvider);
  final q = ref.watch(quickSearchDebouncedQueryProvider);

  return repo.storesByRegions(
    query: q,
    regionId: effectiveHierarchyId(regionPath),
    categoryId: effectiveHierarchyId(categoryPath),
  );
});
