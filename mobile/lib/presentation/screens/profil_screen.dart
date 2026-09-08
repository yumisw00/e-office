import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/theme_provider.dart';
import '../../domain/providers/locale_provider.dart';
import '../../core/localization/app_localizations.dart';

class ProfilScreen extends ConsumerWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);
    final localizations = AppLocalizations.of(context);
    final theme = Theme.of(context);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Profile Header Card
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Stack(
                    children: [
                      Hero(
                        tag: 'profile_avatar',
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: theme.colorScheme.primaryContainer,
                          child: Icon(
                            Icons.person_rounded,
                            size: 56,
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Bpk. Budi Santoso',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Direktur Utama',
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          )
              .animate()
              .fade(duration: 400.ms, curve: Curves.easeOutCubic)
              .scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1), duration: 400.ms, curve: Curves.easeOutCubic),
          const SizedBox(height: 24),

          // Settings Section Title
          Text(
            localizations.get('account_settings'),
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: theme.colorScheme.primary,
              letterSpacing: 0.8,
            ),
          ).animate().fade(delay: 100.ms),
          const SizedBox(height: 12),

          // Settings Items
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4)),
            ),
            child: ListView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                // Theme Setting Option
                ListTile(
                  leading: Icon(
                    themeMode == ThemeMode.light
                        ? Icons.light_mode_outlined
                        : themeMode == ThemeMode.dark
                            ? Icons.dark_mode_outlined
                            : Icons.settings_brightness_outlined,
                    color: theme.colorScheme.primary,
                  ),
                  title: Text(localizations.get('theme')),
                  subtitle: Text(
                    themeMode == ThemeMode.light
                        ? localizations.get('light')
                        : themeMode == ThemeMode.dark
                            ? localizations.get('dark')
                            : localizations.get('system'),
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => _showThemePicker(context, ref, localizations),
                ),
                const Divider(height: 1, indent: 56),
                // Language Setting Option
                ListTile(
                  leading: Icon(Icons.language_rounded, color: theme.colorScheme.primary),
                  title: Text(localizations.get('language')),
                  subtitle: Text(
                    locale.languageCode == 'en'
                        ? localizations.get('english')
                        : localizations.get('indonesia'),
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => _showLanguagePicker(context, ref, localizations),
                ),
              ],
            ),
          ).animate().fade(delay: 150.ms).slideY(begin: 0.1, end: 0, delay: 150.ms),

          const SizedBox(height: 32),

          // Logout Button
          FilledButton.tonalIcon(
            onPressed: () => _showLogoutConfirm(context, ref, localizations),
            icon: const Icon(Icons.logout_rounded, color: Colors.red),
            label: Text(
              localizations.get('logout'),
              style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              backgroundColor: Colors.red.withValues(alpha: 0.05),
            ),
          ).animate().fade(delay: 200.ms),
        ],
      ),
    );
  }

  void _showThemePicker(BuildContext context, WidgetRef ref, AppLocalizations localizations) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final currentMode = ref.watch(themeProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  localizations.get('select_theme'),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildThemeRadioOption(context, ref, ThemeMode.light, localizations.get('light'), currentMode),
                _buildThemeRadioOption(context, ref, ThemeMode.dark, localizations.get('dark'), currentMode),
                _buildThemeRadioOption(context, ref, ThemeMode.system, localizations.get('system'), currentMode),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildThemeRadioOption(
      BuildContext context, WidgetRef ref, ThemeMode mode, String label, ThemeMode currentMode) {
    return RadioListTile<ThemeMode>(
      value: mode,
      groupValue: currentMode,
      title: Text(label),
      onChanged: (value) {
        if (value != null) {
          ref.read(themeProvider.notifier).setThemeMode(value);
          Navigator.pop(context);
        }
      },
    );
  }

  void _showLanguagePicker(BuildContext context, WidgetRef ref, AppLocalizations localizations) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final currentLocale = ref.watch(localeProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  localizations.get('select_language'),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildLanguageRadioOption(context, ref, const Locale('en'), localizations.get('english'), currentLocale),
                _buildLanguageRadioOption(context, ref, const Locale('id'), localizations.get('indonesia'), currentLocale),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLanguageRadioOption(
      BuildContext context, WidgetRef ref, Locale locale, String label, Locale currentLocale) {
    return RadioListTile<Locale>(
      value: locale,
      groupValue: currentLocale,
      title: Text(label),
      onChanged: (value) {
        if (value != null) {
          ref.read(localeProvider.notifier).setLocale(value);
          Navigator.pop(context);
        }
      },
    );
  }

  void _showLogoutConfirm(BuildContext context, WidgetRef ref, AppLocalizations localizations) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(localizations.get('logout')),
          content: Text(localizations.get('logout_confirm')),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(localizations.get('cancel')),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                ref.read(authProvider.notifier).logout();
                context.go('/login');
              },
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: Text(localizations.get('logout')),
            ),
          ],
        );
      },
    );
  }
}
