import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final double borderWidth;
  // isTranslucent dipertahankan sebagai parameter agar tidak perlu ubah semua
  // caller, namun BackdropFilter dihapus — gunakan warna solid mendekati
  // frosted glass tanpa overhead GPU compositing layer.
  final bool isTranslucent;

  const CustomCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
    this.margin,
    this.borderRadius = 20.0,
    this.onTap,
    this.color,
    this.borderColor,
    this.borderWidth = 1.0,
    this.isTranslucent = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // isTranslucent: warna solid (alpha 1.0) agar tidak memunculkan compositing
    // layer. Efek "frosted" dicapai dengan warna yang sedikit lebih cerah/gelap
    // dari surface tanpa membutuhkan BackdropFilter.blur.
    final effectiveColor = color ??
        (isTranslucent
            ? (isDark
                ? theme.colorScheme.surfaceContainerHigh
                : Colors.white)
            : theme.colorScheme.surface);

    final effectiveBorderColor = borderColor ??
        (isDark
            ? Colors.white.withValues(alpha: 0.12)
            : theme.colorScheme.outlineVariant.withValues(alpha: 0.35));

    Widget content = Padding(
      padding: padding ?? const EdgeInsets.all(16.0),
      child: child,
    );

    if (onTap != null) {
      content = InkWell(
        borderRadius: BorderRadius.circular(borderRadius),
        splashColor: theme.colorScheme.primary.withValues(alpha: 0.12),
        highlightColor: theme.colorScheme.primary.withValues(alpha: 0.06),
        onTap: () {
          HapticHelper.lightImpact();
          onTap!();
        },
        child: content,
      );
    }

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: effectiveColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: effectiveBorderColor,
          width: borderWidth,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius),
        child: content,
      ),
    );
  }
}
