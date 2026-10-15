import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
              width: 1.0,
            ),
          ),
          child: child,
        ),
      );
    }

    // Liquid Glass Effect
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  isDark ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.6),
                  isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(borderRadius),
            ),
            padding: const EdgeInsets.all(1.0), // 1px border thickness
            child: Container(
              padding: padding,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.2)
                    : Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(
                  borderRadius > 1.0 ? borderRadius - 1.0 : borderRadius,
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
