import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/utils/device_utils.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    final deviceId = await DeviceUtils.getDeviceId();
    try {
      final response = await _apiClient.dio.post(
        '/auth/login',
        data: {
          'identifier': identifier.trim(),
          'password': password,
          'appType': 'customer',
          'deviceId': deviceId,
        },
        options: Options(
          headers: {'x-device-id': deviceId},
        ),
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    String? referralCode,
  }) async {
    final deviceId = await DeviceUtils.getDeviceId();
    try {
      final response = await _apiClient.dio.post(
        '/auth/register-customer',
        data: {
          'name': 'مستخدم جديد',
          'phone': phone,
          'password': password,
          'deviceId': deviceId,
          if (referralCode != null) 'referralCode': referralCode,
        },
        options: Options(
          headers: {'x-device-id': deviceId},
        ),
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> requestOtp({required String channel}) async {
    final deviceId = await DeviceUtils.getDeviceId();
    try {
      final response = await _apiClient.dio.post(
        '/auth/verify/request',
        data: {'channel': channel},
        options: Options(
          headers: {'x-device-id': deviceId},
        ),
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> confirmOtp({
    required String channel,
    required String code,
  }) async {
    final deviceId = await DeviceUtils.getDeviceId();
    try {
      final response = await _apiClient.dio.post(
        '/auth/verify/confirm',
        data: {
          'channel': channel,
          'code': code,
        },
        options: Options(
          headers: {'x-device-id': deviceId},
        ),
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    final deviceId = await DeviceUtils.getDeviceId();
    try {
      await _apiClient.dio.post(
        '/auth/logout',
        options: Options(
          headers: {'x-device-id': deviceId},
        ),
      );
    } catch (_) {
      // Ignore server failure on logout
    } finally {
      await DeviceUtils.clearDeviceId();
    }
  }

  /// `POST /auth/password/change` — auth required.
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await _apiClient.dio.post(
      '/auth/password/change',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  /// `POST /auth/password/forgot` — public; customer appType.
  Future<Map<String, dynamic>> requestPasswordReset(String identifier) async {
    final response = await _apiClient.dio.post(
      '/auth/password/forgot',
      data: {
        'identifier': identifier.trim(),
        'appType': 'customer',
      },
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  /// `POST /auth/password/reset` — public; customer appType.
  Future<Map<String, dynamic>> resetPassword({
    required String identifier,
    required String code,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await _apiClient.dio.post(
      '/auth/password/reset',
      data: {
        'identifier': identifier.trim(),
        'code': code.trim(),
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
        'appType': 'customer',
      },
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  /// `GET /auth/verify/email-link?token=&uid=` — public deep link.
  Future<Map<String, dynamic>> confirmEmailLink({
    required String token,
    required String uid,
  }) async {
    final response = await _apiClient.dio.get(
      '/auth/verify/email-link',
      queryParameters: {
        'token': token,
        'uid': uid,
      },
    );
    return Map<String, dynamic>.from(response.data as Map);
  }
}
