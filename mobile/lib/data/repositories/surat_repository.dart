import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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
  Future<void> submitSuratKeluar(String id);
  Future<List<SuratModel>> getApprovalQueue({int page = 1, int pageSize = 20});
  Future<List<dynamic>> getDisposisiList({int page = 1, int pageSize = 20});
  Future<void> forwardDisposisi(String id, Map<String, dynamic> data);
  Future<List<dynamic>> getNotifications();
  Future<void> logAuditTrail(String action, Map<String, dynamic> metadata);
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
      const storage = FlutterSecureStorage();
      final userDataStr = await storage.read(key: AppConfig.userDataKey);
      String? idPemberi;
      if (userDataStr != null) {
        final idMatch = RegExp(r"'id_user':\s*'?([a-zA-Z0-9_-]+)'?").firstMatch(userDataStr) ??
            RegExp(r"'id':\s*'?([a-zA-Z0-9_-]+)'?").firstMatch(userDataStr);
        if (idMatch != null) {
          idPemberi = idMatch.group(1);
        }
      }

      final payload = {
        'id_surat_masuk': idSuratMasuk,
        if (idPemberi != null) 'id_pemberi': idPemberi,
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
      final response = await _dio.post(ApiEndpoints.approvalSign(id)); // ASUMSI-API
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        if (data != null && data['data'] != null) {
          return data['data']['qr_code_url'] ?? data['data']['qr_code'] ?? '';
        }
        return '';
      }
      
      throw _handleAssumedEndpointError(response);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 501) {
        throw Exception('Fitur tanda tangan digital belum tersedia di server.');
      }
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error signing surat: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> submitSuratKeluar(String id) async {
    try {
      final response = await _dio.post(ApiEndpoints.suratKeluarSubmit(id)); // ASUMSI-API
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw _handleAssumedEndpointError(response);
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 501) {
        throw Exception('Fitur submit surat keluar belum tersedia di server.');
      }
      rethrow;
    }
  }

  @override
  Future<void> forwardDisposisi(String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put(ApiEndpoints.disposisiForward(id), data: data); // ASUMSI-API
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw _handleAssumedEndpointError(response);
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 501) {
        throw Exception('Fitur teruskan disposisi belum tersedia di server.');
      }
      rethrow;
    }
  }

  @override
  Future<List<dynamic>> getNotifications() async {
    try {
      final response = await _dio.get(ApiEndpoints.notifications); // ASUMSI-API
      if (response.statusCode == 200) {
        return response.data['data'] ?? [];
      }
      return [];
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('⚠️ Notifications feature not yet available: ${e.message}');
      }
      return []; // Fallback empty list
    }
  }

  @override
  Future<List<dynamic>> getDisposisiList({int page = 1, int pageSize = 20}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisiList,
        queryParameters: {
          'page': page,
          'pagesize': pageSize,
        },
      );
      
      if (response.statusCode == 200) {
        return response.data['data'] ?? [];
      }
      return [];
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting disposisi list: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> logAuditTrail(String action, Map<String, dynamic> metadata) async {
    try {
      await _dio.post(ApiEndpoints.auditTrail, data: { // ASUMSI-API
        'action': action,
        'metadata': metadata,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('⚠️ Audit trail logging failed (optional feature): ${e.message}');
      }
    }
  }

  Exception _handleAssumedEndpointError(Response response) {
    if (response.statusCode == 404 || response.statusCode == 501) {
      return Exception('Fitur ini sedang dikembangkan di backend.');
    }
    return Exception('Gagal memproses permintaan (Error ${response.statusCode})');
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
