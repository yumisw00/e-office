import 'package:dio/dio.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/data/repositories/surat_repository.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';
import 'package:e_office_mobile/presentation/screens/approval_screen.dart';
import 'package:e_office_mobile/presentation/screens/detail_surat_screen.dart';
import 'package:e_office_mobile/presentation/screens/disposisi_screen.dart';
import 'package:e_office_mobile/presentation/screens/surat_masuk_screen.dart';
import 'package:e_office_mobile/presentation/widgets/surat_filter_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

class _FakeActionSuratRepository implements SuratRepository {
  SuratModel? detailSurat;
  bool archiveCalled = false;
  String? archivedId;
  String? archivedLokasiFisik;
  String? archivedTanggalArsip;
  bool createDisposisiCalled = false;
  String? disposisiSuratId;
  List<String>? disposisiRecipientIds;
  String? disposisiTenggat;

  List<Map<String, dynamic>> recipients = [
    {
      'id': '3275',
      'name': 'Budi Santoso',
      'email': 'budi@instansi.go.id',
      'nama_group': 'Pegawai',
    },
    {
      'id': '3276',
      'name': 'Siti Aminah',
      'email': 'siti@instansi.go.id',
      'nama_group': 'Sekretaris',
    },
  ];

  @override
  Future<List<Map<String, String>>> getJenisSuratOptions() async => [
        {'value': 'Surat Edaran', 'label': 'Surat Edaran'},
      ];

  @override
  Future<SuratModel?> getSuratMasukDetail(String id) async => detailSurat;

  @override
  Future<List<TimelineEvent>> getTracking(
    String id,
    String? actionType,
  ) async => [];

