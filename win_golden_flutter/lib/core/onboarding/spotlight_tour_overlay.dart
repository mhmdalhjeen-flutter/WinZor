import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'onboarding_steps.dart';

const _pad = 10.0;
const _tooltipGap = 14.0;

Rect? measureTargetRect(GlobalKey key, {double pad = _pad}) {
  final ctx = key.currentContext;
  if (ctx == null) return null;
  final box = ctx.findRenderObject();
  if (box is! RenderBox || !box.hasSize) return null;

  final offset = box.localToGlobal(Offset.zero);
  final size = box.size;
  return Rect.fromLTWH(
    offset.dx - pad,
    offset.dy - pad,
    size.width + pad * 2,
    size.height + pad * 2,
  );
}

Future<void> scrollTargetIntoView(GlobalKey key) async {
  final ctx = key.currentContext;
  if (ctx == null) return;
  await Scrollable.ensureVisible(
    ctx,
    duration: const Duration(milliseconds: 420),
    curve: Curves.easeOutCubic,
    alignment: 0.35,
  );
}

class SpotlightTourOverlay extends StatefulWidget {
  final bool open;
  final OnboardingStep step;
  final int stepIndex;
  final int totalSteps;
  final VoidCallback onNext;
  final VoidCallback onPrev;
  final VoidCallback onSkip;
  final VoidCallback onFinish;

  const SpotlightTourOverlay({
    super.key,
    required this.open,
    required this.step,
    required this.stepIndex,
    required this.totalSteps,
    required this.onNext,
    required this.onPrev,
    required this.onSkip,
    required this.onFinish,
  });

  @override
  State<SpotlightTourOverlay> createState() => _SpotlightTourOverlayState();
}

