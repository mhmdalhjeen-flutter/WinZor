import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../models/wheel_models.dart';

class WheelRepository {
  final ApiClient _apiClient;

  WheelRepository(this._apiClient);

  Future<WheelConfig> getConfig() async {
    final response = await _apiClient.dio.get('/wheel/config');
    return WheelConfig.fromJson(Map<String, dynamic>.from(response.data as Map));
  }

  Future<WheelSpinResult> spin({required String idempotencyKey}) async {
    final response = await _apiClient.dio.post(
      '/wheel/spin',
      data: {},
      options: Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return WheelSpinResult.fromJson(Map<String, dynamic>.from(response.data as Map));
  }

  Future<List<WheelWin>> getMyWins() async {
    final response = await _apiClient.dio.get('/wheel/my-wins');
    final data = response.data;
    List<dynamic> raw = [];
    if (data is Map && data['wins'] is List) {
      raw = data['wins'] as List;
    } else if (data is List) {
      raw = data;
    }
    return raw
        .whereType<Map>()
        .map((e) => WheelWin.fromJson(Map<String, dynamic>.from(e)))
        .where((w) => w.id.isNotEmpty)
        .toList();
  }
}
