import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../data/models/wheel_models.dart';

Color parseWheelColor(String hex, {double opacity = 1}) {
  var h = hex.replaceAll('#', '').trim();
  if (h.length == 3) {
    h = h.split('').map((c) => '$c$c').join();
  }
  if (h.length == 6) h = 'FF$h';
  try {
    final value = int.parse(h, radix: 16);
    final c = Color(value);
    return opacity >= 1 ? c : c.withOpacity(opacity);
  } catch (_) {
    return Colors.indigo.withOpacity(opacity);
  }
}

/// Matches React `WheelVisual`: conic from -90deg, pointer at top, center hub.
class WheelVisual extends StatelessWidget {
  final List<WheelSegment> segments;
  final double rotationDegrees;
  final double size;
  final bool spinning;

  const WheelVisual({
    super.key,
    required this.segments,
    this.rotationDegrees = 0,
    this.size = 300,
    this.spinning = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size + 16,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: 0,
            child: CustomPaint(
              size: const Size(24, 20),
              painter: _PointerPainter(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Transform.rotate(
              angle: rotationDegrees * math.pi / 180,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF111827), width: 6),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.25),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: CustomPaint(
                    size: Size(size, size),
                    painter: _WheelPainter(segments: segments),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF111827),
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 8,
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Text('🎡', style: TextStyle(fontSize: 22)),
            ),
          ),
        ],
      ),
    );
  }
}

class _PointerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(
      path,
      Paint()
        ..color = const Color(0xFFEF4444)
        ..style = PaintingStyle.fill,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _WheelPainter extends CustomPainter {
  final List<WheelSegment> segments;

  _WheelPainter({required this.segments});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    if (segments.isEmpty) {
      canvas.drawCircle(center, radius, Paint()..color = Colors.grey.shade300);
      return;
    }

    final totalWeight =
        segments.fold<double>(0, (s, e) => s + (e.displayWeight <= 0 ? 1 : e.displayWeight));
    var start = -math.pi / 2;

    for (final seg in segments) {
      final w = seg.displayWeight <= 0 ? 1.0 : seg.displayWeight;
      final sweep = (w / totalWeight) * 2 * math.pi;
      final paint = Paint()
        ..style = PaintingStyle.fill
        ..color = parseWheelColor(seg.color, opacity: seg.locked ? 0.53 : 1);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        true,
        paint,
      );
      // Divider line
      final divider = Paint()
        ..color = Colors.black.withOpacity(0.15)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke;
      final x = center.dx + radius * math.cos(start);
      final y = center.dy + radius * math.sin(start);
      canvas.drawLine(center, Offset(x, y), divider);
      start += sweep;
    }

    // Soft highlight
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..shader = RadialGradient(
          colors: [
            Colors.white.withOpacity(0.18),
            Colors.transparent,
          ],
        ).createShader(Rect.fromCircle(center: center, radius: radius)),
    );
  }

  @override
  bool shouldRepaint(covariant _WheelPainter oldDelegate) =>
      oldDelegate.segments != segments;
}