class _SpotlightTourOverlayState extends State<SpotlightTourOverlay>
    with SingleTickerProviderStateMixin {
  Rect? _hole;
  Offset _tooltipOffset = Offset.zero;
  double _tooltipMaxWidth = 320;
  late final AnimationController _fade;

  bool get _isFirst => widget.stepIndex <= 0;
  bool get _isLast => widget.stepIndex >= widget.totalSteps - 1;

  @override
  void initState() {
    super.initState();
    _fade = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    if (widget.open) _fade.forward();
  }

  @override
  void didUpdateWidget(SpotlightTourOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.open && !oldWidget.open) {
      _fade.forward(from: 0);
    } else if (!widget.open && oldWidget.open) {
      _fade.reverse();
    }
    if (widget.open &&
        (widget.stepIndex != oldWidget.stepIndex ||
            widget.step.id != oldWidget.step.id)) {
      _scheduleMeasure();
    }
  }

  @override
  void dispose() {
    _fade.dispose();
    super.dispose();
  }

  void _scheduleMeasure() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _measure());
    Future<void>.delayed(const Duration(milliseconds: 420), () {
      if (mounted && widget.open) _measure();
    });
  }

  Future<void> _prepareAndMeasure() async {
    if (widget.step.scrollToTarget) {
      await scrollTargetIntoView(widget.step.targetKey);
    }
    if (!mounted) return;
    _measure();
  }

  void _measure() {
    if (!widget.open) return;

    final media = MediaQuery.of(context);
    final screen = media.size;
    final raw = measureTargetRect(widget.step.targetKey);
    if (raw == null) {
      setState(() => _hole = null);
      return;
    }

    final hole = Rect.fromLTWH(
      raw.left.clamp(_pad, screen.width - _pad),
      raw.top.clamp(media.padding.top + _pad, screen.height - _pad),
      raw.width.clamp(24, screen.width - _pad * 2),
      raw.height.clamp(24, screen.height - _pad * 2),
    );

    final tooltipW = (screen.width - 24).clamp(260.0, 320.0);
    final spaceBelow = screen.height - (hole.top + hole.height);
    final placeBelow = spaceBelow > 180 || hole.top < screen.height / 2;
    final tooltipH = 200.0;
    final top = placeBelow
        ? hole.top + hole.height + _tooltipGap
        : hole.top - _tooltipGap - tooltipH;
    final left = (hole.left + hole.width / 2 - tooltipW / 2)
        .clamp(12.0, screen.width - tooltipW - 12.0);

    setState(() {
      _hole = hole;
      _tooltipOffset = Offset(left, top.clamp(12.0, screen.height - tooltipH - 12));
      _tooltipMaxWidth = tooltipW;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.open) return const SizedBox.shrink();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && widget.open && _hole == null) _prepareAndMeasure();
    });

    return Directionality(
      textDirection: TextDirection.rtl,
      child: FadeTransition(
        opacity: CurvedAnimation(parent: _fade, curve: Curves.easeOut),
        child: Material(
          type: MaterialType.transparency,
          child: Stack(
            children: [
              Positioned.fill(
                child: GestureDetector(
                  onTap: widget.onSkip,
                  child: CustomPaint(
                    painter: _SpotlightPainter(hole: _hole),
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
              if (_hole != null)
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 320),
                  curve: Curves.easeOutCubic,
                  left: _hole!.left,
                  top: _hole!.top,
                  width: _hole!.width,
                  height: _hole!.height,
                  child: IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.95),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF7C3AED).withOpacity(0.35),
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              AnimatedPositioned(
                duration: const Duration(milliseconds: 320),
                curve: Curves.easeOutCubic,
                left: _tooltipOffset.dx,
                top: _tooltipOffset.dy,
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: _tooltipMaxWidth),
                  child: _TourCard(
                    step: widget.step,
                    stepIndex: widget.stepIndex,
                    totalSteps: widget.totalSteps,
                    isFirst: _isFirst,
                    isLast: _isLast,
                    onNext: widget.onNext,
                    onPrev: widget.onPrev,
                    onSkip: widget.onSkip,
                    onFinish: widget.onFinish,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpotlightPainter extends CustomPainter {
  final Rect? hole;

  _SpotlightPainter({required this.hole});

  @override
  void paint(Canvas canvas, Size size) {
    final overlay = Paint()..color = Colors.black.withOpacity(0.62);
    final path = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));

    if (hole != null) {
      path.addRRect(
        RRect.fromRectAndRadius(hole!, const Radius.circular(14)),
      );
      path.fillType = PathFillType.evenOdd;
    }

    canvas.drawPath(path, overlay);
  }

  @override
  bool shouldRepaint(covariant _SpotlightPainter oldDelegate) {
    return oldDelegate.hole != hole;
  }
}

class _TourCard extends StatelessWidget {
  final OnboardingStep step;
  final int stepIndex;
  final int totalSteps;
  final bool isFirst;
  final bool isLast;
  final VoidCallback onNext;
  final VoidCallback onPrev;
  final VoidCallback onSkip;
  final VoidCallback onFinish;

  const _TourCard({
    required this.step,
    required this.stepIndex,
    required this.totalSteps,
    required this.isFirst,
    required this.isLast,
    required this.onNext,
    required this.onPrev,
    required this.onSkip,
    required this.onFinish,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.18),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${stepIndex + 1} / $totalSteps',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF7C3AED),
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        step.title,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: onSkip,
                  tooltip: 'تخطي الجولة',
                  icon: const Icon(LucideIcons.x, size: 18, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              step.body,
              style: const TextStyle(
                fontSize: 13,
                height: 1.45,
                color: Color(0xFF4B5563),
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                TextButton(
                  onPressed: onSkip,
                  child: const Text(
                    'تخطي',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ),
                const Spacer(),
                if (!isFirst)
                  OutlinedButton.icon(
                    onPressed: onPrev,
                    icon: const Icon(Icons.chevron_right, size: 18),
                    label: const Text(
                      'السابق',
                      style: TextStyle(fontWeight: FontWeight.w800, fontFamily: 'Cairo'),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF374151),
                      side: const BorderSide(color: Color(0xFFE5E7EB)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                if (!isFirst) const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: isLast ? onFinish : onNext,
                  icon: Icon(isLast ? LucideIcons.check : Icons.chevron_left, size: 18),
                  label: Text(
                    isLast ? 'إنهاء' : 'التالي',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
