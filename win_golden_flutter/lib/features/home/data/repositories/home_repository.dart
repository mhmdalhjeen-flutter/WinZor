import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../models/offer_model.dart';

class HomeRepository {
  final ApiClient _apiClient;

  HomeRepository(this._apiClient);

  Future<List<HierarchyNode>> getCategories(String type) async {
    try {
      final response = await _apiClient.dio.get('/categories/tree', queryParameters: {'type': type});
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

  Future<List<dynamic>> getOffersReels({String? categoryId, String? regionId}) async {
    try {
      final Map<String, dynamic> params = {'limit': 20};
      if (regionId != null) params['region'] = regionId;
      if (categoryId != null) params['category'] = categoryId;

      final response = await _apiClient.dio.get('/offers/reels', queryParameters: params);
      return response.data['reels'] ?? [];
    } catch (e) {
      rethrow;
    }
  }
}
