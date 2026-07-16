import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_brand_assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_styles.dart';
import '../../../../core/utils/phone_validation.dart';
import '../providers/auth_provider.dart';
import '../providers/auth_repository_provider.dart';
import '../widgets/auth_welcome_background.dart';
import '../widgets/palestinian_phone_input.dart';

enum RegisterStep { form, verify }

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  RegisterStep _currentStep = RegisterStep.form;
  bool _phoneOpen = false;
  
  // Form Data
  String _phone = '';
  String _password = '';
  String _confirmPassword = '';
  String _otpCode = '';
  
  bool _loading = false;
  String? _error;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  // OTP Timer
  int _resendSeconds = 60;
  Timer? _timer;

  void _startTimer() {
    _resendSeconds = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendSeconds == 0) {
        timer.cancel();
      } else {
        setState(() => _resendSeconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _handleRegister() async {
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

    if (_password != _confirmPassword) {
      setState(() => _error = 'كلمتا المرور غير متطابقتين');
      return;
    }

    setState(() => _loading = true);

    try {
      final repo = ref.read(authRepositoryProvider);
      final data = await repo.register(
        phone: _phone,
        password: _password,
      );

      if (data['token'] != null && data['user'] != null) {
        await ref.read(authProvider.notifier).login(
          data['user'],
          data['token'],
          refreshToken: data['refreshToken'],
        );
        
        setState(() {
          _currentStep = RegisterStep.verify;
          _loading = false;
        });
        _startTimer();
      }
    } catch (e) {
      setState(() {
        _error = 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.';
        _loading = false;
      });
    }
  }

  Future<void> _handleVerify() async {
    if (_otpCode.length < 6) {
      setState(() => _error = 'أدخل رمز التحقق المكون من 6 أرقام');
      return;
    }

    setState(() => _loading = true);
    setState(() => _error = null);

    try {
      final repo = ref.read(authRepositoryProvider);
      final data = await repo.confirmOtp(
        channel: 'phone',
        code: _otpCode,
      );

      ref.read(authProvider.notifier).updateUser({
        ...data['user'],
        'points': data['points'],
        'isVerified': true,
      });

      if (mounted) {
        context.go('/');
      }
    } catch (e) {
      setState(() {
        _error = 'رمز التحقق غير صحيح أو انتهت صلاحيته';
        _loading = false;
      });
    }
  }

  Future<void> _resendOtp() async {
    if (_resendSeconds > 0) return;
    
    setState(() => _loading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.requestOtp(channel: 'phone');
      _startTimer();
    } catch (e) {
      setState(() => _error = 'تعذّر إعادة إرسال الرمز');
    } finally {
      setState(() => _loading = false);
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
                  const _RegisterLogo(),
                  const SizedBox(height: 24),
                  _buildMainPanel(),
                  if (_currentStep == RegisterStep.form) _buildLoginLink(),
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
        onTap: () {
          if (_currentStep == RegisterStep.verify) {
            setState(() => _currentStep = RegisterStep.form);
          } else {
            context.go('/intro');
          }
        },
        borderRadius: BorderRadius.circular(100),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.75),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: Colors.white.withOpacity(0.7)),
            boxShadow: AppStyles.glassShadow,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.arrowLeft, size: 14, color: Color(0xFF374151)),
              const SizedBox(width: 6),
              Text(
                _currentStep == RegisterStep.verify ? 'تعديل البيانات' : 'العودة للترحيب',
                style: const TextStyle(
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
        child: _currentStep == RegisterStep.form 
          ? _buildRegisterFormStep() 
          : _buildVerifyStep(),
      ),
    );
  }

  Widget _buildRegisterFormStep() {
    return Column(
      children: [
        if (_error != null) _buildErrorAlert(),
        _buildGoogleButton(),
        const SizedBox(height: 12),
        _buildPhoneToggleButton(),
        AnimatedSize(
          duration: const Duration(milliseconds: 400),
          curve: Curves.fastOutSlowIn,
          child: _phoneOpen ? _buildFormFields() : const SizedBox.shrink(),
        ),
      ],
    );
  }

  Widget _buildVerifyStep() {
    return Column(
      children: [
        const Text(
          'تفعيل الحساب',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
        ),
        const SizedBox(height: 8),
        Text(
          'لقد أرسلنا رمز التحقق إلى رقم هاتفك',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey.shade600, fontFamily: 'Cairo'),
        ),
        Text(
          _phone,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF2563EB), fontFamily: 'monospace'),
          textDirection: TextDirection.ltr, // تصحيح من dir إلى textDirection
        ),
        const SizedBox(height: 16),
        if (_error != null) _buildErrorAlert(),
        TextField(
          onChanged: (val) {
            setState(() {
              _otpCode = val.replaceAll(RegExp(r'\D'), '');
              _error = null;
            });
          },
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            letterSpacing: 8,
            color: Color(0xFF111827),
          ),
          decoration: InputDecoration(
            counterText: "",
            hintText: 'رمز التحقق',
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14, letterSpacing: 0),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: (_loading || _otpCode.length < 6) ? null : _handleVerify,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _loading 
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('تأكيد وتفعيل الحساب', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: () => setState(() => _currentStep = RegisterStep.form),
              child: const Text('تعديل البيانات', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
            TextButton(
              onPressed: _resendSeconds == 0 ? _resendOtp : null,
              child: Row(
                children: [
                  const Icon(LucideIcons.rotateCw, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    _resendSeconds > 0 ? 'إعادة الإرسال ($_resendSeconds)' : 'إعادة إرسال الرمز',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF2563EB)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildErrorAlert() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
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
      child: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFDBEAFE), width: 2),
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {}, 
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF1F2937),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(21)),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              elevation: 0,
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.chrome, size: 24, color: Color(0xFF4285F4)),
                SizedBox(width: 12),
                Text(
                  'المتابعة باستخدام Google',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
        ],
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
              ),
              child: const Icon(LucideIcons.phone, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            const Text(
              'المتابعة برقم الهاتف',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1F2937),
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormFields() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 16),
          const Text('رقم الهاتف', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563))),
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
          const Text('كلمة المرور', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563))),
          const SizedBox(height: 4),
          TextField(
            onChanged: (val) => setState(() {
              _password = val;
              _error = null;
            }),
            obscureText: _obscurePassword,
            enabled: !_loading,
            decoration: InputDecoration(
              hintText: 'كلمة المرور (6 أحرف على الأقل)',
              prefixIcon: const Icon(LucideIcons.lock, size: 18),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('تأكيد كلمة المرور', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563))),
          const SizedBox(height: 4),
          TextField(
            onChanged: (val) => setState(() {
              _confirmPassword = val;
              _error = null;
            }),
            obscureText: _obscureConfirmPassword,
            enabled: !_loading,
            decoration: InputDecoration(
              hintText: 'أعد إدخال كلمة المرور',
              prefixIcon: const Icon(LucideIcons.lock, size: 18),
              suffixIcon: IconButton(
                icon: Icon(_obscureConfirmPassword ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: (_loading || _password.length < 6) ? null : _handleRegister,
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
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('إنشاء حساب', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
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

  Widget _buildLoginLink() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Center(
        child: RichText(
          text: TextSpan(
            text: 'لديك حساب؟ ',
            style: const TextStyle(color: Color(0xFF4B5563), fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            children: [
              WidgetSpan(
                child: GestureDetector(
                  onTap: () => context.push('/login'),
                  child: const Text(
                    'سجّل دخولك',
                    style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'Cairo', decoration: TextDecoration.underline),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RegisterLogo extends StatelessWidget {
  const _RegisterLogo();

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
                    colors: [Color(0x66FFC1C1), Color(0x59C1D9FF), Color(0x66C1FFD9)],
                  ),
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
