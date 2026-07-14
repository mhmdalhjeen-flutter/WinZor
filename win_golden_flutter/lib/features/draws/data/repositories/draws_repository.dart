import '../../../../core/api/api_client.dart';
import '../models/draw_model.dart';

class DrawsRepository {
  final ApiClient _apiClient;

  DrawsRepository(this._apiClient);

  Future<List<DrawModel>> getOpenDraws() async {
    final response = await _apiClient.dio.get('/draws/open');
    final data = response.data;
    List<dynamic> list = [];
    if (data is List) {
      list = data;
    } else if (data is Map && data['draws'] is List) {
      list = data['draws'] as List;
    }
    return list
        .whereType<Map>()
        .map((e) => DrawModel.fromJson(Map<String, dynamic>.from(e)))
        .where((d) => d.id.isNotEmpty)
        .toList();
  }

  Future<DrawJoinResult> joinDraw(String drawId, {int entriesToSpend = 1}) async {
    final response = await _apiClient.dio.post(
      '/draws/join',
      data: {
        'drawId': drawId,
        'entriesToSpend': entriesToSpend,
      },
    );
    return DrawJoinResult.fromJson(Map<String, dynamic>.from(response.data as Map));
  }
}
