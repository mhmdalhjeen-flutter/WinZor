import 'package:flutter/material.dart';

const _badgePalette = [
  (bg: Color(0xFFECFDF5), fg: Color(0xFF047857), border: Color(0xFFBBF7D0)),
  (bg: Color(0xFFEFF6FF), fg: Color(0xFF1D4ED8), border: Color(0xFFBFDBFE)),
  (bg: Color(0xFFF5F3FF), fg: Color(0xFF6D28D9), border: Color(0xFFDDD6FE)),
  (bg: Color(0xFFFFFBEB), fg: Color(0xFFB45309), border: Color(0xFFFDE68A)),
];

/// Section title with optional colored filter badges.
/// Example: العروض في: [غزة] - [الرمال] - [الملابس]
class FilterTitleHeader extends StatelessWidget {
  final String title;
  final IconData? icon;
  final Color? iconColor;
  final List<String> filterLabels;
  final VoidCallback? onClear;

  const FilterTitleHeader({
    super.key,
    required this.title,
    this.icon,
    this.iconColor,
    this.filterLabels = const [],
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final hasFilters = filterLabels.isNotEmpty;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: iconColor, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    hasFilters ? '$title في:' : title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
              if (hasFilters) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    for (var i = 0; i < filterLabels.length; i++) ...[
                      if (i > 0)
                        const Text(
                          '-',
                          style: TextStyle(
                            color: Color(0xFF9CA3AF),
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                      _FilterBadge(
                        label: filterLabels[i],
                        palette: _badgePalette[i % _badgePalette.length],
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
        if (hasFilters && onClear != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: GestureDetector(
              onTap: onClear,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F3FF),
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: const Color(0xFFDDD6FE)),
                ),
                child: const Text(
                  'إلغاء الفلترة',
                  style: TextStyle(
                    color: Color(0xFF7C3AED),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _FilterBadge extends StatelessWidget {
  final String label;
  final ({Color bg, Color fg, Color border}) palette;

  const _FilterBadge({required this.label, required this.palette});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: palette.bg,
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: palette.border),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: palette.fg,
          fontSize: 11,
          fontWeight: FontWeight.w900,
          fontFamily: 'Cairo',
        ),
      ),
    );
  }
}
