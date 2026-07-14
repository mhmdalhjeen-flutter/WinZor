import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
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

final storeCategoriesProvider = FutureProvider<List<HierarchyNode>>((ref) async {
  return ref.watch(homeRepositoryProvider).getCategories('store');
});

final regionsProvider = FutureProvider<List<HierarchyNode>>((ref) async {
  return ref.watch(homeRepositoryProvider).getRegions();
});

final regionPathProvider = StateProvider<List<String>>((ref) => []);
final categoryPathProvider = StateProvider<List<String>>((ref) => []);

final reelsProvider = FutureProvider<List<dynamic>>((ref) async {
  final regionPath = ref.watch(regionPathProvider);
  final categoryPath = ref.watch(categoryPathProvider);

  final regionId = regionPath.isNotEmpty ? regionPath.last : null;
  final categoryId = categoryPath.isNotEmpty ? categoryPath.last : null;

  return ref.watch(homeRepositoryProvider).getOffersReels(
        regionId: regionId,
        categoryId: categoryId,
      );
});
