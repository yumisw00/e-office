import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme/smooth_scroll_physics.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    FlutterNativeSplash.remove();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshAll();
    });
  }

  Future<void> _refreshAll() async {
    await ref.read(pimpinanDashboardProvider.notifier).refresh();
    await ref.read(myActionsProvider.notifier).refresh();
    ref.invalidate(pengumumanProvider);
    ref.invalidate(agendaProvider);
  }

  @override
  Widget build(BuildContext context) {
    final dashboardAsync = ref.watch(pimpinanDashboardProvider);
    final pengumumanAsync = ref.watch(pengumumanProvider);
    final agendaAsync = ref.watch(agendaProvider);
    final myActionsAsync = ref.watch(myActionsProvider);

    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(
        title: 'E-Office',
      ),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async {
          await _refreshAll();
          HapticHelper.mediumImpact();
        },
        child: SingleChildScrollView(
          physics: const SmoothScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Statistik Cards
              dashboardAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => EmptyStateView(
                  message: 'Gagal memuat statistik',
                  icon: Icons.error_outline_rounded,
                ),
                data: (data) {
                  return Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          title: 'Approval Menunggu',
                          count: data.pendingApproval,
                          icon: Icons.pending_actions,
                          color: const Color(0xFFF59E0B),
                          onTap: () => context.go('/approval'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatCard(
                          title: 'Surat Masuk',
                          count: data.totalSuratMasukBulanIni,
                          icon: Icons.move_to_inbox,
                          color: const Color(0xFF3B82F6),
                          onTap: () => context.go('/surat-masuk'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatCard(
                          title: 'Disposisi Aktif',
                          count: data.pendingDisposisi,
                          icon: Icons.assignment,
                          color: const Color(0xFF8B5CF6),
                          onTap: () => context.go('/disposisi'),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 24),

              // 3. Papan Pengumuman
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.campaign, color: Color(0xFF0D9488)),
                      const SizedBox(width: 8),
                      Text(
                        'Papan Pengumuman',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: pengumumanAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, st) => const Text('Gagal memuat pengumuman.'),
                  data: (list) {
                    if (list.isEmpty) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text('Belum ada pengumuman.', style: TextStyle(color: Colors.grey)),
                        ),
                      );
                    }
                    return Column(
                      children: list.map((item) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.judul,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item.isi,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FDFA),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  item.status,
                                  style: const TextStyle(color: Color(0xFF0F766E), fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),

              // 4. Approval/Surat Terbaru
              Row(
                children: [
                  const Icon(Icons.thumb_up, color: Color(0xFF0D9488)),
                  const SizedBox(width: 8),
                  Text(
                    'Approval Terbaru',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              myActionsAsync.when(
                loading: () => const Center(child: LinearProgressIndicator()),
                error: (err, st) => const Text('Gagal memuat daftar tindakan.'),
                data: (list) {
                  if (list.isEmpty) {
                    return const CustomCard(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: Text('Belum ada approval.', style: TextStyle(color: Colors.grey))),
                      ),
                    );
                  }
                  final recent = list.take(3).toList();
                  return Column(
                    children: recent.map((item) => CustomCard(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: EdgeInsets.zero,
                      onTap: () {
                        if (item.actionType == 'approval') {
                          context.go('/approval', extra: {'highlightId': item.id});
                        } else {
                          context.push('/surat-masuk/${item.id}', extra: {
                            'actionType': item.actionType,
                            'idDisposisi': item.idDisposisi,
                          });
                        }
                      },
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: item.actionType == 'approval' ? Colors.orange.shade50 : Colors.blue.shade50,
                          child: Icon(
                            item.actionType == 'approval' ? Icons.task_alt_rounded : Icons.alt_route_rounded,
                            size: 20,
                            color: item.actionType == 'approval' ? Colors.orange.shade600 : Colors.blue.shade600,
                          ),
                        ),
                        title: Text(item.perihal, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                        subtitle: Text(item.nomorSurat, style: const TextStyle(fontSize: 12)),
                        trailing: const Icon(Icons.chevron_right, size: 16),
                      ),
                    )).toList(),
                  );
                },
              ),
              const SizedBox(height: 24),

              // 5. Agenda Terbaru
              Row(
                children: [
                  const Icon(Icons.event, color: Color(0xFF0D9488)),
                  const SizedBox(width: 8),
                  Text(
                    'Agenda Terbaru',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              agendaAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, st) => const Text('Gagal memuat agenda.'),
                data: (list) {
                  if (list.isEmpty) {
                    return const CustomCard(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: Text('Belum ada agenda.', style: TextStyle(color: Colors.grey))),
                      ),
                    );
                  }
                  return Column(
                    children: list.map((item) => CustomCard(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  item.tanggalMulai != null ? DateFormat('dd').format(item.tanggalMulai!) : '-',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                ),
                                Text(
                                  item.tanggalMulai != null ? DateFormat('MMM').format(item.tanggalMulai!) : '-',
                                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.judul,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.status,
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )).toList(),
                  );
                },
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _StatCard({
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return CustomCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Text(
                count.toString(),
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 11,
              fontWeight: FontWeight.w500,
              height: 1.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

