import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/theme_provider.dart';

class CustomAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String title;
  final bool showLogout;
  final VoidCallback? onLogoutPressed;

  const CustomAppBar({
    super.key,
    required this.title,
    this.showLogout = false,
    this.onLogoutPressed,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppBar(
      title: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
      ),
      centerTitle: true,
      elevation: 0,
      backgroundColor: Theme.of(context).colorScheme.surface,
      actions: [
        if (showLogout && onLogoutPressed != null)
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            color: Theme.of(context).colorScheme.error,
            onPressed: onLogoutPressed,
          ),
        const SizedBox(width: 8),
      ],
    );
  }
}
