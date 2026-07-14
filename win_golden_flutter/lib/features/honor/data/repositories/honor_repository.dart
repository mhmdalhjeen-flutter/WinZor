import '../../../../core/api/api_client.dart';
import '../models/honor_item_model.dart';
import '../models/points_leaderboard_model.dart';

class HonorRepository {
  final ApiClient _apiClient;

  HonorRepository(this._apiClient);

  /// `GET /honor/active` — public (active & not expired).
  Future<List<HonorItemModel>> getActiveItems() async {
    final response = await _apiClient.dio.get('/honor/active');
    final data = response.data;
    List<dynamic> raw = [];
    if (data is List) {
      raw = data;
    } else if (data is Map) {
      if (data['items'] is List) {
        raw = data['items'] as List;
      } else if (data['data'] is List) {
        raw = data['data'] as List;
      }
    }

    return raw
        .whereType<Map>()
        .map((e) => HonorItemModel.fromJson(Map<String, dynamic>.from(e)))
        .where((e) => e.id.isNotEmpty)
        .toList();
  }

  /// `GET /users/points-leaderboard` — auth required.
  Future<PointsLeaderboard> getPointsLeaderboard() async {
    final response = await _apiClient.dio.get('/users/points-leaderboard');
    final data = response.data;
    if (data is Map) {
      return PointsLeaderboard.fromJson(Map<String, dynamic>.from(data));
    }
    return const PointsLeaderboard(top: []);
  }
}
