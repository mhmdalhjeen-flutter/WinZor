import '../../../../core/api/api_client.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/cached_fetch.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../models/product_model.dart';

class ProductRepository {
  final ApiClient _apiClient;

  ProductRepository(this._apiClient);

  Future<ProductModel> getProduct(String id, {bool forceNetwork = false}) async {
    final cacheKey = CacheKeys.productDetail(id);
    return CachedFetch.load<ProductModel>(
      key: cacheKey,
      forceNetwork: forceNetwork,
      staleAfter: const Duration(minutes: 30),
      network: () async {
        final response = await _apiClient.dio.get('/products/$id');
        final data = response.data;
        final product = data is Map ? data['product'] : null;
        if (product is! Map) {
          throw StateError('المنتج غير موجود');
        }
        final model = ProductModel.fromJson(Map<String, dynamic>.from(product));
        await LocalCacheService.rememberRecentProduct(model.toJson());
        return model;
      },
      fromCache: (raw) {
        final map = raw is Map ? Map<String, dynamic>.from(raw) : {'product': raw};
        final productJson = map['product'] ?? map;
        return ProductModel.fromJson(Map<String, dynamic>.from(productJson as Map));
      },
      toCache: (product) => {'product': product.toJson()},
    );
  }

  Future<void> logView(ProductModel product) async {
    try {
      await _apiClient.dio.post('/activity', data: {
        'type': 'view_product',
        'targetType': 'Product',
        'targetId': product.id,
        'meta': {
          'category': product.category,
          'region': product.storeRegion,
        },
      });
    } catch (_) {}
  }

  Future<({int? myStars, double? ratingAvg, int? ratingCount})> getMyRating(
    String productId,
  ) async {
    final response = await _apiClient.dio.get(
      '/ratings/mine',
      queryParameters: {
        'targetType': 'product',
        'targetId': productId,
      },
    );
    final data = response.data;
    if (data is! Map) {
      return (myStars: null, ratingAvg: null, ratingCount: null);
    }
    return (
      myStars: int.tryParse(data['myStars']?.toString() ?? ''),
      ratingAvg: double.tryParse(data['ratingAvg']?.toString() ?? ''),
      ratingCount: int.tryParse(data['ratingCount']?.toString() ?? ''),
    );
  }

  Future<({double ratingAvg, int ratingCount})> submitRating(
    String productId,
    int stars,
  ) async {
    final response = await _apiClient.dio.post(
      '/ratings',
      data: {
        'targetType': 'product',
        'targetId': productId,
        'stars': stars,
      },
    );
    final data = response.data;
    return (
      ratingAvg: double.tryParse(data is Map ? data['ratingAvg']?.toString() ?? '' : '') ?? 0,
      ratingCount: int.tryParse(data is Map ? data['ratingCount']?.toString() ?? '' : '') ?? 0,
    );
  }
}
