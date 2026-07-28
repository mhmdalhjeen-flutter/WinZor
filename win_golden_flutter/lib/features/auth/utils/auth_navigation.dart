import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Returns to the previous screen after login when possible; otherwise home.
void navigateAfterAuth(BuildContext context) {
  if (context.canPop()) {
    context.pop();
    return;
  }
  context.go('/');
}
