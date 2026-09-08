import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/surat_model.dart';
import '../../domain/providers/surat_provider.dart';

class DetailSuratScreen extends ConsumerWidget {
  final SuratModel surat;

  const DetailSuratScreen({super.key, required this.surat});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch the provider to get the latest version of this specific surat
    final suratMasukAsync = ref.watch(suratMasukProvider);

    // Find the specific surat from the list to reflect live updates
    final currentSurat = suratMasukAsync.maybeWhen(
      data: (list) =>
          list.firstWhere((s) => s.id == surat.id, orElse: () => surat),
      orElse: () => surat,
    );

    final isApproved = currentSurat.status == 'selesai';

    return Scaffold(
      appBar: AppBar(title: Text(currentSurat.nomorSurat)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildMetadataCard(context, currentSurat),
            const SizedBox(height: 16),
            _buildTrackingCard(context, currentSurat),
          ],
        ),
      ),
      bottomNavigationBar: isApproved
          ? null // Hide button if already approved
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          _showDisposisiSheet(context, ref, currentSurat),
                      icon: const Icon(Icons.send),
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
                        ref
                            .read(suratMasukProvider.notifier)
                            .approveSurat(currentSurat.id);
                        _showApprovalModal(context, currentSurat);
                      },
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: Colors.green,
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
                          ref
                              .read(suratMasukProvider.notifier)
                              .disposisiSurat(
                                surat.nomorSurat,
                                selectedTujuan!,
                                instruksiController.text,
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
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              const Icon(
                Icons.check_circle_outline,
                color: Colors.green,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                'Persetujuan Digital Berhasil',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
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
              icon: const Icon(Icons.picture_as_pdf),
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

  Widget _buildTrackingCard(BuildContext context, SuratModel currentSurat) {
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
            Stepper(
              physics: const NeverScrollableScrollPhysics(),
              currentStep: currentSurat.status == 'selesai'
                  ? 2
                  : 2, // Logic can be refined here
              controlsBuilder: _nullControlsBuilder,
              steps: [
                const Step(
                  title: Text('Diterima Admin'),
                  subtitle: Text('Surat telah diverifikasi oleh bagian umum'),
                  content: SizedBox.shrink(),
                  isActive: true,
                  state: StepState.complete,
                ),
                const Step(
                  title: Text('Disposisi Manager'),
                  subtitle: Text('Diteruskan ke Manager Unit untuk arahan'),
                  content: SizedBox.shrink(),
                  isActive: true,
                  state: StepState.complete,
                ),
                Step(
                  title: const Text('Menunggu Persetujuan'),
                  subtitle: Text(
                    currentSurat.status == 'selesai'
                        ? 'Surat telah disetujui secara digital'
                        : 'Sedang dalam tahap review akhir',
                  ),
                  content: const SizedBox.shrink(),
                  isActive: true,
                  state: currentSurat.status == 'selesai'
                      ? StepState.complete
                      : StepState.indexed,
                ),
              ],
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
        return Colors.blue;
      case 'DISPOSISI':
        return Colors.orange;
      case 'SELESAI':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
