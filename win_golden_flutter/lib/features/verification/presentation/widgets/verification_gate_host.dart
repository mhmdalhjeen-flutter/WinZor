import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../profile/presentation/providers/user_center_providers.dart';
import '../providers/verification_gate_provider.dart';
import 'verification_prompt_modal.dart';
import 'verify_account_modal.dart';

/// Global host — mount in `MaterialApp.builder` (React `VerificationGateProvider`).
class VerificationGateHost extends ConsumerWidget {
  final Widget child;

  const VerificationGateHost({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Warm public settings so verification policy is ready (React usePlatformSettings).
    ref.watch(platformSettingsProvider);
    final gate = ref.watch(verificationGateProvider);
    final notifier = ref.read(verificationGateProvider.notifier);

    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        if (gate.promptOpen)
          VerificationPromptModal(
            config: gate.promptConfig,
            onVerifyNow: notifier.handleVerifyNow,
            onLater: notifier.handleLater,
          ),
        if (gate.verifyOpen)
          VerifyAccountModal(
            onClose: notifier.closeVerifyModal,
            onVerified: notifier.handleVerified,
          ),
      ],
    );
  }
}
