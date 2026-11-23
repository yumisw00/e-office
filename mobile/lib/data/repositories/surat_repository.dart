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

/// DEBUG ONLY: cetak raw log aksi dengan token tersamarkan
dynamic _sanitizeForRawLog(dynamic data) {
  if (data == null) return null;
  if (data is Map) {
    final copy = <dynamic, dynamic>{};
    for (final entry in data.entries) {
      final key = entry.key.toString();
      final keyLower = key.toLowerCase();
      if (keyLower.contains('token') ||
          keyLower.contains('password') ||
          keyLower.contains('secret') ||
          keyLower.contains('authorization')) {
        copy[entry.key] = '[HIDDEN]';
      } else {
        copy[entry.key] = _sanitizeForRawLog(entry.value);
      }
    }
    return copy;
  } else if (data is List) {
    return data.map(_sanitizeForRawLog).toList();
  } else if (data is String) {
    if (data.contains('Bearer ')) {
      return data.replaceAll(
        RegExp(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*'),
        'Bearer [HIDDEN]',
      );
    }
    return data;
  }
  return data;
}

void _logActionRaw(String actionName, int? statusCode, dynamic rawData) {
  if (!kDebugMode) return;
  final sanitized = _sanitizeForRawLog(rawData);
  debugPrint('[RAW_LOG][$actionName] Status: $statusCode, Body: $sanitized');
}

abstract class SuratRepository {
  Future<PimpinanDashboard> getDashboard();
  Future<List<SuratModel>> getMyActions({int page = 1, int pageSize = 15});
  Future<List<TimelineEvent>> getTracking(String id, String? actionType);
  Future<void> approveSurat(String id, {String? idSuratApproval});
  Future<void> rejectSurat(String id, String reason, {String? idSuratApproval});
  Future<Map<String, dynamic>> signSurat(
    String id, {
    required String signatureData,
  });
  Future<void> completeDisposisi(
    String id, {
    required String catatan,
    String? fileBuktiPath,
    String? idSuratMasuk,
    String? asalNilai,
  });
  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file);
  Future<List<Map<String, dynamic>>> getDisposisiList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    int page = 1,
    int pageSize = 50,
  });
  Future<List<SuratModel>> getSuratMasukList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    String? tanggalTerima,
    int page = 1,
    int pageSize = 50,
  });
  Future<List<SuratModel>> getApprovalList({
    String? status,
    int page = 1,
    int pageSize = 50,
  });
  Future<List<Map<String, String>>> getJenisSuratOptions();
  Future<Map<String, dynamic>?> getDisposisiForSurat(String idSuratMasuk);
  Future<void> submitSuratKeluar(String id);

  // Aksi Surat Masuk (Arsipkan & Disposisi)
  Future<Map<String, dynamic>> archiveSuratMasuk(
    String id, {
    String? lokasiFisik,
    required String tanggalArsip,
  });
  Future<List<Map<String, dynamic>>> getDisposisiRecipients();
  Future<void> createDisposisi({
    required String idSuratMasuk,
    required List<String> idPenerimaList,
    String? tanggalJatuhTempo,
  });

  // Notifikasi
  Future<List<dynamic>> getNotifications({int page = 1, int perPage = 15});
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();

  // Detail
  Future<SuratModel?> getSuratMasukDetail(String id);
  Future<SuratModel?> getSuratKeluarDetail(String id);
  Future<SuratModel?> getDisposisiDetail(String id);

  // Dashboard Tambahan
  Future<List<PengumumanModel>> getPengumuman({int limit = 5});
  Future<List<AgendaModel>> getAgenda({int limit = 5});
}

class ApiSuratRepository implements SuratRepository {
  final Dio _dio;
  Map<String, int>? _lastSuratMasukCategorySummary;
  Map<String, int>? _lastDisposisiCategorySummary;

  ApiSuratRepository(this._dio);

