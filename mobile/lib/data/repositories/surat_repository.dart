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
  Future<void> uploadDisposisiAttachment(String id, dynamic file, String? description);
  Future<void> completeDisposisi(String id, String statusRealisasi, DateTime realisasiDate, String? notes);
  Future<void> approveSuratKeluar(String id);
  Future<void> rejectSuratKeluar(String id, String catatanRevisi);
  Future<Map<String, dynamic>> signSuratKeluar(String id);
  Future<void> submitSuratKeluar(String id);
  Future<List<SuratModel>> getApprovalQueue({int page = 1, int pageSize = 20});
  Future<List<dynamic>> getDisposisiList({int page = 1, int pageSize = 20});
  Future<void> forwardDisposisi(String id, Map<String, dynamic> data);
  Future<List<dynamic>> getNotifications({bool? unread, int page = 1, int perPage = 15});
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();
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
        
        if (data is Map && data.containsKey('timeline')) {
          timelineList = data['timeline'] as List;
        } else if (data is Map && data.containsKey('data') && data['data'] is Map && data['data'].containsKey('timeline')) {
          timelineList = data['data']['timeline'] as List;
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
        if (data != null) {
          // Contract: response has summary fields directly, possibly nested in 'data' key
          final summaryData = data is Map && data.containsKey('data') ? data['data'] : data;
          return SuratSummary.fromJsonApi(summaryData as Map<String, dynamic>);
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
  Future<void> createDisposisi({ // BUTUH-BACKEND: endpoint tidak ada di backend
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

      // BUTUH-BACKEND: POST /disposisi (endpoint tidak ada di route/controller Laravel)
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
      if (e.response?.statusCode == 404 || e.response?.statusCode == 501) {
        throw Exception('Fitur buat disposisi belum tersedia di server.');
      }
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error creating disposisi: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> uploadDisposisiAttachment(String id, dynamic file, String? description) async {
    try {
      final formData = FormData.fromMap({
        'file': file,
        if (description != null) 'description': description,
      });
      
      // CONFIRMED EXISTS: POST /disposisi/{id}/upload-attachment
      final response = await _dio.post(
        ApiEndpoints.disposisiUploadAttachment(id),
        data: formData,
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
        debugPrint('❌ Error uploading disposisi attachment: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<void> completeDisposisi(String id, String statusRealisasi, DateTime realisasiDate, String? notes) async {
    try {
      // CONFIRMED EXISTS: POST /disposisi/{id}/complete
      // Body { notes: optional, realisasi_date: Y-m-d (required), status_realisasi: "tepat_waktu"|"terlambat" (required) }
      final payload = {
        'realisasi_date': realisasiDate.toIso8601String().split('T').first, // Format Y-m-d
        'status_realisasi': statusRealisasi,
        if (notes != null) 'notes': notes,
      };
      
      final response = await _dio.post(
        ApiEndpoints.disposisiComplete(id),
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
        debugPrint('❌ Error completing disposisi: ${e.message}');
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
  Future<Map<String, dynamic>> signSuratKeluar(String id) async {
    try {
      // FIXED: Using correct endpoint /surat-keluar/{id}/sign per contract
      final response = await _dio.post(ApiEndpoints.suratKeluarSign(id));
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        if (data != null && data is Map) {
          // Contract response:
          // { "message": "...",
          //   "data": { "surat": { "id","nomor_surat","perihal","status":"signed","signed_at","signed_by","signer_name","updated_at" },
          //             "qr_code_content": "...", "qr_code_base64": "<PNG base64>", "verification_url": "..." } }
          final responseData = data['data'] ?? data;
          return responseData as Map<String, dynamic>;
        }
        return {'data': {}};
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
      final response = await _dio.post(ApiEndpoints.suratKeluarSubmit(id));
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
  Future<void> forwardDisposisi(String id, Map<String, dynamic> data) async { // BUTUH-BACKEND
    try {
      final response = await _dio.post( // FIXED: POST instead of PUT
        ApiEndpoints.disposisiForward(id), 
        data: data,
      );
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
  Future<List<dynamic>> getNotifications({bool? unread, int page = 1, int perPage = 15}) async {
    try {
      final Map<String, dynamic> queryParameters = {
        'page': page,
        'per_page': perPage,
      };
      if (unread != null) {
        queryParameters['unread'] = unread ? 1 : 0;
      }
      
      // FIXED: using /eoffice/notifications per contract
      final response = await _dio.get(
        ApiEndpoints.notifications,
        queryParameters: queryParameters,
      );
      
      if (response.statusCode == 200) {
        // Contract: { id, type, notifiable_type, notifiable_id, data: {...}, read_at, created_at, updated_at }
        final data = response.data;
        if (data is Map && data.containsKey('data')) {
          return data['data'] as List;
        } else if (data is List) {
          return data;
        }
        return [];
      }
      return [];
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting notifications: ${e.message}');
      }
      rethrow;
    }
  }
  
  @override
  Future<void> markNotificationRead(String id) async {
    try {
      // CONFIRMED EXISTS: PATCH /eoffice/notifications/{id}/read
      final response = await _dio.patch(ApiEndpoints.notificationMarkRead(id));
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error marking notification read: ${e.message}');
      }
      rethrow;
    }
  }
  
  @override
  Future<void> markAllNotificationsRead() async {
    try {
      // CONFIRMED EXISTS: POST /eoffice/notifications/read-all
      final response = await _dio.post(ApiEndpoints.notificationsMarkAllRead);
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error marking all notifications read: ${e.message}');
      }
      rethrow;
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
        final data = response.data;
        if (data is Map && data.containsKey('data')) {
          return data['data'] as List;
        } else if (data is List) {
          return data;
        }
        return [];
      }
      return [];
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('❌ Error getting disposisi list: ${e.message}');
      }
      rethrow;
    }
  }

  // REMOVED: logAuditTrail method - NOT NEEDED per contract (auto via backend observers)
  // @override
  // Future<void> logAuditTrail(String action, Map<String, dynamic> metadata) async {
  //   ...
  // }

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