import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/cache/cached_fetch.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../../core/utils/image_upload.dart';
import '../../data/repositories/home_repository.dart';

final apiClientProvider = Provider((ref) => ApiClient());

final imageUploadServiceProvider = Provider((ref) {
  return ImageUploadService(ref.watch(apiClientProvider));
});

final homeRepositoryProvider = Provider((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return HomeRepository(apiClient);
});

// تحويل الـ FutureProvider إلى AsyncNotifier لتمكين التحديث الصامت
final storeCategoriesProvider = AsyncNotifierProvider<StoreCategoriesNotifier, List<HierarchyNode>>(() {
  return StoreCategoriesNotifier();
});

class StoreCategoriesNotifier extends AsyncNotifier<List<HierarchyNode>> {
  @override
  Future<List<HierarchyNode>> build() async {
    return CachedFetch.load<List<HierarchyNode>>(
      key: 'categories_store',
      network: () => ref.read(homeRepositoryProvider).getCategories('store'),
      fromCache: (raw) => (raw as List).map((j) => HierarchyNode.fromJson(j)).toList(),
      toCache: (list) => list.map((e) => e.toJson()).toList(),
      staleAfter: const Duration(hours: 1),
      onBackgroundRefresh: (fresh) => state = AsyncData(fresh),
    );
  }
}

final regionsProvider = AsyncNotifierProvider<RegionsNotifier, List<HierarchyNode>>(() {
  return RegionsNotifier();
});

class RegionsNotifier extends AsyncNotifier<List<HierarchyNode>> {
  @override
  Future<List<HierarchyNode>> build() async {
    return CachedFetch.load<List<HierarchyNode>>(
      key: CacheKeys.regionsTree,
      network: () => ref.read(homeRepositoryProvider).getRegions(),
      fromCache: (raw) => (raw as List).map((j) => HierarchyNode.fromJson(j)).toList(),
      toCache: (list) => list.map((e) => e.toJson()).toList(),
      staleAfter: const Duration(days: 1),
      onBackgroundRefresh: (fresh) => state = AsyncData(fresh),
    );
  }
}

final regionPathProvider = StateProvider<List<String>>((ref) => []);
final categoryPathProvider = StateProvider<List<String>>((ref) => []);

final reelsProvider = AsyncNotifierProvider<ReelsNotifier, List<dynamic>>(() {
  return ReelsNotifier();
});

class ReelsNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    final regionPath = ref.watch(regionPathProvider);
    final categoryPath = ref.watch(categoryPathProvider);

    final regionId = regionPath.isNotEmpty ? regionPath.last : 'all';
    final categoryId = categoryPath.isNotEmpty ? categoryPath.last : 'all';
    final key = 'reels_${regionId}_$categoryId';

    return CachedFetch.load<List<dynamic>>(
      key: key,
      network: () => ref.read(homeRepositoryProvider).getOffersReels(
            regionId: regionId == 'all' ? null : regionId,
            categoryId: categoryId == 'all' ? null : categoryId,
          ),
      fromCache: (raw) => raw as List<dynamic>,
      toCache: (data) => data,
      staleAfter: const Duration(minutes: 15),
      onBackgroundRefresh: (fresh) => state = AsyncData(fresh),
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    ref.invalidateSelf();
  }
}
