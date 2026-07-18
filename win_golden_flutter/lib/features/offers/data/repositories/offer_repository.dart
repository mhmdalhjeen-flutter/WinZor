import '../../../../core/api/api_client.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/cached_fetch.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../../../home/data/models/offer_model.dart';

class OfferRepository {
  final ApiClient _apiClient;

  OfferRepository(this._apiClient);

  Future<OfferModel> getOfferDetail(String id, {bool forceNetwork = false}) async {
    final cacheKey = CacheKeys.offerDetail(id);
    return CachedFetch.load<OfferModel>(
      key: cacheKey,
      forceNetwork: forceNetwork,
      staleAfter: const Duration(minutes: 30),
      network: () async {
        final response = await _apiClient.dio.get('/offers/$id');
        final offer = OfferModel.fromJson(response.data['offer']);
        await LocalCacheService.rememberRecentOffer(offer.toJson());
        return offer;
      },
      fromCache: (raw) {
        final map = raw is Map ? Map<String, dynamic>.from(raw) : {'offer': raw};
        final offerJson = map['offer'] ?? map;
        return OfferModel.fromJson(Map<String, dynamic>.from(offerJson as Map));
      },
      toCache: (offer) => {'offer': offer.toJson()},
    );
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
