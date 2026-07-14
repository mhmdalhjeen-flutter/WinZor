import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../profile/presentation/providers/user_center_providers.dart';
import '../../data/repositories/verification_repository.dart';
import '../../utils/verification_api_error.dart';
import '../../utils/verification_gate_config.dart';
import '../../utils/verification_policy.dart';

final verificationRepositoryProvider = Provider<VerificationRepository>((ref) {
  return VerificationRepository(ref.watch(apiClientProvider));
});

final verificationPolicyProvider = Provider<VerificationPolicy>((ref) {
  final settings = ref.watch(platformSettingsProvider).valueOrNull;
  return normalizeVerificationPolicy(settings?.verification);
});

final isUserVerifiedProvider = Provider<bool>((ref) {
  final user = ref.watch(authProvider).user;
  final policy = ref.watch(verificationPolicyProvider);
  return isVerifiedUser(user, policy);
});

class VerificationGateState {
  final bool promptOpen;
  final bool verifyOpen;
  final VerificationPromptConfig promptConfig;

  const VerificationGateState({
    this.promptOpen = false,
    this.verifyOpen = false,
    this.promptConfig = const VerificationPromptConfig(),
  });

  VerificationGateState copyWith({
    bool? promptOpen,
    bool? verifyOpen,
    VerificationPromptConfig? promptConfig,
  }) {
    return VerificationGateState(
      promptOpen: promptOpen ?? this.promptOpen,
      verifyOpen: verifyOpen ?? this.verifyOpen,
      promptConfig: promptConfig ?? this.promptConfig,
    );
  }
}

class VerificationGateNotifier extends StateNotifier<VerificationGateState> {
  VerificationGateNotifier(this._ref) : super(const VerificationGateState());

  final Ref _ref;
  VoidCallback? _pending;

  bool get verified => _ref.read(isUserVerifiedProvider);

  VerificationPolicy get policy => _ref.read(verificationPolicyProvider);

  void openVerificationPrompt(
    VoidCallback? afterVerify, [
    VerificationPromptConfig config = const VerificationPromptConfig(),
  ]) {
    _pending = afterVerify;
    state = state.copyWith(promptOpen: true, promptConfig: config);
  }

  /// Runs [action] if verified; otherwise opens the prompt and queues [action].
  /// Returns `true` when action ran immediately.
  bool runWithVerification(
    VoidCallback action, [
    VerificationPromptConfig config = const VerificationPromptConfig(),
  ]) {
    final user = _ref.read(authProvider).user;
    final policy = _ref.read(verificationPolicyProvider);
    if (isVerifiedUser(user, policy)) {
      action();
      return true;
    }
    openVerificationPrompt(action, config);
    return false;
  }

  /// If API error is `VERIFICATION_REQUIRED`, open prompt with [retryAction].
  bool handleApiVerificationError(
    Object? err,
    VoidCallback retryAction, [
    VerificationPromptConfig config = const VerificationPromptConfig(),
    String? explicitCode,
  ]) {
    if (VerificationApiError.isVerificationRequired(
      err,
      explicitCode: explicitCode,
    )) {
      openVerificationPrompt(retryAction, config);
      return true;
    }
    return false;
  }

  void handleVerifyNow() {
    state = state.copyWith(promptOpen: false, verifyOpen: true);
  }

  void handleLater() {
    _pending = null;
    state = state.copyWith(
      promptOpen: false,
      promptConfig: const VerificationPromptConfig(),
    );
  }

  void closeVerifyModal() {
    state = state.copyWith(verifyOpen: false);
  }

  /// After OTP success + celebration — run queued action without re-login.
  void handleVerified() {
    state = state.copyWith(verifyOpen: false);
    final fn = _pending;
    _pending = null;
    Future<void>.delayed(const Duration(milliseconds: 80), () {
      fn?.call();
    });
  }
}

final verificationGateProvider =
    StateNotifierProvider<VerificationGateNotifier, VerificationGateState>(
  (ref) => VerificationGateNotifier(ref),
);
