import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_gate_provider.dart';
import 'guest_auth_prompt_modal.dart';

class AuthGateHost extends ConsumerWidget {
  final Widget child;

  const AuthGateHost({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gate = ref.watch(authGateProvider);
    final notifier = ref.read(authGateProvider.notifier);

    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        if (gate.promptOpen)
          GuestAuthPromptModal(
            message: gate.message,
            onLater: notifier.cancel,
          ),
      ],
    );
  }
}
