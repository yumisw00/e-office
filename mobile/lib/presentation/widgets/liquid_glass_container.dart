import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:figma_squircle/figma_squircle.dart';
import '../../domain/providers/liquid_glass_provider.dart';

class LiquidGlassContainer extends ConsumerWidget {
  final Widget child;
  final double borderRadius;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;

  const LiquidGlassContainer({
    super.key,
    required this.child,
    this.borderRadius = 16.0,
    this.width,
    this.height,
    this.padding,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isGlass = ref.watch(liquidGlassProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (!isGlass) {
      // Fallback: Plain Solid Container
      return RepaintBoundary(
        child: Container(
          width: width,
          height: height,
          padding: padding,
          decoration: ShapeDecoration(
            color: theme.colorScheme.surface,
            shape: SmoothRectangleBorder(
              borderRadius: SmoothBorderRadius(
                cornerRadius: borderRadius,
                cornerSmoothing: 1.0,
              ),
              side: BorderSide(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
                width: 1.0,
              ),
            ),
          ),
          child: child,
        ),
      );
    }

    // Liquid Glass Effect
    return RepaintBoundary(
      child: ClipSmoothRect(
        radius: SmoothBorderRadius(
          cornerRadius: borderRadius,
          cornerSmoothing: 1.0,
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            width: width,
            height: height,
            decoration: ShapeDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  isDark ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.6),
                  isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.1),
                ],
              ),
              shape: SmoothRectangleBorder(
                borderRadius: SmoothBorderRadius(
                  cornerRadius: borderRadius,
                  cornerSmoothing: 1.0,
                ),
              ),
            ),
            padding: const EdgeInsets.all(1.0), // 1px border thickness
            child: Container(
              padding: padding,
              decoration: ShapeDecoration(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.2)
                    : Colors.white.withValues(alpha: 0.15),
                shape: SmoothRectangleBorder(
                  borderRadius: SmoothBorderRadius(
                    // Inner radius should be slightly smaller, but since it's 1px it's barely noticeable. 
                    cornerRadius: borderRadius > 1.0 ? borderRadius - 1.0 : borderRadius,
                    cornerSmoothing: 1.0,
                  ),
                ),
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
