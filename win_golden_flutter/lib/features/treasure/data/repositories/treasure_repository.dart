import '../../../../core/api/api_client.dart';
import '../models/treasure_box_model.dart';

class TreasureRepository {
  final ApiClient _apiClient;

  TreasureRepository(this._apiClient);

  /// `GET /treasure/available` — auth required.
  Future<List<TreasureBoxModel>> getAvailableBoxes() async {
    final response = await _apiClient.dio.get('/treasure/available');
    final data = response.data;
    List<dynamic> raw = [];
    if (data is Map) {
      if (data['data'] is List) {
        raw = data['data'] as List;
      } else if (data['boxes'] is List) {
        raw = data['boxes'] as List;
      }
    } else if (data is List) {
      raw = data;
    }

    return raw
        .whereType<Map>()
        .map((e) => TreasureBoxModel.fromJson(Map<String, dynamic>.from(e)))
        .where((b) => b.id.isNotEmpty)
        .toList();
  }

  /// `POST /treasure/open/:boxId` — auth + verified (backend middleware).
  Future<TreasureOpenResult> openBox(String boxId) async {
    final response = await _apiClient.dio.post('/treasure/open/$boxId');
    final data = response.data;
    if (data is Map) {
      return TreasureOpenResult.fromJson(Map<String, dynamic>.from(data));
    }
    return const TreasureOpenResult(
      success: true,
      message: 'مبروك! فتحت الصندوق',
    );
  }
}
