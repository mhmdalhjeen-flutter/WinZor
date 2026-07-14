import 'package:flutter/material.dart';

class AuthWelcomeBackground extends StatefulWidget {
  const AuthWelcomeBackground({super.key});

  @override
  State<AuthWelcomeBackground> createState() => _AuthWelcomeBackgroundState();
}

class _AuthWelcomeBackgroundState extends State<AuthWelcomeBackground>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(4, (index) {
      return AnimationController(
        vsync: this,
        duration: Duration(seconds: 20 + (index * 2)),
      )..repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Base Gradient
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment(0.26, -0.97),
                end: Alignment(-0.26, 0.97),
                colors: [
                  Color(0xFFFFF8F0),
                  Color(0xFFFFE8F5),
                  Color(0xFFE8F4FF),
                  Color(0xFFECFDF5),
                  Color(0xFFFFFBEB),
                  Color(0xFFFFFFFF),
                ],
                stops: [0.0, 0.22, 0.48, 0.72, 0.88, 1.0],
              ),
            ),
          ),
        ),
        // Animated Blobs
        _buildBlob(
          controller: _controllers[0],
          top: -0.14,
          right: -0.08,
          height: 0.58,
          width: 0.78,
          color: const Color(0xFFFB7185),
          opacity: 0.38,
        ),
        _buildBlob(
          controller: _controllers[1],
          top: 0.22,
          left: -0.16,
          height: 0.52,
          width: 0.72,
          color: const Color(0xFF60A5FA),
          opacity: 0.34,
        ),
        _buildBlob(
          controller: _controllers[2],
          bottom: -0.10,
          right: 0.04,
          height: 0.48,
          width: 0.68,
          color: const Color(0xFF4ADE80),
          opacity: 0.32,
        ),
        _buildBlob(
          controller: _controllers[3],
          top: 0.48,
          left: 0.28,
          height: 0.38,
          width: 0.52,
          color: const Color(0xFFFBBF24),
          opacity: 0.28,
        ),
        // Top radial highlight
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0, -1.12),
                radius: 1.0,
                colors: [
                  Color.fromRGBO(255, 255, 255, 0.72),
                  Colors.transparent,
                ],
                stops: [0.0, 0.55],
              ),
            ),
          ),
        ),
        // Dot Pattern Placeholder (Can be implemented with a CustomPainter for better performance)
        Positioned.fill(
          child: Opacity(
            opacity: 0.35,
            child: CustomPaint(
              painter: DotPainter(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBlob({
    required AnimationController controller,
    double? top,
    double? left,
    double? right,
    double? bottom,
    required double height,
    required double width,
    required Color color,
    required double opacity,
  }) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        final double t = controller.value;
        // Simple wave motion approximation
        final double xOffset = 24 * (t - 0.5);
        final double yOffset = -18 * (t - 0.5);
        final double scale = 1.0 + 0.08 * (t - 0.5);

        return Positioned(
          top: top != null ? MediaQuery.of(context).size.height * top + yOffset : null,
          left: left != null ? MediaQuery.of(context).size.width * left + xOffset : null,
          right: right != null ? MediaQuery.of(context).size.width * right - xOffset : null,
          bottom: bottom != null ? MediaQuery.of(context).size.height * bottom - yOffset : null,
          child: Transform.scale(
            scale: scale,
            child: Container(
              height: MediaQuery.of(context).size.height * height,
              width: MediaQuery.of(context).size.width * width,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    color.withOpacity(opacity),
                    color.withOpacity(opacity * 0.5),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.4, 0.72],
                ),
              ),
              child: BackdropFilter(
                filter: ColorFilter.mode(
                  Colors.white.withOpacity(0.0),
                  BlendMode.dstATop,
                ),
                child: Container(
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class DotPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color.fromRGBO(255, 255, 255, 0.85)
      ..strokeWidth = 1.0;

    const double spacing = 26.0;
    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 0.5, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
