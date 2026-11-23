import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/data/repositories/surat_repository.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';
import 'package:e_office_mobile/presentation/screens/surat_masuk_screen.dart';
import 'package:e_office_mobile/presentation/screens/disposisi_screen.dart';
import 'package:e_office_mobile/presentation/screens/approval_screen.dart';
import 'package:e_office_mobile/presentation/widgets/custom_app_bar.dart';

class _FakeSuratRepository implements SuratRepository {
  @override
  Future<List<Map<String, String>>> getJenisSuratOptions() async => [
        {'value': 'Surat Edaran', 'label': 'Surat Edaran'},
        {'value': 'Surat Tugas', 'label': 'Surat Tugas'},
      ];

  @override
  Future<List<SuratModel>> getSuratMasukList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    String? tanggalTerima,
    int page = 1,
    int pageSize = 100,
  }) async {
    return List<SuratModel>.generate(
      20,
      (i) => SuratModel(
        id: 'sm_$i',
        nomorSurat: '00$i/SM/2026',
        perihal: 'Surat Masuk Nomor $i',
        asalSurat: 'Instansi $i',
        tanggalDiterima: DateTime(2026, 3, 1 + (i % 28)),
        status: 'baru',
        ringkasan: 'Ringkasan $i',
        jenisSurat: 'Surat Edaran',
        jenisPengiriman: i.isEven ? 'internal' : 'eksternal',
      ),
    );
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    int page = 1,
    int pageSize = 100,
  }) async {
    return List<Map<String, dynamic>>.generate(
      20,
      (i) => {
        'id_surat_disposisi': i + 1,
        'id_surat_masuk': 100 + i,
        'nomor_surat': 'DISP-00$i/2026',
        'perihal': 'Disposisi Nomor $i',
        'nama_pemberi': 'Pemberi $i',
        'instruksi': 'Tindak lanjuti segera instruksi $i',
        'status': 'baru',
        'jenis': 'Surat Edaran',
        'jenis_pengiriman': 'internal',
        'created_at': '2026-03-01 10:00:00',
      },
    );
  }

  @override
  Future<List<SuratModel>> getApprovalList({
    String? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    return List<SuratModel>.generate(
      20,
      (i) => SuratModel(
        id: 'appr_$i',
        idSuratKeluar: 'sk_$i',
        idSuratApproval: 'sa_$i',
        nomorSurat: '00$i/SK/2026',
        perihal: 'Surat Keluar Approval $i',
        asalSurat: 'Pembuat $i',
        tanggalDiterima: DateTime(2026, 3, 1 + (i % 28)),
        status: 'waiting',
        ringkasan: 'Approval $i',
      ),
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('Filter Auto-Hide on Scroll Tests across 3 Screens', () {
    testWidgets('1. SuratMasukScreen: Auto-hide filter on scroll down and reveal on scroll up', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratRepositoryProvider.overrideWithValue(_FakeSuratRepository()),
          ],
          child: const MaterialApp(
            home: SuratMasukScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final filterWidget = find.byType(SizeTransition);
      expect(filterWidget, findsOneWidget);
      expect(tester.getSize(filterWidget).height, greaterThan(50));

      // Scroll ke bawah
      await tester.drag(find.byType(ListView), const Offset(0, -350));
      await tester.pumpAndSettle();
      expect(tester.getSize(filterWidget).height, equals(0.0));

      // Scroll ke atas
      await tester.drag(find.byType(ListView), const Offset(0, 300));
      await tester.pumpAndSettle();
      expect(tester.getSize(filterWidget).height, greaterThan(50));
    });

    testWidgets('2. DisposisiScreen: Auto-hide filter on scroll down and reveal on scroll up', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratRepositoryProvider.overrideWithValue(_FakeSuratRepository()),
          ],
          child: const MaterialApp(
            home: DisposisiScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final filterWidget = find.byType(SizeTransition);
      expect(filterWidget, findsOneWidget);
      expect(tester.getSize(filterWidget).height, greaterThan(50));

      // Scroll ke bawah
      await tester.drag(find.byType(ListView), const Offset(0, -350));
      await tester.pumpAndSettle();
      expect(tester.getSize(filterWidget).height, equals(0.0));

      // Scroll ke atas
      await tester.drag(find.byType(ListView), const Offset(0, 300));
      await tester.pumpAndSettle();
      expect(tester.getSize(filterWidget).height, greaterThan(50));
    });

    testWidgets('3. ApprovalScreen: Auto-hide filter on scroll down and reveal on scroll up', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratRepositoryProvider.overrideWithValue(_FakeSuratRepository()),
          ],
          child: const MaterialApp(
            home: ApprovalScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Cari nomor surat, perihal, pengaju...'), findsOneWidget);

      final filterWidget = find.byType(SizeTransition);
      expect(filterWidget, findsOneWidget);
      expect(tester.getSize(filterWidget).height, greaterThan(80));

      // Scroll ke bawah
      await tester.drag(find.byType(ListView), const Offset(0, -350));
      await tester.pumpAndSettle();
      expect(tester.getSize(filterWidget).height, equals(0.0));

      // Scroll ke atas
      await tester.drag(find.byType(ListView), const Offset(0, 300));
      await tester.pumpAndSettle();
      expect(tester.getSize(filterWidget).height, greaterThan(20));
    });

    testWidgets('4. CustomAppBar retains translucent opacity', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(
              title: 'Judul Bar',
            ),
          ),
        ),
      );

      final containerFinder = find.descendant(
        of: find.byType(AppBar),
        matching: find.byType(Container),
      );
      expect(containerFinder, findsWidgets);

      final initialContainer = tester.widgetList<Container>(containerFinder).firstWhere(
        (c) => c.decoration is BoxDecoration && (c.decoration as BoxDecoration).color != null,
      );
      final initialDecoration = initialContainer.decoration as BoxDecoration;
      expect(initialDecoration.color?.a, closeTo(0.84, 0.01));
    });
  });
}
