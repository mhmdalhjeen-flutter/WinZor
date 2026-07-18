import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../../../../core/cache/local_cache_service.dart';

class HomeRepository {
  final ApiClient _apiClient;

  HomeRepository(this._apiClient);

  Future<List<HierarchyNode>> getCategories(String type, {bool forceNetwork = false}) async {
    final cacheKey = 'categories_$type';
    try {
      final response = await _apiClient.dio.get('/categories/tree', queryParameters: {'type': type});
      final List<dynamic> data = response.data;
      await LocalCacheService.save(cacheKey, data); 
      return data.map((json) => HierarchyNode.fromJson(json)).toList();
    } catch (e) {
      final cachedData = LocalCacheService.get(cacheKey);
      if (cachedData != null) {
        return (cachedData as List).map((json) => HierarchyNode.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  Future<List<HierarchyNode>> getRegions({bool forceNetwork = false}) async {
    const cacheKey = 'regions_tree';
    try {
      final response = await _apiClient.dio.get('/regions', queryParameters: {'tree': 'true'});
      final List<dynamic> data = response.data;
      await LocalCacheService.save(cacheKey, data);
      return data.map((json) => HierarchyNode.fromJson(json)).toList();
    } catch (e) {
      final cachedData = LocalCacheService.get(cacheKey);
      if (cachedData != null) {
        return (cachedData as List).map((json) => HierarchyNode.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  Future<List<dynamic>> getOffersReels({String? categoryId, String? regionId, bool forceNetwork = false}) async {
    final cacheKey = 'reels_${regionId ?? 'all'}_${categoryId ?? 'all'}';
    try {
      final Map<String, dynamic> params = {'limit': 20};
      if (regionId != null) params['region'] = regionId;
      if (categoryId != null) params['category'] = categoryId;

      final response = await _apiClient.dio.get('/offers/reels', queryParameters: params);
      final data = response.data['reels'] ?? [];
      await LocalCacheService.save(cacheKey, data);
      return data;
    } catch (e) {
      final cachedData = LocalCacheService.get(cacheKey);
      if (cachedData != null) return cachedData as List<dynamic>;
      rethrow;
    }
  }

  Future<({List<dynamic> offers, List<dynamic> products, List<dynamic> stores})> universalSearch(String query) async {
    final q = query.trim();
    if (q.length < 2) return (offers: <dynamic>[], products: <dynamic>[], stores: <dynamic>[]);

    try {
      final results = await Future.wait([
        _apiClient.dio.get('/offers/feed', queryParameters: {'q': q, 'limit': 5}),
        _apiClient.dio.get('/products/search', queryParameters: {'q': q}),
        _apiClient.dio.get('/stores/browse', queryParameters: {'q': q}),
      ]);

      // تحديد النوع بشكل صريح جداً لحل مشكلة Record type mismatch
      final offers = List<dynamic>.from(results[0].data['items'] is List ? results[0].data['items'] : []);
      final products = List<dynamic>.from(results[1].data['products'] is List ? results[1].data['products'] : []);
      final stores = List<dynamic>.from(_flattenBrowseStores(results[2].data, 5));

      return (offers: offers, products: products, stores: stores);
    } catch (e) {
      return (offers: <dynamic>[], products: <dynamic>[], stores: <dynamic>[]);
    }
  }

  List<dynamic> _flattenBrowseStores(dynamic data, int limit) {
    final out = <dynamic>[];
    if (data is! Map) return out;
    final regions = data['regions'];
    if (regions is! List) return out;
    void takeStores(List? list) {
      if (list == null) return;
      for (final s in list) {
        if (out.length >= limit) return;
        if (s is Map) out.add(s);
      }
    }
    for (final block in regions) {
      if (out.length >= limit) break;
      if (block is! Map) continue;
      takeStores(block['stores'] is List ? block['stores'] as List : null);
      final subs = block['subRegions'];
      if (subs is List) {
        for (final sub in subs) {
          if (out.length >= limit) break;
          if (sub is Map) takeStores(sub['stores'] is List ? sub['stores'] as List : null);
        }
      }
    }
    return out;
  }
}
