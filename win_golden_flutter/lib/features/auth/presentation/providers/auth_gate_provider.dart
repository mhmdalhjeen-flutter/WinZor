import 'package:flutter/scheduler.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

class AuthGateState {
  final bool promptOpen;
  final String message;

  const AuthGateState({
    this.promptOpen = false,
    this.message = '',
  });

  AuthGateState copyWith({
    bool? promptOpen,
    String? message,
  }) {
    return AuthGateState(
      promptOpen: promptOpen ?? this.promptOpen,
      message: message ?? this.message,
    );
  }
}

class AuthGateNotifier extends StateNotifier<AuthGateState> {
  AuthGateNotifier(this._ref) : super(const AuthGateState());

  final Ref _ref;
  VoidCallback? _pending;

  bool get hasPendingAction => _pending != null;

  /// Runs [action] immediately when authenticated; otherwise opens the sign-in prompt.
  bool runWithAuth(VoidCallback action, {required String message}) {
    if (_ref.read(authProvider).isAuth) {
      action();
      return true;
    }
    _pending = action;
    state = state.copyWith(promptOpen: true, message: message);
    return false;
  }

  void closePrompt() {
    state = state.copyWith(promptOpen: false);
  }

  void cancel() {
    _pending = null;
    closePrompt();
  }

  void onAuthenticated() {
    closePrompt();
    final action = _pending;
    _pending = null;
    if (action != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => action());
    }
  }
}

final authGateProvider =
    StateNotifierProvider<AuthGateNotifier, AuthGateState>((ref) {
  final notifier = AuthGateNotifier(ref);
  ref.listen<AuthState>(authProvider, (previous, next) {
    if (previous?.isAuth != true && next.isAuth) {
      notifier.onAuthenticated();
    }
  });
  return notifier;
});
