import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/presentation/screens/detail_surat_screen.dart';
import 'package:e_office_mobile/presentation/screens/document_viewer_screen.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';

void main() {
  group('DetailSuratScreen - Preview and Google Docs Buttons', () {
    testWidgets('Renders Buka Preview and Buka di Google Docs when surat is Google Docs', (tester) async {
      final googleDocsSurat = SuratModel(
        id: '101',
        nomorSurat: '001/SM/2026',
        asalSurat: 'Instansi Pusat',
        perihal: 'Undangan Rapat Google Docs',
        tanggalDiterima: DateTime(2026, 11, 1),
        status: 'baru',
        ringkasan: 'Ringkasan surat',
        googleDriveUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratDetailProvider((id: '101', type: 'surat_masuk')).overrideWith(
              (ref) => googleDocsSurat,
            ),
            trackingProvider((id: '101', type: 'surat_masuk')).overrideWith(
              (ref) => <TimelineEvent>[],
            ),
          ],
          child: const MaterialApp(
            home: DetailSuratScreen(
              idSurat: '101',
              actionType: 'surat_masuk',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify "Buka Preview" is present
      final previewFinder = find.widgetWithText(ElevatedButton, 'Buka Preview');
      expect(previewFinder, findsOneWidget);

      // Verify "Buka di Google Docs" is present
      final googleDocsFinder = find.widgetWithText(OutlinedButton, 'Buka di Google Docs');
      expect(googleDocsFinder, findsOneWidget);

      // Verify "Buka Preview" is positioned ABOVE "Buka di Google Docs"
      final previewTop = tester.getTopLeft(previewFinder).dy;
      final googleDocsTop = tester.getTopLeft(googleDocsFinder).dy;
      expect(previewTop, lessThan(googleDocsTop));
    });

    testWidgets('Renders only Buka Preview when surat is regular PDF (not Google Docs)', (tester) async {
      final regularPdfSurat = SuratModel(
        id: '102',
        nomorSurat: '002/SM/2026',
        asalSurat: 'Dinas Luar',
        perihal: 'Surat Masuk Format PDF',
        tanggalDiterima: DateTime(2026, 11, 2),
        status: 'baru',
        ringkasan: 'Ringkasan PDF',
        filePdf: 'surat_masuk/dokumen_102.pdf',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratDetailProvider((id: '102', type: 'surat_masuk')).overrideWith(
              (ref) => regularPdfSurat,
            ),
            trackingProvider((id: '102', type: 'surat_masuk')).overrideWith(
              (ref) => <TimelineEvent>[],
            ),
          ],
          child: const MaterialApp(
            home: DetailSuratScreen(
              idSurat: '102',
              actionType: 'surat_masuk',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify "Buka Preview" is present
      expect(find.widgetWithText(ElevatedButton, 'Buka Preview'), findsOneWidget);

      // Verify "Buka di Google Docs" is NOT present
      expect(find.text('Buka di Google Docs'), findsNothing);
    });

    testWidgets('Works for Disposisi with Google Docs', (tester) async {
      final disposisiSurat = SuratModel(
        id: '201',
        nomorSurat: '003/DISP/2026',
        asalSurat: 'Sekretariat',
        perihal: 'Disposisi Google Docs',
        tanggalDiterima: DateTime(2026, 11, 3),
        status: 'pending',
        ringkasan: 'Disposisi penting',
        googleDriveUrl: 'https://docs.google.com/document/d/xyz123/edit',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratDetailProvider((id: '201', type: 'disposisi')).overrideWith(
              (ref) => disposisiSurat,
            ),
            trackingProvider((id: '201', type: 'disposisi')).overrideWith(
              (ref) => <TimelineEvent>[],
            ),
          ],
          child: const MaterialApp(
            home: DetailSuratScreen(
              idSurat: '201',
              actionType: 'disposisi',
              idDisposisi: 'disp_201',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.widgetWithText(ElevatedButton, 'Buka Preview'), findsOneWidget);
      expect(find.widgetWithText(OutlinedButton, 'Buka di Google Docs'), findsOneWidget);
    });

    testWidgets('Works for Approval with Google Docs', (tester) async {
      final approvalSurat = SuratModel(
        id: '301',
        nomorSurat: '004/APPR/2026',
        asalSurat: 'Bagian Hukum',
        perihal: 'Approval Surat Keluar Google Docs',
        tanggalDiterima: DateTime(2026, 11, 4),
        status: 'review',
        ringkasan: 'Approval penting',
        googleDriveUrl: 'https://docs.google.com/document/d/appr456/edit',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratDetailProvider((id: '301', type: 'approval')).overrideWith(
              (ref) => approvalSurat,
            ),
            trackingProvider((id: '301', type: 'approval')).overrideWith(
              (ref) => <TimelineEvent>[],
            ),
          ],
          child: const MaterialApp(
            home: DetailSuratScreen(
              idSurat: '301',
              actionType: 'approval',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.widgetWithText(ElevatedButton, 'Buka Preview'), findsOneWidget);
      expect(find.widgetWithText(OutlinedButton, 'Buka di Google Docs'), findsOneWidget);
    });
  });

  group('DocumentViewerScreen Title and Content', () {
    testWidgets('DocumentViewerScreen shows title "Preview Dokumen" instead of "Google Docs"', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: DocumentViewerScreen(
              pdfUrl: 'https://docs.google.com/document/d/test12345/edit',
            ),
          ),
        ),
      );

      await tester.pump();

      // Title should be "Preview Dokumen"
      expect(find.text('Preview Dokumen'), findsOneWidget);
      // Title should NOT be "Google Docs"
      expect(find.text('Google Docs'), findsNothing);
    });
  });
}
