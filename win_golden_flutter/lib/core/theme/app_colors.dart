import 'package:flutter/material.dart';

class AppColors {
  // Primary colors
  static const Color primary = Color(0xFFB91C1C);
  static const Color primaryLight = Color(0xFFEF4444);
  static const Color primaryDark = Color(0xFF7F1D1D);

  // Rank colors
  static const Color bronze = Color(0xFFCD7F32);
  static const Color silver = Color(0xFFC0C0C0);
  static const Color gold = Color(0xFFFFD700);
  static const Color platinum = Color(0xFFE5E4E2);

  // Background colors
  static const Color bgSoft = Color(0xFFF9FAFB);
  static const Color bgCard = Color(0xFFFFFFFF);
  
  // Text colors
  static const Color textMain = Color(0xFF111827); // gray-900
  static const Color textSecondary = Color(0xFF4B5563); // gray-600
  static const Color textMuted = Color(0xFF9CA3AF); // gray-400

  // Neutral colors
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray200 = Color(0xFFE5E7EB);
  
  // Custom Gradients from index.css
  static const List<Color> bodyGradient = [
    Color(0xFFF8F6F3),
    Color(0xFFF3F1EE),
    Color(0xFFFAF9F7),
    Color(0xFFF0EEEB),
  ];

  static const List<Color> homeHeroGradient = [
    Color(0xFFFDF4FF),
    Color(0xFFFEF3C7),
    Color(0xFFFCE7F3),
  ];
}
