import 'package:dio/dio.dart';
import '../models/surat_model.dart';
import '../../core/constants/app_config.dart';

/// Response wrapper for paginated API responses
class PaginatedResponse<T> {
  final List<T> data;
  final int currentPage;
  final int pageSize;
  final int totalPage;
  final int totalRecords;

  PaginatedResponse({
    required this.data,
    required this.currentPage,
    required this.pageSize,
    required this.totalPage,
    required this.totalRecords,
  });

  factory PaginatedResponse.fromJson(Map<String, dynamic> json, T Function(Map<String, dynamic>) fromJson) {
    final dataList = (json['data'] as List?)?.map((e) => fromJson(e)).toList() ?? [];
    
    return PaginatedResponse(
      data: dataList,
      currentPage: json['page'] as int? ?? 1,
      pageSize: json['page_size'] as int? ?? 20,
      totalPage: json['total_page'] as int? ?? 1,
      totalRecords: json['total_records'] as int? ?? json['total'] as int? ?? dataList.length,
    );
  }
}

abstract class SuratRepository {
  Future<PaginatedResponse<SuratModel>> getSuratMasuk({int page = 1, int limit = 20});
  Future<PaginatedResponse<SuratModel>> getSuratKeluar({int page = 1, int limit = 20});
  Future<SuratModel?> getSuratDetail(String id);
}

class ApiSuratRepository implements SuratRepository {
  final Dio _dio;

  ApiSuratRepository(this._dio);

  @override
  Future<PaginatedResponse<SuratModel>> getSuratMasuk({int page = 1, int limit = 20}) async {
    try {
      if (AppConfig.enableLogging) {
        print('📡 Fetching surat masuk: page=$page, limit=$limit');
      }

      final response = await _dio.get(
        '/surat_masuk',
        queryParameters: {
          'page': page,
          'per_page': limit, // Backend uses per_page or pagesize
        },
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        
        return PaginatedResponse<SuratModel>.fromJson(
          data,
          (json) => SuratModel.fromJsonApi(json),
        );
      }
      
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print('❌ Error getting surat masuk: ${e.message}');
        if (e.response != null) {
          print('Response: ${e.response?.data}');
        }
      }
      
      // Handle 403 Forbidden - User tidak punya akses
      if (e.response?.statusCode == 403) {
        print('⚠️ Error 403: User tidak memiliki akses ke surat_masuk');
        print('💡 Solusi Backend: Tambahkan group "surat_masuk" atau "surat_masuk_pegawai" ke user');
        return PaginatedResponse.empty();
      }
      
      rethrow;
    }
  }

  @override
  Future<PaginatedResponse<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    try {
      if (AppConfig.enableLogging) {
        print('📡 Fetching surat keluar: page=$page, limit=$limit');
      }

      final response = await _dio.get(
        '/surat_keluar',
        queryParameters: {
          'page': page,
          'per_page': limit,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        
        return PaginatedResponse<SuratModel>.fromJson(
          data,
          (json) => SuratModel.fromJsonApi(json),
        );
      }
      
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print('❌ Error getting surat keluar: ${e.message}');
        if (e.response != null) {
          print('Response: ${e.response?.data}');
        }
      }
      rethrow;
    }
  }

  @override
  Future<SuratModel?> getSuratDetail(String id) async {
    try {
      if (AppConfig.enableLogging) {
        print('📡 Fetching surat detail: id=$id');
      }

      final response = await _dio.get('/surat_masuk/$id');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          return SuratModel.fromJsonApi(data['data']);
        } else if (data is Map<String, dynamic>) {
          return SuratModel.fromJsonApi(data);
        }
      }
      return null;
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print('❌ Error getting surat detail: ${e.message}');
        if (e.response != null) {
          print('Response: ${e.response?.data}');
        }
      }
      rethrow;
    }
  }
}

// Keep MockSuratRepository for development/testing
class MockSuratRepository implements SuratRepository {
  @override
  Future<PaginatedResponse<SuratModel>> getSuratMasuk({int page = 1, int limit = 20}) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    final mockData = [
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
        nomorSurat: '120/SKR/2024',
        asalSurat: 'Politeknik Negeri Madiun',
        perihal: 'Pembaruan Kontrak Sewa Server',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 7)),
        status: 'belum_dibaca',
        ringkasan: 'Dokumen rincian biaya seva server cloud dari langganan google cloud.',
      ),
    ];

    return PaginatedResponse(
      data: mockData,
      currentPage: page,
      pageSize: limit,
      totalPage: 1,
      totalRecords: mockData.length,
    );
  }

  @override
  Future<PaginatedResponse<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    await Future.delayed(const Duration(seconds: 1));
    return PaginatedResponse(
      data: [],
      currentPage: page,
      pageSize: limit,
      totalPage: 0,
      totalRecords: 0,
    );
  }

  @override
  Future<SuratModel?> getSuratDetail(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return null;
  }
}