  @override
  Future<Map<String, dynamic>> archiveSuratMasuk(
    String id, {
    String? lokasiFisik,
    required String tanggalArsip,
  }) async {
    archiveCalled = true;
    archivedId = id;
    archivedLokasiFisik = lokasiFisik;
    archivedTanggalArsip = tanggalArsip;
    if (detailSurat != null) {
      detailSurat = detailSurat!.copyWith(
        sudahDiarsipkan: true,
        status: 'diarsipkan',
      );
    }
    return {'id_surat_arsip': 10};
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiRecipients() async =>
      recipients;

  @override
  Future<void> createDisposisi({
    required String idSuratMasuk,
    required List<String> idPenerimaList,
    String? tanggalJatuhTempo,
  }) async {
    createDisposisiCalled = true;
    disposisiSuratId = idSuratMasuk;
    disposisiRecipientIds = List<String>.from(idPenerimaList);
    disposisiTenggat = tanggalJatuhTempo;
  }

  @override
  Future<List<SuratModel>> getSuratMasukList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    String? tanggalTerima,
    int page = 1,
    int pageSize = 50,
  }) async {
    return [
      SuratModel(
        id: '132',
        nomorSurat: 'SK/2026/11/017',
        asalSurat: 'Admin Sistem',
        perihal: 'SK/2026/11/017',
        tanggalDiterima: DateTime(2026, 11, 5),
        status: 'didistribusikan',
        ringkasan: '-',
        filePdf: 'surat_masuk/contoh.pdf',
      ),
    ];
  }

  @override
  Future<List<SuratModel>> getApprovalList({
    String? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    return [
      SuratModel(
        id: '201',
        idSuratKeluar: '201',
        idSuratApproval: '1',
        nomorSurat: 'SK/2026/11/099',
        asalSurat: 'Bagian Umum',
        pemohon: 'Admin Sistem',
        perihal: 'Persetujuan Surat Keluar',
        tanggalDiterima: DateTime(2026, 11, 10),
        tanggalSurat: DateTime(2026, 11, 10),
        status: 'waiting',
        ringkasan: '-',
      ),
    ];
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    int page = 1,
    int pageSize = 50,
  }) async {
    return [
      {
        'id_surat_disposisi': 55,
        'id_surat_masuk': 132,
        'nomor_surat': 'SM/2026/11/017',
        'perihal': 'Tindak Lanjut Surat Edaran',
        'instruksi': 'Harap segera ditindaklanjuti.',
        'nama_pemberi': 'Pimpinan',
        'status': 'baru',
        'jenis_pengiriman': 'internal',
        'created_at': '2026-11-18 09:00:00',
      },
    ];
  }

  @override
  Future<List<SuratModel>> getMyActions({
    int page = 1,
    int pageSize = 15,
  }) async => [];

  @override
  Future<PimpinanDashboard> getDashboard() async {
    return PimpinanDashboard(
      totalSuratMasukBulanIni: 1,
      pendingDisposisi: 1,
      pendingApproval: 1,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('SuratModel.fromJsonApi Detail Surat Masuk fields', () {
    test(
      'parses sudah_diarsipkan, nomor_agenda, penerima_user.name, sifat, isi_ringkasan, tanggal_terima',
      () {
        final json = {
          'id': 132,
          'id_surat_masuk': 132,
          'nomor_agenda': 'AGK/2026/11/017',
          'nomor_surat': 'SK/2026/11/017',
          'asal_surat': 'Admin Sistem',
          'kepada_tujuan': 'Pimpinan',
          'penerima_user': {'id_user': 3273, 'name': 'Pimpinan Utama'},
          'jenis': 'Surat Edaran',
          'sifat': 'Penting',
          'tanggal_surat': '2026-11-05',
          'tanggal_terima': '2026-11-18',
          'status': 'dikirim',
          'perihal': 'Surat Edaran',
          'isi_ringkasan': 'Ringkasan isi surat masuk',
          'catatan': 'Catatan tambahan',
          'sudah_diarsipkan': false,
          'file_surat': 'surat_masuk/test.pdf',
        };

        final model = SuratModel.fromJsonApi(json);

        expect(model.id, '132');
        expect(model.nomorAgenda, 'AGK/2026/11/017');
        expect(model.nomorSurat, 'SK/2026/11/017');
        expect(model.asalSurat, 'Admin Sistem');
        expect(model.penerima, 'Pimpinan Utama');
        expect(model.jenisSurat, 'Surat Edaran');
        expect(model.sifat, 'Penting');
        expect(model.tanggalSurat, DateTime(2026, 11, 5));
        expect(model.tanggalDiterima, DateTime(2026, 11, 18));
        expect(model.ringkasan, 'Ringkasan isi surat masuk');
        expect(model.catatan, 'Catatan tambahan');
        expect(model.sudahDiarsipkan, isFalse);

        final archivedModel = SuratModel.fromJsonApi({
          ...json,
          'sudah_diarsipkan': true,
        });
        expect(archivedModel.sudahDiarsipkan, isTrue);
      },
    );
  });

  group('ApiSuratRepository Surat Masuk actions', () {
    test(
      'archiveSuratMasuk sends POST /surat_masuk/132/archive with lokasi_fisik and tanggal_arsip',
      () async {
        RequestOptions? capturedReq;
        final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'));
        dio.interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              capturedReq = options;
              return handler.resolve(
                Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {
                    'success': true,
                    'message': 'Surat masuk berhasil diarsipkan.',
                    'data': {'id_surat_arsip': 77},
                  },
                ),
              );
            },
          ),
        );

        final repo = ApiSuratRepository(dio);
        final res = await repo.archiveSuratMasuk(
          '132',
          lokasiFisik: 'Rak A-03',
          tanggalArsip: '2026-11-20',
        );

        expect(capturedReq?.method, 'POST');
        expect(capturedReq?.path, '/surat_masuk/132/archive');
        expect(capturedReq?.data, {
          'lokasi_fisik': 'Rak A-03',
          'tanggal_arsip': '2026-11-20',
        });
        expect(res['id_surat_arsip'], 77);
      },
    );

    test(
      'getDisposisiRecipients calls GET /surat_keluar/recipients and maps fields',
      () async {
        RequestOptions? capturedReq;
        final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'));
        dio.interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              capturedReq = options;
              return handler.resolve(
                Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {
                    'data': [
                      {
                        'id_user': 3275,
                        'name': 'Budi Santoso',
                        'email': 'budi@instansi.go.id',
                        'nama_group': 'Pegawai',
                      },
                    ],
                  },
                ),
              );
            },
          ),
        );

        final repo = ApiSuratRepository(dio);
        final list = await repo.getDisposisiRecipients();

        expect(capturedReq?.method, 'GET');
        expect(capturedReq?.path, '/surat_keluar/recipients');
        expect(list.length, 1);
        expect(list.first['id'], '3275');
        expect(list.first['name'], 'Budi Santoso');
        expect(list.first['email'], 'budi@instansi.go.id');
        expect(list.first['nama_group'], 'Pegawai');
      },
    );

    test(
      'createDisposisi calls POST /surat_disposisi once per recipient with int IDs',
      () async {
        final capturedRequests = <RequestOptions>[];
        final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'));
        dio.interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              capturedRequests.add(options);
              return handler.resolve(
                Response(
                  requestOptions: options,
                  statusCode: 201,
                  data: {
                    'success': true,
                    'message': 'Disposisi berhasil dibuat.',
                  },
                ),
              );
            },
          ),
        );

        final repo = ApiSuratRepository(dio);
        await repo.createDisposisi(
          idSuratMasuk: '132',
          idPenerimaList: ['3275', '3276'],
          tanggalJatuhTempo: '2026-11-25',
        );

        expect(capturedRequests.length, 2);
        expect(capturedRequests[0].method, 'POST');
        expect(capturedRequests[0].path, '/surat_disposisi');
        expect(capturedRequests[0].data, {
          'id_surat_masuk': 132,
          'id_penerima': 3275,
          'tanggal_jatuh_tempo': '2026-11-25',
          'status': 'baru',
        });
        expect(capturedRequests[1].data, {
          'id_surat_masuk': 132,
          'id_penerima': 3276,
          'tanggal_jatuh_tempo': '2026-11-25',
          'status': 'baru',
        });
      },
    );
  });

  group('DetailSuratScreen Surat Masuk Arsipkan & Disposisi widgets', () {
    testWidgets(
      'shows Arsipkan banner/button and Disposisi form for surat_masuk and runs both actions',
      (tester) async {
        final fakeRepo = _FakeActionSuratRepository()
          ..detailSurat = SuratModel(
            id: '132',
            nomorAgenda: 'AGK/2026/11/017',
            nomorSurat: 'SK/2026/11/017',
            asalSurat: 'Admin Sistem',
            penerima: 'Pimpinan',
            jenisSurat: 'Surat Edaran',
            sifat: '-',
            perihal: 'SK/2026/11/017',
            tanggalSurat: DateTime(2026, 11, 5),
            tanggalDiterima: DateTime(2026, 11, 18),
            status: 'dikirim',
            ringkasan: '-',
            sudahDiarsipkan: false,
            actionType: 'surat_masuk',
          );

        await tester.pumpWidget(
          ProviderScope(
            overrides: [suratRepositoryProvider.overrideWithValue(fakeRepo)],
            child: const MaterialApp(
              home: DetailSuratScreen(
                idSurat: '132',
                actionType: 'surat_masuk',
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        // Verify archive banner & button
        expect(find.text('Surat ini belum diarsipkan.'), findsOneWidget);
        final bannerContainer = tester.widget<Container>(
          find.ancestor(
            of: find.text('Surat ini belum diarsipkan.'),
            matching: find.byType(Container),
          ).first,
        );
        expect(bannerContainer.decoration, isA<ShapeDecoration>());
        expect(
          (bannerContainer.decoration as ShapeDecoration).shape,
          isA<StadiumBorder>(),
        );

        final archiveBtnFinder = find.widgetWithText(
          ElevatedButton,
          'Arsipkan',
        );
        expect(archiveBtnFinder, findsOneWidget);
        final archiveBtn = tester.widget<ElevatedButton>(archiveBtnFinder);
        expect(
          archiveBtn.style?.shape?.resolve({}),
          isA<StadiumBorder>(),
        );

        // Verify Disposisi card fields
        expect(find.text('Penerima Disposisi'), findsOneWidget);
        expect(find.text('Tenggat'), findsOneWidget);
        expect(find.byIcon(Icons.send_rounded), findsNothing);

        final penerimaFieldContainer = tester.widget<Container>(
          find.ancestor(
            of: find.text('Pilih pegawai penerima'),
            matching: find.byType(Container),
          ).first,
        );
        expect(
          (penerimaFieldContainer.decoration as BoxDecoration).borderRadius,
          BorderRadius.circular(28),
        );

        final tenggatFieldContainer = tester.widget<Container>(
          find.ancestor(
            of: find.text('hh / bb / tttt'),
            matching: find.byType(Container),
          ).first,
        );
        expect(
          (tenggatFieldContainer.decoration as BoxDecoration).borderRadius,
          BorderRadius.circular(28),
        );

        final tambahDisposisiFinder = find.widgetWithText(
          ElevatedButton,
          'Tambah Disposisi',
        );
        expect(tambahDisposisiFinder, findsOneWidget);
        final tambahBtn = tester.widget<ElevatedButton>(tambahDisposisiFinder);
        expect(
          tambahBtn.style?.shape?.resolve({}),
          isA<StadiumBorder>(),
        );

        // 1. Archive flow
        await Scrollable.ensureVisible(
          tester.element(archiveBtnFinder),
          alignment: 0.5,
        );
        await tester.pumpAndSettle();
        await tester.tap(archiveBtnFinder);
        await tester.pumpAndSettle();

        expect(find.text('Arsip Surat Masuk'), findsOneWidget);
        await tester.enterText(find.byType(TextField), 'Ruang Arsip, Rak 1');
        await tester.tap(find.widgetWithText(ElevatedButton, 'Simpan Arsip'));
        await tester.pumpAndSettle();

        expect(fakeRepo.archiveCalled, isTrue);
        expect(fakeRepo.archivedId, '132');
        expect(fakeRepo.archivedLokasiFisik, 'Ruang Arsip, Rak 1');
        expect(
          fakeRepo.archivedTanggalArsip,
          DateFormat('yyyy-MM-dd').format(DateTime.now()),
        );
        expect(find.text('Surat ini sudah diarsipkan.'), findsOneWidget);
        final doneArchiveBtn = tester.widget<ElevatedButton>(
          find.widgetWithText(ElevatedButton, 'Sudah Diarsipkan'),
        );
        expect(doneArchiveBtn.onPressed, isNull);

        // 2. Disposisi flow
        final pickerTrigger = find.text('Pilih pegawai penerima');
        await Scrollable.ensureVisible(
          tester.element(pickerTrigger),
          alignment: 0.5,
        );
        await tester.pumpAndSettle();
        await tester.tap(pickerTrigger);
        await tester.pumpAndSettle();

        expect(find.byType(SuratSearchBar), findsOneWidget);
        expect(find.text('Cari pegawai...'), findsOneWidget);
        final pilihZeroBtn = tester.widget<ElevatedButton>(
          find.widgetWithText(ElevatedButton, 'Pilih (0)'),
        );
        expect(pilihZeroBtn.style?.shape?.resolve({}), isA<StadiumBorder>());

        expect(find.text('Budi Santoso'), findsOneWidget);
        await tester.tap(find.text('Budi Santoso'));
        await tester.pumpAndSettle();

        await tester.tap(find.widgetWithText(ElevatedButton, 'Pilih (1)'));
        await tester.pumpAndSettle();

        expect(find.text('1 pegawai dipilih'), findsOneWidget);

        await Scrollable.ensureVisible(
          tester.element(tambahDisposisiFinder),
          alignment: 0.5,
        );
        await tester.pumpAndSettle();
        await tester.tap(tambahDisposisiFinder);
        await tester.pumpAndSettle();

        expect(fakeRepo.createDisposisiCalled, isTrue);
        expect(fakeRepo.disposisiSuratId, '132');
        expect(fakeRepo.disposisiRecipientIds, ['3275']);
      },
    );

    testWidgets('hides Arsipkan and Tambah Disposisi for approval actionType', (
      tester,
    ) async {
      final approvalSurat = SuratModel(
        id: '301',
        nomorSurat: 'SK/2026/11/301',
        asalSurat: 'Bagian Hukum',
        perihal: 'Approval Surat Keluar',
        tanggalDiterima: DateTime(2026, 11, 4),
        status: 'waiting',
        ringkasan: '-',
        actionType: 'approval',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            suratDetailProvider((
              id: '301',
              type: 'approval',
            )).overrideWith((ref) => approvalSurat),
            trackingProvider((
              id: '301',
              type: 'approval',
            )).overrideWith((ref) => <TimelineEvent>[]),
          ],
          child: const MaterialApp(
            home: DetailSuratScreen(idSurat: '301', actionType: 'approval'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Arsipkan'), findsNothing);
      expect(find.text('Tambah Disposisi'), findsNothing);
      expect(find.text('Setujui'), findsOneWidget);
    });

    testWidgets(
      'hides Arsipkan and Tambah Disposisi for disposisi actionType',
      (tester) async {
        final disposisiSurat = SuratModel(
          id: '401',
          nomorSurat: 'SM/2026/11/401',
          asalSurat: 'Sekretariat',
          perihal: 'Disposisi Masuk',
          tanggalDiterima: DateTime(2026, 11, 4),
          status: 'baru',
          ringkasan: '-',
          actionType: 'disposisi',
        );

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              suratDetailProvider((
                id: '401',
                type: 'disposisi',
              )).overrideWith((ref) => disposisiSurat),
              trackingProvider((
                id: '401',
                type: 'disposisi',
              )).overrideWith((ref) => <TimelineEvent>[]),
            ],
            child: const MaterialApp(
              home: DetailSuratScreen(
                idSurat: '401',
                actionType: 'disposisi',
                idDisposisi: '401',
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('Arsipkan'), findsNothing);
        expect(find.text('Tambah Disposisi'), findsNothing);
        expect(find.text('Selesaikan Disposisi'), findsOneWidget);
      },
    );

    testWidgets(
      'recipient picker Pilih button stays well above Android bottom navigation bar',
      (tester) async {
        final fakeRepo = _FakeActionSuratRepository()
          ..detailSurat = SuratModel(
            id: '132',
            nomorSurat: 'SK/2026/11/017',
            asalSurat: 'Admin Sistem',
            perihal: 'Surat Edaran',
            tanggalDiterima: DateTime(2026, 11, 18),
            status: 'dikirim',
            ringkasan: '-',
            actionType: 'surat_masuk',
          );

        await tester.pumpWidget(
          ProviderScope(
            overrides: [suratRepositoryProvider.overrideWithValue(fakeRepo)],
            child: const MaterialApp(
              home: MediaQuery(
                data: MediaQueryData(
                  size: Size(390, 844),
                  viewPadding: EdgeInsets.only(bottom: 48),
                ),
                child: DetailSuratScreen(
                  idSurat: '132',
                  actionType: 'surat_masuk',
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        final pickerTrigger = find.text('Pilih pegawai penerima');
        await Scrollable.ensureVisible(
          tester.element(pickerTrigger),
          alignment: 0.5,
        );
        await tester.pumpAndSettle();
        await tester.tap(pickerTrigger);
        await tester.pumpAndSettle();

        final pilihFinder = find.widgetWithText(ElevatedButton, 'Pilih (0)');
        expect(pilihFinder, findsOneWidget);
        final pilihBottom = tester.getBottomLeft(pilihFinder).dy;
        // Must sit at least 20dp above the 48dp Android nav bar (844 - 48 = 796).
        expect(pilihBottom, lessThanOrEqualTo(844.0 - 48.0 - 20.0));
      },
    );
  });

  group('Left metadata icons removed from Surat cards', () {
    testWidgets(
      'SuratMasukScreen card removes 3 metadata icons while keeping Dokumen badge',
      (tester) async {
        final fakeRepo = _FakeActionSuratRepository();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [suratRepositoryProvider.overrideWithValue(fakeRepo)],
            child: const MaterialApp(home: SuratMasukScreen()),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('Nomor: SK/2026/11/017'), findsOneWidget);
        expect(find.text('Pengirim: Admin Sistem'), findsOneWidget);
        expect(find.text('05 November 2026'), findsOneWidget);
        expect(find.text('Dokumen'), findsOneWidget);

        expect(find.byIcon(Icons.tag_rounded), findsNothing);
        expect(find.byIcon(Icons.business_outlined), findsNothing);
        expect(find.byIcon(Icons.calendar_today_outlined), findsNothing);
        expect(find.byIcon(Icons.attach_file_rounded), findsOneWidget);
      },
    );

    testWidgets('ApprovalScreen card removes 3 metadata icons', (tester) async {
      final fakeRepo = _FakeActionSuratRepository();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [suratRepositoryProvider.overrideWithValue(fakeRepo)],
          child: const MaterialApp(home: ApprovalScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Nomor: SK/2026/11/099'), findsOneWidget);
      expect(find.text('Pengaju: Admin Sistem'), findsOneWidget);
      expect(find.text('Tanggal: 10 November 2026'), findsOneWidget);

      expect(find.byIcon(Icons.tag_rounded), findsNothing);
      expect(find.byIcon(Icons.person_outline_rounded), findsNothing);
      expect(find.byIcon(Icons.calendar_today_outlined), findsNothing);
    });

    testWidgets('DisposisiScreen card removes left quote icon', (tester) async {
      final fakeRepo = _FakeActionSuratRepository();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [suratRepositoryProvider.overrideWithValue(fakeRepo)],
          child: const MaterialApp(home: DisposisiScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.text('Instruksi: Harap segera ditindaklanjuti.'),
        findsOneWidget,
      );
      expect(find.byIcon(Icons.format_quote_rounded), findsNothing);
    });
  });
}
