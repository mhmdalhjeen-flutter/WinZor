import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MarketplaceTabConfig {
  final String id;
  final IconData icon;
  final String label;
  final List<String>? types;
  final Color activeBg;
  final Color activeText;
  final Color iconColor;
  final Color iconBg;

  const MarketplaceTabConfig({
    required this.id,
    required this.icon,
    required this.label,
    this.types,
    required this.activeBg,
    required this.activeText,
    required this.iconColor,
    required this.iconBg,
  });
}

final Map<String, MarketplaceTabConfig> marketplaceTabs = {
  'sellExchange': const MarketplaceTabConfig(
    id: 'sellExchange',
    icon: LucideIcons.shoppingCart,
    label: 'شراء / بدل',
    types: ['sell', 'exchange'],
    activeBg: Color(0xFFECFDF5),
    activeText: Color(0xFF047857),
    iconColor: Color(0xFF059669),
    iconBg: Color(0xFFD1FAE5),
  ),
  'rent': const MarketplaceTabConfig(
    id: 'rent',
    icon: LucideIcons.home,
    label: 'إيجار',
    types: ['rent'],
    activeBg: Color(0xFFEFF6FF),
    activeText: Color(0xFF1D4ED8),
    iconColor: Color(0xFF2563EB),
    iconBg: Color(0xFFDBEAFE),
  ),
  'wanted': const MarketplaceTabConfig(
    id: 'wanted',
    icon: LucideIcons.megaphone,
    label: 'مطلوب',
    types: ['custom'],
    activeBg: Color(0xFFFFF7ED),
    activeText: Color(0xFFC2410C),
    iconColor: Color(0xFFEA580C),
    iconBg: Color(0xFFFFEDD5),
  ),
  'favorites': const MarketplaceTabConfig(
    id: 'favorites',
    icon: LucideIcons.heart,
    label: 'المفضلة',
    activeBg: Color(0xFFFFF1F2),
    activeText: Color(0xFFBE123C),
    iconColor: Color(0xFFF43F5E),
    iconBg: Color(0xFFFFE4E6),
  ),
  'mine': const MarketplaceTabConfig(
    id: 'mine',
    icon: LucideIcons.clipboardList,
    label: 'منشوراتي',
    activeBg: Color(0xFFF5F3FF),
    activeText: Color(0xFF6D28D9),
    iconColor: Color(0xFF7C3AED),
    iconBg: Color(0xFFEDE9FE),
  ),
};

class MarketplaceTabNav extends StatelessWidget {
  final String activeTab;
  final Function(String) onTabChange;

  const MarketplaceTabNav({
    super.key,
    required this.activeTab,
    required this.onTabChange,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6))),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        child: Row(
          children: marketplaceTabs.values.map((tab) {
            final bool isActive = activeTab == tab.id;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: GestureDetector(
                onTap: () => onTabChange(tab.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  minWidth: 70,
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  decoration: BoxDecoration(
                    color: isActive ? tab.activeBg : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    border: isActive ? Border.all(color: tab.activeText.withOpacity(0.2)) : null,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isActive ? Colors.white : tab.iconBg,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: isActive ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))] : null,
                        ),
                        child: Icon(
                          tab.icon,
                          size: 20,
                          color: tab.iconColor,
                          fill: (tab.id == 'favorites' && isActive) ? 1.0 : 0.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        tab.label,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: isActive ? tab.activeText : const Color(0xFF6B7280),
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
