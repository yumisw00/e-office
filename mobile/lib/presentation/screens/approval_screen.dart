import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class ApprovalScreen extends ConsumerStatefulWidget {
  const ApprovalScreen({super.key});

  @override
  ConsumerState<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends ConsumerState<ApprovalScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(approvalQueueProvider.notifier).fetchApprovalQueue();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(approvalQueueProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Antrian Persetujuan'),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(approvalQueueProvider.notifier).fetchApprovalQueue(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat antrian: $err',
            icon: Icons.error_outline,
          ),
          data: (queueList) {
            if (queueList.isEmpty) {
              return const EmptyStateView(
                message: 'Tidak ada surat yang menunggu persetujuan.',
                icon: Icons.check_circle_outline,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: queueList.length,
              itemBuilder: (context, index) {
                final item = queueList[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.description, color: Theme.of(context).colorScheme.primary),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                item.perihal ?? 'Tanpa Perihal',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Text('Nomor: ${item.nomorSurat ?? '-'}'),
                        const SizedBox(height: 4),
                        Text('Pengaju: ${item.pemohon ?? '-'}'),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Theme.of(context).colorScheme.error,
                                side: BorderSide(color: Theme.of(context).colorScheme.error),
                              ),
                              onPressed: () => _showRejectDialog(context, item.id),
                              child: const Text('Tolak'),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton.icon(
                              onPressed: () => _showApproveDialog(context, item.id),
                              icon: const Icon(Icons.check),
                              label: const Text('Setuju'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  void _showRejectDialog(BuildContext context, String idSurat) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Catatan Revisi (Wajib)',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () {
              if (controller.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Catatan revisi wajib diisi')),
                );
                return;
              }
              Navigator.pop(ctx);
              ref.read(approvalQueueProvider.notifier).rejectSurat(idSurat, controller.text);
            },
            child: const Text('Konfirmasi Penolakan'),
          ),
        ],
      ),
    );
  }

  void _showApproveDialog(BuildContext context, String idSurat) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: const Text('Apakah Anda yakin ingin menyetujui surat ini?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(approvalQueueProvider.notifier).approveSurat(idSurat);
            },
            child: const Text('Setuju'),
          ),
        ],
      ),
    );
  }
}
