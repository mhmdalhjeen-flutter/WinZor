import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_brand_assets.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/home/presentation/providers/home_providers.dart';

/// Session flag — splash runs once per cold start.
final startupSplashDoneProvider = StateProvider<bool>((ref) => false);

/// Full-screen startup splash — user sees only splash until ready, then Home.
class StartupSplashGate extends ConsumerStatefulWidget {
  final Widget child;

  const StartupSplashGate({super.key, required this.child});

  @override
  ConsumerState<StartupSplashGate> createState() => _StartupSplashGateState();
}

class _StartupSplashGateState extends ConsumerState<StartupSplashGate>
    with SingleTickerProviderStateMixin {
  static const _slogans = [
    'تسوق • اجمع نقاط • اربح',
    'أفضل العروض من المتاجر المعتمدة',
    'جوائز • مسابقات • عروض يومية',
  ];

  static const _minVisible = Duration(seconds: 6);
  static const _sloganInterval = Duration(milliseconds: 2000);

  int _sloganIndex = 0;
  Timer? _sloganTimer;
  bool _visible = true;
  bool _ready = false;
  late final AnimationController _fadeOut;

  @override
  void initState() {
    super.initState();
    _fadeOut = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _sloganTimer = Timer.periodic(_sloganInterval, (_) {
      if (!mounted || !_visible) return;
      setState(() => _sloganIndex = (_sloganIndex + 1) % _slogans.length);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _runStartup());
  }

  Future<void> _runStartup() async {
    if (ref.read(startupSplashDoneProvider)) {
      if (mounted) {
        setState(() {
          _visible = false;
          _ready = true;
        });
      }
      return;
    }

    Future<void> preload(Future<dynamic> future) async {
      try {
        await future;
      } catch (_) {}
    }

    await Future.wait<void>([
      Future<void>.delayed(_minVisible),
      preload(ref.read(reelsProvider.future)),
      preload(ref.read(regionsProvider.future)),
      preload(ref.read(storeCategoriesProvider.future)),
      _waitAuthSettled(),
    ]);

    if (!mounted) return;
    ref.read(startupSplashDoneProvider.notifier).state = true;
    await _fadeOut.forward();
    if (!mounted) return;
    setState(() {
      _visible = false;
      _ready = true;
    });
  }

  Future<void> _waitAuthSettled() async {
    while (mounted && ref.read(authProvider).isLoading) {
      await Future<void>.delayed(const Duration(milliseconds: 40));
    }
  }

  @override
  void dispose() {
    _sloganTimer?.cancel();
    _fadeOut.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (_ready) widget.child,
        if (_visible)
          FadeTransition(
            opacity: Tween<double>(begin: 1, end: 0).animate(
              CurvedAnimation(parent: _fadeOut, curve: Curves.easeOutCubic),
            ),
            child: Material(
              type: MaterialType.transparency,
              child: IgnorePointer(
                child: _StartupSplashVisual(
                  slogan: _slogans[_sloganIndex],
                  sloganKey: ValueKey(_sloganIndex),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _StartupSplashVisual extends StatelessWidget {
  final String slogan;
  final Key sloganKey;

  const _StartupSplashVisual({
    required this.slogan,
    required this.sloganKey,
  });

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFF7F5F2),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF059669).withOpacity(0.06),
              ),
            ),
          ),
          Positioned(
            bottom: -40,
            left: -40,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFD97706).withOpacity(0.06),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 112,
                      height: 112,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 24,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: const BrandLogo.full(width: 84, height: 84),
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      'Shop & Win',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF111827),
                        letterSpacing: 0.4,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      height: 48,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 380),
                        switchInCurve: Curves.easeOut,
                        switchOutCurve: Curves.easeIn,
                        transitionBuilder: (child, animation) {
                          final offset = Tween<Offset>(
                            begin: const Offset(0, 0.25),
                            end: Offset.zero,
                          ).animate(animation);
                          return FadeTransition(
                            opacity: animation,
                            child: SlideTransition(
                              position: offset,
                              child: child,
                            ),
                          );
                        },
                        child: Text(
                          slogan,
                          key: sloganKey,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF4B5563),
                            fontFamily: 'Cairo',
                            height: 1.35,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
