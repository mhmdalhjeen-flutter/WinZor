import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/profile/data/models/user_center_models.dart';
import '../../features/profile/presentation/providers/user_center_providers.dart';
import '../widgets/startup_splash_gate.dart';
import 'onboarding_controller.dart';
import 'onboarding_steps.dart';
import 'onboarding_storage.dart';
import 'spotlight_tour_overlay.dart';

/// Hosts main + marketplace spotlight tours over the main shell.
class OnboardingTourHost extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;

  const OnboardingTourHost({
    super.key,
    required this.navigationShell,
  });

  @override
  ConsumerState<OnboardingTourHost> createState() => _OnboardingTourHostState();
}

class _OnboardingTourHostState extends ConsumerState<OnboardingTourHost> {
  Timer? _mainStartTimer;
  Timer? _marketplaceStartTimer;

  @override
  void dispose() {
    _mainStartTimer?.cancel();
    _marketplaceStartTimer?.cancel();
    super.dispose();
  }

  List<OnboardingStep> get _mainSteps {
    final settings =
        ref.watch(platformSettingsProvider).asData?.value ??
            const PlatformSettings();
    return filteredMainSteps(showMarketplace: settings.showMarketplace);
  }

  bool get _onMarketplaceTab => widget.navigationShell.currentIndex == 2;

  void _scheduleMainTour() {
    _mainStartTimer?.cancel();
    if (OnboardingStorage.isMainTourComplete()) return;

    final splashDone = ref.read(startupSplashDoneProvider);
    final delay = splashDone
        ? const Duration(milliseconds: 900)
        : const Duration(milliseconds: 5500);

    _mainStartTimer = Timer(delay, () {
      if (!mounted) return;
      final auth = ref.read(authProvider);
      if (!auth.isAuth) return;
      if (OnboardingStorage.isMainTourComplete()) return;
      ref.read(mainTourProvider.notifier).start();
    });
  }

  void _scheduleMarketplaceTour() {
    _marketplaceStartTimer?.cancel();
    if (!_onMarketplaceTab || OnboardingStorage.isMarketplaceTourComplete()) {
      return;
    }
    if (ref.read(mainTourProvider).active) return;

    _marketplaceStartTimer = Timer(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      if (!_onMarketplaceTab) return;
      if (OnboardingStorage.isMarketplaceTourComplete()) return;
      if (ref.read(mainTourProvider).active) return;
      ref.read(marketplaceTourProvider.notifier).tryStart();
    });
  }

  void _applyStepBranch(OnboardingStep step) {
    final branch = step.shellBranch;
    if (branch == null) return;
    if (widget.navigationShell.currentIndex != branch) {
      widget.navigationShell.goBranch(branch);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final mainTour = ref.watch(mainTourProvider);
    final marketplaceTour = ref.watch(marketplaceTourProvider);
    final resetSignal = ref.watch(onboardingResetSignalProvider);
    final splashDone = ref.watch(startupSplashDoneProvider);

    ref.listen<int>(onboardingResetSignalProvider, (prev, next) {
      if (prev == next) return;
      widget.navigationShell.goBranch(0);
    });

    ref.listen<bool>(startupSplashDoneProvider, (prev, next) {
      if (next && !OnboardingStorage.isMainTourComplete()) {
        _scheduleMainTour();
      }
    });

    ref.listen<TourState>(mainTourProvider, (prev, next) {
      if (prev?.active == true && !next.active && _onMarketplaceTab) {
        _scheduleMarketplaceTour();
      }
      if (!next.active) return;
      final steps = _mainSteps;
      if (next.stepIndex >= steps.length) return;
      final step = steps[next.stepIndex];
      _applyStepBranch(step);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (step.scrollToTarget) {
          scrollTargetIntoView(step.targetKey);
        }
      });
    });

    ref.listen<TourState>(marketplaceTourProvider, (prev, next) {
      if (!next.active) return;
      if (next.stepIndex >= marketplaceOnboardingSteps.length) return;
      final step = marketplaceOnboardingSteps[next.stepIndex];
      _applyStepBranch(step);
    });

    if (auth.isAuth) {
      if (splashDone) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleMainTour());
      }
      if (_onMarketplaceTab && !mainTour.active) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleMarketplaceTour());
      }
    }

    // Re-run scheduling when reset or tab changes.
    if (resetSignal >= 0 && auth.isAuth && splashDone) {
      // noop — watch ensures rebuild; timers scheduled above.
    }

    if (!auth.isAuth) return const SizedBox.shrink();

    final mainActive = mainTour.active;
    final marketplaceActive = marketplaceTour.active && !mainActive;

    if (!mainActive && !marketplaceActive) {
      return const SizedBox.shrink();
    }

    if (mainActive) {
      final steps = _mainSteps;
      final index = mainTour.stepIndex.clamp(0, steps.length - 1);
      final step = steps[index];
      return SpotlightTourOverlay(
        open: true,
        step: step,
        stepIndex: index,
        totalSteps: steps.length,
        onNext: () => ref.read(mainTourProvider.notifier).next(steps.length),
        onPrev: () => ref.read(mainTourProvider.notifier).previous(),
        onSkip: () => ref.read(mainTourProvider.notifier).skip(),
        onFinish: () => ref.read(mainTourProvider.notifier).finish(),
      );
    }

    final mpIndex =
        marketplaceTour.stepIndex.clamp(0, marketplaceOnboardingSteps.length - 1);
    final mpStep = marketplaceOnboardingSteps[mpIndex];
    return SpotlightTourOverlay(
      open: true,
      step: mpStep,
      stepIndex: mpIndex,
      totalSteps: marketplaceOnboardingSteps.length,
      onNext: () => ref
          .read(marketplaceTourProvider.notifier)
          .next(marketplaceOnboardingSteps.length),
      onPrev: () => ref.read(marketplaceTourProvider.notifier).previous(),
      onSkip: () => ref.read(marketplaceTourProvider.notifier).skip(),
      onFinish: () => ref.read(marketplaceTourProvider.notifier).finish(),
    );
  }
}
