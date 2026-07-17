import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/auth_repository_provider.dart';

/// React `VerifyEmail.jsx` — deep-link email confirmation (`?token=&uid=`).
class VerifyEmailPage extends ConsumerStatefulWidget {
  final String? token;
  final String? uid;

  const VerifyEmailPage({
    super.key,
    this.token,
    this.uid,
  });

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  String _status = 'loading'; // loading | success | error
  String _message = '';
  int _bonusPoints = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _confirm());
  }

  Future<void> _confirm() async {
    final token = widget.token;
    final uid = widget.uid;
    if (token == null ||
        token.isEmpty ||
        uid == null ||
        uid.isEmpty) {
      setState(() {
        _status = 'error';
        _message = 'رابط التفعيل غير مكتمل';
      });
      return;
    }

    try {
      final data = await ref.read(authRepositoryProvider).confirmEmailLink(
            token: token,
            uid: uid,
          );
      final auth = ref.read(authProvider);
      if (auth.isAuth && data['user'] is Map) {
        final user = Map<String, dynamic>.from(data['user'] as Map);
        ref.read(authProvider.notifier).updateUser({
          ...user,
          if (data['points'] != null) 'points': data['points'],
          if (user['isVerified'] != null) 'isVerified': user['isVerified'],
        });
      }
      if (!mounted) return;
      setState(() {
        _status = 'success';
        _message = data['message']?.toString() ?? 'تم توثيق بريدك الإلكتروني';
        _bonusPoints = int.tryParse(data['bonusPoints']?.toString() ?? '') ?? 0;
      });
    } catch (e) {
      String msg = 'تعذّر تفعيل البريد';
      if (e is DioException && e.response?.data is Map) {
        msg = e.response?.data['message']?.toString() ?? msg;
      }
      if (!mounted) return;
      setState(() {
        _status = 'error';
        _message = msg;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAuth = ref.watch(authProvider).isAuth;

    return Scaffold(
      backgroundColor: const Color(0xFF07070F),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 40,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_status == 'loading') ...[
                    const SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 3,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'جاري تأكيد بريدك...',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                  if (_status == 'success') ...[
                    const Icon(LucideIcons.checkCircle2,
                        size: 48, color: Color(0xFF22C55E)),
                    const SizedBox(height: 16),
                    const Text(
                      'تم التوثيق',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Cairo',
                        color: Color(0xFF4B5563),
                      ),
                    ),
                    if (_bonusPoints > 0) ...[
                      const SizedBox(height: 8),
                      Text(
                        '+$_bonusPoints نقاط هدية!',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFFD97706),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () =>
                            context.go(isAuth ? '/' : '/login'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Text(
                          isAuth ? 'متابعة' : 'تسجيل الدخول',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (_status == 'error') ...[
                    const Icon(LucideIcons.xCircle,
                        size: 48, color: Color(0xFFEF4444)),
                    const SizedBox(height: 16),
                    const Text(
                      'تعذّر التفعيل',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Cairo',
                        color: Color(0xFF4B5563),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            context.go(isAuth ? '/center' : '/login'),
                        icon: const Icon(LucideIcons.shieldCheck, size: 18),
                        label: Text(
                          isAuth ? 'مركز المستخدم' : 'تسجيل الدخول',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF374151),
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(
                              color: Color(0xFFF3F4F6), width: 2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
