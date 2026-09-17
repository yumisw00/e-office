import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/surat_model.dart';
import '../../domain/providers/surat_provider.dart';
class DetailSuratScreen extends ConsumerStatefulWidget {
  final String idSurat;
  const DetailSuratScreen({super.key, required this.idSurat});

  @override
  ConsumerState<DetailSuratScreen> createState() => _DetailSuratScreenState();
}

class _DetailSuratScreenState extends ConsumerState<DetailSuratScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(suratRepositoryProvider).logAuditTrail('view_surat_detail', {
        'id_surat': widget.idSurat,
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final suratMasukAsync = ref.watch(suratMasukProvider);
    final currentSurat = suratMasukAsync.maybeWhen(
      data: (list) =>
          list.firstWhere((s) => s.id == widget.idSurat, orElse: () => throw Exception('Surat tidak ditemukan')),
      orElse: () => throw Exception('Data surat belum tersedia'),
    );
    final isApproved = currentSurat.status == 'selesai';
    
    // ASUMSI-API: Fetch timeline secara paralel
    final timelineAsync = ref.watch(suratTimelineProvider(widget.idSurat));

    return Scaffold(
      appBar: AppBar(title: Text(currentSurat.nomorSurat)),
      body: RefreshIndicator(
        onRefresh: () async {
           ref.invalidate(suratTimelineProvider(widget.idSurat));
           return ref.read(suratMasukProvider.notifier).refresh();
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildMetadataCard(context, currentSurat),
              const SizedBox(height: 16),
              timelineAsync.when(
                data: (events) => _buildTrackingCard(context, currentSurat, events),
                loading: () => const Center(child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: CircularProgressIndicator(),
                )),
                error: (err, st) => Text('Gagal memuat timeline: $err'),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: isApproved
          ? null 
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          _showDisposisiSheet(context, ref, currentSurat),
                      icon: const Icon(Icons.send_outlined),
                      label: const Text('Disposisi'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        _showApprovalModal(context, currentSurat);
                      },
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: const Color(0xFF27AE60),
                      ),
                      child: const Text(
                        'Setujui',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
  void _showDisposisiSheet(
    BuildContext context,
    WidgetRef ref,
    SuratModel surat,
  ) {
    String? selectedTujuan;
    final instruksiController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 24,
                right: 24,
                top: 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Instruksi Disposisi',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 24),
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Tujuan Disposisi',
                        border: OutlineInputBorder(),
                      ),
                      initialValue: selectedTujuan,
                      items:
                          [
                                "Manajer IT",
                                "Divisi Umum",
                                "Keuangan",
                                "SDM",
                                "Legal",
                              ]
                              .map(
                                (e) =>
                                    DropdownMenuItem(value: e, child: Text(e)),
                              )
                              .toList(),
                      onChanged: (value) =>
                          setModalState(() => selectedTujuan = value),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: instruksiController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Catatan Instruksi',
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () {
                        if (selectedTujuan != null) {
                          // TODO: Implementasi disposisi dengan API call yang benar
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Disposisi ke $selectedTujuan terkirim')),
                          );
                          context.pop();
                        }
                      },
                      child: const Text('Kirim Disposisi'),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
  void _showApprovalModal(BuildContext context, SuratModel surat) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              const Icon(
                Icons.check_circle_outline_rounded,
                color: Color(0xFF27AE60),
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                'Persetujuan Digital Berhasil',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF27AE60),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Surat dengan nomor ${surat.nomorSurat} telah berhasil ditandatangani secara digital.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              QrImageView(
                data: 'VERIFIED-${surat.nomorSurat}-2026',
                version: QrVersions.auto,
                size: 200.0,
                backgroundColor: Colors.white,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: () => context.pop(),
                  child: const Text('Tutup'),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
  Widget _buildMetadataCard(BuildContext context, SuratModel currentSurat) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Informasi Surat',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Divider(),
            _buildInfoRow('Asal Surat', currentSurat.asalSurat, currentSurat),
            _buildInfoRow(
              'Tanggal Diterima',
              DateFormat(
                'dd MMMM yyyy, HH:mm',
              ).format(currentSurat.tanggalDiterima),
              currentSurat,
            ),
            _buildInfoRow('Perihal', currentSurat.perihal, currentSurat),
            _buildInfoRow(
              'Status',
              currentSurat.status.replaceAll('_', ' ').toUpperCase(),
              currentSurat,
              isStatus: true,
            ),
            const SizedBox(height: 8),
            Text(
              'Ringkasan:',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(currentSurat.ringkasan),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {
                context.push(
                  '/pdf',
                  extra:
                      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                );
              },
              icon: const Icon(Icons.picture_as_pdf_outlined),
              label: const Text('Lihat Dokumen'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildInfoRow(
    String label,
    String value,
    SuratModel currentSurat, {
    bool isStatus = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isStatus ? _getStatusColor(currentSurat.status) : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
  Widget _buildTrackingCard(BuildContext context, SuratModel currentSurat, List<TimelineEvent> events) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tracking Disposisi',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Divider(),
            if (events.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('Belum ada riwayat perjalanan surat'),
              )
            else
              Stepper(
                physics: const NeverScrollableScrollPhysics(),
                currentStep: events.length - 1,
                controlsBuilder: _nullControlsBuilder,
                steps: events.map((event) => Step(
                  title: Text(event.judul),
                  subtitle: Text('${event.pelaku} - ${DateFormat('dd MMM yyyy HH:mm').format(event.tanggal)}'),
                  content: Text(event.deskripsi),
                  isActive: true,
                  state: event.status == 'selesai' ? StepState.complete : StepState.indexed,
                )).toList(),
              ),
          ],
        ),
      ),
    );
  }
  static Widget _nullControlsBuilder(
    BuildContext context,
    ControlsDetails details,
  ) {
    return const SizedBox.shrink();
  }
  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'BELUM_DIBACA':
        return Theme.of(context).colorScheme.primary;
      case 'DISPOSISI':
        return const Color(0xFFE67E22);
      case 'SELESAI':
        return const Color(0xFF27AE60);
      default:
        return const Color(0xFF7F8C8D);
    }
  }
}
