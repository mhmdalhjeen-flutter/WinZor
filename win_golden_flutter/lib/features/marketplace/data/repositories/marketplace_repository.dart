import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../models/bazaar_listing_model.dart';
import '../../../../core/models/hierarchy_node.dart';

class MarketplaceRepository {
  final ApiClient _apiClient;

  MarketplaceRepository(this._apiClient);

  Future<List<BazaarListingModel>> getListings({
    String? regionId,
    String? condition,
    String? category,
  }) async {
    try {
      final Map<String, dynamic> params = {};
      if (regionId != null) params['regionId'] = regionId;
      if (condition != null) params['condition'] = condition;
      if (category != null) params['category'] = category;

      final response = await _apiClient.dio.get('/bazaar', queryParameters: params);
      final List<dynamic> data = response.data['listings'] ?? [];
      return data.map((json) => BazaarListingModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<BazaarListingModel>> getMyListings() async {
    try {
      final response = await _apiClient.dio.get('/bazaar/my');
      final List<dynamic> data = response.data['listings'] ?? [];
      return data.map((json) => BazaarListingModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<BazaarListingModel>> getFavoriteListings() async {
    try {
      final response = await _apiClient.dio.get('/bazaar/favorites');
      final List<dynamic> data = response.data['listings'] ?? [];
      return data.map((json) => BazaarListingModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getBazaarMeta() async {
    try {
      final response = await _apiClient.dio.get('/bazaar/meta');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> toggleFavorite(String id) async {
    try {
      final response = await _apiClient.dio.post('/bazaar/$id/favorite');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteListing(String id) async {
    try {
      await _apiClient.dio.delete('/bazaar/$id');
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> renewListing(String id) async {
    try {
      final response = await _apiClient.dio.post('/bazaar/$id/renew');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<String> uploadImage(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(filePath),
      });

      final response = await _apiClient.dio.post(
        '/upload/image',
        data: formData,
      );

      return response.data['url'];
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createListing(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post('/bazaar', data: data);
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateListing(String id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.patch('/bazaar/$id', data: data);
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}
