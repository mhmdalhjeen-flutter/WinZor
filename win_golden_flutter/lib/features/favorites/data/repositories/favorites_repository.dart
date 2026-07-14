import '../../../../core/api/api_client.dart';

class FavoritesPayload {
  final List<Map<String, dynamic>> favorites;
  final Set<String> favoriteIds;

  const FavoritesPayload({
    required this.favorites,
    required this.favoriteIds,
  });

  static const empty = FavoritesPayload(
    favorites: [],
    favoriteIds: {},
  );
}

class FavoritesRepository {
  final ApiClient _apiClient;

  FavoritesRepository(this._apiClient);

  /// `GET /activity/favorites` — offer favorites only (auth required).
  Future<FavoritesPayload> getFavorites() async {
    final response = await _apiClient.dio.get('/activity/favorites');
    final data = response.data;
    if (data is! Map) return FavoritesPayload.empty;

    final rawFavs = data['favorites'];
    final favorites = <Map<String, dynamic>>[];
    if (rawFavs is List) {
      for (final item in rawFavs) {
        if (item is Map) {
          favorites.add(Map<String, dynamic>.from(item));
        }
      }
    }

    final rawIds = data['favoriteIds'];
    final ids = <String>{};
    if (rawIds is List) {
      for (final id in rawIds) {
        final s = id?.toString();
        if (s != null && s.isNotEmpty) ids.add(s);
      }
    }
    // Ensure ids from activity also cover offer _ids if API omits some.
    for (final o in favorites) {
      final id = (o['_id'] ?? o['id'])?.toString();
      if (id != null && id.isNotEmpty) ids.add(id);
    }

    return FavoritesPayload(favorites: favorites, favoriteIds: ids);
  }

  /// `POST /activity/favorites/:offerId/toggle`
  Future<bool> toggleFavorite(String offerId) async {
    final response =
        await _apiClient.dio.post('/activity/favorites/$offerId/toggle');
    final data = response.data;
    if (data is Map && data.containsKey('favorited')) {
      return data['favorited'] == true;
    }
    // Fallback: unknown shape — caller should refetch.
    return true;
  }
}
