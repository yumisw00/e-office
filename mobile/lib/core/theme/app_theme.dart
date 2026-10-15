import 'package:flutter/material.dart';
import 'package:flex_color_scheme/flex_color_scheme.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    final baseData = FlexThemeData.light(
      colors: const FlexSchemeColor(
        primary: AppColors.primary,
        primaryContainer: Color(0xFFC0EBF0),
        secondary: Color(0xFF006B76),
        secondaryContainer: Color(0xFFA1EFFF),
        tertiary: Color(0xFF006B76),
        tertiaryContainer: Color(0xFFA1EFFF),
        appBarColor: AppColors.primary,
        error: AppColors.error,
      ),
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 7,
      subThemesData: const FlexSubThemesData(
        blendOnLevel: 10,
        blendOnColors: false,
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        alignedDropdown: true,
        useInputDecoratorThemeInDialogs: true,
        defaultRadius: 20.0,
        cardRadius: 20.0,
        dialogRadius: 24.0,
        bottomSheetRadius: 28.0,
        inputDecoratorBorderType: FlexInputBorderType.outline,
        inputDecoratorUnfocusedBorderIsColored: false,
      ),
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      useMaterial3: true,
      swapColors: false,
      scaffoldBackground: AppColors.surface,
    );

    return baseData.copyWith(
      cardTheme: baseData.cardTheme.copyWith(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.0),
          side: BorderSide(
            color: baseData.colorScheme.outlineVariant.withValues(alpha: 0.35),
            width: 1.0,
          ),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    final baseData = FlexThemeData.dark(
      scheme: FlexScheme.deepBlue,
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 13,
      subThemesData: const FlexSubThemesData(
        blendOnLevel: 20,
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        alignedDropdown: true,
        useInputDecoratorThemeInDialogs: true,
        defaultRadius: 20.0,
        cardRadius: 20.0,
        dialogRadius: 24.0,
        bottomSheetRadius: 28.0,
        inputDecoratorBorderType: FlexInputBorderType.outline,
      ),
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      useMaterial3: true,
    );

    return baseData.copyWith(
      cardTheme: baseData.cardTheme.copyWith(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.0),
          side: BorderSide(
            color: Colors.white.withValues(alpha: 0.12),
            width: 1.0,
          ),
        ),
      ),
    );
  }
}
