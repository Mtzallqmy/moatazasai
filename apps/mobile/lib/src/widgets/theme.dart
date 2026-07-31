import 'package:flutter/material.dart';

/// نظام تصميم هادئ فيروزي يدعم الوضع الفاتح والداكن.
class MoatazTheme {
  static const _brand = Color(0xFF087D75);
  static const _brandSoft = Color(0xFFDDF5F1);

  static ThemeData light() => ThemeData(
        useMaterial3: true,
        fontFamily: 'Noto Sans Arabic',
        fontFamilyFallback: const ['Noto Kufi Arabic', 'sans-serif'],
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(
          seedColor: _brand,
          brightness: Brightness.light,
          surface: const Color(0xFFF5F8F8),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F8F8),
        cardTheme: const CardThemeData(
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(18)),
            side: BorderSide(color: Color(0xFFDDE4ED)),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: _brand,
            foregroundColor: Colors.white,
          ),
        ),
      );

  static ThemeData dark() => ThemeData(
        useMaterial3: true,
        fontFamily: 'Noto Sans Arabic',
        fontFamilyFallback: const ['Noto Kufi Arabic', 'sans-serif'],
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: _brand,
          brightness: Brightness.dark,
          surface: const Color(0xFF18242A),
        ),
        scaffoldBackgroundColor: const Color(0xFF0E1820),
        cardTheme: CardThemeData(
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: const BorderRadius.all(Radius.circular(18)),
            side: BorderSide(color: const Color(0xFF2C3C44)),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: _brand,
            foregroundColor: Colors.white,
          ),
        ),
      );
}
