import 'package:dio/dio.dart';

/// Shared detection for backend `code: VERIFICATION_REQUIRED`.
class VerificationApiError {
  static const code = 'VERIFICATION_REQUIRED';

  static String? codeOf(Object? err, {String? explicitCode}) {
    if (explicitCode != null && explicitCode.isNotEmpty) return explicitCode;
    if (err is DioException) {
      final data = err.response?.data;
      if (data is Map && data['code'] != null) {
        return data['code'].toString();
      }
    }
    if (err is Map && err['code'] != null) {
      return err['code'].toString();
    }
    return null;
  }

  static bool isVerificationRequired(Object? err, {String? explicitCode}) {
    return codeOf(err, explicitCode: explicitCode) == code;
  }

  static String messageOf(Object? err, [String fallback = 'حدث خطأ']) {
    if (err is DioException) {
      final data = err.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    }
    if (err is Map && err['message'] != null) {
      return err['message'].toString();
    }
    final s = err?.toString() ?? '';
    if (s.isNotEmpty && s != 'null') {
      return s
          .replaceFirst('Exception: ', '')
          .replaceFirst('DioException: ', '');
    }
    return fallback;
  }
}
