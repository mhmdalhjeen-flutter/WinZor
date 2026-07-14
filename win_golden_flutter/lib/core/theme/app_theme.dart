import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        surface: AppColors.bgCard,
        background: AppColors.bgSoft,
      ),
      scaffoldBackgroundColor: AppColors.bgSoft,
      
      // Typography mapping
      // h1, h2, h3, h4, h5, h6 -> Cairo
      // body -> Tajawal
      textTheme: GoogleFonts.tajawalTextTheme().copyWith(
        displayLarge: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        displayMedium: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        displaySmall: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        headlineLarge: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        headlineMedium: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        headlineSmall: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        titleLarge: GoogleFonts.cairo(
          fontWeight: FontWeight.w900,
          color: AppColors.textMain,
        ),
        titleMedium: GoogleFonts.cairo(
          fontWeight: FontWeight.w800,
          color: AppColors.textMain,
        ),
        titleSmall: GoogleFonts.cairo(
          fontWeight: FontWeight.w700,
          color: AppColors.textMain,
        ),
        bodyLarge: GoogleFonts.tajawal(
          fontWeight: FontWeight.w400,
          color: AppColors.textMain,
        ),
        bodyMedium: GoogleFonts.tajawal(
          fontWeight: FontWeight.w400,
          color: AppColors.textMain,
        ),
        labelLarge: GoogleFonts.tajawal(
          fontWeight: FontWeight.w700,
          color: AppColors.textMain,
        ),
      ),

      // Button Styles
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.cairo(
            fontWeight: FontWeight.w900,
            fontSize: 14,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16), // rounded-2xl is usually 1rem/16px
          ),
          elevation: 0,
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        hintStyle: GoogleFonts.tajawal(
          color: AppColors.textMuted,
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
      ),

      // Card Theme
      cardTheme: CardTheme(
        color: AppColors.bgCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24), // matching .marketplace-offer-card__media
          side: const BorderSide(color: Color(0x0F000000)), // rgba(0,0,0,0.06)
        ),
      ),

      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.gray200,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
