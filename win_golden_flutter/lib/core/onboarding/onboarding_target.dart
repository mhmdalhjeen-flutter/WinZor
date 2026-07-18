import 'package:flutter/material.dart';

/// Wraps a widget so its bounds can be measured for the spotlight tour.
class OnboardingTarget extends StatelessWidget {
  final GlobalKey targetKey;
  final Widget child;

  const OnboardingTarget({
    super.key,
    required this.targetKey,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return KeyedSubtree(key: targetKey, child: child);
  }
}
