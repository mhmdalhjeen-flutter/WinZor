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

  /// React HomeSearchCards universal search.
  Future<({List offers, List products, List stores})> universalSearch(
    String query,
  ) async {
    final q = query.trim();
    if (q.length < 2) {
      return (offers: <dynamic>[], products: <dynamic>[], stores: <dynamic>[]);
    }

    final results = await Future.wait([
      _apiClient.dio.get('/offers/feed', queryParameters: {'q': q, 'limit': 5}),
      _apiClient.dio.get('/products/search', queryParameters: {'q': q}),
      _apiClient.dio.get('/stores/browse', queryParameters: {'q': q}),
    ]);

    final offersData = results[0].data;
    final productsData = results[1].data;
    final storesData = results[2].data;

    final offers = offersData is Map && offersData['items'] is List
        ? List<dynamic>.from(offersData['items'] as List)
        : <dynamic>[];

    final products = productsData is Map && productsData['products'] is List
        ? List<dynamic>.from((productsData['products'] as List).take(5))
        : <dynamic>[];

    final stores = _flattenBrowseStores(storesData, 5);

    return (offers: offers, products: products, stores: stores);
  }

  List<dynamic> _flattenBrowseStores(dynamic data, int limit) {
    final out = <dynamic>[];
    if (data is! Map) return out;
    final regions = data['regions'];
    if (regions is! List) return out;

    void takeStores(List? list) {
      if (list == null) return;
      for (final s in list) {
        if (out.length >= limit) return;
        if (s is Map) out.add(s);
      }
    }

    for (final block in regions) {
      if (out.length >= limit) break;
      if (block is! Map) continue;
      takeStores(block['stores'] is List ? block['stores'] as List : null);
      final subs = block['subRegions'];
      if (subs is List) {
        for (final sub in subs) {
          if (out.length >= limit) break;
          if (sub is Map) {
            takeStores(sub['stores'] is List ? sub['stores'] as List : null);
          }
        }
      }
      // Explore browse may use parentGroups sections
      final groups = block['parentGroups'];
      if (groups is List) {
        for (final g in groups) {
          if (out.length >= limit) break;
          if (g is! Map) continue;
          final sections = g['sections'];
          if (sections is! List) continue;
          for (final sec in sections) {
            if (out.length >= limit) break;
            if (sec is Map) {
              takeStores(sec['stores'] is List ? sec['stores'] as List : null);
            }
          }
        }
      }
    }
    return out;
  }
}
