import 'package:dio/dio.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/data/repositories/surat_repository.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';
import 'package:e_office_mobile/presentation/screens/approval_screen.dart';
import 'package:e_office_mobile/presentation/screens/disposisi_screen.dart';
import 'package:e_office_mobile/presentation/widgets/surat_filter_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFilterRepository implements SuratRepository {
  @override
  Future<List<Map<String, String>>> getJenisSuratOptions() async => [
    {'value': 'Surat Edaran', 'label': 'Surat Edaran'},
    {'value': 'Surat MOU / MoU', 'label': 'Surat MOU / MoU'},
    {'value': 'Surat Pemberitahuan', 'label': 'Surat Pemberitahuan'},
    {'value': 'Surat Tugas', 'label': 'Surat Tugas'},
  ];

  @override
  Future<List<Map<String, dynamic>>> getDisposisiList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    int page = 1,
    int pageSize = 100,
  }) async {
    return [
      {
        'id_surat_disposisi': 1,
        'id_surat_masuk': 201,
        'status': 'baru',
        'instruksi': 'Review MOU kerjasama',
        'nama_pemberi': 'Direktur Utama',
        'jenis_pengiriman': 'internal',
        'created_at': '2026-11-10 09:00:00',
        'surat_masuk': {
          'id': 201,
          'nomor_surat': 'SM/INT/001',
          'perihal': 'Draft MOU Kerjasama',
          'jenis': 'Surat MOU / MoU',
          'jenis_pengiriman': 'internal',
          'asal_surat': 'Divisi Hukum',
        },
      },
      {
        'id_surat_disposisi': 2,
        'id_surat_masuk': 202,
        'status': 'diproses',
        'instruksi': 'Tindak lanjuti pemberitahuan audit',
        'nama_pemberi': 'Sekretaris',
        'jenis_pengiriman': 'internal',
        'created_at': '2026-11-11 10:00:00',
        'surat_masuk': {
          'id': 202,
          'nomor_surat': 'SM/INT/002',
          'perihal': 'Pemberitahuan Audit Tahunan',
          'jenis': 'Surat Pemberitahuan',
          'jenis_pengiriman': 'internal',
          'asal_surat': 'Divisi Keuangan',
        },
      },
      {
        'id_surat_disposisi': 3,
        'id_surat_masuk': 203,
        'status': 'baru',
        'instruksi': 'Hadiri undangan kementerian',
        'nama_pemberi': 'Direktur Utama',
        'jenis_pengiriman': 'eksternal',
        'created_at': '2026-11-12 11:00:00',
        'surat_masuk': {
          'id': 203,
          'nomor_surat': 'SM/EKS/003',
          'perihal': 'MOU Vendor Eksternal',
          'jenis': 'Surat MOU / MoU',
          'jenis_pengiriman': 'eksternal',
          'asal_surat': 'PT Mitra Jaya',
        },
      },
    ];
  }

  @override
  Future<List<SuratModel>> getApprovalList({
    String? status,
    int page = 1,
    int pageSize = 100,
  }) async {
    return [
      SuratModel(
        id: '501',
        idSuratKeluar: '501',
        idSuratApproval: '11',
        nomorSurat: 'SK/2026/11/001',
        asalSurat: 'Divisi SDM',
        pemohon: 'Budi Santoso',
        perihal: 'Pengajuan Pelatihan Pegawai',
        tanggalDiterima: DateTime(2026, 11, 15),
        tanggalSurat: DateTime(2026, 11, 15),
        status: 'waiting',
        ringkasan: '-',
        jenisSurat: 'Surat Permohonan',
      ),
      SuratModel(
        id: '502',
        idSuratKeluar: '502',
        idSuratApproval: '12',
        nomorSurat: 'SK/2026/11/002',
        asalSurat: 'Divisi Keuangan',
        pemohon: 'Siti Aminah',
        perihal: 'Laporan Anggaran Triwulan',
        tanggalDiterima: DateTime(2026, 11, 16),
        tanggalSurat: DateTime(2026, 11, 16),
        status: 'waiting',
        ringkasan: '-',
        jenisSurat: 'Surat Pemberitahuan',
      ),
      SuratModel(
        id: '503',
        idSuratKeluar: '503',
        idSuratApproval: '13',
        nomorSurat: 'SK/2026/11/003',
        asalSurat: 'Sekretariat',
        pemohon: 'Andi Wijaya',
        perihal: 'Edaran Libur Nasional',
        tanggalDiterima: DateTime(2026, 11, 17),
        tanggalSurat: DateTime(2026, 11, 17),
        status: 'approved',
        ringkasan: '-',
        jenisSurat: 'Surat Edaran',
      ),
    ];
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('ApiSuratRepository master-data & category_summary parsing', () {
    test('getJenisSuratOptions fetches /surat_masuk/master-data', () async {
      final requestedPaths = <String>[];
      final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'));
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            requestedPaths.add(options.path);
            return handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'success': true,
                  'data': {
                    'jenis': [
                      {'value': 'Surat Edaran', 'label': 'Surat Edaran'},
                      {'value': 'Surat Tugas', 'label': 'Surat Tugas'},
                    ],
                  },
                },
              ),
            );
          },
        ),
      );

      final repo = ApiSuratRepository(dio);
      final options = await repo.getJenisSuratOptions();

      expect(requestedPaths, ['/surat_masuk/master-data']);
      expect(options, [
        {'value': 'Surat Edaran', 'label': 'Surat Edaran'},
        {'value': 'Surat Tugas', 'label': 'Surat Tugas'},
      ]);
    });

    test(
      'getJenisSuratOptions falls back to /surat_masuk/master_data on error',
      () async {
        final requestedPaths = <String>[];
        final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'));
        dio.interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              requestedPaths.add(options.path);
              if (options.path == '/surat_masuk/master-data') {
                return handler.reject(
                  DioException(
                    requestOptions: options,
                    response: Response(requestOptions: options, statusCode: 404),
                    type: DioExceptionType.badResponse,
                  ),
                );
              }
              return handler.resolve(
                Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {
                    'data': {
                      'jenis': [
                        {'nama': 'Surat Keputusan'},
                      ],
                    },
                  },
                ),
              );
            },
          ),
        );

        final repo = ApiSuratRepository(dio);
        final options = await repo.getJenisSuratOptions();

        expect(requestedPaths, [
          '/surat_masuk/master-data',
          '/surat_masuk/master_data',
        ]);
        expect(options, [
          {'value': 'Surat Keputusan', 'label': 'Surat Keputusan'},
        ]);
      },
    );

    test(
      'getSuratMasukList and getDisposisiList store category_summary',
      () async {
        final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'));
        dio.interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              if (options.path == '/surat_masuk') {
                return handler.resolve(
                  Response(
                    requestOptions: options,
                    statusCode: 200,
                    data: {
                      'data': [],
                      'category_summary': {
                        'total': 16,
                        'internal': 13,
                        'eksternal': 3,
                      },
                    },
                  ),
                );
              }
              return handler.resolve(
                Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {
                    'data': [],
                    'category_summary': {
                      'total': 3,
                      'internal': 2,
                      'eksternal': 1,
                    },
                  },
                ),
              );
            },
          ),
        );

        final repo = ApiSuratRepository(dio);
        await repo.getSuratMasukList();
        await repo.getDisposisiList();

        expect(repo.lastSuratMasukCategorySummary, {
          'total': 16,
          'internal': 13,
          'eksternal': 3,
        });
        expect(repo.lastDisposisiCategorySummary, {
          'total': 3,
          'internal': 2,
          'eksternal': 1,
        });
      },
    );
  });

  group('DisposisiScreen Web-Aligned Filtering', () {
    testWidgets(
      'shows Semua Disposisi / Internal / Eksternal counts and Jenis Surat chips and filters interactively',
      (tester) async {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              suratRepositoryProvider.overrideWithValue(
                _FakeFilterRepository(),
              ),
            ],
            child: const MaterialApp(home: DisposisiScreen()),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.byType(SuratSearchBar), findsOneWidget);
        expect(find.text('Semua Disposisi (3)'), findsOneWidget);
        expect(find.text('Internal (2)'), findsOneWidget);
        expect(find.text('Eksternal (1)'), findsOneWidget);

        expect(find.text('Jenis Surat'), findsOneWidget);
        expect(find.text('Semua (3)'), findsOneWidget);
        expect(find.text('Surat Edaran (0)'), findsOneWidget);
        expect(find.text('Surat MOU / MoU (2)'), findsOneWidget);
        expect(find.text('Surat Pemberitahuan (1)'), findsOneWidget);
        expect(find.text('Surat Tugas (0)'), findsOneWidget);

        // Tap Internal (2) -> updates list and Jenis Surat counts
        await tester.tap(find.text('Internal (2)'));
        await tester.pumpAndSettle();
        expect(find.text('Draft MOU Kerjasama'), findsOneWidget);
        expect(find.text('Pemberitahuan Audit Tahunan'), findsOneWidget);
        expect(find.text('MOU Vendor Eksternal'), findsNothing);
        expect(find.text('Semua (2)'), findsOneWidget);
        expect(find.text('Surat MOU / MoU (1)'), findsOneWidget);

        // Tap Jenis Surat chip Surat Pemberitahuan (1)
        await tester.ensureVisible(find.text('Surat Pemberitahuan (1)'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Surat Pemberitahuan (1)'));
        await tester.pumpAndSettle();
        expect(find.text('Pemberitahuan Audit Tahunan'), findsOneWidget);
        expect(find.text('Draft MOU Kerjasama'), findsNothing);

        // Reset filters and test search keyword
        await tester.tap(find.text('Semua Disposisi (3)'));
        await tester.pumpAndSettle();
        await tester.ensureVisible(find.text('Semua (3)'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Semua (3)'));
        await tester.pumpAndSettle();

        await tester.enterText(find.byType(TextField), 'Vendor');
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pumpAndSettle();
        expect(find.text('MOU Vendor Eksternal'), findsOneWidget);
        expect(find.text('Draft MOU Kerjasama'), findsNothing);
      },
    );
  });

  group('ApprovalScreen Search Bar', () {
    testWidgets(
      'renders SuratSearchBar matching other screens and filters approvals by keyword and status tab',
      (tester) async {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              suratRepositoryProvider.overrideWithValue(
                _FakeFilterRepository(),
              ),
            ],
            child: const MaterialApp(home: ApprovalScreen()),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.byType(SuratSearchBar), findsOneWidget);
        final searchFieldFinder = find.byType(TextField);
        expect(searchFieldFinder, findsOneWidget);
        expect(
          find.text('Cari nomor surat, perihal, pengaju...'),
          findsOneWidget,
        );

        // Initially on Menunggu tab: 2 waiting items visible
        expect(find.text('Pengajuan Pelatihan Pegawai'), findsOneWidget);
        expect(find.text('Laporan Anggaran Triwulan'), findsOneWidget);
        expect(find.text('Edaran Libur Nasional'), findsNothing);

        // Search by pengaju name
        await tester.enterText(searchFieldFinder, 'Siti Aminah');
        await tester.pumpAndSettle();
        expect(find.text('Laporan Anggaran Triwulan'), findsOneWidget);
        expect(find.text('Pengajuan Pelatihan Pegawai'), findsNothing);

        // Search by nomor surat that only exists in approved tab -> empty state shown
        await tester.enterText(searchFieldFinder, 'SK/2026/11/003');
        await tester.pumpAndSettle();
        expect(
          find.text('Tidak ada surat persetujuan yang sesuai pencarian.'),
          findsOneWidget,
        );

        // Switch to Disetujui tab -> matching approved item appears
        await tester.tap(find.text('Disetujui'));
        await tester.pumpAndSettle();
        expect(find.text('Edaran Libur Nasional'), findsOneWidget);

        // Tap clear icon to clear search
        await tester.tap(find.byIcon(Icons.clear));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Semua'));
        await tester.pumpAndSettle();
        expect(find.text('Pengajuan Pelatihan Pegawai'), findsOneWidget);
        expect(find.text('Laporan Anggaran Triwulan'), findsOneWidget);
        await tester.drag(find.byType(ListView), const Offset(0, -350));
        await tester.pumpAndSettle();
        expect(find.text('Edaran Libur Nasional'), findsOneWidget);
      },
    );
  });
}
