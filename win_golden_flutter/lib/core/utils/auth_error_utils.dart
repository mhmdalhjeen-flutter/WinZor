import 'package:dio/dio.dart';

/// Surfaces API `message` the same way React `getAuthErrorMessage` does.
String authErrorMessage(
  Object error, [
  String fallback = 'حدث خطأ. يرجى المحاولة مرة أخرى.',
]) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      final msg = data['message'].toString().trim();
      if (msg.isNotEmpty) return msg;
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.';
    }
  }
  return fallback;
}
