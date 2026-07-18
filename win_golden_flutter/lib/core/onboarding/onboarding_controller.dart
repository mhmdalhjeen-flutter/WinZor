import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'onboarding_storage.dart';

enum OnboardingTourKind { main, marketplace }

class TourState {
  final bool active;
  final int stepIndex;

  const TourState({this.active = false, this.stepIndex = 0});

  TourState copyWith({bool? active, int? stepIndex}) {
    return TourState(
      active: active ?? this.active,
      stepIndex: stepIndex ?? this.stepIndex,
    );
  }
}

class MainTourNotifier extends StateNotifier<TourState> {
  MainTourNotifier() : super(const TourState());

  void start() {
    if (OnboardingStorage.isMainTourComplete()) return;
    state = const TourState(active: true, stepIndex: 0);
  }

  void restart() {
    state = const TourState(active: true, stepIndex: 0);
  }

  void next(int totalSteps) {
    if (state.stepIndex >= totalSteps - 1) {
      finish();
      return;
    }
    state = state.copyWith(stepIndex: state.stepIndex + 1);
  }

  void previous() {
    if (state.stepIndex <= 0) return;
    state = state.copyWith(stepIndex: state.stepIndex - 1);
  }

  Future<void> finish() async {
    await OnboardingStorage.markMainTourComplete();
    state = const TourState(active: false, stepIndex: 0);
  }

  Future<void> skip() => finish();

  void stop() {
    state = const TourState(active: false, stepIndex: 0);
  }
}

class MarketplaceTourNotifier extends StateNotifier<TourState> {
  MarketplaceTourNotifier() : super(const TourState());

  void tryStart() {
    if (OnboardingStorage.isMarketplaceTourComplete()) return;
    state = const TourState(active: true, stepIndex: 0);
  }

  void restart() {
    state = const TourState(active: true, stepIndex: 0);
  }

  void next(int totalSteps) {
    if (state.stepIndex >= totalSteps - 1) {
      finish();
      return;
    }
    state = state.copyWith(stepIndex: state.stepIndex + 1);
  }

  void previous() {
    if (state.stepIndex <= 0) return;
    state = state.copyWith(stepIndex: state.stepIndex - 1);
  }

  Future<void> finish() async {
    await OnboardingStorage.markMarketplaceTourComplete();
    state = const TourState(active: false, stepIndex: 0);
  }

  Future<void> skip() => finish();

  void stop() {
    state = const TourState(active: false, stepIndex: 0);
  }
}

final mainTourProvider =
    StateNotifierProvider<MainTourNotifier, TourState>((ref) {
  return MainTourNotifier();
});

final marketplaceTourProvider =
    StateNotifierProvider<MarketplaceTourNotifier, TourState>((ref) {
  return MarketplaceTourNotifier();
});

/// Bumped when user resets tours from Settings.
final onboardingResetSignalProvider = StateProvider<int>((ref) => 0);

Future<void> resetAllOnboardingTours(WidgetRef ref) async {
  await OnboardingStorage.resetAll();
  ref.read(onboardingResetSignalProvider.notifier).state++;
  ref.read(mainTourProvider.notifier).restart();
  ref.read(marketplaceTourProvider.notifier).stop();
}
