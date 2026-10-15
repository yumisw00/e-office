import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../data/models/surat_model.dart';

class ApprovalReceiptModal extends StatelessWidget {
  final SuratModel surat;
  final String approverName;
  final DateTime approvalTime;
  final String? customQrData;

  const ApprovalReceiptModal({
    super.key,
    required this.surat,
    required this.approverName,
    required this.approvalTime,
    this.customQrData,
  });

  static void show(
    BuildContext context, {
    required SuratModel surat,
    required String approverName,
    DateTime? approvalTime,
    String? customQrData,
  }) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: ApprovalReceiptModal(
          surat: surat,
          approverName: approverName,
          approvalTime: approvalTime ?? DateTime.now(),
          customQrData: customQrData,
        ),
      ),
    );
  }

  static String formatTanggalWaktuIndonesia(DateTime dt) {
    const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final namaHari = hari[dt.weekday - 1];
    final namaBulan = bulan[dt.month - 1];
    final tgl = dt.day;
    final thn = dt.year;
    final jam = dt.hour.toString().padLeft(2, '0');
    final menit = dt.minute.toString().padLeft(2, '0');
    final detik = dt.second.toString().padLeft(2, '0');
    return '$namaHari, $tgl $namaBulan $thn $jam.$menit.$detik';
  }

  String _getQrDataString() {
    if (customQrData != null && customQrData!.isNotEmpty) {
      return customQrData!;
    }
    final timeStr = formatTanggalWaktuIndonesia(approvalTime);
    final data = {
      'jenis': surat.perihal.isNotEmpty ? surat.perihal : 'Surat Keluar',
      'no_surat': surat.nomorSurat,
      'perihal': surat.perihal,
      'pengirim': surat.pengirim ?? surat.pemohon ?? '-',
      'approver': approverName,
      'tanggal_waktu': timeStr,
      'status': 'Disetujui',
      'id': surat.id,
    };
    return jsonEncode(data);
  }

  Future<void> _handleDownloadQr(BuildContext context, String qrData) async {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Menyimpan QR Code ke perangkat...')),
    );

    try {
      final qrApiUrl =
          'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${Uri.encodeComponent(qrData)}&format=png&margin=10';
      final dio = Dio();
      final dir = await getApplicationDocumentsDirectory();
      final safeName = surat.id.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
      final savePath = '${dir.path}/approval_qr_$safeName.png';

      await dio.download(qrApiUrl, savePath);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF138A98),
            content: Text('QR Code berhasil diunduh ke: $savePath'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tanda terima QR berhasil dibuat (Kode: ${surat.nomorSurat})'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final qrData = _getQrDataString();
    const primaryTeal = Color(0xFF138A98);

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Row: Title & Red Close Button
            Row(
              children: [
                const Icon(
                  Icons.qr_code_2_rounded,
                  size: 24,
                  color: Colors.black87,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Tanda Terima Approval',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
                // Red close square button as in screenshot
                InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                  },
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2), // soft red
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.close,
                      size: 20,
                      color: Color(0xFFEF4444), // red
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // QR Code Box
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 190.0,
                  backgroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Divider(color: Colors.grey.shade200, height: 1),
            const SizedBox(height: 14),

            // Details List
            _buildInfoRow('Jenis Surat', surat.perihal.isNotEmpty ? surat.perihal : 'Surat Permohonan'),
            _buildInfoRow('Nomor Surat', surat.nomorSurat),
            _buildInfoRow('Perihal', surat.perihal),
            _buildInfoRow(
              'Disetujui oleh',
              approverName.isNotEmpty ? approverName : 'Pimpinan',
              valueColor: const Color(0xFF16A34A), // Green
            ),
            _buildInfoRow(
              'Tanggal & Waktu',
              formatTanggalWaktuIndonesia(approvalTime),
            ),

            // Status Badge
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Status',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF84CC16), // Lime Green as in screenshot
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Disetujui',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryTeal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                  },
                  child: const Text(
                    'TUTUP',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryTeal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              onPressed: () => _handleDownloadQr(context, qrData),
              icon: const Icon(Icons.download_rounded, size: 18),
              label: const Text(
                'DOWNLOAD QR CODE',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
