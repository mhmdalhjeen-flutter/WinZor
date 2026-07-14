import '../../../../core/api/api_client.dart';
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
  }) async {
    try {
      final Map<String, dynamic> params = {};
      if (query != null && query.isNotEmpty) params['q'] = query;
      if (regionId != null) params['regionId'] = regionId;
      if (categoryId != null) params['categoryId'] = categoryId;

      final response = await _apiClient.dio.get('/stores/browse', queryParameters: params);
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<HierarchyNode>> getCategories() async {
    try {
      final response = await _apiClient.dio.get('/categories/tree', queryParameters: {'type': 'store'});
      final List<dynamic> data = response.data;
      return data.map((json) => HierarchyNode.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<HierarchyNode>> getRegions() async {
    try {
      final response = await _apiClient.dio.get(
        '/regions',
        queryParameters: {'tree': 'true'},
      );
      final List<dynamic> data = response.data;
      return data.map((json) => HierarchyNode.fromJson(json)).toList();
    } catch (e) {
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

  /// `GET /stores/by-regions` — Store Quick Search page.
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

  Future<StoreDetailResponse> getStoreDetail(String id) async {
    try {
      final response = await _apiClient.dio.get('/stores/$id');
      return StoreDetailResponse.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
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
    try {
      final response = await _apiClient.dio.post('/stores/$id/join');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logStoreVisit(String id, String? category, String? region) async {
    try {
      await _apiClient.dio.post('/activity', data: {
        'type': 'visit_store',
        'targetType': 'Store',
        'targetId': id,
        'meta': {'category': category, 'region': region},
      });
    } catch (_) {
      // Background logging can fail silently
    }
  }
}
