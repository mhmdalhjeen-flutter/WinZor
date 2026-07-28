import 'package:flutter/material.dart';

/// Fast fade + slide overlay — smooth open/close without stutter.
Future<T?> showInstantOverlay<T>({
  required BuildContext context,
  required Widget child,
  Alignment alignment = Alignment.bottomCenter,
  bool dismissible = true,
  Duration duration = const Duration(milliseconds: 220),
}) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: dismissible,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black54,
    transitionDuration: duration,
    pageBuilder: (_, __, ___) => SafeArea(
      child: Align(alignment: alignment, child: child),
    ),
    transitionBuilder: (_, animation, __, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      Widget result = FadeTransition(opacity: curved, child: child);

      if (alignment == Alignment.topCenter) {
        result = SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, -0.06),
            end: Offset.zero,
          ).animate(curved),
          child: result,
        );
      } else if (alignment == Alignment.bottomCenter) {
        result = SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.06),
            end: Offset.zero,
          ).animate(curved),
          child: result,
        );
      } else {
        result = ScaleTransition(
          scale: Tween<double>(begin: 0.97, end: 1).animate(curved),
          alignment: Alignment.center,
          child: result,
        );
      }

      return result;
    },
  );
}

Future<T?> showSmoothOverlay<T>({
  required BuildContext context,
  required Widget child,
  Alignment alignment = Alignment.bottomCenter,
  bool dismissible = true,
  Duration duration = const Duration(milliseconds: 220),
}) {
  return showInstantOverlay<T>(
    context: context,
    child: child,
    alignment: alignment,
    dismissible: dismissible,
    duration: duration,
  );
}

Future<T?> showSmoothCenterDialog<T>({
  required BuildContext context,
  required Widget child,
  bool dismissible = true,
}) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: dismissible,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black54,
    transitionDuration: const Duration(milliseconds: 220),
    pageBuilder: (_, __, ___) => Center(child: child),
    transitionBuilder: (_, animation, __, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.94, end: 1).animate(curved),
          child: child,
        ),
      );
    },
  );
}
