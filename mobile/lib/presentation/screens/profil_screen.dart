import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/theme_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/custom_card.dart';

class ProfilScreen extends ConsumerWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider);
    
    String userName = 'Nama User';
    String userEmail = 'email@user.com';

    authState.whenData((user) {
      if (user != null) {
        userName = user.nama;
        userEmail = user.email ?? 'email@contoh.com';
      }
    });

    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(
        title: 'Profil',
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
        children: [
          CustomCard(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(Icons.person_outline_rounded, size: 50, color: Theme.of(context).colorScheme.primary),
                ),
                const SizedBox(height: 16),
                Text(
                  userName,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  userEmail,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          CustomCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.dark_mode_outlined),
                  title: const Text('Mode Gelap'),
                  trailing: Switch(
                    value: themeMode == ThemeMode.dark,
                    onChanged: (val) {
                      HapticFeedback.selectionClick();
                      ref.read(themeProvider.notifier).toggleTheme();
                    },
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.logout_rounded, color: Theme.of(context).colorScheme.error),
                  title: Text(
                    'Keluar',
                    style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.bold),
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _confirmLogout(context, ref);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
            },
            child: const Text('Ya'),
          ),
        ],
      ),
    );
  }
}
