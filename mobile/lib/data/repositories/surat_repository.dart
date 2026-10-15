import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/surat_model.dart';
import '../../core/network/api_endpoints.dart';

/// Exception berpesan untuk endpoint tracking (403/404).
/// [message] diambil apa adanya dari body.message server.
class TrackingException implements Exception {
  final int? statusCode;
  final String message;
  TrackingException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// DEBUG ONLY: cetak teks panjang per potongan agar tidak terpotong logcat.
void _debugLogLong(String label, Object? value) {
  if (!kDebugMode) return;
  String text;
  try {
    text = const JsonEncoder.withIndent('  ').convert(value);
  } catch (_) {
    text = value.toString();
  }
  const chunk = 800;
  for (var i = 0; i < text.length; i += chunk) {
    final end = (i + chunk < text.length) ? i + chunk : text.length;
    debugPrint('$label ${text.substring(i, end)}');
  }
}

/// DEBUG ONLY: cetak key top-level & key di dalam 'data' pada response detail.
void _debugLogDetailKeys(String label, dynamic body) {
  if (!kDebugMode) return;
  if (body is Map) {
    debugPrint('🔎 $label TOP-LEVEL KEYS: ${body.keys.toList()}');
    final inner = body['data'];
    if (inner is Map) {
      debugPrint('🔎 $label DATA KEYS: ${inner.keys.toList()}');
    } else {
      debugPrint('🔎 $label DATA bukan Map (type: ${inner.runtimeType})');
    }
  } else {
    debugPrint('🔎 $label body bukan Map (type: ${body.runtimeType})');
  }
}

abstract class SuratRepository {
  Future<PimpinanDashboard> getDashboard();
  Future<List<SuratModel>> getMyActions({int page = 1, int pageSize = 15});
  Future<List<TimelineEvent>> getTracking(String id, String? actionType);
  Future<void> approveSurat(String id);
  Future<void> rejectSurat(String id, String reason);
  Future<Map<String, dynamic>> signSurat(String id, {required String signatureData});
  Future<void> completeDisposisi(String id, {required String catatan, String? fileBuktiPath});
  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file);
  Future<List<Map<String, dynamic>>> getDisposisiList({String? status, int page = 1, int pageSize = 20});
  Future<Map<String, dynamic>?> getDisposisiForSurat(String idSuratMasuk);
  Future<void> submitSuratKeluar(String id);
  
  // Notifikasi
  Future<List<dynamic>> getNotifications({int page = 1, int perPage = 15});
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();

  // Detail
  Future<SuratModel?> getSuratMasukDetail(String id);
  Future<SuratModel?> getSuratKeluarDetail(String id);

  // Dashboard Tambahan
  Future<List<PengumumanModel>> getPengumuman({int limit = 5});
  Future<List<AgendaModel>> getAgenda({int limit = 5});
}

class ApiSuratRepository implements SuratRepository {
  final Dio _dio;

  ApiSuratRepository(this._dio);

  @override
  Future<PimpinanDashboard> getDashboard() async {
    try {
      final response = await _dio.get(ApiEndpoints.pimpinanDashboard);
      return PimpinanDashboard.fromJsonApi(response.data);
    } catch (e) {
      if (kDebugMode) print('❌ GetDashboard Error: $e');
      rethrow;
    }
  }

  @override
  Future<List<SuratModel>> getMyActions({int page = 1, int pageSize = 15}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.myActions,
        queryParameters: {'page': page, 'pagesize': pageSize},
      );
      
      final rawData = response.data;
      List<dynamic> listData = [];

      if (rawData is Map<String, dynamic>) {
        if (rawData['data'] is List) {
          listData = rawData['data'];
        } else if (rawData['items'] is List) {
          listData = rawData['items'];
        } else if (rawData['results'] is List) {
          listData = rawData['results'];
        }
      } else if (rawData is List) {
        listData = rawData;
      }

