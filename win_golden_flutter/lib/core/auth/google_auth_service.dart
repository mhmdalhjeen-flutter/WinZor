import 'package:google_sign_in/google_sign_in.dart';
import '../config/app_auth_config.dart';

class GoogleAuthService {
  GoogleAuthService._();

  // استخدام تعريف بسيط جداً ومباشر
  static final _googleSignIn = GoogleSignIn(
    scopes: <String>[
      'email',
      'profile',
    ],
    serverClientId: AppAuthConfig.googleServerClientId,
  );

  static bool get isAvailable => AppAuthConfig.isGoogleAuthAvailable;

  static Future<String?> signInForIdToken() async {
    if (!isAvailable) {
      throw StateError('Google Sign-In غير متاح');
    }

    try {
      // تسجيل الخروج أولاً لضمان ظهور قائمة اختيار الحسابات
      await _googleSignIn.signOut();
      
      final account = await _googleSignIn.signIn();
      if (account == null) return null;

      final auth = await account.authentication;
      final idToken = auth.idToken;
      
      if (idToken == null || idToken.isEmpty) {
        throw StateError('تعذّر الحصول على idToken');
      }
      return idToken;
    } catch (e) {
      throw Exception('خطأ أثناء تسجيل الدخول عبر Google: $e');
    }
  }
}
