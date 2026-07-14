import '../../../../core/api/api_client.dart';
import '../../home/data/models/offer_model.dart';

class OfferRepository {
  final ApiClient _apiClient;

  OfferRepository(this._apiClient);

  Future<OfferModel> getOfferDetail(String id) async {
    try {
      final response = await _apiClient.dio.get('/offers/$id');
      return OfferModel.fromJson(response.data['offer']);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> recordView(String id) async {
    try {
      await _apiClient.dio.post('/offers/$id/view');
    } catch (_) {}
  }

  Future<void> recordShare(String id) async {
    try {
      await _apiClient.dio.post('/offers/$id/share');
    } catch (_) {}
  }

  Future<void> toggleFavorite(String id) async {
    try {
      await _apiClient.dio.post('/activity/favorites/$id/toggle');
    } catch (e) {
      rethrow;
    }
  }
}
