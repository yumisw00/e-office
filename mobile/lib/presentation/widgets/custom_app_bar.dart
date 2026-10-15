import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CustomAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;

  const CustomAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final canPop = Navigator.canPop(context);

    Widget? effectiveLeading = leading;
    if (effectiveLeading == null && canPop) {
      effectiveLeading = IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded),
        onPressed: () {
          HapticFeedback.lightImpact();
          context.pop();
        },
      );
    }

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: AppBar(
          leading: effectiveLeading,
          title: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: isDark
              ? theme.colorScheme.surface.withValues(alpha: 0.05)
              : Colors.white.withValues(alpha: 0.08),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1.0),
            child: Container(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.black.withValues(alpha: 0.04),
              height: 1.0,
            ),
          ),
          actions: actions ?? [
            IconButton(
              icon: const Icon(Icons.notifications_none_rounded),
              onPressed: () {
                HapticFeedback.lightImpact();
                context.push('/notifications');
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }
}
