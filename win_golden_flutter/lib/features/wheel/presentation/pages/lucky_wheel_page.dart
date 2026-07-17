import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/wheel_models.dart';
import '../providers/wheel_providers.dart';
import '../widgets/wheel_result_popup.dart';
import '../widgets/wheel_visual.dart';

/// Ease matching React Framer: cubic-bezier(0.12, 0.85, 0.22, 1)
const _spinCurve = Cubic(0.12, 0.85, 0.22, 1.0);

class LuckyWheelPage extends ConsumerStatefulWidget {
  const LuckyWheelPage({super.key});

  @override
  ConsumerState<LuckyWheelPage> createState() => _LuckyWheelPageState();
}

class _LuckyWheelPageState extends ConsumerState<LuckyWheelPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Animation<double>? _rotationAnim;
  double _rotation = 0;
  bool _spinning = false;
  int? _displayPoints;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 7200),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _idemKey() {
    final r = math.Random().nextInt(1 << 32).toRadixString(36);
    return '${DateTime.now().millisecondsSinceEpoch}-$r';
  }

  double _calcRotation(int segmentIndex, int segmentCount, double currentRot) {
    if (segmentCount <= 0) return currentRot;
    final angle = 360 / segmentCount;
    final target = 360 - (segmentIndex * angle + angle / 2);
    const fullSpins = 8 * 360.0;
    final base = currentRot % 360;
    return currentRot + fullSpins + (target - base + 360) % 360;
  }

  Future<void> _spin(WheelConfig config) async {
    if (_spinning || config.segments.isEmpty) return;

    final isAuth = ref.read(authProvider).isAuth;
    if (!isAuth) {
      context.push('/login');
      return;
    }

    ref.read(verificationGateProvider.notifier).runWithVerification(
          () => _doSpin(config),
        );
  }

  Future<void> _doSpin(WheelConfig config) async {
    if (_spinning || config.segments.isEmpty) return;

    setState(() => _spinning = true);
    HapticFeedback.lightImpact();

    try {
      final result = await ref.read(wheelRepositoryProvider).spin(
            idempotencyKey: _idemKey(),
          );

      final segCount = result.segmentCount > 0
          ? result.segmentCount
          : config.segments.length;
      final newRot = _calcRotation(result.segmentIndex, segCount, _rotation);

      _rotationAnim = Tween<double>(begin: _rotation, end: newRot).animate(
        CurvedAnimation(parent: _controller, curve: _spinCurve),
      );
      _controller.reset();
      await _controller.forward();
      _rotation = newRot;

      ref.read(authProvider.notifier).updateUser({'points': result.userPoints});
      setState(() => _displayPoints = result.userPoints);

      ref.invalidate(wheelConfigProvider);
      ref.invalidate(wheelWinsProvider);

      if (!mounted) return;
      await showWheelResultPopup(
        context: context,
        result: result,
        onViewInventory: () => context.push('/inventory'),
      );
    } catch (e) {
      if (!mounted) return;
      final gate = ref.read(verificationGateProvider.notifier);
      if (gate.handleApiVerificationError(e, () => _doSpin(config))) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_errMsg(e))),
      );
    } finally {
      if (mounted) setState(() => _spinning = false);
    }
  }

  String _errMsg(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    }
    return 'تعذّر الدوران';
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'سجّل الدخول لتجربة عجلة الحظ',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.push('/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                  ),
                  child: const Text(
                    'تسجيل الدخول',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final configAsync = ref.watch(wheelConfigProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: configAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _errMsg(e),
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                TextButton(
                  onPressed: () => ref.invalidate(wheelConfigProvider),
                  child: const Text(
                    'إعادة المحاولة',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          data: (config) {
            if (!config.enabled) {
              return _DisabledState(
                onBack: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/center');
                  }
                },
              );
            }

            final points = _displayPoints ??
                config.userPoints;
            final authPoints =
                (auth.user?['points'] as num?)?.toInt();
            final shownPoints = _displayPoints ?? authPoints ?? points;
            final spinCost = config.spinCost;

            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(wheelConfigProvider);
                await ref.read(wheelConfigProvider.future);
              },
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                children: [
                  _Header(
                    points: shownPoints,
                    onBack: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/center');
                      }
                    },
                    onWins: () => context.push('/inventory'),
                  ),
                  const SizedBox(height: 24),
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, _) {
                      final rot = _rotationAnim?.value ?? _rotation;
                      return Column(
                        children: [
                          WheelVisual(
                            segments: config.segments,
                            rotationDegrees: rot,
                            size: 300,
                            spinning: _spinning,
                          ),
                          const SizedBox(height: 28),
                          SizedBox(
                            height: 56,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                gradient: _spinning
                                    ? null
                                    : const LinearGradient(
                                        colors: [
                                          AppColors.primary,
                                          Color(0xFF9333EA),
                                        ],
                                      ),
                                color:
                                    _spinning ? Colors.grey.shade400 : null,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.35),
                                    blurRadius: 16,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed:
                                    _spinning ? null : () => _spin(config),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  disabledBackgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 36,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                                child: Text(
                                  _spinning
                                      ? 'جاري الدوران...'
                                      : 'جرّب حظك ($spinCost نقاط)',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ),
                            ),
                          ),
                          if (shownPoints < spinCost)
                            const Padding(
                              padding: EdgeInsets.only(top: 10),
                              child: Text(
                                'قد تحتاج نقاط إضافية إذا لم تتوقف على جائزة مقفلة',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFFD97706),
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 28),
                  _Legend(segments: config.segments),
                  const SizedBox(height: 20),
                  const Text(
                    '* النتيجة تُحدَّد على الخادم — لا يمكن التلاعب بالعجلة من الواجهة.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final int points;
  final VoidCallback onBack;
  final VoidCallback onWins;

  const _Header({
    required this.points,
    required this.onBack,
    required this.onWins,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: onBack,
          style: IconButton.styleFrom(
            backgroundColor: Colors.white,
            side: const BorderSide(color: Color(0xFFF3F4F6)),
          ),
          icon: const Icon(LucideIcons.chevronRight, size: 20),
        ),
        const SizedBox(width: 8),
        const Expanded(
          child: Text(
            'عجلة الحظ',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
              color: Color(0xFF1F2937),
            ),
          ),
        ),
        GestureDetector(
          onTap: onWins,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF59E0B), Color(0xFFEA580C)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.orange.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.trophy, size: 14, color: Colors.white),
                SizedBox(width: 4),
                Text(
                  'جوائزي',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFEF3C7)),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.sparkles,
                  size: 14, color: Color(0xFFF59E0B)),
              const SizedBox(width: 4),
              Text(
                '$points نقطة',
                style: const TextStyle(
                  color: Color(0xFFB45309),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  final List<WheelSegment> segments;

  const _Legend({required this.segments});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'دليل الجوائز',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 10),
          ...segments.map((seg) {
            return Opacity(
              opacity: seg.locked ? 0.65 : 1,
              child: Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: seg.locked ? const Color(0xFFF9FAFB) : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: parseWheelColor(seg.color),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(seg.icon, style: const TextStyle(fontSize: 18)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            seg.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          if (seg.minPoints > 0)
                            Row(
                              children: [
                                if (seg.locked)
                                  const Icon(LucideIcons.lock,
                                      size: 10, color: Color(0xFFF59E0B)),
                                if (seg.locked) const SizedBox(width: 4),
                                Text(
                                  seg.locked
                                      ? 'مقفلة — ${seg.minPoints}+ نقطة'
                                      : 'من ${seg.minPoints} نقطة',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF9CA3AF),
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _DisabledState extends StatelessWidget {
  final VoidCallback onBack;

  const _DisabledState({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.circleDot, size: 48, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            const Text(
              'عجلة الحظ غير متاحة حالياً',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'تم إيقاف الميزة من إعدادات المنصة',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF9CA3AF),
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: onBack,
              child: const Text(
                'العودة',
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
