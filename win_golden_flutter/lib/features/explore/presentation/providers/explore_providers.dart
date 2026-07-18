import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/explore_repository.dart';
import '../../../home/presentation/providers/home_providers.dart'; // To reuse apiClientProvider
import '../../../../core/models/hierarchy_node.dart';

final exploreRepositoryProvider = Provider((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ExploreRepository(apiClient);
});

final exploreRegionPathProvider = StateProvider<List<String>>((ref) => []);
final exploreCategoryPathProvider = StateProvider<List<String>>((ref) => []);
final exploreSearchQueryProvider = StateProvider<String>((ref) => '');

final storeBrowseProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  ref.keepAlive();
  final repo = ref.watch(exploreRepositoryProvider);
  final regionPath = ref.watch(exploreRegionPathProvider);
  final categoryPath = ref.watch(exploreCategoryPathProvider);
  final query = ref.watch(exploreSearchQueryProvider);

  final regionId = regionPath.isNotEmpty ? regionPath.last : null;
  final categoryId = categoryPath.isNotEmpty ? categoryPath.last : null;

  return repo.browseStores(
    query: query,
    regionId: regionId,
    categoryId: categoryId,
    onBackgroundRefresh: (_) {
      ref.invalidateSelf();
    },
  );
});

final exploreCategoriesProvider = FutureProvider<List<HierarchyNode>>((ref) async {
  return ref.watch(exploreRepositoryProvider).getCategories();
});

final exploreRegionsProvider = FutureProvider<List<HierarchyNode>>((ref) async {
  return ref.watch(exploreRepositoryProvider).getRegions();
});
