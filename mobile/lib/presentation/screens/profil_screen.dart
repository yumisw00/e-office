import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/theme_provider.dart';
import '../widgets/custom_app_bar.dart';

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

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Profil Sayang',
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                    child: Icon(Icons.person, size: 50, color: Theme.of(context).colorScheme.primary),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    userName,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    userEmail,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.palette),
                  title: const Text('Mode Gelap'),
                  trailing: Switch(
                    value: themeMode == ThemeMode.dark,
                    onChanged: (val) {
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
                  onTap: () => _confirmLogout(context, ref),
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
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
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