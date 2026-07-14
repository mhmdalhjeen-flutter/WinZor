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

  Future<String?> getStoreOwnerId(String id) async {
    final response = await _apiClient.dio.get('/offers/$id');
    final offer = response.data is Map ? response.data['offer'] : null;
    if (offer is! Map) return null;
    final store = offer['store'];
    if (store is Map) {
      final owner = store['owner'];
      if (owner is Map) {
        return (owner['_id'] ?? owner['id'])?.toString();
      }
      if (owner != null) return owner.toString();
    }
    return null;
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
}
