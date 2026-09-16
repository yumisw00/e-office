import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../../domain/providers/theme_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(suratSummaryProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final summaryAsync = ref.watch(suratSummaryProvider);

    String userName = 'User';
    String userRole = '-';
    authState.whenData((user) {
      if (user != null) {
        userName = user.nama;
        userRole = user.role;
      }
    });

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Dashboard',
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(suratSummaryProvider.notifier).refresh(),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        child: Icon(Icons.person, color: Theme.of(context).colorScheme.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Selamat Datang,',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            Text(
                              userName,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              userRole,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Statistik Section
              Text(
                'Statistik Surat',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              summaryAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => EmptyStateView(
                  message: 'Gagal memuat statistik: $err',
                  icon: Icons.error_outline,
                ),
                data: (summary) {
                  if (summary == null) {
                    return const EmptyStateView(
                      message: 'Belum ada data statistik',
                      icon: Icons.analytics_outlined,
                    );
                  }
                  
                  return GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.5,
                    children: [
                      _StatCard(
                        title: 'Total Surat',
                        count: summary.total ?? 0,
                        icon: Icons.folder_open,
                        color: Colors.blue,
                      ),
                      _StatCard(
                        title: 'Surat Baru',
                        count: summary.baru ?? 0,
                        icon: Icons.mail,
                        color: Colors.orange,
                      ),
                      _StatCard(
                        title: 'Disposisi',
                        count: summary.disposisi ?? 0,
                        icon: Icons.share,
                        color: Colors.purple,
                      ),
                      _StatCard(
                        title: 'Selesai',
                        count: summary.selesai ?? 0,
                        icon: Icons.check_circle,
                        color: Colors.green,
                      ),
                    ],
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // Tombol Aksi Cepat
              Text(
                'Aksi Cepat',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => context.go('/surat-masuk'),
                      icon: const Icon(Icons.inbox),
                      label: const Text('Lihat Surat Masuk'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.go('/approval'),
                      icon: const Icon(Icons.gavel),
                      label: const Text('Approval'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
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
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 32),
            const Spacer(),
            Text(
              count.toString(),
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
