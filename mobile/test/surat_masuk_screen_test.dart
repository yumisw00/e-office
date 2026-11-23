import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:e_office_mobile/presentation/screens/surat_masuk_screen.dart';
import 'package:e_office_mobile/presentation/widgets/custom_app_bar.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/data/repositories/surat_repository.dart';

import 'package:e_office_mobile/presentation/widgets/surat_filter_widgets.dart';

class FakeSuratRepository implements SuratRepository {
  List<SuratModel>? customList;
  FakeSuratRepository({this.customList});

  @override
  Future<List<Map<String, String>>> getJenisSuratOptions() async => [
        {'value': 'Surat Edaran', 'label': 'Surat Edaran'},
        {'value': 'Surat Pemberitahuan', 'label': 'Surat Pemberitahuan'},
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
    if (customList != null) return customList!;
    return [
      SuratModel(
        id: '101',
        nomorSurat: '001/SM/2026',
        perihal: 'Undangan Rapat Koordinasi',
        asalSurat: 'Kementerian Keuangan',
        ringkasan: 'Rapat koordinasi antar bagian',
        tanggalDiterima: DateTime(2026, 3, 10),
        status: 'baru',
        jenisSurat: 'Surat Edaran',
        jenisPengiriman: 'internal',
      ),
      SuratModel(
        id: '102',
        nomorSurat: '002/SM/2026',
        perihal: 'Pemberitahuan Workshop',
        asalSurat: 'Dinas Pendidikan',
        ringkasan: 'Workshop pengembangan kompetensi',
        tanggalDiterima: DateTime(2026, 3, 12),
        status: 'dikirim',
        jenisSurat: 'Surat Pemberitahuan',
        jenisPengiriman: 'eksternal',
      ),
    ];
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('SuratMasukScreen UI verification: Web-aligned pengiriman + jenis surat filtering & search', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          suratRepositoryProvider.overrideWithValue(FakeSuratRepository()),
        ],
        child: const MaterialApp(
          home: SuratMasukScreen(),
        ),
      ),
    );

    // Initial pump
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // 1. Verify AppBar title is 'Surat Masuk'
    expect(find.text('Surat Masuk'), findsOneWidget);

    // 2. Verify filter button (Icons.tune_rounded) is REMOVED from AppBar
    expect(find.byIcon(Icons.tune_rounded), findsNothing);

    // 3. Verify Profile button (Icons.person_rounded) is present in leading
    expect(find.byIcon(Icons.person_rounded), findsOneWidget);

    // 4. Verify Search TextField is rendered directly on the main body using SuratSearchBar
    expect(find.byType(SuratSearchBar), findsOneWidget);
    final searchFinder = find.byType(TextField);
    expect(searchFinder, findsOneWidget);
    expect(find.text('Cari nomor surat, perihal, pengirim...'), findsOneWidget);

    // 5. Verify Pengiriman Tabs match Web frontend with counts
    expect(find.text('Semua Surat (2)'), findsOneWidget);
    expect(find.text('Internal (1)'), findsOneWidget);
    expect(find.text('Eksternal (1)'), findsOneWidget);

    // 6. Verify Jenis Surat chips match Web frontend JenisSuratTabs
    expect(find.text('Jenis Surat'), findsOneWidget);
    expect(find.text('Semua (2)'), findsOneWidget);
    expect(find.text('Surat Edaran (1)'), findsOneWidget);
    expect(find.text('Surat Pemberitahuan (1)'), findsOneWidget);
    expect(find.text('Surat Tugas (0)'), findsOneWidget);

    // 7. Verify items are rendered
    expect(find.text('Undangan Rapat Koordinasi'), findsOneWidget);
    expect(find.text('Pemberitahuan Workshop'), findsOneWidget);

    // 8. Tap Internal (1) tab -> only internal item shown
    await tester.tap(find.text('Internal (1)'));
    await tester.pumpAndSettle();
    expect(find.text('Undangan Rapat Koordinasi'), findsOneWidget);
    expect(find.text('Pemberitahuan Workshop'), findsNothing);

    // Reset back to Semua Surat (2)
    await tester.tap(find.text('Semua Surat (2)'));
    await tester.pumpAndSettle();
    expect(find.text('Undangan Rapat Koordinasi'), findsOneWidget);
    expect(find.text('Pemberitahuan Workshop'), findsOneWidget);

    // 9. Tap Jenis Surat chip Surat Edaran (1)
    await tester.tap(find.text('Surat Edaran (1)'));
    await tester.pumpAndSettle();
    expect(find.text('Undangan Rapat Koordinasi'), findsOneWidget);
    expect(find.text('Pemberitahuan Workshop'), findsNothing);

    // Reset back to Semua (2)
    await tester.tap(find.text('Semua (2)'));
    await tester.pumpAndSettle();
    expect(find.text('Pemberitahuan Workshop'), findsOneWidget);

    // 10. Test inline keyword search functionality and flush debounce timer
    await tester.enterText(searchFinder, 'Koordinasi');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();

    // After typing 'Koordinasi', only the matching item should be displayed
    expect(find.text('Undangan Rapat Koordinasi'), findsOneWidget);
    expect(find.text('Pemberitahuan Workshop'), findsNothing);
  });

  testWidgets('SuratMasukScreen: Auto-hide filter on scroll down and reveal on scroll up', (tester) async {
    final manyItems = List<SuratModel>.generate(
      25,
      (i) => SuratModel(
        id: '$i',
        nomorSurat: '00$i/SM/2026',
        perihal: 'Surat Penting Perihal Nomor $i',
        asalSurat: 'Instansi Pengirim $i',
        tanggalDiterima: DateTime(2026, 3, 1 + (i % 28)),
        status: 'baru',
        ringkasan: 'Ringkasan surat $i',
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          suratRepositoryProvider.overrideWithValue(FakeSuratRepository(customList: manyItems)),
        ],
        child: const MaterialApp(
          home: SuratMasukScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Pastikan SizeTransition dan TextField awalnya terlihat dengan tinggi > 0
    final searchFinder = find.byType(TextField);
    expect(searchFinder, findsOneWidget);
    final initialHeight = tester.getSize(find.byType(SizeTransition)).height;
    expect(initialHeight, greaterThan(50));

    // Scroll ke bawah (drag list view ke atas)
    await tester.drag(find.byType(ListView), const Offset(0, -350));
    await tester.pumpAndSettle();

    // Filter menyusut ke 0
    final collapsedHeight = tester.getSize(find.byType(SizeTransition)).height;
    expect(collapsedHeight, equals(0.0));

    // Scroll ke atas (drag list view ke bawah)
    await tester.drag(find.byType(ListView), const Offset(0, 300));
    await tester.pumpAndSettle();

    // Filter muncul kembali dengan tinggi semula
    final expandedHeight = tester.getSize(find.byType(SizeTransition)).height;
    expect(expandedHeight, greaterThan(50));
  });

  testWidgets('CustomAppBar has zero elevation and clean layout', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          appBar: CustomAppBar(title: 'Test Bar'),
        ),
      ),
    );

    final appBar = tester.widget<AppBar>(find.byType(AppBar));
    expect(appBar.elevation, equals(0));
  });
}
