import 'dart:convert';
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
            icon: Icons.info_outline_rounded,
          ),
          data: (queueList) {
            if (queueList.isEmpty) {
              return const EmptyStateView(
                message: 'Tidak ada surat yang menunggu persetujuan.',
                icon: Icons.check_circle_outline_rounded,
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
                            Icon(Icons.description_outlined, color: Theme.of(context).colorScheme.primary),
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
                              onPressed: () => _showApproveDialog(context, item.id, canSign: true),
                              icon: const Icon(Icons.draw_outlined),
                              label: const Text('Setujui & Sign'),
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

  void _showSignatureSuccessDialog(BuildContext context, Map<String, dynamic> data) {
    final qrBase64 = data['qr_code_base64']?.toString() ?? '';
    final verificationUrl = data['verification_url']?.toString() ?? '';
    final message = data['message'] ?? 'Surat berhasil ditandatangani';
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text('Penandatanganan Sukses'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              if (qrBase64.isNotEmpty) ...[
                const Text('QR Code Tanda Tangan Resmi Backend:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Image.memory(
                    base64Decode(qrBase64),
                    height: 180,
                    width: 180,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(
                      height: 180,
                      child: Center(child: Text('Gagal me-render QR Code resmi')),
                    ),
                  ),
                ),
              ],
              if (verificationUrl.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  'URL Verifikasi:\n$verificationUrl',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: Colors.blueGrey),
                ),
              ],
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Selesai'),
          ),
        ],
      ),
    );
  }

  void _showApproveDialog(BuildContext context, String idSurat, {bool canSign = false}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text(canSign 
          ? 'Apakah Anda yakin ingin menyetujui dan menandatangani surat ini secara digital?'
          : 'Apakah Anda yakin ingin menyetujui surat ini?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                if (canSign) {
                  final result = await ref.read(approvalQueueProvider.notifier).signSurat(idSurat);
                  if (context.mounted) {
                    if (result != null) {
                      _showSignatureSuccessDialog(context, result);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Surat berhasil ditandatangani dan berstatus "signed"')),
                      );
                    }
                  }
                } else {
                  await ref.read(approvalQueueProvider.notifier).approveSurat(idSurat);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Surat berhasil disetujui')),
                    );
                  }
                }
              } catch (e) {
                 if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                 }
              }
            },
            child: Text(canSign ? 'Setuju & Sign' : 'Setuju'),
          ),
        ],
      ),
    );
  }
}
