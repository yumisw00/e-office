import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/surat_model.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';
import '../widgets/approval_receipt_modal.dart';

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
      ref.read(myActionsProvider.notifier).fetchMyActions();
    });
  }

  void _showApproveConfirm(BuildContext context, SuratModel surat) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text(
          'Apakah Anda yakin ingin menyetujui surat keluar:\n\n'
          'Nomor: ${surat.nomorSurat}\n'
          'Perihal: ${surat.perihal}',
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF138A98),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(myActionsProvider.notifier).approveSurat(surat.id);
                if (context.mounted) {
                  final user = ref.read(authProvider).value;
                  final approverName = user?.nama ?? 'Pimpinan';

                  // Langsung tampilkan modal Tanda Terima Approval QR sesuai tampilan frontend
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: approverName,
                    approvalTime: DateTime.now(),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menyetujui surat: $e')),
                  );
                }
              }
            },
            child: const Text('Setujui'),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog(BuildContext context, SuratModel surat) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nomor: ${surat.nomorSurat}'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Catatan Revisi *',
                hintText: 'Tuliskan alasan penolakan / revisi...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final reason = controller.text.trim();
              if (reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Catatan revisi wajib diisi.')),
                );
                return;
              }
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(myActionsProvider.notifier).rejectSurat(surat.id, reason);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Surat berhasil ditolak.')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menolak surat: $e')),
                  );
                }
              }
            },
            child: const Text('Tolak'),
          ),
        ],
      ),
    );
  }

  String? _loadingDocId;

  Future<void> _handleViewDocument(BuildContext context, String suratId) async {
    HapticFeedback.lightImpact();
    setState(() {
      _loadingDocId = suratId;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/surat_keluar/$suratId');
      if (response.statusCode == 200) {
        final body = response.data;
        String? filePath;
        if (body is Map) {
          filePath = (body['draft_file_path'] ?? body['signed_file_path'])?.toString();
          if ((filePath == null || filePath.isEmpty) && body['data'] is Map) {
            final dataMap = body['data'] as Map;
            filePath = (dataMap['draft_file_path'] ?? dataMap['signed_file_path'])?.toString();
          }
          if (filePath == null || filePath.isEmpty) {
            filePath = (body['file_pdf_path'] ?? body['file_draft_path'])?.toString();
          }
          if ((filePath == null || filePath.isEmpty) && body['data'] is Map) {
            final dataMap = body['data'] as Map;
            filePath = (dataMap['file_pdf_path'] ?? dataMap['file_draft_path'])?.toString();
          }
        }

        if (filePath == null || filePath.isEmpty) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('File dokumen belum tersedia.')),
            );
          }
          return;
        }

        final dotIndex = filePath.lastIndexOf('.');
        final ext = dotIndex != -1 ? filePath.substring(dotIndex).toLowerCase() : '';

        if (ext == '.pdf') {
          if (context.mounted) {
            context.push('/pdf', extra: filePath);
          }
        } else {
          debugPrint('📄 Dokumen bukan PDF (path: $filePath)');
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Dokumen berformat $ext belum bisa dibuka di aplikasi')),
            );
          }
        }
      }
    } on DioException catch (e) {
      final body = e.response?.data;
      String msg;
      if (body is Map && body['message'] != null) {
        msg = body['message'].toString();
      } else if (e.message != null && e.message!.isNotEmpty) {
        msg = e.message!;
      } else {
        msg = 'Terjadi kesalahan (${e.response?.statusCode ?? "koneksi"})';
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memuat dokumen: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loadingDocId = null;
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return const Color(0xFF16A34A); // Green
      case 'review':
        return Colors.purple;
      case 'waiting':
      case 'pending':
        return Colors.orange.shade700;
      default:
        return Colors.blueGrey;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Disetujui';
      case 'review':
        return 'Sedang Direview';
      case 'waiting':
        return 'Menunggu Persetujuan';
      case 'pending':
        return 'Antrian Persetujuan';
      default:
        return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(myActionsProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(title: 'Antrian Persetujuan'),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async => ref.read(myActionsProvider.notifier).fetchMyActions(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat antrian: $err',
            icon: Icons.info_outline_rounded,
          ),
          data: (queueList) {
            final approvalTasks = queueList.where((item) => item.actionType == 'approval').toList();

            if (approvalTasks.isEmpty) {
              return const EmptyStateView(
                message: 'Tidak ada surat yang menunggu persetujuan.',
                icon: Icons.check_circle_outline_rounded,
              );
            }

            return ListView.builder(
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
              itemCount: approvalTasks.length,
              itemBuilder: (context, index) {
                final item = approvalTasks[index];
                final status = item.status.toLowerCase();
                final isApproved = status == 'approved';
                final statusColor = _getStatusColor(status);

                return CustomCard(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              item.perihal,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                            ),
                            child: Text(
                              _formatStatusLabel(status),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        children: [
                          const Icon(Icons.tag_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Nomor: ${item.nomorSurat}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.person_outline_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Pengaju: ${item.pemohon ?? '-'}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      if (item.tanggalSurat != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 15, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text(
                              'Tanggal: ${DateFormat('dd MMMM yyyy').format(item.tanggalSurat!)}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _loadingDocId == item.id
                                ? null
                                : () => _handleViewDocument(context, item.id),
                            icon: _loadingDocId == item.id
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.description_outlined, size: 18),
                            label: const Text('Lihat Dokumen'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF138A98),
                              side: const BorderSide(color: Color(0xFF138A98)),
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (isApproved)
                                ElevatedButton.icon(
                                  onPressed: () {
                                    final user = ref.read(authProvider).value;
                                    ApprovalReceiptModal.show(
                                      context,
                                      surat: item,
                                      approverName: user?.nama ?? 'Pimpinan',
                                      approvalTime: item.tanggalDiterima,
                                    );
                                  },
                                  icon: const Icon(Icons.qr_code_2_rounded, size: 18),
                                  label: const Text('Tanda Terima QR'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF138A98),
                                    foregroundColor: Colors.white,
                                  ),
                                )
                              else ...[
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Theme.of(context).colorScheme.error,
                                    side: BorderSide(color: Theme.of(context).colorScheme.error),
                                  ),
                                  onPressed: () => _showRejectDialog(context, item),
                                  icon: const Icon(Icons.close_rounded, size: 18),
                                  label: const Text('Tolak'),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton.icon(
                                  onPressed: () => _showApproveConfirm(context, item),
                                  icon: const Icon(Icons.check_rounded, size: 18),
                                  label: const Text('Setujui'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF22A06B), // Green as in React frontend
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
