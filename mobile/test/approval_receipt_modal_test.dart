import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/presentation/widgets/approval_receipt_modal.dart';

void main() {
  testWidgets('ApprovalReceiptModal renders QR code, surat metadata, and buttons correctly', (tester) async {
    final testSurat = SuratModel(
      id: 'SK-1234',
      nomorSurat: 'SK/2026/11/003',
      asalSurat: 'Bagian Umum',
      perihal: 'Surat Edaran Libur Nasional',
      jenisSurat: 'Surat Edaran',
      tanggalDiterima: DateTime(2026, 11, 5, 14, 42, 21),
      status: 'approved',
      ringkasan: 'Uji coba approval',
      pemohon: 'Staff Tata Usaha',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ApprovalReceiptModal(
            surat: testSurat,
            approverName: 'Pimpinan',
            approvalTime: DateTime(2026, 11, 5, 14, 42, 21),
          ),
        ),
      ),
    );

    // Verify Title
    expect(find.text('Tanda Terima Approval'), findsOneWidget);

    // Verify QR Code
    expect(find.byType(QrImageView), findsOneWidget);

    // Verify Metadata labels and values
    expect(find.text('Jenis Surat'), findsOneWidget);
    expect(find.text('Surat Edaran'), findsOneWidget);
    expect(find.text('Nomor Surat'), findsOneWidget);
    expect(find.text('SK/2026/11/003'), findsOneWidget);
    expect(find.text('Perihal'), findsOneWidget);
    expect(find.text('Surat Edaran Libur Nasional'), findsOneWidget);
    expect(find.text('Disetujui oleh'), findsOneWidget);
    expect(find.text('Pimpinan'), findsOneWidget);
    expect(find.text('Tanggal & Waktu'), findsOneWidget);

    // Verify Indonesian date formatting
    expect(find.text('Kamis, 5 November 2026 14.42.21'), findsOneWidget);

    // Verify Status Badge
    expect(find.text('Status'), findsOneWidget);
    expect(find.text('Disetujui'), findsOneWidget);

    // Verify Action Buttons
    expect(find.text('TUTUP'), findsOneWidget);
    expect(find.text('DOWNLOAD QR CODE'), findsOneWidget);
  });
}
