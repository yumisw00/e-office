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
      ref.read(suratMasukProvider.notifier).refresh();
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
        title: 'Dashboard E-Office',
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(suratSummaryProvider.notifier).refresh();
          await ref.read(suratMasukProvider.notifier).refresh();
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Identity Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        child: Icon(Icons.person_outline_rounded, color: Theme.of(context).colorScheme.primary),
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
                      IconButton(
                        icon: const Icon(Icons.logout_outlined, color: Colors.grey),
                        onPressed: () => _confirmLogout(context),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Statistik Section
              Text(
                'Statistik Organisasi',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              summaryAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => EmptyStateView(
                  message: 'Gagal memuat statistik: ${err.toString().replaceAll('Exception: ', '')}',
                  icon: Icons.error_outline_rounded,
                ),
                data: (summary) {
                  return GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.4,
                    children: [
                      _StatCard(
                        title: 'Surat Masuk',
                        count: summary.suratMasukCount,
                        icon: Icons.move_to_inbox_outlined,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      _StatCard(
                        title: 'Surat Keluar',
                        count: summary.suratKeluarCount,
                        icon: Icons.outbox_outlined,
                        color: const Color(0xFFE67E22),
                      ),
                      _StatCard(
                        title: 'Disposisi Pending',
                        count: summary.disposisiPendingCount,
                        icon: Icons.assignment_late_outlined,
                        color: Theme.of(context).colorScheme.secondary,
                      ),
                      _StatCard(
                        title: 'Agenda Hari Ini',
                        count: summary.agendaTodayCount,
                        icon: Icons.today_outlined,
                        color: const Color(0xFF27AE60),
                      ),
                    ],
                  );
                },
              ),
              
              const SizedBox(height: 24),

              // Section Surat Terbaru
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Surat Terbaru',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push('/surat-masuk'),
                    child: const Text('Lihat Semua'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ref.watch(suratMasukProvider).when(
                loading: () => const Center(child: LinearProgressIndicator()),
                error: (err, st) => Text('Gagal memuat surat terbaru.'),
                data: (list) {
                  if (list.isEmpty) return const Text('Tidak ada surat terbaru');
                  final recent = list.take(3).toList();
                  return Column(
                    children: recent.map((surat) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const CircleAvatar(child: Icon(Icons.description_outlined, size: 20)),
                        title: Text(surat.perihal, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(surat.asalSurat),
                        onTap: () => context.push('/surat-masuk/${surat.id}'),
                      ),
                    )).toList(),
                  );
                },
              ),

              const SizedBox(height: 24),
              
              // Tombol Aksi Cepat Berbasis Role Cerdas (Kontrak Poin 7)
              Text(
                'Aksi Cepat',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              summaryAsync.maybeWhen(
                data: (summary) {
                  final isPimpinan = summary.role.toLowerCase().contains('pimpinan') || 
                                     summary.role.toLowerCase().contains('direksi') ||
                                     userRole.toLowerCase().contains('pimpinan');
                  
                  return Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => context.push('/surat-masuk'),
                          icon: const Icon(Icons.inbox_outlined),
                          label: const Text('Surat Masuk'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Hanya pimpinan yang melihat tombol persetujuan (approval) secara adaptif
                      if (isPimpinan)
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => context.push('/approval'),
                            icon: const Icon(Icons.gavel_outlined),
                            label: const Text('Persetujuan (Sign)'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.teal.shade700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        )
                      else
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => context.push('/disposisi'),
                            icon: const Icon(Icons.share_outlined),
                            label: const Text('Disposisi'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                    ],
                  );
                },
                orElse: () => Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/surat-masuk'),
                        icon: const Icon(Icons.inbox_outlined),
                        label: const Text('Surat Masuk'),
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),
                    ),
                  ],
                ),
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
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 28),
                Text(
                  count.toString(),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
