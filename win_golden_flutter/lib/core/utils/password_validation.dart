/// Mirrors React `utils/passwordValidation.js` — client-side checks only;
/// backend remains the authority for final validation.
class PasswordValidation {
  static const int minLen = 6;

  static String? validateChange({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
    int min = minLen,
  }) {
    if (currentPassword.isEmpty) return 'أدخل كلمة المرور الحالية';
    if (newPassword.isEmpty) return 'أدخل كلمة المرور الجديدة';
    if (newPassword.length < min) {
      return 'كلمة المرور يجب أن تكون $min أحرف على الأقل';
    }
    if (newPassword != confirmPassword) return 'كلمة المرور غير متطابقة';
    if (currentPassword == newPassword) {
      return 'كلمة المرور الجديدة يجب أن تختلف عن الحالية';
    }
    return null;
  }

  static String? validateReset({
    required String code,
    required String newPassword,
    required String confirmPassword,
    int min = minLen,
  }) {
    if (code.trim().isEmpty) return 'أدخل رمز التحقق';
    if (newPassword.isEmpty) return 'أدخل كلمة المرور الجديدة';
    if (newPassword.length < min) {
      return 'كلمة المرور يجب أن تكون $min أحرف على الأقل';
    }
    if (newPassword != confirmPassword) return 'كلمة المرور غير متطابقة';
    return null;
  }
}
