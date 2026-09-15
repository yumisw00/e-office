import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/surat_model.dart';
import '../../core/constants/app_config.dart';
import '../../core/network/api_endpoints.dart';

abstract class SuratRepository {
  Future<List<SuratModel>> getSuratMasuk({int page = 1, int pageSize = 20});
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20});
  Future<SuratModel?> getSuratMasukDetail(String id);
  Future<List<TimelineEvent>> getSuratMasukTimeline(String id);
  Future<SuratSummary> getSuratMasukSummary();
  Future<void> createDisposisi({
    required String idSuratMasuk,
    required String idPenerima,
    required String instruksi,
    DateTime? tanggalJatuhTempo,
  });
  Future<void> approveSuratKeluar(String id);
  Future<void> rejectSuratKeluar(String id, String catatanRevisi);
  Future<String> signSuratKeluar(String id);
  Future<List<SuratModel>> getApprovalQueue({int page = 1, int pageSize = 20});
}

class ApiSuratRepository implements SuratRepository {
  final Dio _dio;
  
  ApiSuratRepository(this._dio);

  @override
  Future<List<SuratModel>> getSuratMasuk({int page = 1, int pageSize = 20}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.suratMasukList,
        queryParameters: {
          'page': page,
          'pagesize': pageSize,
          'filter[status]': 'baru',
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
        debugPrint('❌ Error getting surat masuk: ${e.message}');
      }
      
      // Handle 403 Forbidden - User tidak memiliki akses
      if (e.response?.statusCode == 403) {
        debugPrint('⚠️ Error 403: User bukan Pimpinan atau tidak memiliki akses');
        return [];
      }
      
      rethrow;
    }
  }

  @override
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.suratKeluarList,
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
        debugPrint('❌ Error getting surat keluar: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<SuratModel?> getSuratMasukDetail(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.suratMasukDetail(id));
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null) {
          return SuratModel.fromJsonApi(data);
        }
      }
      return null;
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting surat detail: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<List<TimelineEvent>> getSuratMasukTimeline(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.suratMasukTimeline(id));
      
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> timelineList;
        
        if (data is Map && data.containsKey('data')) {
          timelineList = data['data'] as List;
        } else if (data is List) {
          timelineList = data;
        } else {
          timelineList = [];
        }

        return timelineList
            .map((json) => TimelineEvent.fromJsonApi(json))
            .toList();
      }
      
      return [];
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting timeline: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<SuratSummary> getSuratMasukSummary() async {
    try {
      final response = await _dio.get(ApiEndpoints.suratMasukSummary);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null && data['summary'] != null) {
          return SuratSummary.fromJsonApi(data['summary']);
        }
      }
      
      // Return default jika gagal
      return SuratSummary.empty();
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting summary: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> createDisposisi({
    required String idSuratMasuk,
    required String idPenerima,
    required String instruksi,
    DateTime? tanggalJatuhTempo,
  }) async {
    try {
      final payload = {
        'id_surat_masuk': idSuratMasuk,
        'id_pemberi': idPenerima, 
        'id_penerima': idPenerima,
        'instruksi': instruksi,
        'status': 'baru',
        if (tanggalJatuhTempo != null)
          'tanggal_jatuh_tempo': tanggalJatuhTempo.toIso8601String(),
      };

      final response = await _dio.post(
        ApiEndpoints.disposisiCreate,
        data: payload,
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error creating disposisi: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> approveSuratKeluar(String id) async {
    try {
      final response = await _dio.post(ApiEndpoints.suratKeluarApprove(id));
      
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error approving surat: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> rejectSuratKeluar(String id, String catatanRevisi) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.suratKeluarReject(id),
        data: {
          'catatan_revisi': catatanRevisi,
        },
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error rejecting surat: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<String> signSuratKeluar(String id) async {
    try {
      final response = await _dio.post(ApiEndpoints.suratKeluarSign(id));
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        // Backend returns QR code URL/path in response
        if (data != null && data['data'] != null) {
          return data['data']['qr_code_url'] ?? data['data']['qr_code'] ?? '';
        }
        return '';
      }
      
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error signing surat: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<List<SuratModel>> getApprovalQueue({int page = 1, int pageSize = 20}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.approvalQueue,
        queryParameters: {
          'page': page,
          'limit': pageSize,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null && data['data'] != null) {
          return (data['data'] as List)
              .map((json) => SuratModel.fromJsonApi(json))
              .toList();
        }
        return [];
      }
      
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting approval queue: ${e.message}');
      }
      rethrow;
    }
  }
}
