import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/wheel_models.dart';

Future<void> showWheelResultPopup({
  required BuildContext context,
  required WheelSpinResult result,
  VoidCallback? onViewInventory,
}) {
  return showGeneralDialog(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'إغلاق',
    barrierColor: Colors.black26,
    transitionDuration: const Duration(milliseconds: 280),
    pageBuilder: (ctx, a1, a2) {
      return _WheelResultDialog(
        result: result,
        onViewInventory: onViewInventory,
      );
    },
    transitionBuilder: (ctx, anim, _, child) {
      final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutBack);
      return FadeTransition(
        opacity: anim,
        child: ScaleTransition(scale: curved, child: child),
      );
    },
  );
}

class _WheelResultDialog extends StatefulWidget {
  final WheelSpinResult result;
  final VoidCallback? onViewInventory;

  const _WheelResultDialog({
    required this.result,
    this.onViewInventory,
  });

  @override
  State<_WheelResultDialog> createState() => _WheelResultDialogState();
}

class _WheelResultDialogState extends State<_WheelResultDialog> {
  @override
  void initState() {
    super.initState();
    final outcome = widget.result.outcome;
    final ms = switch (outcome) {
      'win' => 3200,
      'locked' => 2800,
      _ => 2500,
    };
    Future.delayed(Duration(milliseconds: ms), () {
      if (mounted) Navigator.of(context).maybePop();
    });
  }

  @override
  Widget build(BuildContext context) {
    final result = widget.result;
    final outcome = result.outcome;
    final theme = _themeFor(outcome);
    final subtitle = _subtitle(result);

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: mathMin(MediaQuery.of(context).size.width * 0.92, 340),
          margin: const EdgeInsets.only(top: 40),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: theme.bg,
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: theme.ring, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.18),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                left: 0,
                top: 0,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x, size: 16, color: Colors.grey),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      result.prize?.icon.isNotEmpty == true
                          ? result.prize!.icon
                          : theme.icon,
                      style: const TextStyle(fontSize: 28),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.badgeBg,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (outcome == 'win') ...[
                          Icon(LucideIcons.sparkles,
                              size: 12, color: theme.badgeFg),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          theme.title,
                          style: TextStyle(
                            color: theme.badgeFg,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      color: Color(0xFF111827),
                      height: 1.4,
                    ),
                  ),
                  if (result.charged) ...[
                    const SizedBox(height: 8),
                    Text(
                      'تم خصم ${result.pointsCost} نقاط — رصيدك: ${result.userPoints}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6B7280),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                  if (!result.charged && outcome == 'locked') ...[
                    const SizedBox(height: 8),
                    const Text(
                      'لم تُخصم نقاط — جرّب مجدداً',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFD97706),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                  if (outcome == 'win' && widget.onViewInventory != null) ...[
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          widget.onViewInventory!();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text(
                          'مخزن جوائزي',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  const Text(
                    'يُغلق تلقائياً...',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF9CA3AF),
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _subtitle(WheelSpinResult result) {
    if (result.outcome == 'win') {
      final name = result.prize?.name;
      if (name != null && name.isNotEmpty) return 'لقد ربحت: $name';
      return result.message.isNotEmpty
          ? result.message.replaceFirst(RegExp(r'^مبروك! فزت بـ\s*'), 'لقد ربحت: ')
          : 'لقد ربحت جائزة';
    }
    if (result.outcome == 'no_win') {
      return 'حاول مرة أخرى — قد يبتسم الحظ قريباً';
    }
    if (result.outcome == 'locked') {
      return result.message.isNotEmpty
          ? result.message
          : 'ارفع نقاطك لفتح هذه الجائزة';
    }
    return result.message;
  }

  _Theme _themeFor(String outcome) {
    switch (outcome) {
      case 'win':
        return const _Theme(
          ring: Color(0xFFA7F3D0),
          bg: [Colors.white, Color(0xFFECFDF5)],
          badgeBg: Color(0xFFD1FAE5),
          badgeFg: Color(0xFF047857),
          icon: '🎉',
          title: 'مبروك!',
        );
      case 'locked':
        return const _Theme(
          ring: Color(0xFFFDE68A),
          bg: [Colors.white, Color(0xFFFFFBEB)],
          badgeBg: Color(0xFFFEF3C7),
          badgeFg: Color(0xFFB45309),
          icon: '🔒',
          title: 'جائزة مقفلة',
        );
      default:
        return const _Theme(
          ring: Color(0xFFE2E8F0),
          bg: [Colors.white, Color(0xFFF8FAFC)],
          badgeBg: Color(0xFFF1F5F9),
          badgeFg: Color(0xFF475569),
          icon: '😔',
          title: 'حظ أوفر!',
        );
    }
  }
}

class _Theme {
  final Color ring;
  final List<Color> bg;
  final Color badgeBg;
  final Color badgeFg;
  final String icon;
  final String title;

  const _Theme({
    required this.ring,
    required this.bg,
    required this.badgeBg,
    required this.badgeFg,
    required this.icon,
    required this.title,
  });
}

double mathMin(double a, double b) => a < b ? a : b;
