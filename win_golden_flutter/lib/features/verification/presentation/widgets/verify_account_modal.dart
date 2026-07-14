import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/verification_gate_provider.dart';
import 'verification_celebration.dart';

/// React `VerifyAccountModal.jsx`
class VerifyAccountModal extends ConsumerStatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onVerified;

  const VerifyAccountModal({
    super.key,
    required this.onClose,
    required this.onVerified,
  });

  @override
  ConsumerState<VerifyAccountModal> createState() => _VerifyAccountModalState();
}

class _VerifyAccountModalState extends ConsumerState<VerifyAccountModal> {
  static const _resendCooldown = 60;

  String? _channel;
  final _codeCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _celebrate = false;
  int _bonus = 0;
  int _resendSeconds = 0;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  int _parseWaitSeconds(String message) {
    final match = RegExp(r'(\d+)\s*ثانية').firstMatch(message);
    if (match != null) {
      return int.tryParse(match.group(1)!) ?? _resendCooldown;
    }
    return _resendCooldown;
  }

  void _tickResend() {
    if (_resendSeconds <= 0) return;
    Future<void>.delayed(const Duration(seconds: 1), () {
      if (!mounted || _resendSeconds <= 0) return;
      setState(() => _resendSeconds -= 1);
      _tickResend();
    });
  }

