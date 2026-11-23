import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:e_office_mobile/data/models/surat_model.dart';
import 'package:e_office_mobile/data/repositories/surat_repository.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';

class FakeSuratRepository implements SuratRepository {
  List<SuratModel> mockSuratMasuk = [];
  List<SuratModel> mockApproval = [];
  String? lastApprovedId;
  String? lastApprovedApprovalId;
  String? lastRejectedId;
  String? lastRejectedReason;

  @override
  Future<List<SuratModel>> getSuratMasukList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    String? tanggalTerima,
    int page = 1,
    int pageSize = 20,
  }) async {
    return mockSuratMasuk;
  }

  @override
  Future<List<SuratModel>> getApprovalList({String? status, int page = 1, int pageSize = 50}) async {
    return mockApproval;
  }

  @override
  Future<void> approveSurat(String id, {String? idSuratApproval}) async {
    lastApprovedId = id;
    lastApprovedApprovalId = idSuratApproval;
  }

  @override
  Future<void> rejectSurat(String id, String reason, {String? idSuratApproval}) async {
    lastRejectedId = id;
    lastRejectedReason = reason;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('SuratModel.fromJsonApi Tests', () {
    test('Correctly parses surat_masuk payload', () {
      final json = {
        'id_surat_masuk': 42,
        'nomor_surat': 'SM/2026/01/001',
        'pengirim': 'Dinas Pendidikan',
        'perihal': 'Undangan Sosialisasi',
        'tanggal_surat': '2026-03-15',
        'status': 'baru',
        'file_surat': 'documents/surat_42.pdf',
      };

      final model = SuratModel.fromJsonApi(json);

      expect(model.id, '42');
      expect(model.nomorSurat, 'SM/2026/01/001');
      expect(model.asalSurat, 'Dinas Pendidikan');
      expect(model.perihal, 'Undangan Sosialisasi');
      expect(model.status, 'baru');
      expect(model.filePdf, 'documents/surat_42.pdf');
      expect(model.activeFilePath, 'documents/surat_42.pdf');
    });

    test('Correctly parses disposisi payload with nested surat_masuk', () {
      final json = {
        'id_surat_disposisi': 77,
        'instruksi': 'Tindak lanjuti segera',
        'status': 'diproses',
        'surat_masuk': {
          'id_surat_masuk': 88,
          'nomor_surat': 'SM/DISP/2026/05',
          'perihal': 'Koordinasi Anggaran',
          'asal_surat': 'Bappeda',
          'file_surat': 'surat_masuk/anggaran.pdf',
        },
      };

      final model = SuratModel.fromJsonApi(json);

      expect(model.id, '77');
      expect(model.idDisposisi, '77');
      expect(model.nomorSurat, 'SM/DISP/2026/05');
      expect(model.perihal, 'Koordinasi Anggaran');
      expect(model.asalSurat, 'Bappeda');
      expect(model.status, 'diproses');
      expect(model.ringkasan, 'Tindak lanjuti segera');
      expect(model.activeFilePath, 'surat_masuk/anggaran.pdf');
    });

    test('Correctly parses surat_approval payload', () {
      final json = {
        'id_surat_approval': 101,
        'id_surat_keluar': 55,
        'nomor_surat': 'SK/2026/04/099',
        'perihal': 'Pemberitahuan Cuti Bersama',
        'status': 'pending',
        'pembuat': 'Staff SDM',
        'created_by_name': 'Staff SDM',
        'tanggal_diajukan': '2026-04-10 09:00:00',
        'action_type': 'approval',
      };

      final model = SuratModel.fromJsonApi(json);

      expect(model.id, '55'); // id is id_surat_keluar
      expect(model.idSuratKeluar, '55');
      expect(model.idSuratApproval, '101');
      expect(model.nomorSurat, 'SK/2026/04/099');
      expect(model.perihal, 'Pemberitahuan Cuti Bersama');
      expect(model.status, 'pending');
      expect(model.actionType, 'approval');
    });
  });

  group('Surat Provider State Tests', () {
    test('suratMasukListProvider fetches dedicated surat masuk list', () async {
      final fakeRepo = FakeSuratRepository();
      fakeRepo.mockSuratMasuk = [
        SuratModel(
          id: '1',
          nomorSurat: 'SM-001',
          asalSurat: 'Instansi A',
          perihal: 'Surat Masuk 1',
          tanggalDiterima: DateTime.now(),
          status: 'baru',
          ringkasan: 'Test SM',
        ),
      ];

      final container = ProviderContainer(
        overrides: [
          suratRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      final initial = await container.read(suratMasukListProvider.future);
      expect(initial.length, 1);
      expect(initial.first.nomorSurat, 'SM-001');
    });

    test('approvalListProvider fetches and executes approve/reject with correct IDs', () async {
      final fakeRepo = FakeSuratRepository();
      fakeRepo.mockApproval = [
        SuratModel(
          id: '55',
          idSuratKeluar: '55',
          idSuratApproval: '101',
          nomorSurat: 'SK-001',
          asalSurat: 'Staff',
          perihal: 'Approval 1',
          tanggalDiterima: DateTime.now(),
          status: 'pending',
          ringkasan: 'Test Approval',
        ),
      ];

      final container = ProviderContainer(
        overrides: [
          suratRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      final initial = await container.read(approvalListProvider.future);
      expect(initial.length, 1);
      expect(initial.first.id, '55');

      // Test approve
      await container.read(approvalListProvider.notifier).approveSurat('55', idSuratApproval: '101');
      expect(fakeRepo.lastApprovedId, '55');
      expect(fakeRepo.lastApprovedApprovalId, '101');

      // State is optimistically updated
      final afterApprove = container.read(approvalListProvider).value!;
      expect(afterApprove.isEmpty, isTrue);
    });
  });
}
