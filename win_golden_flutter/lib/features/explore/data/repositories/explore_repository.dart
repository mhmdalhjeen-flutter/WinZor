import '../../../../core/api/api_client.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/cached_fetch.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../models/store_model.dart';
import '../models/store_detail_response.dart';

class ExploreRepository {
  final ApiClient _apiClient;

  ExploreRepository(this._apiClient);

  Future<Map<String, dynamic>> browseStores({
    String? query,
    String? regionId,
    String? categoryId,
    bool forceNetwork = false,
    void Function(Map<String, dynamic> fresh)? onBackgroundRefresh,
  }) async {
    final cacheKey = CacheKeys.storesBrowse(
      query: query,
      regionId: regionId,
      categoryId: categoryId,
    );
    return CachedFetch.load<Map<String, dynamic>>(
      key: cacheKey,
      forceNetwork: forceNetwork,
      staleAfter: const Duration(minutes: 15),
      onBackgroundRefresh: onBackgroundRefresh,
      network: () async {
        final Map<String, dynamic> params = {};
        if (query != null && query.isNotEmpty) params['q'] = query;
        if (regionId != null) params['regionId'] = regionId;
        if (categoryId != null) params['categoryId'] = categoryId;

        final response = await _apiClient.dio.get('/stores/browse', queryParameters: params);
        return Map<String, dynamic>.from(response.data as Map);
      },
      fromCache: (raw) => Map<String, dynamic>.from(raw as Map),
      toCache: (data) => data,
    );
  }

  Future<List<HierarchyNode>> getCategories({bool forceNetwork = false}) async {
    try {
      final response = await _apiClient.dio.get('/categories/tree', queryParameters: {'type': 'store'});
      final List<dynamic> data = response.data;
      await LocalCacheService.save(CacheKeys.categories('store'), data);
      return data.map((json) => HierarchyNode.fromJson(json)).toList();
    } catch (e) {
      final cached = LocalCacheService.getData(CacheKeys.categories('store'));
      if (cached != null) {
        return (cached as List).map((json) => HierarchyNode.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  Future<List<HierarchyNode>> getRegions({bool forceNetwork = false}) async {
    try {
      final response = await _apiClient.dio.get(
        '/regions',
        queryParameters: {'tree': 'true'},
      );
      final List<dynamic> data = response.data;
      await LocalCacheService.save(CacheKeys.regionsTree, data);
      return data.map((json) => HierarchyNode.fromJson(json)).toList();
    } catch (e) {
      final cached = LocalCacheService.getData(CacheKeys.regionsTree);
      if (cached != null) {
        return (cached as List).map((json) => HierarchyNode.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> pointsProgramStores({
    String? query,
    String? regionId,
  }) async {
    final params = <String, dynamic>{};
    if (query != null && query.isNotEmpty) params['q'] = query;
    if (regionId != null && regionId.isNotEmpty) params['regionId'] = regionId;

    final response =
        await _apiClient.dio.get('/stores/points', queryParameters: params);
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'total': 0, 'regions': <dynamic>[]};
  }

  Future<Map<String, dynamic>> storesByRegions({
    String? query,
    String? regionId,
    String? categoryId,
  }) async {
    final params = <String, dynamic>{};
    if (query != null && query.isNotEmpty) params['q'] = query;
    if (regionId != null && regionId.isNotEmpty) params['regionId'] = regionId;
    if (categoryId != null && categoryId.isNotEmpty) {
      params['categoryId'] = categoryId;
    }

    final response = await _apiClient.dio
        .get('/stores/by-regions', queryParameters: params);
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'regions': <dynamic>[]};
  }

  Future<StoreDetailResponse> getStoreDetail(String id, {bool forceNetwork = false}) async {
    final cacheKey = CacheKeys.storeDetail(id);
    return CachedFetch.load<StoreDetailResponse>(
      key: cacheKey,
      forceNetwork: forceNetwork,
      staleAfter: const Duration(minutes: 30),
      network: () async {
        final response = await _apiClient.dio.get('/stores/$id');
        final detail = StoreDetailResponse.fromJson(response.data);
        await LocalCacheService.rememberVisitedStore(
          id,
          {
            'name': detail.store.name,
            'logo': detail.store.logo,
            'region': detail.store.region,
          },
        );
        return detail;
      },
      fromCache: (raw) => StoreDetailResponse.fromJson(Map<String, dynamic>.from(raw as Map)),
      toCache: (detail) => detail.toJson(),
    );
  }

  Future<List<MemberPrize>> getMemberPrizes(String id) async {
    try {
      final response = await _apiClient.dio.get('/stores/$id/member-prizes');
      final List<dynamic> data = response.data['prizes'] ?? [];
      return data.map((json) => MemberPrize.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> joinStore(String id) async {
    final response = await _apiClient.dio.post('/stores/$id/join');
    return response.data;
  }

  Future<void> logStoreVisit(String id, String? category, String? region) async {
    try {
      await _apiClient.dio.post('/activity', data: {
        'type': 'visit_store',
        'targetType': 'Store',
        'targetId': id,
        'meta': {'category': category, 'region': region},
      });
    } catch (_) {}
  }
}
