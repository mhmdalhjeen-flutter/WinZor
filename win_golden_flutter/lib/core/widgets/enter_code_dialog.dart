import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../features/auth/presentation/providers/auth_gate_provider.dart';
import '../../features/auth/utils/auth_gate_messages.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/home/presentation/providers/home_providers.dart';
import '../../features/verification/presentation/providers/verification_gate_provider.dart';
import '../../features/verification/utils/verification_api_error.dart';
import '../theme/app_colors.dart';
import 'smooth_bottom_sheet.dart';

Future<void> showEnterCodeDialog(BuildContext context, WidgetRef ref) {
  ref.read(authGateProvider.notifier).runWithAuth(
        () {
          ref.read(verificationGateProvider.notifier).runWithVerification(() {
            showSmoothBottomSheet(
              context: context,
              isScrollControlled: true,
              builder: (ctx) => _EnterCodeDialog(ref: ref),
            );
          });
        },
        message: AuthGateMessages.activationCode,
      );
  return Future.value();
}

class _EnterCodeDialog extends ConsumerStatefulWidget {
  final WidgetRef ref;

  const _EnterCodeDialog({required this.ref});

  @override
  ConsumerState<_EnterCodeDialog> createState() => _EnterCodeDialogState();
}

class _EnterCodeDialogState extends ConsumerState<_EnterCodeDialog> {
  final _controller = TextEditingController();
  bool _loading = false;
  bool _success = false;
  String? _error;
  int _rewardPoints = 0;
  String? _storeId;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _redeem() async {
    final code = _controller.text.trim();
    if (code.isEmpty || _loading) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await ref.read(apiClientProvider).dio.post(
        '/promo/redeem',
        data: {'code': code},
      );
      final data = response.data as Map<String, dynamic>;
      final pts = (data['rewards']?['points'] as num?)?.toInt() ?? 0;
      final userPoints = (data['userPoints'] as num?)?.toInt();
      if (userPoints != null) {
        ref.read(authProvider.notifier).updateUser({'points': userPoints});
      }

      if (!mounted) return;
      setState(() {
        _loading = false;
        _success = true;
        _rewardPoints = pts;
        _storeId = data['storeId']?.toString();
      });

      await Future.delayed(const Duration(milliseconds: 1800));
      if (!mounted) return;
      Navigator.of(context).pop();
      if (_storeId != null && _storeId!.isNotEmpty) {
        context.push('/store/$_storeId');
      }
    } catch (err) {
      if (VerificationApiError.isVerificationRequired(err)) {
        if (mounted) Navigator.of(context).pop();
        ref.read(verificationGateProvider.notifier).handleApiVerificationError(
          err,
          _redeem,
        );
        return;
      }
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = VerificationApiError.messageOf(err, 'فشل تفعيل الكود');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return Material(
      color: Colors.transparent,
      child: Container(
        width: width,
        margin: const EdgeInsets.only(top: 48),
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: _loading ? null : () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.grey),
              ),
            ),
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                LucideIcons.zap,
                color: AppColors.primary,
                size: 28,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'شحن سريع للنقاط',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'أدخل الكود من المتجر',
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 20),
            if (!_success) ...[
              TextField(
                controller: _controller,
                textAlign: TextAlign.center,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  fontSize: 16,
                ),
                decoration: InputDecoration(
                  hintText: 'PREFIX-XXXXXX',
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  errorText: _error,
                ),
                onSubmitted: (_) => _redeem(),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _redeem,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'تفعيل الكود الآن',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                ),
              ),
            ] else ...[
              const Icon(
                LucideIcons.circleCheck,
                color: Color(0xFF059669),
                size: 56,
              ),
              const SizedBox(height: 12),
              const Text(
                'تم شحن نقاطك بنجاح!',
                style: TextStyle(
                  color: Color(0xFF059669),
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
              if (_rewardPoints > 0) ...[
                const SizedBox(height: 4),
                Text(
                  '+$_rewardPoints نقطة',
                  style: const TextStyle(
                    color: Color(0xFFD97706),
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
