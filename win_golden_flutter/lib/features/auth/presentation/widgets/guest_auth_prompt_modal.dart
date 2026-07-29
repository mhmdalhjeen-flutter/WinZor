import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/config/app_auth_config.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/phone_validation.dart';
import '../../utils/auth_actions.dart';
import '../providers/auth_gate_provider.dart';
import 'palestinian_phone_input.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class GuestAuthPromptModal extends ConsumerStatefulWidget {
  final String message;
  final VoidCallback onLater;

  const GuestAuthPromptModal({
    super.key,
    required this.message,
    required this.onLater,
  });

  @override
  ConsumerState<GuestAuthPromptModal> createState() =>
      _GuestAuthPromptModalState();
}

class _GuestAuthPromptModalState extends ConsumerState<GuestAuthPromptModal> {
  bool _phoneOpen = false;
  bool _loading = false;
  String? _error;
  String _phone = '';
  String _password = '';
  bool _obscurePassword = true;

  Future<void> _googleSignIn() async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await AuthActions.signInWithGoogle(ref);
    if (!mounted) return;

    if (result.ok) {
      setState(() => _loading = false);
      return;
    }

    setState(() {
      _loading = false;
      _error = result.error;
    });
  }

  Future<void> _phoneSignIn() async {
    if (_loading) return;

    final phoneError = PhoneValidation.getLocalPhoneError(_phone);
    if (phoneError != null) {
      setState(() => _error = phoneError);
      return;
    }
    if (_password.length < 6) {
      setState(() => _error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await AuthActions.signInWithPhone(
      ref: ref,
      phone: _phone,
      password: _password,
    );
    if (!mounted) return;

    if (result.ok) {
      setState(() => _loading = false);
      return;
    }

    setState(() {
      _loading = false;
      _error = result.error;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withOpacity(0.65),
      child: SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                clipBehavior: Clip.antiAlias,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Color(0xFF1E1B4B),
                              AppColors.primary,
                              Color(0xFFF97316),
                            ],
                            begin: Alignment.topRight,
                            end: Alignment.bottomLeft,
                          ),
                        ),
                        child: Stack(
                          children: [
                            Positioned(
                              left: 0,
                              top: 0,
                              child: IconButton(
                                onPressed: _loading ? null : widget.onLater,
                                style: IconButton.styleFrom(
                                  backgroundColor: Colors.white24,
                                ),
                                icon: const Icon(
                                  LucideIcons.x,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                            ),
                            Column(
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(22),
                                  ),
                                  child: const Icon(
                                    LucideIcons.userRound,
                                    color: Color(0xFFFCD34D),
                                    size: 30,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                const Text(
                                  'تسجيل الدخول مطلوب',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  widget.message,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'Cairo',
                                    color: Colors.white.withOpacity(0.85),
                                    height: 1.45,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                        child: Column(
                          children: [
                            if (_error != null) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(14),
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
                              ),
                              const SizedBox(height: 12),
                            ],
                            if (AppAuthConfig.isGoogleAuthAvailable)
                              _AuthMethodButton(
                                icon: LucideIcons.globe,
                                iconColor: const Color(0xFF4285F4),
                                label: 'تسجيل الدخول بواسطة Google',
                                loading: _loading,
                                onTap: _googleSignIn,
                              ),
                            if (AppAuthConfig.isGoogleAuthAvailable)
                              const SizedBox(height: 8),
                            _AuthMethodButton(
                              icon: LucideIcons.phone,
                              iconColor: const Color(0xFF2563EB),
                              label: 'تسجيل الدخول بواسطة رقم الهاتف',
                              loading: false,
                              selected: _phoneOpen,
                              onTap: () => setState(() => _phoneOpen = !_phoneOpen),
                            ),
                            AnimatedSize(
                              duration: const Duration(milliseconds: 280),
                              curve: Curves.easeOutCubic,
                              child: _phoneOpen
                                  ? Padding(
                                      padding: const EdgeInsets.only(top: 14),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          const Text(
                                            'رقم الهاتف',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w900,
                                              fontFamily: 'Cairo',
                                              color: Color(0xFF4B5563),
                                            ),
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
                                          const SizedBox(height: 12),
                                          const Text(
                                            'كلمة المرور',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w900,
                                              fontFamily: 'Cairo',
                                              color: Color(0xFF4B5563),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          TextField(
                                            onChanged: (val) => setState(() {
                                              _password = val;
                                              _error = null;
                                            }),
                                            obscureText: _obscurePassword,
                                            enabled: !_loading,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            decoration: InputDecoration(
                                              hintText: 'كلمة المرور',
                                              prefixIcon: const Icon(
                                                LucideIcons.lock,
                                                size: 18,
                                              ),
                                              suffixIcon: IconButton(
                                                icon: Icon(
                                                  _obscurePassword
                                                      ? LucideIcons.eye
                                                      : LucideIcons.eyeOff,
                                                  size: 18,
                                                ),
                                                onPressed: () => setState(
                                                  () => _obscurePassword =
                                                      !_obscurePassword,
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 12),
                                          SizedBox(
                                            height: 48,
                                            child: ElevatedButton(
                                              onPressed: (_loading ||
                                                      _password.length < 6)
                                                  ? null
                                                  : _phoneSignIn,
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: AppColors.primary,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(14),
                                                ),
                                              ),
                                              child: _loading
                                                  ? const SizedBox(
                                                      width: 20,
                                                      height: 20,
                                                      child:
                                                          CircularProgressIndicator(
                                                        strokeWidth: 2,
                                                        color: Colors.white,
                                                      ),
                                                    )
                                                  : const Text(
                                                      'دخول',
                                                      style: TextStyle(
                                                        fontWeight:
                                                            FontWeight.w900,
                                                        fontFamily: 'Cairo',
                                                      ),
                                                    ),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Center(
                                            child: GestureDetector(
                                              onTap: _loading
                                                  ? null
                                                  : () {
                                                      ref
                                                          .read(authGateProvider
                                                              .notifier)
                                                          .closePrompt();
                                                      context.push('/register');
                                                    },
                                              child: const Text(
                                                'لا تملك حساب؟ أنشئ حساباً مجاناً',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w800,
                                                  fontFamily: 'Cairo',
                                                  color: Color(0xFF2563EB),
                                                  decoration:
                                                      TextDecoration.underline,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  : const SizedBox.shrink(),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 48,
                              child: OutlinedButton(
                                onPressed: _loading ? null : widget.onLater,
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                    color: Color(0xFFF3F4F6),
                                    width: 2,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: const Text(
                                  'لاحقاً',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthMethodButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  final bool loading;
  final bool selected;

  const _AuthMethodButton({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.onTap,
    this.loading = false,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? const Color(0xFFEFF6FF) : const Color(0xFFF9FAFB),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: loading ? null : onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? const Color(0xFF93C5FD) : const Color(0xFFF3F4F6),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: loading
                    ? SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: iconColor,
                        ),
                      )
                    : Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: Color(0xFF1F2937),
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
