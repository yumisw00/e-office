import 'dart:math' as math;
import 'package:e_office_mobile/core/constants/app_colors.dart';
import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/network/api_endpoints.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart' show TrackingException;
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/approval_receipt_modal.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/surat_filter_widgets.dart';

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
  String _asalNilaiDisposisi = 'tidak diketahui';
  SuratModel? _lastLoggedSurat; // DEBUG ONLY: cegah log berulang tiap rebuild
  bool _localArchived = false;
  List<Map<String, dynamic>>? _recipients;
  final List<Map<String, dynamic>> _selectedRecipients = [];
  DateTime? _tenggatDate;
  bool _isSubmittingDisposisi = false;

  bool _isApproval(SuratModel surat) =>
      (widget.actionType ?? surat.actionType) == 'approval';

  bool _isDisposisi(SuratModel surat) =>
      (widget.actionType ?? surat.actionType) == 'disposisi' ||
      widget.idDisposisi != null ||
      _resolvedIdDisposisi != null;

  bool _isSuratMasuk(SuratModel surat) =>
      !_isApproval(surat) && !_isDisposisi(surat);

  String _extractApiError(Object error, {required String fallback}) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final message = data['message']?.toString().trim();
        if (message != null && message.isNotEmpty) return message;
        final errField = data['error'] ?? data['errors'];
        if (errField is Map) {
          final flattened = errField.values
              .expand((v) => v is List ? v : [v])
              .map((v) => v?.toString().trim() ?? '')
              .where((v) => v.isNotEmpty)
              .join(', ');
          if (flattened.isNotEmpty) return flattened;
        } else if (errField is String && errField.trim().isNotEmpty) {
          return errField.trim();
        }
      }
      if (error.response?.statusCode == 403) {
        return 'Anda tidak memiliki izin untuk melakukan aksi ini.';
      }
      if (error.message != null && error.message!.trim().isNotEmpty) {
        return error.message!.trim();
      }
    }
    final text = error.toString().replaceFirst('Exception: ', '').trim();
    return text.isNotEmpty ? text : fallback;
  }

  @override
  void initState() {
    super.initState();
    _resolvedIdDisposisi = widget.idDisposisi;
    if (widget.idDisposisi != null && widget.idDisposisi!.isNotEmpty) {
      _asalNilaiDisposisi = 'extra dari my-actions';
    } else if (widget.actionType == 'disposisi') {
      _resolveDisposisiId();
    }
  }

  @override
  void didUpdateWidget(covariant DetailSuratScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.idSurat != widget.idSurat) {
      _localArchived = false;
      _selectedRecipients.clear();
      _tenggatDate = null;
    }
  }

  Future<void> _resolveDisposisiId() async {
    try {
      final disp = await ref
          .read(suratRepositoryProvider)
          .getDisposisiForSurat(widget.idSurat);
      if (disp != null && mounted) {
        setState(() {
          _resolvedIdDisposisi = (disp['id_surat_disposisi'] ?? disp['id'])
              ?.toString();
          _asalNilaiDisposisi = 'hasil getDisposisiForSurat';
        });
      }
    } catch (_) {}
  }

  /// DEBUG ONLY: cetak activeFilePath & URL hasil buildStorageUrl (sekali per hasil fetch).
  void _debugLogPdfInfo(SuratModel surat) {
    if (!kDebugMode || identical(_lastLoggedSurat, surat)) return;
    _lastLoggedSurat = surat;
    final path = surat.activeFilePath;
    debugPrint(
      '📄 DETAIL ${widget.idSurat} (${widget.actionType}) status=${surat.status}',
    );
    debugPrint('📄 activeFilePath: $path');
    debugPrint(
      '📄 buildStorageUrl: ${path == null ? '(null - tidak dipanggil)' : ApiEndpoints.buildStorageUrl(path)}',
    );
  }

  /// Pesan error riwayat: pesan server apa adanya untuk 403/404.
  String _trackingErrorMessage(Object err) {
    if (err is TrackingException) return err.message;
    if (err is DioException)
      return 'Gagal memuat riwayat: ${err.message ?? err.type.name}';
    return 'Gagal memuat riwayat: $err';
  }

  /// Membuka tautan Google Docs langsung di aplikasi Google Docs jika terpasang,
  /// atau fallback ke browser jika belum terpasang.
  Future<void> _openGoogleDocs(String rawUrl) async {
    HapticHelper.lightImpact();
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) return;

    final uri = Uri.parse(trimmed);
    bool launched = false;

    // 1. Coba buka di aplikasi Google Docs / Drive (non-browser) jika terpasang
    try {
      launched = await launchUrl(
        uri,
        mode: LaunchMode.externalNonBrowserApplication,
      );
    } catch (_) {
      launched = false;
    }

    // 2. Jika aplikasi tidak terpasang, buka di browser eksternal
    if (!launched) {
      try {
        launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {
        launched = false;
      }
    }

    // 3. Fallback platform default
    if (!launched) {
      try {
        launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Tidak dapat membuka dokumen: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(
      suratDetailProvider((id: widget.idSurat, type: widget.actionType)),
    );
    final trackingAsync = ref.watch(
      trackingProvider((id: widget.idSurat, type: widget.actionType)),
    );
    final topPadding =
        MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

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
                    isPermissionError
                        ? Icons.lock_person_rounded
                        : Icons.error_outline_rounded,
                    size: 64,
                    color: isPermissionError ? Colors.orange : Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isPermissionError ? 'Akses Ditolak' : 'Terjadi Kesalahan',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
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
                      onPressed: () => ref.invalidate(
                        suratDetailProvider((
                          id: widget.idSurat,
                          type: widget.actionType,
                        )),
                      ),
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
          appBar: CustomAppBar(title: currentSurat.nomorSurat),
          body: RefreshIndicator(
            edgeOffset: topPadding,
            onRefresh: () async {
              ref.invalidate(
                suratDetailProvider((
                  id: widget.idSurat,
                  type: widget.actionType,
                )),
              );
              ref.invalidate(
                trackingProvider((id: widget.idSurat, type: widget.actionType)),
              );
              await ref.read(approvalListProvider.notifier).fetchApprovalList();
              await ref.read(suratMasukListProvider.notifier).fetchSuratMasuk();
              await ref.read(disposisiListProvider.notifier).refresh();
              await ref.read(myActionsProvider.notifier).refresh();
              HapticHelper.mediumImpact();
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
                    data: (events) =>
                        _buildTrackingCard(context, currentSurat, events),
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    error: (err, st) => Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Riwayat',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const Divider(height: 20),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  err is TrackingException &&
                                          err.statusCode == 403
                                      ? Icons.lock_outline_rounded
                                      : Icons.info_outline_rounded,
                                  size: 18,
                                  color: Colors.orange.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _trackingErrorMessage(err),
                                    style: TextStyle(
                                      color: Colors.grey.shade700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (_isSuratMasuk(currentSurat)) ...[
                    const SizedBox(height: 16),
                    _buildDisposisiCard(context, currentSurat),
                  ],
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
    final chipLabel = ((widget.actionType ?? surat.actionType) ?? 'SURAT')
        .replaceAll('_', ' ')
        .toUpperCase();

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
                  label: Text(chipLabel),
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primaryContainer,
                  labelStyle: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
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
            if (_isSuratMasuk(surat)) ...[
              if (surat.nomorAgenda != null && surat.nomorAgenda!.isNotEmpty)
                _infoRow('Nomor Agenda', surat.nomorAgenda!),
              _infoRow('Nomor Surat', surat.nomorSurat),
              _infoRow('Pengirim', surat.asalSurat),
              if (surat.penerima != null && surat.penerima!.isNotEmpty)
                _infoRow('Penerima', surat.penerima!),
              if (surat.jenisSurat != null && surat.jenisSurat!.isNotEmpty)
                _infoRow('Jenis', surat.jenisSurat!),
              if (surat.sifat != null && surat.sifat!.isNotEmpty)
                _infoRow('Sifat', surat.sifat!),
              if (surat.tanggalSurat != null)
                _infoRow(
                  'Tanggal Surat',
                  DateFormat('dd MMM yyyy').format(surat.tanggalSurat!),
                ),
              _infoRow(
                'Tanggal Terima',
                DateFormat('dd MMM yyyy').format(surat.tanggalDiterima),
              ),
              _infoRow('Status', surat.status),
              if (surat.ringkasan.isNotEmpty)
                _infoRow('Ringkasan', surat.ringkasan),
              if (surat.catatan != null && surat.catatan!.isNotEmpty)
                _infoRow('Catatan', surat.catatan!),
            ] else ...[
              _infoRow('Nomor Surat', surat.nomorSurat),
              _infoRow('Asal Surat', surat.asalSurat),
              _infoRow('Pengaju', surat.pemohon ?? '-'),
              _infoRow('Status', surat.status),
            ],
            if (surat.activeFilePath != null &&
                surat.activeFilePath!.isNotEmpty) ...[
              const SizedBox(height: 16),
              // Tombol "Buka Preview" — pratinjau dokumen langsung di dalam aplikasi
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () {
                    HapticHelper.lightImpact();
                    if (context.mounted) {
                      context.push('/pdf', extra: surat.activeFilePath);
                    }
                  },
                  icon: const Icon(Icons.visibility_rounded, size: 20),
                  label: const Text(
                    'Buka Preview',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              // Tombol "Buka di Google Docs" — buka di aplikasi Google Docs jika
              // terinstall, atau di browser jika belum.
              if (surat.isGoogleDocs) ...[
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      shape: const StadiumBorder(),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () {
                      final docsUrl =
                          (surat.googleDriveUrl != null &&
                              surat.googleDriveUrl!.isNotEmpty)
                          ? surat.googleDriveUrl!
                          : surat.activeFilePath!;
                      _openGoogleDocs(docsUrl);
                    },
                    icon: const Icon(Icons.open_in_new_rounded, size: 20),
                    label: const Text(
                      'Buka di Google Docs',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ],
            // Aksi tombol Approval / Disposisi
            const SizedBox(height: 16),
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
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
          const Text(': ', style: TextStyle(color: Colors.grey)),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionSection(BuildContext context, SuratModel surat) {
    final isApproval = (widget.actionType ?? surat.actionType) == 'approval';
    final isDisposisi =
        (widget.actionType ?? surat.actionType) == 'disposisi' ||
        widget.idDisposisi != null ||
        _resolvedIdDisposisi != null;
    final status = surat.status.toLowerCase();

    if (isApproval) {
      if (status == 'approved') {
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              HapticHelper.mediumImpact();
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
                  HapticHelper.lightImpact();
                  _showRejectDialog(surat);
                },
                child: const Text('Tolak'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  HapticHelper.mediumImpact();
                  _showApproveConfirm(surat);
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
          decoration: ShapeDecoration(
            color: Colors.green.shade50,
            shape: const StadiumBorder(
              side: BorderSide(color: Color(0xFF86EFAC)), // green.shade300
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle_rounded,
                color: Colors.green.shade700,
                size: 20,
              ),
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
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: const StadiumBorder(),
          ),
          onPressed: () {
            HapticHelper.mediumImpact();
            _showCompleteDisposisiDialog(context, surat);
          },
          icon: const Icon(Icons.task_alt_rounded),
          label: const Text(
            'Selesaikan Disposisi',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
        ),
      );
    } else {
      final isDark = Theme.of(context).brightness == Brightness.dark;
      final isArchived = _localArchived || surat.sudahDiarsipkan;
      final bannerColor = isArchived
          ? (isDark
                ? Colors.green.withValues(alpha: 0.15)
                : Colors.green.shade50)
          : (isDark
                ? Colors.amber.withValues(alpha: 0.15)
                : const Color(0xFFFFF8E1));
      final bannerBorderColor = isArchived
          ? (isDark ? Colors.green.shade700 : Colors.green.shade300)
          : (isDark ? Colors.amber.shade700 : Colors.amber.shade300);
      final bannerIconColor = isArchived
          ? (isDark ? Colors.green.shade300 : Colors.green.shade700)
          : (isDark ? Colors.amber.shade300 : Colors.amber.shade800);
      final bannerTextColor = isArchived
          ? (isDark ? Colors.green.shade200 : Colors.green.shade900)
          : (isDark ? Colors.amber.shade200 : Colors.amber.shade900);

      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: ShapeDecoration(
              color: bannerColor,
              shape: StadiumBorder(
                side: BorderSide(color: bannerBorderColor),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isArchived
                      ? Icons.inventory_2_outlined
                      : Icons.pending_actions_rounded,
                  size: 18,
                  color: bannerIconColor,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    isArchived
                        ? 'Surat ini sudah diarsipkan.'
                        : 'Surat ini belum diarsipkan.',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: bannerTextColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade400,
                disabledForegroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: const StadiumBorder(),
              ),
              onPressed: isArchived
                  ? null
                  : () {
                      HapticHelper.lightImpact();
                      _showArchiveDialog(surat);
                    },
              icon: const Icon(Icons.archive_outlined, size: 20),
              label: Text(
                isArchived ? 'Sudah Diarsipkan' : 'Arsipkan',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      );
    }
  }

  Widget _buildDisposisiCard(BuildContext context, SuratModel surat) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final fieldFillColor = isDark
        ? theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35)
        : Colors.grey.shade50;
    final fieldBorderColor = isDark
        ? Colors.white.withValues(alpha: 0.18)
        : Colors.grey.shade300;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Disposisi',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'Pilih pegawai penerima dan tenggat, lalu klik Tambah Disposisi.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 14),
            const Text(
              'Penerima Disposisi',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            InkWell(
              borderRadius: BorderRadius.circular(28),
              onTap: _isSubmittingDisposisi
                  ? null
                  : () => _showRecipientPickerSheet(context),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: fieldFillColor,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: fieldBorderColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _selectedRecipients.isEmpty
                            ? 'Pilih pegawai penerima'
                            : '${_selectedRecipients.length} pegawai dipilih',
                        style: TextStyle(
                          fontSize: 14,
                          color: _selectedRecipients.isEmpty
                              ? Colors.grey.shade600
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                    Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: Colors.grey.shade600,
                    ),
                  ],
                ),
              ),
            ),
            if (_selectedRecipients.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: _selectedRecipients.map((recipient) {
                  final id = recipient['id']?.toString() ?? '';
                  final name = recipient['name']?.toString() ?? 'Pegawai';
                  return InputChip(
                    shape: const StadiumBorder(),
                    label: Text(name, style: const TextStyle(fontSize: 12)),
                    onDeleted: _isSubmittingDisposisi
                        ? null
                        : () {
                            setState(() {
                              _selectedRecipients.removeWhere(
                                (r) => r['id']?.toString() == id,
                              );
                            });
                          },
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 14),
            const Text(
              'Tenggat',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            InkWell(
              borderRadius: BorderRadius.circular(28),
              onTap: _isSubmittingDisposisi
                  ? null
                  : () async {
                      final now = DateTime.now();
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _tenggatDate ?? now,
                        firstDate: DateTime(now.year - 5),
                        lastDate: DateTime(now.year + 10),
                      );
                      if (picked != null && mounted) {
                        setState(() => _tenggatDate = picked);
                      }
                    },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: fieldFillColor,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: fieldBorderColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _tenggatDate == null
                            ? 'hh / bb / tttt'
                            : DateFormat(
                                'dd / MM / yyyy',
                              ).format(_tenggatDate!),
                        style: TextStyle(
                          fontSize: 14,
                          color: _tenggatDate == null
                              ? Colors.grey.shade600
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                    if (_tenggatDate != null)
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        visualDensity: VisualDensity.compact,
                        style: IconButton.styleFrom(
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        icon: Icon(
                          Icons.close,
                          size: 18,
                          color: Colors.grey.shade600,
                        ),
                        onPressed: _isSubmittingDisposisi
                            ? null
                            : () => setState(() => _tenggatDate = null),
                      )
                    else
                      Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: Colors.grey.shade600,
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: const StadiumBorder(),
                ),
                onPressed: _isSubmittingDisposisi
                    ? null
                    : () => _submitDisposisi(surat),
                child: _isSubmittingDisposisi
                    ? const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Mengirim...',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      )
                    : const Text(
                        'Tambah Disposisi',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showRecipientPickerSheet(BuildContext context) async {
    HapticHelper.lightImpact();
    final initialIds = _selectedRecipients
        .map((e) => e['id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toSet();

    final result = await showModalBottomSheet<List<Map<String, dynamic>>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => _RecipientPickerSheet(
        cachedRecipients: _recipients,
        initialSelectedIds: initialIds,
        fetchRecipients: () =>
            ref.read(suratRepositoryProvider).getDisposisiRecipients(),
        onRecipientsLoaded: (items) {
          _recipients = items;
        },
        formatError: (e) =>
            _extractApiError(e, fallback: 'Gagal memuat daftar pegawai.'),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _selectedRecipients
          ..clear()
          ..addAll(result);
      });
    }
  }

  Future<void> _submitDisposisi(SuratModel surat) async {
    if (_selectedRecipients.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Penerima disposisi wajib dipilih.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    HapticHelper.mediumImpact();
    setState(() => _isSubmittingDisposisi = true);

    final idList = _selectedRecipients
        .map((r) => r['id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList();
    final tenggatFormatted = _tenggatDate != null
        ? DateFormat('yyyy-MM-dd').format(_tenggatDate!)
        : null;

    try {
      await ref
          .read(suratRepositoryProvider)
          .createDisposisi(
            idSuratMasuk: surat.id,
            idPenerimaList: idList,
            tanggalJatuhTempo: tenggatFormatted,
          );
      if (!mounted) return;
      setState(() {
        _selectedRecipients.clear();
        _tenggatDate = null;
        _isSubmittingDisposisi = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Disposisi berhasil dibuat.'),
          backgroundColor: Colors.green,
        ),
      );
      ref.invalidate(
        suratDetailProvider((id: widget.idSurat, type: widget.actionType)),
      );
      ref.invalidate(
        trackingProvider((id: widget.idSurat, type: widget.actionType)),
      );
      ref.read(suratMasukListProvider.notifier).refresh();
      ref.read(disposisiListProvider.notifier).refresh();
      ref.read(myActionsProvider.notifier).refresh();
      ref.read(pimpinanDashboardProvider.notifier).refresh();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmittingDisposisi = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _extractApiError(e, fallback: 'Gagal membuat disposisi.'),
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _showArchiveDialog(SuratModel surat) async {
    final archived = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => _ArchiveSuratMasukSheet(
        surat: surat,
        onSubmitArchive: (lokasiFisik, tanggalArsip) => ref
            .read(suratRepositoryProvider)
            .archiveSuratMasuk(
              surat.id,
              lokasiFisik: lokasiFisik,
              tanggalArsip: tanggalArsip,
            ),
        formatError: (e) =>
            _extractApiError(e, fallback: 'Surat masuk gagal diarsipkan.'),
      ),
    );

    if (archived == true && mounted) {
      setState(() => _localArchived = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Surat berhasil masuk arsip.'),
          backgroundColor: Colors.green,
        ),
      );
      ref.invalidate(
        suratDetailProvider((id: widget.idSurat, type: widget.actionType)),
      );
      ref.invalidate(
        trackingProvider((id: widget.idSurat, type: widget.actionType)),
      );
      ref.read(suratMasukListProvider.notifier).refresh();
      ref.read(myActionsProvider.notifier).refresh();
      ref.read(pimpinanDashboardProvider.notifier).refresh();
    }
  }

  Widget _buildTrackingCard(
    BuildContext context,
    SuratModel surat,
    List<TimelineEvent> events,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Riwayat',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Divider(height: 16),
            const SizedBox(height: 6),
            if (events.isEmpty)
              const Text(
                'Belum ada riwayat.',
                style: TextStyle(color: Colors.grey),
              )
            else
              for (int index = 0; index < events.length; index++)
                _buildTimelineItem(
                  context,
                  events[index],
                  index,
                  events.length,
                  isDark,
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineItem(
    BuildContext context,
    TimelineEvent event,
    int index,
    int total,
    bool isDark,
  ) {
    final theme = Theme.of(context);
    final isLast = index == total - 1;

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0.0 : 12.0),
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
                  color: index == 0
                      ? theme.colorScheme.primary
                      : (isDark
                            ? Colors.white.withValues(alpha: 0.4)
                            : Colors.grey.shade400),
                ),
              ),
              if (!isLast)
                Container(
                  width: 2,
                  height: 35,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.25)
                      : Colors.grey.shade300,
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
                      child: Text(
                        event.judul,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    if (event.deskripsi.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: ShapeDecoration(
                          color: theme.colorScheme.primaryContainer,
                          shape: const StadiumBorder(),
                        ),
                        child: Text(
                          event.deskripsi,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.primary,
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
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark
                          ? Colors.grey.shade400
                          : Colors.grey.shade700,
                    ),
                  ),
                Text(
                  DateFormat('dd/MM/yy HH:mm').format(event.tanggal),
                  style: TextStyle(
                    fontSize: 10,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- ACTIONS ---

  void _showApproveConfirm(SuratModel surat) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text(
          'Apakah Anda yakin ingin menyetujui surat nomor ${surat.nomorSurat}?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticHelper.lightImpact();
              Navigator.of(dialogCtx).pop();
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticHelper.mediumImpact();
              Navigator.of(dialogCtx).pop();
              final targetId = surat.idSuratKeluar ?? surat.id;
              try {
                await ref
                    .read(approvalListProvider.notifier)
                    .approveSurat(
                      targetId,
                      idSuratApproval: surat.idSuratApproval,
                    );
                if (!mounted) return;
                ref
                    .read(myActionsProvider.notifier)
                    .removeActionOptimistically(surat.id);
                final user = ref.read(authProvider).value;
                ApprovalReceiptModal.show(
                  context,
                  surat: surat,
                  approverName: user?.nama ?? 'Pimpinan',
                  approvalTime: DateTime.now(),
                );
              } catch (e) {
                bool wasActuallyApproved = false;
                if (e is DioException &&
                    e.type == DioExceptionType.receiveTimeout) {
                  try {
                    await ref
                        .read(approvalListProvider.notifier)
                        .fetchApprovalList();
                    final remaining =
                        ref.read(approvalListProvider).value ?? [];
                    if (!remaining.any(
                      (it) =>
                          it.id == targetId ||
                          it.idSuratApproval == surat.idSuratApproval,
                    )) {
                      wasActuallyApproved = true;
                    }
                  } catch (_) {}
                }

                if (!mounted) return;
                if (wasActuallyApproved) {
                  ref
                      .read(myActionsProvider.notifier)
                      .removeActionOptimistically(surat.id);
                  ref
                      .read(approvalListProvider.notifier)
                      .removeApprovalOptimistically(targetId);
                  final user = ref.read(authProvider).value;
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: user?.nama ?? 'Pimpinan',
                    approvalTime: DateTime.now(),
                  );
                } else {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text('Gagal: $e')));
                }
              }
            },
            child: const Text('Setujui'),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog(SuratModel surat) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Catatan Revisi',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticHelper.lightImpact();
              Navigator.of(dialogCtx).pop();
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              if (controller.text.isEmpty) return;
              HapticHelper.mediumImpact();
              Navigator.of(dialogCtx).pop();
              final targetId = surat.idSuratKeluar ?? surat.id;
              try {
                await ref
                    .read(approvalListProvider.notifier)
                    .rejectSurat(
                      targetId,
                      controller.text,
                      idSuratApproval: surat.idSuratApproval,
                    );
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Surat berhasil ditolak.')),
                );
                ref
                    .read(myActionsProvider.notifier)
                    .removeActionOptimistically(surat.id);
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text('Gagal: $e')));
              }
            },
            child: const Text('Tolak'),
          ),
        ],
      ),
    );
  }

  void _showCompleteDisposisiDialog(BuildContext context, SuratModel surat) {
    String? tempDispositionId = _resolvedIdDisposisi ?? widget.idDisposisi;
    String asal = _asalNilaiDisposisi;
    if ((tempDispositionId == null || tempDispositionId.isEmpty) &&
        surat.idDisposisi != null &&
        surat.idDisposisi!.isNotEmpty) {
      tempDispositionId = surat.idDisposisi;
      asal = 'surat.idDisposisi';
    }
    if (tempDispositionId == null || tempDispositionId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'ID disposisi tidak ditemukan untuk surat ini. Silakan muat ulang.',
          ),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    final dispositionId = tempDispositionId;

    final catatanController = TextEditingController();
    PlatformFile? selectedFile;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (modalContext) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final mediaQuery = MediaQuery.of(ctx);
          final safeBottom = math.max(
            mediaQuery.viewInsets.bottom,
            math.max(mediaQuery.padding.bottom, mediaQuery.viewPadding.bottom),
          );
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, safeBottom + 24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Selesaikan Disposisi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
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
                    hintText:
                        'Tuliskan tindakan atau penyelesaian disposisi...',
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
                          selectedFile != null
                              ? Icons.attach_file
                              : Icons.upload_file,
                          color: selectedFile != null
                              ? AppColors.primary
                              : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile != null
                                ? selectedFile!.name
                                : 'Lampirkan Bukti (PDF/Gambar - Opsional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: selectedFile != null
                                  ? Colors.black87
                                  : Colors.grey.shade600,
                              fontWeight: selectedFile != null
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedFile != null)
                          IconButton(
                            icon: const Icon(
                              Icons.cancel,
                              size: 18,
                              color: Colors.red,
                            ),
                            onPressed: () =>
                                setModalState(() => selectedFile = null),
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
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: const StadiumBorder(),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final catatan = catatanController.text.trim();
                            if (catatan.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Catatan penyelesaian wajib diisi.',
                                  ),
                                ),
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);
                            try {
                              String? fileBuktiPath;
                              if (selectedFile != null &&
                                  selectedFile!.path != null) {
                                final uploadResp = await ref
                                    .read(suratRepositoryProvider)
                                    .uploadAttachment(
                                      dispositionId,
                                      selectedFile!.path!,
                                    );
                                fileBuktiPath = uploadResp['file_bukti_path']
                                    ?.toString();
                              }

                              await ref
                                  .read(suratRepositoryProvider)
                                  .completeDisposisi(
                                    dispositionId,
                                    catatan: catatan,
                                    fileBuktiPath: fileBuktiPath,
                                    idSuratMasuk: widget.idSurat,
                                    asalNilai: asal,
                                  );

                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Disposisi berhasil diselesaikan.',
                                    ),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                ref.invalidate(
                                  suratDetailProvider((
                                    id: widget.idSurat,
                                    type: widget.actionType,
                                  )),
                                );
                                ref.invalidate(
                                  trackingProvider((
                                    id: widget.idSurat,
                                    type: widget.actionType,
                                  )),
                                );
                                ref.read(myActionsProvider.notifier).refresh();
                                ref
                                    .read(pimpinanDashboardProvider.notifier)
                                    .refresh();
                              }
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Gagal menyelesaikan disposisi: $e',
                                    ),
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
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Selesaikan Disposisi',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
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

class _RecipientPickerSheet extends StatefulWidget {
  final List<Map<String, dynamic>>? cachedRecipients;
  final Set<String> initialSelectedIds;
  final Future<List<Map<String, dynamic>>> Function() fetchRecipients;
  final void Function(List<Map<String, dynamic>> items) onRecipientsLoaded;
  final String Function(Object error) formatError;

  const _RecipientPickerSheet({
    required this.cachedRecipients,
    required this.initialSelectedIds,
    required this.fetchRecipients,
    required this.onRecipientsLoaded,
    required this.formatError,
  });

  @override
  State<_RecipientPickerSheet> createState() => _RecipientPickerSheetState();
}

class _RecipientPickerSheetState extends State<_RecipientPickerSheet> {
  final TextEditingController _searchController = TextEditingController();
  late List<Map<String, dynamic>> _items;
  late final Set<String> _selectedIds;
  bool _loading = false;
  String? _errorMsg;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _selectedIds = Set<String>.from(widget.initialSelectedIds);
    if (widget.cachedRecipients != null) {
      _items = widget.cachedRecipients!;
    } else {
      _items = [];
      _loadRecipients();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRecipients() async {
    setState(() {
      _loading = true;
      _errorMsg = null;
    });
    try {
      final fetched = await widget.fetchRecipients();
      widget.onRecipientsLoaded(fetched);
      if (mounted) {
        setState(() {
          _items = fetched;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMsg = widget.formatError(e);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final maxHeight =
        (mediaQuery.size.height - mediaQuery.viewPadding.top) * 0.82;
    final keyboardInset = mediaQuery.viewInsets.bottom;
    final systemBottomInset = math.max(
      mediaQuery.padding.bottom,
      mediaQuery.viewPadding.bottom,
    );
    final bottomPadding = math.max(keyboardInset, systemBottomInset) + 24.0;
    final filtered = _items.where((item) {
      if (_query.isEmpty) return true;
      final q = _query.toLowerCase();
      final name = (item['name'] ?? '').toString().toLowerCase();
      final group = (item['nama_group'] ?? '').toString().toLowerCase();
      final email = (item['email'] ?? '').toString().toLowerCase();
      return name.contains(q) || group.contains(q) || email.contains(q);
    }).toList();

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: maxHeight),
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, bottomPadding),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Pilih Pegawai Penerima',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SuratSearchBar(
              controller: _searchController,
              hintText: 'Cari pegawai...',
              padding: EdgeInsets.zero,
              hasText: _query.isNotEmpty,
              onChanged: (val) => setState(() => _query = val.trim()),
              onClear: () => setState(() => _query = ''),
            ),
            const SizedBox(height: 12),
            Expanded(child: _buildBody(filtered)),
            const SizedBox(height: 12),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: const StadiumBorder(),
              ),
              onPressed: () {
                final selected = _items
                    .where(
                      (item) =>
                          _selectedIds.contains(item['id']?.toString() ?? ''),
                    )
                    .toList();
                Navigator.pop(context, selected);
              },
              child: Text(
                'Pilih (${_selectedIds.length})',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(List<Map<String, dynamic>> filtered) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_errorMsg != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _errorMsg!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _loadRecipients,
                icon: const Icon(Icons.refresh),
                label: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      );
    }
    if (filtered.isEmpty) {
      return const Center(
        child: Text(
          'Pegawai tidak ditemukan.',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      itemCount: filtered.length,
      itemBuilder: (ctx, index) {
        final item = filtered[index];
        final id = item['id']?.toString() ?? '';
        final name = item['name']?.toString() ?? 'Pegawai';
        final group = item['nama_group']?.toString() ?? '';
        final email = item['email']?.toString() ?? '';
        final subtitle = group.isNotEmpty ? group : email;
        final isSelected = _selectedIds.contains(id);

        return CheckboxListTile(
          value: isSelected,
          controlAffinity: ListTileControlAffinity.leading,
          title: Text(
            name,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          subtitle: subtitle.isNotEmpty
              ? Text(subtitle, style: const TextStyle(fontSize: 12))
              : null,
          onChanged: (checked) {
            setState(() {
              if (checked == true) {
                _selectedIds.add(id);
              } else {
                _selectedIds.remove(id);
              }
            });
          },
        );
      },
    );
  }
}

class _ArchiveSuratMasukSheet extends StatefulWidget {
  final SuratModel surat;
  final Future<Map<String, dynamic>> Function(
    String lokasiFisik,
    String tanggalArsip,
  )
  onSubmitArchive;
  final String Function(Object error) formatError;

  const _ArchiveSuratMasukSheet({
    required this.surat,
    required this.onSubmitArchive,
    required this.formatError,
  });

  @override
  State<_ArchiveSuratMasukSheet> createState() =>
      _ArchiveSuratMasukSheetState();
}

class _ArchiveSuratMasukSheetState extends State<_ArchiveSuratMasukSheet> {
  final TextEditingController _lokasiController = TextEditingController();
  DateTime _tanggalArsip = DateTime.now();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _lokasiController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);
    try {
      await widget.onSubmitArchive(
        _lokasiController.text.trim(),
        DateFormat('yyyy-MM-dd').format(_tanggalArsip),
      );
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.formatError(e)),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final fieldFillColor = isDark
        ? theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35)
        : Colors.grey.shade50;
    final fieldBorderColor = isDark
        ? Colors.white.withValues(alpha: 0.18)
        : Colors.grey.shade300;
    final mediaQuery = MediaQuery.of(context);
    final safeBottom = math.max(
      mediaQuery.viewInsets.bottom,
      math.max(mediaQuery.padding.bottom, mediaQuery.viewPadding.bottom),
    );

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, safeBottom + 24.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Arsip Surat Masuk',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: _isSubmitting
                    ? null
                    : () => Navigator.pop(context, false),
              ),
            ],
          ),
          Text(
            '${widget.surat.nomorSurat} — ${widget.surat.perihal}',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          const Text(
            'Tanggal Arsip *',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          InkWell(
            borderRadius: BorderRadius.circular(28),
            onTap: _isSubmitting
                ? null
                : () async {
                    final now = DateTime.now();
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _tanggalArsip,
                      firstDate: DateTime(now.year - 5),
                      lastDate: DateTime(now.year + 5),
                    );
                    if (picked != null && mounted) {
                      setState(() => _tanggalArsip = picked);
                    }
                  },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: fieldFillColor,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: fieldBorderColor),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      DateFormat('dd MMMM yyyy').format(_tanggalArsip),
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                  Icon(
                    Icons.calendar_today_outlined,
                    size: 18,
                    color: Colors.grey.shade600,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _lokasiController,
            enabled: !_isSubmitting,
            decoration: InputDecoration(
              labelText: 'Lokasi Arsip Fisik (Opsional)',
              hintText: 'Contoh: Ruang Arsip, Rak No. 10, Box A-03',
              filled: true,
              fillColor: fieldFillColor,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: BorderSide(color: fieldBorderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: BorderSide(color: fieldBorderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: BorderSide(color: theme.colorScheme.primary),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: _isSubmitting
                      ? null
                      : () => Navigator.pop(context, false),
                  child: const Text('Batal'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: const StadiumBorder(),
                  ),
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Simpan Arsip',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
