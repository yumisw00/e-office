import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/network/api_endpoints.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart' show TrackingException;
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/approval_receipt_modal.dart';
import '../widgets/custom_app_bar.dart';

class DetailSuratScreen extends ConsumerStatefulWidget {
  final String idSurat;
  final String? actionType;
  final String? idDisposisi;

  const DetailSuratScreen({
    super.key,
    required this.idSurat,
    this.actionType,
    this.idDisposisi,
  });

  @override
  ConsumerState<DetailSuratScreen> createState() => _DetailSuratScreenState();
}

class _DetailSuratScreenState extends ConsumerState<DetailSuratScreen> {
  String? _resolvedIdDisposisi;
  SuratModel? _lastLoggedSurat; // DEBUG ONLY: cegah log berulang tiap rebuild

  @override
  void initState() {
    super.initState();
    _resolvedIdDisposisi = widget.idDisposisi;
    if (_resolvedIdDisposisi == null && widget.actionType == 'disposisi') {
      _resolveDisposisiId();
    }
  }

  Future<void> _resolveDisposisiId() async {
    try {
      final disp = await ref.read(suratRepositoryProvider).getDisposisiForSurat(widget.idSurat);
      if (disp != null && mounted) {
        setState(() {
          _resolvedIdDisposisi = (disp['id_surat_disposisi'] ?? disp['id'])?.toString();
        });
      }
    } catch (_) {}
  }

  /// DEBUG ONLY: cetak activeFilePath & URL hasil buildStorageUrl (sekali per hasil fetch).
  void _debugLogPdfInfo(SuratModel surat) {
    if (!kDebugMode || identical(_lastLoggedSurat, surat)) return;
    _lastLoggedSurat = surat;
    final path = surat.activeFilePath;
    debugPrint('📄 DETAIL ${widget.idSurat} (${widget.actionType}) status=${surat.status}');
    debugPrint('📄 activeFilePath: $path');
    debugPrint('📄 buildStorageUrl: ${path == null ? '(null - tidak dipanggil)' : ApiEndpoints.buildStorageUrl(path)}');
  }

