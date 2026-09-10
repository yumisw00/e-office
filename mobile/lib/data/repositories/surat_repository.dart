import 'package:dio/dio.dart';
import '../models/surat_model.dart';
import '../../core/constants/app_config.dart';
abstract class SuratRepository {
  Future<List<SuratModel>> getSuratMasuk({int page = 1, int limit = 20});
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20});
  Future<SuratModel?> getSuratDetail(String id);
}
class ApiSuratRepository implements SuratRepository {
  final Dio _dio;
  ApiSuratRepository(this._dio);
  @override
  Future<List<SuratModel>> getSuratMasuk({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/surat_masuk',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> suratList;
        if (data is Map && data.containsKey('data')) {
          suratList = data['data'] as List;
        } else if (data is List) {
          suratList = data;
        } else {
          suratList = [];
        }
        return suratList
            .map((json) => SuratModel.fromJsonApi(json))
            .toList();
      }
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print(' Error getting surat masuk: ${e.message}');
      }
      if (e.response?.statusCode == 403) {
        print(' Error 403: User tidak memiliki akses ke surat_masuk');
        print('💡 Solusi Backend: Tambahkan group "surat_masuk" atau "surat_masuk_pegawai" ke user');
        return PaginatedResponse.empty();
      }
      rethrow;
    }
  }
  @override
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/surat_keluar',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> suratList;
        if (data is Map && data.containsKey('data')) {
          suratList = data['data'] as List;
        } else if (data is List) {
          suratList = data;
        } else {
          suratList = [];
        }
        return suratList
            .map((json) => SuratModel.fromJsonApi(json))
            .toList();
      }
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print(' Error getting surat keluar: ${e.message}');
      }
      rethrow;
    }
  }
  @override
  Future<SuratModel?> getSuratDetail(String id) async {
    try {
      final response = await _dio.get('/surat_masuk/$id');
      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null) {
          return SuratModel.fromJsonApi(data);
        }
      }
      return null;
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print(' Error getting surat detail: ${e.message}');
      }
      rethrow;
    }
  }
}
class MockSuratRepository implements SuratRepository {
  @override
  Future<List<SuratModel>> getSuratMasuk({int page = 1, int limit = 20}) async {
    await Future.delayed(const Duration(seconds: 1));
    return [
      SuratModel(
        id: '1',
        nomorSurat: '001/ADM/VI/2024',
        asalSurat: 'PT. Maju Bersama',
        perihal: 'Permohonan Kerjasama Vendor',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 1)),
        status: 'belum_dibaca',
        ringkasan: 'Permohonan kerjasama penyediaan alat tulis kantor untuk periode semester kedua.',
      ),
      SuratModel(
        id: '2',
        nomorSurat: '045/SK/HRD/2024',
        asalSurat: 'Dinas Kepegawaian Pusat',
        perihal: 'Pemberitahuan Pelatihan Digital Government',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 2)),
        status: 'disposisi',
        ringkasan: 'Undangan pelatihan peningkatan kompetensi digital untuk staf administrasi.',
      ),
      SuratModel(
        id: '3',
        nomorSurat: '122/INV/FIN/2024',
        asalSurat: 'PLN Persero',
        perihal: 'Tagihan Listrik Gedung Pusat - Mei 2024',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 3)),
        status: 'selesai',
        ringkasan: 'Laporan tagihan bulanan penggunaan listrik operasional gedung utama.',
      ),
      SuratModel(
        id: '4',
        nomorSurat: '089/EXT/DIR/2024',
        asalSurat: 'Kementerian Keuangan',
        perihal: 'Koordinasi Anggaran Triwulan III',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 4)),
        status: 'disposisi',
        ringkasan: 'Rapat koordinasi teknis mengenai penyesuaian anggaran operasional triwulan ketiga.',
      ),
      SuratModel(
        id: '5',
        nomorSurat: '012/UND/VI/2024',
        asalSurat: 'Universitas Indonesia',
        perihal: 'Undangan Seminar Transformasi Digital',
        tanggalDiterima: DateTime.now().subtract(const Duration(hours: 5)),
        status: 'belum_dibaca',
        ringkasan: 'Undangan menjadi pembicara tamu dalam seminar nasional transformasi digital sektor publik.',
      ),
      SuratModel(
        id: '6',
        nomorSurat: '331/LEG/2024',
        asalSurat: 'Firma Hukum Adidarma',
        perihal: 'Pembaruan Kontrak Sewa Lahan',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 6)),
        status: 'selesai',
        ringkasan: 'Dokumen finalisasi perpanjangan kontrak sewa lahan parkir sisi timur gedung.',
      ),
      SuratModel(
        id: '7',
        nomorSurat: '119/SKR/2024',
        asalSurat: 'Politeknik Negeri Madiun',
        perihal: 'Pembaruan Kontrak Sewa Server',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 7)),
        status: 'belum_dibaca',
        ringkasan: 'Dokumen rincian biaya seva server cloud dari langganan google cloud.',
      ),
      SuratModel(
        id: '8',
        nomorSurat: '119/SKR/2024',
        asalSurat: 'Politeknik Negeri Madiun',
        perihal: 'Pembaruan Kontrak Sewa Server',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 7)),
        status: 'belum_dibaca',
        ringkasan: 'Dokumen rincian biaya seva server cloud dari langganan google cloud.',
      ),
    ];
    return mockData;
  }
  @override
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    await Future.delayed(const Duration(seconds: 1));
    return [];
  }
  @override
  Future<SuratModel?> getSuratDetail(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return null;
  }
}
