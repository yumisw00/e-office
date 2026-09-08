import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../core/localization/app_localizations.dart';

class OutgoingSuratModel {
  final String id;
  final String nomorSurat;
  final String penerima;
  final String perihal;
  final DateTime tanggalKirim;
  final String status; // 'terkirim', 'draft', 'pending'

  OutgoingSuratModel({
    required this.id,
    required this.nomorSurat,
    required this.penerima,
    required this.perihal,
    required this.tanggalKirim,
    required this.status,
  });
}

class SuratKeluarScreen extends StatelessWidget {
  const SuratKeluarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);

    // Mock Outgoing Letters
    final mockOutgoingList = [
      OutgoingSuratModel(
        id: '101',
        nomorSurat: '142/OUT-DIR/VI/2026',
        penerima: 'PT. Telekomunikasi Indonesia',
        perihal: 'Pengajuan Kerjasama Layanan Cloud Server Terintegrasi',
        tanggalKirim: DateTime.now().subtract(const Duration(hours: 3)),
        status: 'terkirim',
      ),
      OutgoingSuratModel(
        id: '102',
        nomorSurat: '143/OUT-HRD/VI/2026',
        penerima: 'Badan Sertifikasi Kompetensi',
        perihal: 'Permohonan Uji Kompetensi Staf Administrasi Utama',
        tanggalKirim: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
        status: 'pending',
      ),
      OutgoingSuratModel(
        id: '103',
        nomorSurat: '144/OUT-LEG/VI/2026',
        penerima: 'Kementerian Hukum & HAM',
        perihal: 'Laporan Pembaruan Legalitas Perusahaan Triwulan II',
        tanggalKirim: DateTime.now().subtract(const Duration(days: 3)),
        status: 'terkirim',
      ),
      OutgoingSuratModel(
        id: '104',
        nomorSurat: '145/OUT-FIN/VI/2026',
        penerima: 'Bank Mandiri Persero',
        perihal: 'Aplikasi Pembukaan Rekening Giro Cabang Baru',
        tanggalKirim: DateTime.now().subtract(const Duration(days: 5)),
        status: 'draft',
      ),
    ];

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: mockOutgoingList.length,
      itemBuilder: (context, index) {
        final surat = mockOutgoingList[index];
        return Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
            ),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              // Outgoing letter details popup or preview
              _showDetailDialog(context, surat, localizations);
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    backgroundColor: _getStatusColor(surat.status).withValues(alpha: 0.1),
                    child: Icon(
                      _getStatusIcon(surat.status),
                      color: _getStatusColor(surat.status),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          surat.nomorSurat,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${localizations.get('receiver')}: ${surat.penerima}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          surat.perihal,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(surat.status).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                surat.status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: _getStatusColor(surat.status),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Text(
                              DateFormat('dd MMM yyyy').format(surat.tanggalKirim),
                              style: TextStyle(
                                  fontSize: 11,
                                  color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        )
            .animate()
            .fade(duration: 350.ms, curve: Curves.easeOutCubic)
            .slideY(begin: 0.15, end: 0, duration: 350.ms, curve: Curves.easeOutCubic);
      },
    );
  }

  void _showDetailDialog(BuildContext context, OutgoingSuratModel surat, AppLocalizations localizations) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            surat.nomorSurat,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          content: SingleChildScrollView(
            child: ListBody(
              children: [
                _buildInfoField(localizations.get('receiver'), surat.penerima, context),
                const SizedBox(height: 12),
                _buildInfoField(localizations.get('subject'), surat.perihal, context),
                const SizedBox(height: 12),
                _buildInfoField(localizations.get('sent_date'), DateFormat('dd MMMM yyyy, HH:mm').format(surat.tanggalKirim), context),
                const SizedBox(height: 12),
                _buildInfoField(localizations.get('status'), surat.status.toUpperCase(), context, isStatus: true, statusValue: surat.status),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(localizations.get('close')),
            ),
          ],
        );
      },
    );
  }

  Widget _buildInfoField(String label, String value, BuildContext context, {bool isStatus = false, String? statusValue}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: isStatus && statusValue != null ? _getStatusColor(statusValue) : null,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'terkirim':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'draft':
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'terkirim':
        return Icons.check_circle_outline_rounded;
      case 'pending':
        return Icons.watch_later_outlined;
      case 'draft':
      default:
        return Icons.edit_note_rounded;
    }
  }
}
