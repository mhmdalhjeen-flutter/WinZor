import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/device_utils.dart';

/// Called after a non-recoverable 401 (matches React redirect-to-login).
typedef SessionExpiredCallback = void Function();

class ApiClient {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String baseUrl = 'https://winzor.onrender.com/api';

  /// Wired from app startup so session expiry can clear auth + navigate.
  static SessionExpiredCallback? onSessionExpired;

  ApiClient()
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        final deviceId = await DeviceUtils.getDeviceId();
        options.headers['x-device-id'] = deviceId;

        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        final response = e.response;
        final original = e.requestOptions;
        final alreadyRetried = original.extra['_authRetry'] == true;

        final data = response?.data;
        final code = data is Map ? data['code'] : null;
        final canRefresh = code == 'TOKEN_EXPIRED';

        // Match customerFrontend/src/api/axios.js refresh flow.
        if (response?.statusCode == 401 && canRefresh && !alreadyRetried) {
          final refreshToken = await _storage.read(key: 'refreshToken');
          if (refreshToken != null && refreshToken.isNotEmpty) {
            try {
              final deviceId = await DeviceUtils.getDeviceId();
              // Bare client (no interceptors) — same as React using raw axios.post.
              final refreshDio = Dio(BaseOptions(
                baseUrl: baseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 15),
              ));
              final refreshResponse = await refreshDio.post(
                '/auth/refresh',
                data: {
                  'refreshToken': refreshToken,
                  'deviceId': deviceId,
                },
                options: Options(headers: {'x-device-id': deviceId}),
              );

              final refreshData = refreshResponse.data as Map<String, dynamic>;
              final newToken = refreshData['token'] as String?;
              if (newToken == null || newToken.isEmpty) {
                throw StateError('Missing token in refresh response');
              }

              await _storage.write(key: 'token', value: newToken);
              final newRefresh = refreshData['refreshToken'];
              if (newRefresh is String && newRefresh.isNotEmpty) {
                await _storage.write(key: 'refreshToken', value: newRefresh);
              }
              final newDeviceId = refreshData['deviceId'];
              if (newDeviceId is String && newDeviceId.isNotEmpty) {
                await DeviceUtils.setDeviceId(newDeviceId);
              }

              original.headers['Authorization'] = 'Bearer $newToken';
              original.extra['_authRetry'] = true;
              final retryResponse = await _dio.fetch(original);
              return handler.resolve(retryResponse);
            } catch (_) {
              // Fall through to session-clear like React.
            }
          }
        }

        if (response?.statusCode == 401) {
          final path = original.path;
          final onAuthEndpoint = path.contains('/auth/login') ||
              path.contains('/auth/refresh') ||
              path.contains('/auth/register');

          if (!onAuthEndpoint) {
            await _storage.delete(key: 'token');
            await _storage.delete(key: 'refreshToken');
            await _storage.delete(key: 'user');
            onSessionExpired?.call();
          }
        }

        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;
}