  Future<void> _send(String channel, {bool isResend = false}) async {
    setState(() {
      _loading = true;
      _error = null;
      if (!isResend) _channel = channel;
    });

    try {
      final data =
          await ref.read(verificationRepositoryProvider).requestCode(channel);
      if (!mounted) return;
      if (!isResend) _codeCtrl.clear();
      setState(() {
        _resendSeconds = _resendCooldown;
        _loading = false;
      });
      _tickResend();
      final msg = isResend
          ? 'تم إعادة إرسال الرمز'
          : (data['message']?.toString() ?? 'تم إرسال الرمز');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg, style: const TextStyle(fontFamily: 'Cairo'))),
      );
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? e.response!.data['message']?.toString()
          : null;
      if (!mounted) return;
      setState(() {
        _error = msg ?? 'فشل إرسال الرمز';
        _loading = false;
        if (e.response?.statusCode == 429) {
          _resendSeconds = _parseWaitSeconds(_error!);
          _tickResend();
        }
        if (!isResend) _channel = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'فشل إرسال الرمز';
        _loading = false;
        if (!isResend) _channel = null;
      });
    }
  }

  Future<void> _confirm() async {
    final channel = _channel;
    if (channel == null || _codeCtrl.text.trim().length < 6) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await ref.read(verificationRepositoryProvider).confirmCode(
            channel: channel,
            code: _codeCtrl.text.trim(),
          );
      if (!mounted) return;

      final bonusPoints = (data['bonusPoints'] as num?)?.toInt() ?? 0;
      final user = data['user'];
      final auth = ref.read(authProvider);
      final patch = <String, dynamic>{
        'isVerified': true,
        if (data['points'] != null) 'points': data['points'],
        if (user is Map) ...{
          if (user['emailVerified'] != null)
            'emailVerified': user['emailVerified'],
          if (user['phoneVerified'] != null)
            'phoneVerified': user['phoneVerified'],
          if (user['email'] != null) 'email': user['email'],
          if (user['phone'] != null) 'phone': user['phone'],
        },
        'verificationBonusAwarded':
            bonusPoints > 0 || auth.user?['verificationBonusAwarded'] == true,
      };
      ref.read(authProvider.notifier).updateUser(patch);

      final toast = bonusPoints > 0
          ? 'تم التوثيق — +$bonusPoints نقاط هدية!'
          : (data['message']?.toString() ?? 'تم توثيق حسابك');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(toast, style: const TextStyle(fontFamily: 'Cairo'))),
      );

      setState(() {
        _bonus = bonusPoints;
        _celebrate = true;
        _loading = false;
      });
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? e.response!.data['message']?.toString()
          : null;
      if (!mounted) return;
      setState(() {
        _error = msg ?? 'رمز غير صحيح';
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'رمز غير صحيح';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final policy = ref.watch(verificationPolicyProvider);
    final canEmail =
        policy.emailAvailable && (user?['email']?.toString().isNotEmpty ?? false);
    final canPhone =
        policy.phoneAvailable && (user?['phone']?.toString().isNotEmpty ?? false);
    final hasChannel = canEmail || canPhone;

    return Material(
      color: Colors.black.withOpacity(0.7),
      child: SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                child: Padding(
                  padding: const EdgeInsets.all(22),
                  child: _celebrate
                      ? VerificationCelebration(
                          bonus: _bonus,
                          onDone: widget.onVerified,
                        )
                      : Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(LucideIcons.shieldCheck,
                                              color: AppColors.primary,
                                              size: 22),
                                          SizedBox(width: 8),
                                          Text(
                                            'وثّق حسابك',
                                            style: TextStyle(
                                              fontSize: 20,
                                              fontWeight: FontWeight.w900,
                                              fontFamily: 'Cairo',
                                            ),
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 6),
                                      Text(
                                        'سيتم إرسال رمز حقيقي إلى بريدك أو SMS إلى هاتفك — السلة والأكواد والمسابقات تحتاج توثيق',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          fontFamily: 'Cairo',
                                          color: Color(0xFF6B7280),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  onPressed: widget.onClose,
                                  icon: const Icon(LucideIcons.x,
                                      color: Color(0xFF9CA3AF)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (_channel == null) ...[
                              if (!hasChannel)
                                _amberBox(
                                  title: 'التوثيق غير متاح حالياً',
                                  body: policy.enforced
                                      ? 'خدمة البريد أو SMS غير مهيّأة بعد — يمكنك استخدام المنصة بدون توثيق.'
                                      : 'يمكنك استخدام المنصة بدون توثيق حتى يتم تفعيل خدمة البريد أو SMS.',
                                )
                              else if (!_hasEmailOrPhone(user))
                                _amberBox(
                                  title: 'لا يوجد بريد أو هاتف مرتبط',
                                  body:
                                      'أضف بريداً أو رقم هاتف من مركز المستخدم ثم عد للتوثيق.',
                                )
                              else ...[
                                if (canEmail)
                                  _channelBtn(
                                    icon: LucideIcons.mail,
                                    title: 'توثيق البريد',
                                    subtitle: user?['email']?.toString() ?? '',
                                    onTap: () => _send('email'),
                                  ),
                                if (canPhone) ...[
                                  const SizedBox(height: 10),
                                  _channelBtn(
                                    icon: LucideIcons.phone,
                                    title: 'توثيق الهاتف',
                                    subtitle: user?['phone']?.toString() ?? '',
                                    ltr: true,
                                    onTap: () => _send('phone'),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFFBEB),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    '+5 نقاط مجانية بعد التوثيق!',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Cairo',
                                      color: Color(0xFFD97706),
                                    ),
                                  ),
                                ),
                              ],
                            ] else ...[
                              Text(
                                _channel == 'email'
                                    ? 'تحقق من بريدك — قد يستغرق دقيقة. راجع مجلد Spam.'
                                    : 'تحقق من رسائل SMS على هاتفك',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _codeCtrl,
                                keyboardType: TextInputType.number,
                                maxLength: 6,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  letterSpacing: 8,
                                ),
                                decoration: InputDecoration(
                                  hintText: '6 أرقام',
                                  counterText: '',
                                  filled: true,
                                  fillColor: const Color(0xFFF9FAFB),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                        color: Color(0xFFF3F4F6), width: 2),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                        color: Color(0xFFF3F4F6), width: 2),
                                  ),
                                ),
                                onChanged: (_) => setState(() {}),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                height: 52,
                                child: ElevatedButton(
                                  onPressed: _loading ||
                                          _codeCtrl.text.trim().length < 6
                                      ? null
                                      : _confirm,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
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
                                      : const Text(
                                          'تأكيد التوثيق',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontFamily: 'Cairo',
                                          ),
                                        ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              OutlinedButton.icon(
                                onPressed: _loading ||
                                        _resendSeconds > 0 ||
                                        _channel == null
                                    ? null
                                    : () => _send(_channel!, isResend: true),
                                icon: Icon(
                                  LucideIcons.rotateCw,
                                  size: 16,
                                  color: _loading
                                      ? AppColors.primary
                                      : const Color(0xFF4B5563),
                                ),
                                label: Text(
                                  _resendSeconds > 0
                                      ? 'إعادة الإرسال بعد $_resendSeconds ث'
                                      : 'إعادة إرسال الرمز',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(double.infinity, 46),
                                  side: const BorderSide(
                                      color: Color(0xFFF3F4F6), width: 2),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: () => setState(() {
                                  _channel = null;
                                  _resendSeconds = 0;
                                  _codeCtrl.clear();
                                  _error = null;
                                }),
                                child: const Text(
                                  'رجوع',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'Cairo',
                                    color: Color(0xFF9CA3AF),
                                  ),
                                ),
                              ),
                            ],
                            if (_error != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFFEF4444),
                                ),
                              ),
                            ],
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

  bool _hasEmailOrPhone(Map<String, dynamic>? user) {
    final email = user?['email']?.toString() ?? '';
    final phone = user?['phone']?.toString() ?? '';
    return email.isNotEmpty || phone.isNotEmpty;
  }

  Widget _amberBox({required String title, required String body}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
              color: Color(0xFF78350F),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              fontFamily: 'Cairo',
              color: Color(0xFFB45309),
            ),
          ),
        ],
      ),
    );
  }

  Widget _channelBtn({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool ltr = false,
  }) {
    return InkWell(
      onTap: _loading ? null : onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF3F4F6), width: 2),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  Text(
                    subtitle,
                    textDirection: ltr ? TextDirection.ltr : null,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Cairo',
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
            if (_loading)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
      ),
    );
  }
}