      if (kDebugMode) {
        dynamic firstDisp;
        dynamic firstAppr;
        for (final item in listData) {
          if (item is Map) {
            final at = item['action_type']?.toString();
            if (at == 'disposisi' && firstDisp == null) firstDisp = item;
            if (at == 'approval' && firstAppr == null) firstAppr = item;
          }
        }
        _debugLogLong('📋 [RAW_LOG] MY-ACTIONS ITEM (action_type=disposisi):', firstDisp ?? '(tidak ada)');
        _debugLogLong('📋 [RAW_LOG] MY-ACTIONS ITEM (action_type=approval):', firstAppr ?? '(tidak ada)');
      }

      return listData.map((json) => SuratModel.fromJsonApi(json)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetMyActions Error: $e');
      rethrow;
    }
  }

  /// Kontrak backend: {"success":true,"data":[{type,title,status,created_at}, ...]}
  /// 403/404: {"success":false,"message":"..."} -> dilempar sebagai [TrackingException].
  /// Error lain di-rethrow (tidak ditelan).
  @override
  Future<List<TimelineEvent>> getTracking(String id, String? actionType) async {
    try {
      final response = await _dio.get(ApiEndpoints.tracking(id));
      final body = response.data;
      final rawList = body is Map ? body['data'] : null;

      if (rawList is! List) {
        if (kDebugMode) {
          debugPrint('⚠️ GetTracking: body["data"] bukan List (type: ${rawList.runtimeType})');
        }
        return [];
      }

      return rawList
          .whereType<Map>()
          .map((e) => TimelineEvent.fromJsonApi(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final body = e.response?.data;
      final serverMessage =
          (body is Map && body['message'] is String) ? body['message'] as String : null;

      if (kDebugMode) debugPrint('❌ GetTracking Error [$statusCode]: ${serverMessage ?? e.message}');

      if (statusCode == 403 || statusCode == 404) {
        throw TrackingException(
          serverMessage ??
              (statusCode == 403
                  ? 'Anda tidak memiliki akses ke riwayat ini (403).'
                  : 'Riwayat tidak ditemukan (404).'),
          statusCode: statusCode,
        );
      }
      rethrow;
    }
  }

  @override
  Future<void> approveSurat(String id) async {
    await _dio.post(ApiEndpoints.suratKeluarApprove(id));
  }

  @override
  Future<void> rejectSurat(String id, String reason) async {
    await _dio.post(
      ApiEndpoints.suratKeluarReject(id),
      data: {
        'catatan_revisi': reason,
        'reason': reason,
      },
    );
  }

  @override
  Future<Map<String, dynamic>> signSurat(String id, {required String signatureData}) async {
    final response = await _dio.post(
      ApiEndpoints.suratKeluarSign(id),
      data: {
        'signature_data': signatureData,
        'signature': signatureData,
      },
    );
    return response.data is Map<String, dynamic> ? response.data : {'message': 'Success'};
  }

  @override
  Future<void> completeDisposisi(String id, {required String catatan, String? fileBuktiPath}) async {
    final payload = <String, dynamic>{
      'catatan_penyelesaian': catatan,
      if (fileBuktiPath != null && fileBuktiPath.isNotEmpty)
        'file_bukti_path': fileBuktiPath,
    };

    await _dio.post(
      ApiEndpoints.disposisiComplete(id),
      data: payload,
    );
  }

  @override
  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file) async {
    String? filePath;
    String? fileName;
    if (file is String) {
      filePath = file;
      fileName = filePath.split('/').last;
    }
    
    final formData = FormData.fromMap({
      if (filePath != null)
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _dio.post(
      ApiEndpoints.disposisiUploadAttachment(id),
      data: formData,
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      if (data['data'] is Map<String, dynamic>) {
        return Map<String, dynamic>.from(data['data']);
      }
      return data;
    }
    return {};
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiList({String? status, int page = 1, int pageSize = 20}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisi,
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status,
          'page': page,
          'pagesize': pageSize,
        },
      );
      final rawData = response.data;
      List<dynamic> items = [];
      if (rawData is Map<String, dynamic>) {
        if (rawData['data'] is List) {
          items = rawData['data'];
        } else if (rawData['result'] is List) {
          items = rawData['result'];
        }
      } else if (rawData is List) {
        items = rawData;
      }
      return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ getDisposisiList Error: $e');
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>?> getDisposisiForSurat(String idSuratMasuk) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisi,
        queryParameters: {
          'id_surat_masuk': idSuratMasuk,
          'pagesize': 5,
        },
      );
      final rawData = response.data;
      List<dynamic> items = [];
      if (rawData is Map<String, dynamic>) {
        if (rawData['data'] is List) {
          items = rawData['data'];
        } else if (rawData['result'] is List) {
          items = rawData['result'];
        }
      }
      if (items.isNotEmpty) {
        final active = items.firstWhere(
          (element) {
            final st = (element['status'] ?? '').toString().toLowerCase();
            return st != 'selesai' && st != 'dibatalkan';
          },
          orElse: () => items.first,
        );
        return Map<String, dynamic>.from(active as Map);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ getDisposisiForSurat Error: $e');
      return null;
    }
  }

  @override
  Future<void> submitSuratKeluar(String id) async {
    await _dio.post('/surat_keluar/$id/submit');
  }

  @override
  Future<List<dynamic>> getNotifications({int page = 1, int perPage = 15}) async {
    final response = await _dio.get(
      ApiEndpoints.notifications,
      queryParameters: {'page': page, 'per_page': perPage},
    );

    // DEBUG ONLY: log mentah (tidak mengubah parsing di bawah)
    if (kDebugMode) {
      final body = response.data;
      if (body is Map) {
        final rawItems = body['data'];
        if (rawItems is List) {
          _debugLogLong('🔔 [RAW_LOG] NOTIFIKASI ITEM 1:', rawItems.isNotEmpty ? rawItems[0] : '(kosong)');
          _debugLogLong('🔔 [RAW_LOG] NOTIFIKASI ITEM 2:', rawItems.length > 1 ? rawItems[1] : '(kosong)');
        }
      }
    }

    return response.data['data'] as List? ?? [];
  }

  @override
  Future<void> markNotificationRead(String id) async {
    await _dio.post(ApiEndpoints.notificationMarkRead(id));
  }

  @override
  Future<void> markAllNotificationsRead() async {
    await _dio.post(ApiEndpoints.notificationsMarkAllRead);
  }

  @override
  Future<SuratModel?> getSuratMasukDetail(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.suratMasukDetail(id));
      if (kDebugMode) {
        _debugLogLong('📥 [RAW_LOG] GET /surat_masuk/$id RAW BODY:', response.data);
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        if (model.activeFilePath == null) {
          _debugLogDetailKeys('SURAT MASUK $id (activeFilePath null)', response.data);
        }
        return model;
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ GetSuratMasukDetail Error: $e');
      return null;
    }
  }

  @override
  Future<SuratModel?> getSuratKeluarDetail(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.suratKeluarDetail(id));
      if (kDebugMode) {
        _debugLogLong('📤 [RAW_LOG] GET /surat_keluar/$id RAW BODY:', response.data);
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        if (model.activeFilePath == null) {
          _debugLogDetailKeys('SURAT KELUAR $id (activeFilePath null)', response.data);
        }
        return model;
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ GetSuratKeluarDetail Error: $e');
      return null;
    }
  }

  @override
  Future<List<PengumumanModel>> getPengumuman({int limit = 5}) async {
    try {
      final response = await _dio.get(ApiEndpoints.pengumuman, queryParameters: {'pagesize': limit, 'page': 1});
      final rawData = response.data;
      List<dynamic> listData = [];
      if (rawData is Map<String, dynamic>) {
        listData = rawData['data'] is List ? rawData['data'] : (rawData['data']?['data'] ?? []);
      } else if (rawData is List) {
        listData = rawData;
      }
      return listData.map((e) => PengumumanModel.fromJsonApi(e)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetPengumuman Error: $e');
      return [];
    }
  }

  @override
  Future<List<AgendaModel>> getAgenda({int limit = 5}) async {
    try {
      final response = await _dio.get(ApiEndpoints.agendaKegiatan, queryParameters: {'pagesize': limit, 'page': 1});
      final rawData = response.data;
      List<dynamic> listData = [];
      if (rawData is Map<String, dynamic>) {
        listData = rawData['data'] is List ? rawData['data'] : (rawData['data']?['data'] ?? []);
      } else if (rawData is List) {
        listData = rawData;
      }
      return listData.map((e) => AgendaModel.fromJsonApi(e)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetAgenda Error: $e');
      return [];
    }
  }
}
