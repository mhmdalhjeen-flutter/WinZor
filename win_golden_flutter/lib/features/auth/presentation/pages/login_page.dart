import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/auth/google_auth_service.dart';
import '../../../../core/config/app_auth_config.dart';
import '../../../../core/theme/app_brand_assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_styles.dart';
import '../../../../core/utils/auth_error_utils.dart';
import '../../../../core/utils/phone_validation.dart';
import '../providers/auth_provider.dart';
import '../providers/auth_repository_provider.dart';
import '../widgets/auth_welcome_background.dart';
import '../widgets/palestinian_phone_input.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  bool _phoneOpen = false;
  String _phone = '';
  String _password = '';
  bool _loading = false;
  String? _error;
  bool _obscurePassword = true;

  Future<void> _handleLogin() async {
    setState(() => _error = null);

    final phoneError = PhoneValidation.getLocalPhoneError(_phone);
    if (phoneError != null) {
      setState(() => _error = phoneError);
      return;
    }

    if (_password.length < 6) {
      setState(() => _error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setState(() => _loading = true);

    try {
      final repo = ref.read(authRepositoryProvider);
      final data = await repo.login(
        identifier: _phone,
        password: _password,
      );

      if (data['token'] != null && data['user'] != null) {
        await ref.read(authProvider.notifier).login(
              data['user'],
              data['token'],
              refreshToken: data['refreshToken'],
            );

        if (mounted) {
          context.go('/');
        }
      } else {
        setState(() => _error = 'استجابة غير صالحة من الخادم');
      }
    } catch (e) {
      setState(() => _error = authErrorMessage(
            e,
            'خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.',
          ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleGoogleLogin() async {
    if (_loading || !AppAuthConfig.isGoogleAuthAvailable) return;
    setState(() {
      _error = null;
      _loading = true;
    });

    try {
      final idToken = await GoogleAuthService.signInForIdToken();
      if (idToken == null) {
        // User cancelled chooser — not an error.
        return;
      }

      final data = await ref.read(authRepositoryProvider).googleAuth(
            credential: idToken,
          );

      if (data['token'] != null && data['user'] != null) {
        await ref.read(authProvider.notifier).login(
              Map<String, dynamic>.from(data['user'] as Map),
              data['token'] as String,
              refreshToken: data['refreshToken']?.toString(),
            );
        if (mounted) context.go('/');
      } else {
        setState(() => _error = 'استجابة غير صالحة من الخادم');
      }
    } catch (e) {
      setState(() => _error = authErrorMessage(
            e,
            'تعذّر تسجيل الدخول عبر Google',
          ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const AuthWelcomeBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBackButton(),
                  const SizedBox(height: 24),
                  const _LoginLogo(),
                  const SizedBox(height: 24),
                  _buildMainPanel(),
                  const SizedBox(height: 24),
                  _buildRegisterLink(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackButton() {
    return FadeIn(
      child: InkWell(
        onTap: () => context.go('/intro'),
        borderRadius: BorderRadius.circular(100),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.75),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: Colors.white.withOpacity(0.7)),
            boxShadow: AppStyles.glassShadow,
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.arrowLeft, size: 14, color: Color(0xFF374151)),
              SizedBox(width: 6),
              Text(
                'العودة للترحيب',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF374151),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainPanel() {
    return FadeInUp(
      duration: const Duration(milliseconds: 500),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.75),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white.withOpacity(0.8)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 60,
              offset: const Offset(0, 20),
            ),
          ],
        ),
        child: Column(
          children: [
            if (_error != null) _buildErrorAlert(),
            if (AppAuthConfig.isGoogleAuthAvailable) ...[
              _buildGoogleButton(),
              const SizedBox(height: 12),
            ],
            _buildPhoneToggleButton(),
            AnimatedSize(
              duration: const Duration(milliseconds: 400),
              curve: Curves.fastOutSlowIn,
              child: _phoneOpen ? _buildLoginForm() : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorAlert() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16), // تم تصحيح الخطأ هنا
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        _error!,
        style: const TextStyle(
          color: Color(0xFFB91C1C),
          fontSize: 12,
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
        ),
      ),
    );
  }

  Widget _buildGoogleButton() {
    return Container(
      width: double.infinity,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4285F4).withOpacity(0.22),
            blurRadius: 36,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _loading ? null : _handleGoogleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1F2937),
          disabledBackgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(21)),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          elevation: 0,
          side: const BorderSide(color: Color(0xFFDBEAFE), width: 2),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_loading)
              const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              const Icon(LucideIcons.globe, size: 24, color: Color(0xFF4285F4)),
            const SizedBox(width: 12),
            const Text(
              'المتابعة باستخدام Google',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhoneToggleButton() {
    return GestureDetector(
      onTap: () => setState(() => _phoneOpen = !_phoneOpen),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _phoneOpen ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: _phoneOpen ? const Color(0xFF93C5FD) : const Color(0xFFE5E7EB),
            width: 2,
          ),
          boxShadow: _phoneOpen
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.07),
                    blurRadius: 28,
                    offset: const Offset(0, 10),
                  ),
                ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _phoneOpen ? const Color(0xFF3B82F6) : null,
                gradient: _phoneOpen
                    ? null
                    : const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF2563EB)]),
                borderRadius: BorderRadius.circular(12),
                boxShadow: _phoneOpen ? [] : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  )
                ],
              ),
              child: const Icon(LucideIcons.phone, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              'المتابعة برقم الهاتف',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: _phoneOpen ? const Color(0xFF1E40AF) : const Color(0xFF1F2937),
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 16),
          const Text(
            'رقم الهاتف',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563)),
          ),
          const SizedBox(height: 4),
          PalestinianPhoneInput(
            value: _phone,
            onChanged: (val) => setState(() {
              _phone = val;
              _error = null;
            }),
            disabled: _loading,
          ),
          const SizedBox(height: 16),
          const Text(
            'كلمة المرور',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563)),
          ),
          const SizedBox(height: 4),
          TextField(
            onChanged: (val) => setState(() {
              _password = val;
              _error = null;
            }),
            obscureText: _obscurePassword,
            enabled: !_loading,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              hintText: 'كلمة المرور',
              prefixIcon: const Icon(LucideIcons.lock, size: 18),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: () => context.push('/forgot-password'),
              child: const Text(
                'نسيت كلمة المرور؟',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2563EB),
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: (_loading || _password.length < 6) ? null : _handleLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDC2626), Color(0xFFEF4444), Color(0xFFF59E0B)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Container(
                  alignment: Alignment.center,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('دخول', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                            SizedBox(width: 8),
                            Icon(LucideIcons.arrowLeft, size: 18),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterLink() {
    return Center(
      child: RichText(
        text: TextSpan(
          text: 'لا تملك حساب؟ ',
          style: const TextStyle(
            color: Color(0xFF4B5563),
            fontSize: 14,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
          children: [
            WidgetSpan(
              child: GestureDetector(
                onTap: () => context.push('/register'),
                child: const Text(
                  'أنشئ حساباً مجاناً',
                  style: TextStyle(
                    color: Color(0xFF2563EB),
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoginLogo extends StatelessWidget {
  const _LoginLogo();

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      duration: const Duration(milliseconds: 500),
      child: Center(
        child: SizedBox(
          height: 144,
          width: 144,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [
                      Color(0x66FFC1C1),
                      Color(0x59C1D9FF),
                      Color(0x66C1FFD9),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withOpacity(0.1),
                      blurRadius: 40,
                      spreadRadius: 20,
                    ),
                  ],
                ),
              ),
              const BrandLogo.full(width: 110, height: 110),
            ],
          ),
        ),
      ),
    );
  }
}
