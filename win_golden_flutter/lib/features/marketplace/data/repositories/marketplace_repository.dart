import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../models/bazaar_listing_model.dart';

class MarketplaceRepository {
  final ApiClient _apiClient;

  MarketplaceRepository(this._apiClient);

  Future<List<BazaarListingModel>> getListings({
    String? regionId,
    String? condition,
    String? category,
  }) async {
    final Map<String, dynamic> params = {};
    if (regionId != null && regionId.isNotEmpty) params['regionId'] = regionId;
    if (condition != null && condition.isNotEmpty) params['condition'] = condition;
    if (category != null && category.isNotEmpty) params['category'] = category;

    final response = await _apiClient.dio.get('/bazaar', queryParameters: params);
    final List<dynamic> data = response.data['listings'] ?? [];
    return data
        .map((json) => BazaarListingModel.fromJson(Map<String, dynamic>.from(json as Map)))
        .toList();
  }

  Future<BazaarListingModel> getListing(String id) async {
    final response = await _apiClient.dio.get('/bazaar/$id');
    return BazaarListingModel.fromJson(
      Map<String, dynamic>.from(response.data['listing'] as Map),
    );
  }

  Future<List<BazaarListingModel>> getMyListings() async {
    final response = await _apiClient.dio.get('/bazaar/my');
    final List<dynamic> data = response.data['listings'] ?? [];
    return data
        .map((json) => BazaarListingModel.fromJson(Map<String, dynamic>.from(json as Map)))
        .toList();
  }

  Future<List<BazaarListingModel>> getFavoriteListings() async {
    final response = await _apiClient.dio.get('/bazaar/favorites');
    final List<dynamic> data = response.data['listings'] ?? [];
    return data
        .map((json) => BazaarListingModel.fromJson(Map<String, dynamic>.from(json as Map)))
        .toList();
  }

  Future<Map<String, dynamic>> getBazaarMeta() async {
    final response = await _apiClient.dio.get('/bazaar/meta');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> toggleFavorite(String id) async {
    final response = await _apiClient.dio.post('/bazaar/$id/favorite');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> deleteListing(String id) async {
    await _apiClient.dio.delete('/bazaar/$id');
  }

  Future<Map<String, dynamic>> renewListing(String id) async {
    final response = await _apiClient.dio.post('/bazaar/$id/renew');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<String> uploadImage(String filePath) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(filePath),
    });

    final response = await _apiClient.dio.post(
      '/upload/image',
      data: formData,
    );

    return response.data['url'] as String;
  }

  Future<Map<String, dynamic>> createListing(Map<String, dynamic> data) async {
    final response = await _apiClient.dio.post('/bazaar', data: data);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> updateListing(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.dio.patch('/bazaar/$id', data: data);
    return Map<String, dynamic>.from(response.data as Map);
  }
}
