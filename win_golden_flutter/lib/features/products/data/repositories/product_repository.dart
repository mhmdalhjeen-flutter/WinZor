import '../../../../core/api/api_client.dart';
import '../models/product_model.dart';

class ProductRepository {
  final ApiClient _apiClient;

  ProductRepository(this._apiClient);

  Future<ProductModel> getProduct(String id) async {
    final response = await _apiClient.dio.get('/products/$id');
    final data = response.data;
    final product = data is Map ? data['product'] : null;
    if (product is! Map) {
      throw StateError('المنتج غير موجود');
    }
    return ProductModel.fromJson(Map<String, dynamic>.from(product));
  }

  /// Fire-and-forget — matches React `logActivity('view_product', …)`.
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
