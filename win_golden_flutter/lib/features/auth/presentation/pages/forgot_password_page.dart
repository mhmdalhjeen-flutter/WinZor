import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/password_validation.dart';
import '../providers/auth_provider.dart';
import '../providers/auth_repository_provider.dart';
import '../widgets/auth_welcome_background.dart';

/// React `ForgotPassword.jsx` — two-step OTP reset (guest only).
class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  int _step = 1;
  final _identifier = TextEditingController();
  final _code = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _identifier.dispose();
    _code.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    setState(() => _error = null);
    if (_identifier.text.trim().isEmpty) {
      setState(() => _error = 'أدخل البريد أو رقم الهاتف');
      return;
    }
    setState(() => _loading = true);
    try {
      final data = await ref
          .read(authRepositoryProvider)
          .requestPasswordReset(_identifier.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            data['message']?.toString() ?? 'تم إرسال الرمز',
            style: const TextStyle(fontFamily: 'Cairo'),
          ),
        ),
      );
      setState(() => _step = 2);
    } catch (e) {
      String msg = 'تعذّر إرسال الرمز';
      if (e is DioException && e.response?.data is Map) {
        msg = e.response?.data['message']?.toString() ?? msg;
      }
      if (mounted) setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reset() async {
    setState(() => _error = null);
    final validation = PasswordValidation.validateReset(
      code: _code.text,
      newPassword: _newPassword.text,
      confirmPassword: _confirmPassword.text,
    );
    if (validation != null) {
      setState(() => _error = validation);
      return;
    }
    setState(() => _loading = true);
    try {
      final data = await ref.read(authRepositoryProvider).resetPassword(
            identifier: _identifier.text.trim(),
            code: _code.text.trim(),
            newPassword: _newPassword.text,
            confirmPassword: _confirmPassword.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            data['message']?.toString() ?? 'تم تعيين كلمة المرور',
            style: const TextStyle(fontFamily: 'Cairo'),
          ),
        ),
      );
      context.go('/login');
    } catch (e) {
      String msg = 'تعذّر إعادة التعيين';
      if (e is DioException && e.response?.data is Map) {
        msg = e.response?.data['message']?.toString() ?? msg;
      }
      if (mounted) setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _dec({
    required String hint,
    required IconData icon,
    Widget? suffix,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        fontFamily: 'Cairo',
        fontWeight: FontWeight.w700,
        color: Color(0xFF9CA3AF),
        fontSize: 13,
      ),
      prefixIcon: Icon(icon, size: 18, color: const Color(0xFF9CA3AF)),
      suffixIcon: suffix,
      filled: true,
      fillColor: Colors.white.withOpacity(0.08),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: AppColors.primary.withOpacity(0.6)),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (auth.isAuth) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
      return const Scaffold(backgroundColor: Color(0xFF07070F));
    }

    return Scaffold(
      backgroundColor: const Color(0xFF07070F),
      body: Stack(
        children: [
          const AuthWelcomeBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton.icon(
                        onPressed: () => context.go('/intro'),
                        icon: const Icon(LucideIcons.arrowLeft,
                            size: 14, color: Colors.white70),
                        label: const Text(
                          'العودة للترحيب',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                            color: Colors.white70,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.sparkles,
                                size: 12, color: Color(0xFFFDE68A)),
                            SizedBox(width: 4),
                            Text(
                              'Win GoldenStore',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                color: Color(0xFFFECACA),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFBBF24).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: const Text(
                      'استعادة الحساب',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        color: Color(0xFFFDE68A),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'نسيت كلمة المرور؟',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _step == 1
                        ? 'أدخل بريدك أو هاتفك لإرسال رمز OTP'
                        : 'أدخل الرمز وكلمة المرور الجديدة',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Cairo',
                      color: Colors.white.withOpacity(0.55),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: Column(
                      children: [
                        if (_error != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: Colors.red.withOpacity(0.2)),
                            ),
                            child: Text(
                              _error!,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Cairo',
                                color: Color(0xFFFCA5A5),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                        ],
                        if (_step == 1) ...[
                          TextField(
                            controller: _identifier,
                            enabled: !_loading,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                            ),
                            decoration: _dec(
                              hint: '0592222222 أو البريد الإلكتروني',
                              icon: LucideIcons.mail,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _primaryBtn(
                            label: 'إرسال رمز التحقق',
                            onPressed: _loading ? null : _sendCode,
                          ),
                        ] else ...[
                          TextField(
                            controller: _code,
                            enabled: !_loading,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                              letterSpacing: 4,
                            ),
                            decoration: _dec(
                              hint: 'رمز OTP (6 أرقام)',
                              icon: LucideIcons.keyRound,
                            ).copyWith(counterText: ''),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _newPassword,
                            obscureText: _obscureNew,
                            enabled: !_loading,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                            ),
                            decoration: _dec(
                              hint: 'كلمة المرور الجديدة',
                              icon: LucideIcons.lock,
                              suffix: IconButton(
                                icon: Icon(
                                  _obscureNew
                                      ? LucideIcons.eye
                                      : LucideIcons.eyeOff,
                                  size: 18,
                                  color: Colors.white54,
                                ),
                                onPressed: () => setState(
                                    () => _obscureNew = !_obscureNew),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _confirmPassword,
                            obscureText: _obscureConfirm,
                            enabled: !_loading,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                            ),
                            decoration: _dec(
                              hint: 'تأكيد كلمة المرور',
                              icon: LucideIcons.lock,
                              suffix: IconButton(
                                icon: Icon(
                                  _obscureConfirm
                                      ? LucideIcons.eye
                                      : LucideIcons.eyeOff,
                                  size: 18,
                                  color: Colors.white54,
                                ),
                                onPressed: () => setState(
                                    () => _obscureConfirm = !_obscureConfirm),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          _primaryBtn(
                            label: 'تعيين كلمة المرور',
                            onPressed: _loading ? null : _reset,
                          ),
                          const SizedBox(height: 10),
                          TextButton(
                            onPressed: _loading
                                ? null
                                : () => setState(() {
                                      _step = 1;
                                      _error = null;
                                    }),
                            child: Text(
                              'إعادة إرسال الرمز',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Cairo',
                                color: Colors.white.withOpacity(0.5),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text(
                      'العودة لتسجيل الدخول',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFFCD34D),
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _primaryBtn({required String label, VoidCallback? onPressed}) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: _loading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.arrowLeft, size: 18),
                ],
              ),
      ),
    );
  }
}
