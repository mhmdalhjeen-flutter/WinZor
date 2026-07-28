import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class PointsOptionsMenu extends StatelessWidget {
  final VoidCallback onSupport;
  final VoidCallback onSuggest;
  final VoidCallback onPrefs;
  final VoidCallback onAbout;

  const PointsOptionsMenu({
    super.key,
    required this.onSupport,
    required this.onSuggest,
    required this.onPrefs,
    required this.onAbout,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      _MenuItem(
        icon: LucideIcons.history,
        label: 'الطلبات السابقة',
        color: const Color(0xFF6366F1),
        onTap: () => context.push('/orders/history'),
      ),
      _MenuItem(
        icon: LucideIcons.headphones,
        label: 'الدعم الفني',
        color: const Color(0xFF0EA5E9),
        onTap: onSupport,
      ),
      _MenuItem(
        icon: LucideIcons.lightbulb,
        label: 'قدم اقتراحاً',
        color: const Color(0xFFF59E0B),
        onTap: onSuggest,
      ),
      _MenuItem(
        icon: LucideIcons.slidersHorizontal,
        label: 'تخصيص أفضل العروض',
        color: const Color(0xFF8B5CF6),
        onTap: onPrefs,
      ),
      _MenuItem(
        icon: LucideIcons.settings,
        label: 'الإعدادات',
        color: const Color(0xFF475569),
        onTap: () => context.push('/settings'),
      ),
      _MenuItem(
        icon: LucideIcons.info,
        label: 'عن التطبيق',
        color: const Color(0xFF059669),
        onTap: onAbout,
      ),
    ];

    return Column(
      children: items.map((item) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          child: Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: item.onTap,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: item.color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Icon(item.icon, color: item.color, size: 17),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        item.label,
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const Icon(LucideIcons.chevronLeft, color: Color(0xFFD1D5DB), size: 16),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}
