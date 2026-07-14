import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/utils/device_utils.dart';

/// Account verification OTP — `POST /auth/verify/request|confirm`.
/// Separate from register/login OTP UX; used by the global gate modal.
class VerificationRepository {
  final ApiClient _apiClient;

  VerificationRepository(this._apiClient);

  Future<Map<String, dynamic>> requestCode(String channel) async {
    final deviceId = await DeviceUtils.getDeviceId();
    final response = await _apiClient.dio.post(
      '/auth/verify/request',
      data: {'channel': channel},
      options: Options(headers: {'x-device-id': deviceId}),
    );
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  Future<Map<String, dynamic>> confirmCode({
    required String channel,
    required String code,
  }) async {
    final deviceId = await DeviceUtils.getDeviceId();
    final response = await _apiClient.dio.post(
      '/auth/verify/confirm',
      data: {'channel': channel, 'code': code},
      options: Options(headers: {'x-device-id': deviceId}),
    );
    final data = response.data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}
