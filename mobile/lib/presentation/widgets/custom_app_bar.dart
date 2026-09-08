import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/theme_provider.dart';
import '../../domain/providers/locale_provider.dart';
import '../../domain/providers/liquid_glass_provider.dart';
import '../../core/localization/app_localizations.dart';
import 'liquid_glass_container.dart';

class CustomAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final Widget? title;
  final Widget? leading;
  final bool centerTitle;

  const CustomAppBar({
    super.key,
    this.title,
    this.leading,
    this.centerTitle = true,
  });

  void _showSettingsBottomSheet(BuildContext context, WidgetRef ref) {
    final localizations = AppLocalizations.of(context);
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      elevation: 0,
      builder: (context) {
        return LiquidGlassContainer(
          borderRadius: 32, // More rounded for bottom sheet
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                localizations.get('select_theme'),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              // Liquid Glass Toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Efek Kaca Liquid',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Consumer(
                    builder: (context, ref, child) {
                      final isGlass = ref.watch(liquidGlassProvider);
                      return Switch(
                        value: isGlass,
                        onChanged: (value) {
                          ref.read(liquidGlassProvider.notifier).toggle();
                        },
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Theme Selector
              Consumer(
                builder: (context, ref, child) {
                  final themeMode = ref.watch(themeProvider);
                  return SegmentedButton<ThemeMode>(
                    segments: [
                      ButtonSegment(
                        value: ThemeMode.light,
                        icon: const Icon(Icons.light_mode),
                        label: Text(localizations.get('light')),
                      ),
                      ButtonSegment(
                        value: ThemeMode.dark,
                        icon: const Icon(Icons.dark_mode),
                        label: Text(localizations.get('dark')),
                      ),
                      ButtonSegment(
                        value: ThemeMode.system,
                        icon: const Icon(Icons.settings_brightness),
                        label: Text(localizations.get('system')),
                      ),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (Set<ThemeMode> newSelection) {
                      ref.read(themeProvider.notifier).setThemeMode(newSelection.first);
                    },
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final localizations = AppLocalizations.of(context);

    return AppBar(
      title: title,
      leading: leading,
      centerTitle: centerTitle,
      elevation: 0,
      backgroundColor: Colors.transparent, // Required for global glass effect to bleed through
      actions: [
        // Language Picker
        PopupMenuButton<Locale>(
          icon: const Icon(Icons.translate),
          tooltip: localizations.get('select_language'),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          onSelected: (Locale newLocale) {
            ref.read(localeProvider.notifier).setLocale(newLocale);
          },
          itemBuilder: (BuildContext context) => <PopupMenuEntry<Locale>>[
            PopupMenuItem<Locale>(
              value: const Locale('en'),
              child: Row(
                children: [
                  const Text('🇺🇸 '),
                  const SizedBox(width: 8),
                  Text(
                    localizations.get('english'),
                    style: TextStyle(
                      fontWeight: locale.languageCode == 'en' ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  if (locale.languageCode == 'en') ...[
                    const Spacer(),
                    Icon(Icons.check, size: 16, color: Theme.of(context).colorScheme.primary),
                  ]
                ],
              ),
            ),
            PopupMenuItem<Locale>(
              value: const Locale('id'),
              child: Row(
                children: [
                  const Text('🇮🇩 '),
                  const SizedBox(width: 8),
                  Text(
                    localizations.get('indonesia'),
                    style: TextStyle(
                      fontWeight: locale.languageCode == 'id' ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  if (locale.languageCode == 'id') ...[
                    const Spacer(),
                    Icon(Icons.check, size: 16, color: Theme.of(context).colorScheme.primary),
                  ]
                ],
              ),
            ),
          ],
        ),
        // Theme / Settings Picker
        IconButton(
          icon: const Icon(Icons.settings_outlined),
          tooltip: localizations.get('select_theme'),
          onPressed: () => _showSettingsBottomSheet(context, ref),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
