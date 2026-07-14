import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class StarRating extends StatelessWidget {
  final double ratingAvg;
  final int ratingCount;
  final bool compact;
  final double starSize;

  const StarRating({
    super.key,
    required this.ratingAvg,
    required this.ratingCount,
    this.compact = false,
    this.starSize = 16,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: List.generate(5, (index) {
            return Icon(
              LucideIcons.star,
              size: starSize,
              color: index < ratingAvg ? Colors.amber : Colors.grey.shade300,
              fill: index < ratingAvg ? 1.0 : 0.0,
            );
          }),
        ),
        if (!compact) ...[
          const SizedBox(width: 8),
          Text(
            '${ratingAvg.toStringAsFixed(1)} ($ratingCount)',
            style: TextStyle(
              fontSize: starSize * 0.75,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ],
    );
  }
}
