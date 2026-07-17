import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/product_providers.dart';

/// Interactive stars — React `StarRating.jsx` for product target.
class ProductStarRating extends ConsumerStatefulWidget {
  final String productId;
  final double ratingAvg;
  final int ratingCount;

  const ProductStarRating({
    super.key,
    required this.productId,
    required this.ratingAvg,
    required this.ratingCount,
  });

  @override
  ConsumerState<ProductStarRating> createState() => _ProductStarRatingState();
}

class _ProductStarRatingState extends ConsumerState<ProductStarRating> {
  int? _myStars;
  double _avg = 0;
  int _count = 0;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _avg = widget.ratingAvg;
    _count = widget.ratingCount;
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadMine());
  }

  @override
  void didUpdateWidget(covariant ProductStarRating oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.ratingAvg != widget.ratingAvg) _avg = widget.ratingAvg;
    if (oldWidget.ratingCount != widget.ratingCount) _count = widget.ratingCount;
    if (oldWidget.productId != widget.productId) _loadMine();
  }

  Future<void> _loadMine() async {
    try {
      final result =
          await ref.read(productRepositoryProvider).getMyRating(widget.productId);
      if (!mounted) return;
      setState(() {
        _myStars = result.myStars;
        if (result.ratingAvg != null) _avg = result.ratingAvg!;
        if (result.ratingCount != null) _count = result.ratingCount!;
      });
    } catch (_) {}
  }

  Future<void> _submit(int stars) async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      final result = await ref
          .read(productRepositoryProvider)
          .submitRating(widget.productId, stars);
      if (!mounted) return;
      setState(() {
        _myStars = stars;
        _avg = result.ratingAvg;
        _count = result.ratingCount;
      });
    } catch (_) {
      /* ignore — matches React */
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final display = _myStars ?? 0;
    return Row(
      children: [
        Row(
          children: List.generate(5, (i) {
            final n = i + 1;
            final filled = n <= display;
            return InkWell(
              onTap: _saving ? null : () => _submit(n),
              borderRadius: BorderRadius.circular(4),
              child: Padding(
                padding: const EdgeInsets.all(2),
                child: Icon(
                  LucideIcons.star,
                  size: 22,
                  color: filled ? Colors.amber : Colors.grey.shade300,
                  fill: filled ? 1.0 : 0.0,
                ),
              ),
            );
          }),
        ),
        const SizedBox(width: 8),
        Text(
          '${_avg > 0 ? _avg.toStringAsFixed(1) : '—'} ($_count)',
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            fontFamily: 'Cairo',
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }
}
