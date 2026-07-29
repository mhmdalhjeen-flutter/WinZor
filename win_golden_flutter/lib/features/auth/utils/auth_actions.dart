import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/google_auth_service.dart';
import '../../../core/config/app_auth_config.dart';
import '../../../core/utils/auth_error_utils.dart';
import '../presentation/providers/auth_provider.dart';
import '../presentation/providers/auth_repository_provider.dart';

/// Shared sign-in handlers reused by login page and guest auth prompt.
class AuthActions {
  AuthActions._();

  static Future<({bool ok, String? error})> signInWithGoogle(WidgetRef ref) async {
    if (!AppAuthConfig.isGoogleAuthAvailable) {
      return (ok: false, error: 'تسجيل الدخول عبر Google غير متاح');
    }

    try {
      final idToken = await GoogleAuthService.signInForIdToken();
      if (idToken == null) return (ok: false, error: null);

      final data = await ref.read(authRepositoryProvider).googleAuth(
            credential: idToken,
          );

      if (data['token'] != null && data['user'] != null) {
        await ref.read(authProvider.notifier).login(
              Map<String, dynamic>.from(data['user'] as Map),
              data['token'] as String,
              refreshToken: data['refreshToken']?.toString(),
            );
        return (ok: true, error: null);
      }
      return (ok: false, error: 'استجابة غير صالحة من الخادم');
    } catch (e) {
      return (
        ok: false,
        error: authErrorMessage(e, 'تعذّر تسجيل الدخول عبر Google'),
      );
    }
  }

  static Future<({bool ok, String? error})> signInWithPhone({
    required WidgetRef ref,
    required String phone,
    required String password,
  }) async {
    try {
      final data = await ref.read(authRepositoryProvider).login(
            identifier: phone,
            password: password,
          );

      if (data['token'] != null && data['user'] != null) {
        await ref.read(authProvider.notifier).login(
              data['user'],
              data['token'],
              refreshToken: data['refreshToken'],
            );
        return (ok: true, error: null);
      }
      return (ok: false, error: 'استجابة غير صالحة من الخادم');
    } catch (e) {
      return (
        ok: false,
        error: authErrorMessage(
          e,
          'خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.',
        ),
      );
    }
  }
}