  /// Pesan error riwayat: pesan server apa adanya untuk 403/404.
  String _trackingErrorMessage(Object err) {
    if (err is TrackingException) return err.message;
    if (err is DioException) return 'Gagal memuat riwayat: ${err.message ?? err.type.name}';
    return 'Gagal memuat riwayat: $err';
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(suratDetailProvider((id: widget.idSurat, type: widget.actionType)));
    final trackingAsync = ref.watch(trackingProvider((id: widget.idSurat, type: widget.actionType)));
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return detailAsync.when(
      loading: () => Scaffold(
        extendBodyBehindAppBar: true,
        appBar: const CustomAppBar(title: 'Memuat Detail...'),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (err, st) {
        final isPermissionError = err.toString().contains('PERM_403');
        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: const CustomAppBar(title: 'Detail Surat'),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isPermissionError ? Icons.lock_person_rounded : Icons.error_outline_rounded,
                    size: 64,
                    color: isPermissionError ? Colors.orange : Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isPermissionError ? 'Akses Ditolak' : 'Terjadi Kesalahan',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isPermissionError 
                      ? 'Akun grup Pimpinan belum diberi izin (permission) untuk mengakses fitur detail surat ini. Silakan hubungi admin sistem.'
                      : err.toString().replaceAll('Exception: ', ''),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),
                  if (!isPermissionError) ...[
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(suratDetailProvider((id: widget.idSurat, type: widget.actionType))),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
      data: (currentSurat) {
        if (currentSurat == null) {
          return Scaffold(
            extendBodyBehindAppBar: true,
            appBar: const CustomAppBar(title: 'Detail Surat'),
            body: const Center(child: Text('Data surat tidak ditemukan')),
          );
        }

        _debugLogPdfInfo(currentSurat);

        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: CustomAppBar(
            title: currentSurat.nomorSurat,
          ),
          body: RefreshIndicator(
            edgeOffset: topPadding,
            onRefresh: () async {
              ref.invalidate(suratDetailProvider((id: widget.idSurat, type: widget.actionType)));
              ref.invalidate(trackingProvider((id: widget.idSurat, type: widget.actionType)));
              await ref.read(myActionsProvider.notifier).refresh();
              HapticFeedback.mediumImpact();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 120.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildMetadataCard(context, currentSurat),
                  const SizedBox(height: 16),
                  trackingAsync.when(
                    data: (events) => _buildTrackingCard(context, currentSurat, events),
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    error: (err, st) => Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Riwayat / Tracking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const Divider(height: 20),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  err is TrackingException && err.statusCode == 403
                                      ? Icons.lock_outline_rounded
                                      : Icons.info_outline_rounded,
                                  size: 18,
                                  color: Colors.orange.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _trackingErrorMessage(err),
                                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMetadataCard(BuildContext context, SuratModel surat) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(
                  label: Text(surat.actionType?.toUpperCase() ?? 'SURAT'),
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  labelStyle: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Text(
                  DateFormat('dd MMM yyyy').format(surat.tanggalDiterima),
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              surat.perihal,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(height: 24),
            _infoRow('Nomor Surat', surat.nomorSurat),
            _infoRow('Asal Surat', surat.asalSurat),
            _infoRow('Pengaju', surat.pemohon ?? '-'),
            _infoRow('Status', surat.status),
            if (surat.activeFilePath != null && surat.activeFilePath!.isNotEmpty) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    context.push('/pdf', extra: surat.activeFilePath);
                  },
                  icon: const Icon(Icons.picture_as_pdf_rounded),
                  label: const Text('Buka Dokumen PDF'),
                ),
              ),
            ],
            // Aksi tombol Approval / Disposisi
            const SizedBox(height: 20),
            _buildActionSection(context, surat),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          const Text(': ', style: TextStyle(color: Colors.grey)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildActionSection(BuildContext context, SuratModel surat) {
    final isApproval = (widget.actionType ?? surat.actionType) == 'approval';
    final isDisposisi = (widget.actionType ?? surat.actionType) == 'disposisi' ||
        widget.idDisposisi != null ||
        _resolvedIdDisposisi != null;
    final status = surat.status.toLowerCase();

    if (isApproval) {
      if (status == 'approved') {
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF138A98), foregroundColor: Colors.white),
            onPressed: () {
              HapticFeedback.mediumImpact();
              final user = ref.read(authProvider).value;
              ApprovalReceiptModal.show(
                context,
                surat: surat,
                approverName: user?.nama ?? 'Pimpinan',
                approvalTime: surat.tanggalDiterima,
              );
            },
            icon: const Icon(Icons.qr_code_2_rounded),
            label: const Text('Tanda Terima Approval (QR)'),
          ),
        );
      } else {
        return Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Theme.of(context).colorScheme.error,
                  side: BorderSide(color: Theme.of(context).colorScheme.error),
                ),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  _showRejectDialog(context, surat);
                },
                child: const Text('Tolak'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF138A98),
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  _showApproveConfirm(context, surat);
                },
                child: const Text('Setujui'),
              ),
            ),
          ],
        );
      }
    } else if (isDisposisi) {
      final isDone = status == 'done' || status == 'selesai';
      if (isDone) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.green.shade300),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_rounded, color: Colors.green.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                'Disposisi Telah Diselesaikan',
                style: TextStyle(
                  color: Colors.green.shade800,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        );
      }

      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF138A98),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: () {
            HapticFeedback.mediumImpact();
            _showCompleteDisposisiDialog(context, surat);
          },
          icon: const Icon(Icons.task_alt_rounded),
          label: const Text(
            'Selesaikan Disposisi',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildTrackingCard(BuildContext context, SuratModel surat, List<TimelineEvent> events) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Riwayat / Tracking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const Divider(height: 20),
            if (events.isEmpty)
              const Text('Belum ada riwayat tracking.', style: TextStyle(color: Colors.grey))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: events.length,
                itemBuilder: (context, index) {
                  final event = events[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: index == 0 ? Theme.of(context).colorScheme.primary : Colors.grey.shade400,
                              ),
                            ),
                            if (index < events.length - 1)
                              Container(
                                width: 2,
                                height: 35,
                                color: Colors.grey.shade300,
                              ),
                          ],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(event.judul, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  ),
                                  if (event.deskripsi.isNotEmpty) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.primaryContainer,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        event.deskripsi,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: Theme.of(context).colorScheme.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              if (event.catatan != null && event.catatan!.isNotEmpty)
                                Text(event.catatan!, style: const TextStyle(fontSize: 12)),
                              if (event.pelaku.isNotEmpty)
                                Text(
                                  event.pelaku,
                                  style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                                ),
                              Text(
                                DateFormat('dd/MM/yy HH:mm').format(event.tanggal),
                                style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  // --- ACTIONS ---

  void _showApproveConfirm(BuildContext context, SuratModel surat) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text('Apakah Anda yakin ingin menyetujui surat nomor ${surat.nomorSurat}?'),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF138A98), foregroundColor: Colors.white),
            onPressed: () async {
              HapticFeedback.mediumImpact();
              context.pop();
              try {
                await ref.read(suratRepositoryProvider).approveSurat(surat.id);
                if (context.mounted) {
                  ref.read(myActionsProvider.notifier).refresh();
                  final user = ref.read(authProvider).value;
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: user?.nama ?? 'Pimpinan',
                    approvalTime: DateTime.now(),
                  );
                }
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
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
      builder: (context) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Catatan Revisi', border: OutlineInputBorder()),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error, foregroundColor: Colors.white),
            onPressed: () async {
              if (controller.text.isEmpty) return;
              HapticFeedback.mediumImpact();
              context.pop();
              try {
                await ref.read(suratRepositoryProvider).rejectSurat(surat.id, controller.text);
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Surat berhasil ditolak.')));
                   ref.read(myActionsProvider.notifier).refresh();
                }
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
              }
            },
            child: const Text('Tolak'),
          ),
        ],
      ),
    );
  }

  void _showCompleteDisposisiDialog(BuildContext context, SuratModel surat) {
    final dispositionId = _resolvedIdDisposisi ?? widget.idDisposisi ?? surat.idDisposisi;
    if (dispositionId == null || dispositionId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ID disposisi tidak ditemukan untuk surat ini. Silakan muat ulang.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final catatanController = TextEditingController();
    PlatformFile? selectedFile;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (modalContext) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Selesaikan Disposisi',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  'Nomor Surat: ${surat.nomorSurat}',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: catatanController,
                  decoration: const InputDecoration(
                    labelText: 'Catatan / Laporan Penyelesaian *',
                    hintText: 'Tuliskan tindakan atau penyelesaian disposisi...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 14),
                // Lampiran Bukti
                InkWell(
                  onTap: isSubmitting
                      ? null
                      : () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setModalState(() {
                              selectedFile = result.files.first;
                            });
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey.shade50,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selectedFile != null ? Icons.attach_file : Icons.upload_file,
                          color: selectedFile != null ? const Color(0xFF138A98) : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile != null
                                ? selectedFile!.name
                                : 'Lampirkan Bukti (PDF/Gambar - Opsional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: selectedFile != null ? Colors.black87 : Colors.grey.shade600,
                              fontWeight: selectedFile != null ? FontWeight.w600 : FontWeight.normal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedFile != null)
                          IconButton(
                            icon: const Icon(Icons.cancel, size: 18, color: Colors.red),
                            onPressed: () => setModalState(() => selectedFile = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF138A98),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final catatan = catatanController.text.trim();
                            if (catatan.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Catatan penyelesaian wajib diisi.')),
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);
                            try {
                              String? fileBuktiPath;
                              if (selectedFile != null && selectedFile!.path != null) {
                                final uploadResp = await ref
                                    .read(suratRepositoryProvider)
                                    .uploadAttachment(dispositionId, selectedFile!.path!);
                                fileBuktiPath = uploadResp['file_bukti_path']?.toString();
                              }

                              await ref.read(suratRepositoryProvider).completeDisposisi(
                                    dispositionId,
                                    catatan: catatan,
                                    fileBuktiPath: fileBuktiPath,
                                  );

                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Disposisi berhasil diselesaikan.'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                ref.invalidate(suratDetailProvider((id: widget.idSurat, type: widget.actionType)));
                                ref.invalidate(trackingProvider((id: widget.idSurat, type: widget.actionType)));
                                ref.read(myActionsProvider.notifier).refresh();
                                ref.read(pimpinanDashboardProvider.notifier).refresh();
                              }
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Gagal menyelesaikan disposisi: $e'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Selesaikan Disposisi', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