  Map<String, int>? get lastSuratMasukCategorySummary =>
      _lastSuratMasukCategorySummary;
  Map<String, int>? get lastDisposisiCategorySummary =>
      _lastDisposisiCategorySummary;

  Map<String, int>? _parseCategorySummary(dynamic rawData) {
    if (rawData is! Map) return null;
    final rawSummary = rawData['category_summary'];
    if (rawSummary is! Map) return null;
    return {
      'total': int.tryParse(rawSummary['total']?.toString() ?? '') ?? 0,
      'internal': int.tryParse(rawSummary['internal']?.toString() ?? '') ?? 0,
      'eksternal': int.tryParse(rawSummary['eksternal']?.toString() ?? '') ?? 0,
    };
  }

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
  Future<List<SuratModel>> getMyActions({
    int page = 1,
    int pageSize = 15,
  }) async {
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
        _debugLogLong(
          '📋 [RAW_LOG] MY-ACTIONS ITEM (action_type=disposisi):',
          firstDisp ?? '(tidak ada)',
        );
        _debugLogLong(
          '📋 [RAW_LOG] MY-ACTIONS ITEM (action_type=approval):',
          firstAppr ?? '(tidak ada)',
        );
      }

      return listData.map((json) => SuratModel.fromJsonApi(json)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetMyActions Error: $e');
      rethrow;
    }
  }

  /// Kontrak backend: {"success":true,"data":[{type,title,status,created_at}, ...]}
  /// Untuk disposisi: gunakan endpoint /surat_disposisi/{id}/timeline.
  /// Untuk lainnya: gunakan endpoint /pimpinan/tracking/{id}.
  /// 403/404: {"success":false,"message":"..."} -> dilempar sebagai [TrackingException].
  /// Error lain di-rethrow (tidak ditelan).
  @override
  Future<List<TimelineEvent>> getTracking(String id, String? actionType) async {
    try {
      final endpoint = actionType == 'disposisi'
          ? ApiEndpoints.disposisiTimeline(id)
          : ApiEndpoints.tracking(id);
      final response = await _dio.get(endpoint);
      final body = response.data;
      final rawList = body is Map ? body['data'] : null;

      if (rawList is! List) {
        if (kDebugMode) {
          debugPrint(
            '⚠️ GetTracking: body["data"] bukan List (type: ${rawList.runtimeType})',
          );
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
      final serverMessage = (body is Map && body['message'] is String)
          ? body['message'] as String
          : null;

      if (kDebugMode)
        debugPrint(
          '❌ GetTracking Error [$statusCode]: ${serverMessage ?? e.message}',
        );

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
  Future<void> approveSurat(String id, {String? idSuratApproval}) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.suratKeluarApprove(id),
        data: {
          if (idSuratApproval != null && idSuratApproval.isNotEmpty)
            'id_surat_approval': idSuratApproval,
        },
      );
      _logActionRaw('approve', response.statusCode, response.data);
    } on DioException catch (e) {
      _logActionRaw(
        'approve',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    } catch (e) {
      _logActionRaw('approve', null, e.toString());
      rethrow;
    }
  }

  @override
  Future<void> rejectSurat(
    String id,
    String reason, {
    String? idSuratApproval,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.suratKeluarReject(id),
        data: {
          'catatan_revisi': reason,
          if (idSuratApproval != null && idSuratApproval.isNotEmpty)
            'id_surat_approval': idSuratApproval,
        },
      );
      _logActionRaw('reject', response.statusCode, response.data);
    } on DioException catch (e) {
      _logActionRaw(
        'reject',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    } catch (e) {
      _logActionRaw('reject', null, e.toString());
      rethrow;
    }
  }

  @override
  Future<Map<String, dynamic>> signSurat(
    String id, {
    required String signatureData,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.suratKeluarSign(id),
      data: {'signature_data': signatureData, 'signature': signatureData},
    );
    return response.data is Map<String, dynamic>
        ? response.data
        : {'message': 'Success'};
  }

  @override
  Future<void> completeDisposisi(
    String id, {
    required String catatan,
    String? fileBuktiPath,
    String? idSuratMasuk,
    String? asalNilai,
  }) async {
    if (kDebugMode) {
      debugPrint(
        '[DEBUG][complete]: idDisposisi yang dikirim: $id, id surat masuk: ${idSuratMasuk ?? "-"}, ASAL nilai: ${asalNilai ?? "tidak diketahui"}',
      );
    }
    final payload = <String, dynamic>{
      'catatan_penyelesaian': catatan,
      if (fileBuktiPath != null && fileBuktiPath.isNotEmpty)
        'file_bukti_path': fileBuktiPath,
    };

    try {
      final response = await _dio.post(
        ApiEndpoints.disposisiComplete(id),
        data: payload,
      );
      _logActionRaw('complete', response.statusCode, response.data);
    } on DioException catch (e) {
      _logActionRaw(
        'complete',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    } catch (e) {
      _logActionRaw('complete', null, e.toString());
      rethrow;
    }
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

    try {
      final response = await _dio.post(
        ApiEndpoints.disposisiUploadAttachment(id),
        data: formData,
      );
      _logActionRaw('upload-attachment', response.statusCode, response.data);
      final data = response.data;
      if (data is Map<String, dynamic>) {
        if (data['data'] is Map<String, dynamic>) {
          return Map<String, dynamic>.from(data['data']);
        }
        return data;
      }
      return {};
    } on DioException catch (e) {
      _logActionRaw(
        'upload-attachment',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    } catch (e) {
      _logActionRaw('upload-attachment', null, e.toString());
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisi,
        queryParameters: {
          if (status != null && status.isNotEmpty && status != 'semua')
            'status': status,
          if (jenisPengiriman != null &&
              jenisPengiriman.isNotEmpty &&
              jenisPengiriman != 'semua')
            'q[jenis_pengiriman]': jenisPengiriman,
          if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
          'page': page,
          'pagesize': pageSize,
        },
      );
      final rawData = response.data;
      final parsedSummary = _parseCategorySummary(rawData);
      if (parsedSummary != null) {
        _lastDisposisiCategorySummary = parsedSummary;
      }
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
  Future<List<SuratModel>> getSuratMasukList({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    String? tanggalTerima,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.suratMasuk,
        queryParameters: {
          if (status != null && status.isNotEmpty && status != 'semua')
            'status': status,
          if (jenisPengiriman != null &&
              jenisPengiriman.isNotEmpty &&
              jenisPengiriman != 'semua')
            'jenis_pengiriman': jenisPengiriman,
          if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
          if (tanggalTerima != null && tanggalTerima.isNotEmpty)
            'tanggal_surat': tanggalTerima,
          'page': page,
          'pagesize': pageSize,
        },
      );
      final rawData = response.data;
      final parsedSummary = _parseCategorySummary(rawData);
      if (parsedSummary != null) {
        _lastSuratMasukCategorySummary = parsedSummary;
      }
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
      return items.map((json) {
        final itemMap = Map<String, dynamic>.from(json as Map);
        itemMap['action_type'] = 'surat_masuk';
        return SuratModel.fromJsonApi(itemMap);
      }).toList();
    } catch (e) {
      if (kDebugMode) print('❌ getSuratMasukList Error: $e');
      return [];
    }
  }

  @override
  Future<List<SuratModel>> getApprovalList({
    String? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.suratApproval,
        queryParameters: {
          if (status != null && status.isNotEmpty && status != 'semua')
            'status': status,
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
      return items.map((json) {
        final itemMap = Map<String, dynamic>.from(json as Map);
        itemMap['action_type'] = 'approval';
        return SuratModel.fromJsonApi(itemMap);
      }).toList();
    } catch (e) {
      if (kDebugMode) print('❌ getApprovalList Error: $e');
      return [];
    }
  }

  @override
  Future<List<Map<String, String>>> getJenisSuratOptions() async {
    Response<dynamic>? response;
    try {
      response = await _dio.get(ApiEndpoints.suratMasukMasterData);
    } catch (_) {
      try {
        response = await _dio.get(ApiEndpoints.suratMasukMasterDataFallback);
      } catch (e) {
        if (kDebugMode) print('❌ getJenisSuratOptions Error: $e');
        return [];
      }
    }

    final payload = response.data;
    dynamic source;
    if (payload is Map) {
      final dataField = payload['data'];
      if (dataField is Map && dataField['jenis'] is List) {
        source = dataField['jenis'];
      } else if (dataField is List) {
        source = dataField;
      } else if (payload['jenis'] is List) {
        source = payload['jenis'];
      }
    } else if (payload is List) {
      source = payload;
    }

    if (source is! List) return [];

    final seen = <String>{};
    final options = <Map<String, String>>[];
    for (final raw in source) {
      String value = '';
      String label = '';
      if (raw is Map) {
        value = (raw['value'] ?? raw['nama'] ?? raw['label'] ?? '')
            .toString()
            .trim();
        label = (raw['label'] ?? raw['nama'] ?? raw['value'] ?? '')
            .toString()
            .trim();
      } else if (raw != null) {
        value = raw.toString().trim();
        label = value;
      }
      if (value.isEmpty) continue;
      final normalizedKey = value.toLowerCase();
      if (!seen.add(normalizedKey)) continue;
      options.add({
        'value': value,
        'label': label.isNotEmpty ? label : value,
      });
    }
    return options;
  }

  @override
  Future<Map<String, dynamic>?> getDisposisiForSurat(
    String idSuratMasuk,
  ) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisi,
        queryParameters: {'id_surat_masuk': idSuratMasuk, 'pagesize': 5},
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
        final active = items.firstWhere((element) {
          final st = (element['status'] ?? '').toString().toLowerCase();
          return st != 'selesai' && st != 'dibatalkan';
        }, orElse: () => items.first);
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
  Future<Map<String, dynamic>> archiveSuratMasuk(
    String id, {
    String? lokasiFisik,
    required String tanggalArsip,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.suratMasukArchive(id),
        data: {
          'lokasi_fisik': (lokasiFisik ?? '').trim(),
          'tanggal_arsip': tanggalArsip,
        },
      );
      _logActionRaw('archive_surat_masuk', response.statusCode, response.data);
      final body = response.data;
      if (body is Map && body['success'] == false) {
        throw Exception(
          body['message']?.toString() ?? 'Surat masuk gagal diarsipkan.',
        );
      }
      if (body is Map) {
        if (body['data'] is Map) {
          return Map<String, dynamic>.from(body['data'] as Map);
        }
        return Map<String, dynamic>.from(body);
      }
      return {};
    } on DioException catch (e) {
      _logActionRaw(
        'archive_surat_masuk',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    } catch (e) {
      _logActionRaw('archive_surat_masuk', null, e.toString());
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiRecipients() async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisiRecipients,
        queryParameters: {'page': 1, 'pagesize': 1000},
      );
      final rawData = response.data;
      List<dynamic> rows = [];
      if (rawData is Map) {
        if (rawData['data'] is List) {
          rows = rawData['data'] as List;
        } else if (rawData['result'] is List) {
          rows = rawData['result'] as List;
        }
      } else if (rawData is List) {
        rows = rawData;
      }

      return rows
          .whereType<Map>()
          .map((item) {
            final row = Map<String, dynamic>.from(item);
            final id = (row['id_user'] ?? row['id'] ?? '').toString();
            final name =
                (row['name'] ?? row['nama'] ?? row['email'] ?? 'User $id')
                    .toString();
            return {
              'id': id,
              'name': name,
              'email': (row['email'] ?? '').toString(),
              'nama_group': (row['nama_group'] ?? '').toString(),
            };
          })
          .where((item) => item['id']!.isNotEmpty)
          .toList();
    } on DioException catch (e) {
      _logActionRaw(
        'get_disposisi_recipients',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    }
  }

  @override
  Future<void> createDisposisi({
    required String idSuratMasuk,
    required List<String> idPenerimaList,
    String? tanggalJatuhTempo,
  }) async {
    if (idPenerimaList.isEmpty) {
      throw ArgumentError('Penerima disposisi wajib dipilih.');
    }

    final parsedSuratId = int.tryParse(idSuratMasuk) ?? idSuratMasuk;
    final cleanDeadline =
        (tanggalJatuhTempo != null && tanggalJatuhTempo.trim().isNotEmpty)
        ? tanggalJatuhTempo.trim()
        : null;

    try {
      for (final idPenerima in idPenerimaList) {
        final parsedPenerimaId = int.tryParse(idPenerima) ?? idPenerima;
        final response = await _dio.post(
          ApiEndpoints.disposisi,
          data: {
            'id_surat_masuk': parsedSuratId,
            'id_penerima': parsedPenerimaId,
            'tanggal_jatuh_tempo': cleanDeadline,
            'status': 'baru',
          },
        );
        _logActionRaw('create_disposisi', response.statusCode, response.data);
        final body = response.data;
        if (body is Map && body['success'] == false) {
          throw Exception(
            body['message']?.toString() ?? 'Disposisi gagal dibuat.',
          );
        }
      }
    } on DioException catch (e) {
      _logActionRaw(
        'create_disposisi',
        e.response?.statusCode,
        e.response?.data ?? e.message,
      );
      rethrow;
    } catch (e) {
      _logActionRaw('create_disposisi', null, e.toString());
      rethrow;
    }
  }

  @override
  Future<List<dynamic>> getNotifications({
    int page = 1,
    int perPage = 15,
  }) async {
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
          _debugLogLong(
            '🔔 [RAW_LOG] NOTIFIKASI ITEM 1:',
            rawItems.isNotEmpty ? rawItems[0] : '(kosong)',
          );
          _debugLogLong(
            '🔔 [RAW_LOG] NOTIFIKASI ITEM 2:',
            rawItems.length > 1 ? rawItems[1] : '(kosong)',
          );
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
        _debugLogLong(
          '📥 [RAW_LOG] GET /surat_masuk/$id RAW BODY:',
          response.data,
        );
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        if (model.activeFilePath == null) {
          _debugLogDetailKeys(
            'SURAT MASUK $id (activeFilePath null)',
            response.data,
          );
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
        _debugLogLong(
          '📤 [RAW_LOG] GET /surat_keluar/$id RAW BODY:',
          response.data,
        );
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        if (model.activeFilePath == null) {
          _debugLogDetailKeys(
            'SURAT KELUAR $id (activeFilePath null)',
            response.data,
          );
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
  Future<SuratModel?> getDisposisiDetail(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.disposisiDetail(id));
      if (kDebugMode) {
        _debugLogLong(
          '📥 [RAW_LOG] GET /surat_disposisi/$id RAW BODY:',
          response.data,
        );
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        return model;
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ GetDisposisiDetail Error: $e');
      return null;
    }
  }

  @override
  Future<List<PengumumanModel>> getPengumuman({int limit = 5}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.pengumuman,
        queryParameters: {'pagesize': limit, 'page': 1},
      );
      final rawData = response.data;
      List<dynamic> listData = [];
      if (rawData is Map<String, dynamic>) {
        listData = rawData['data'] is List
            ? rawData['data']
            : (rawData['data']?['data'] ?? []);
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
      final response = await _dio.get(
        ApiEndpoints.agendaKegiatan,
        queryParameters: {'pagesize': limit, 'page': 1},
      );
      final rawData = response.data;
      List<dynamic> listData = [];
      if (rawData is Map<String, dynamic>) {
        listData = rawData['data'] is List
            ? rawData['data']
            : (rawData['data']?['data'] ?? []);
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
