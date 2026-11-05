import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Representasi rute hasil parsing payload/URL notifikasi
class ResolvedNotificationRoute {
  final String path;
  final Object? extra;
  final Map<String, String>? queryParams;
  final String? notificationId;

  const ResolvedNotificationRoute({
    required this.path,
    this.extra,
    this.queryParams,
    this.notificationId,
  });

  String get fullUri {
    if (queryParams == null || queryParams!.isEmpty) {
      return path;
    }
    final uri = Uri(path: path, queryParameters: queryParams);
    return uri.toString();
  }

  @override
  String toString() => 'ResolvedNotificationRoute(path: $path, extra: $extra, query: $queryParams, id: $notificationId)';
}

/// Unified resolver yang memetakan notifikasi (push FCM maupun riwayat API)
/// ke rute aplikasi yang sesuai secara konsisten.
class NotificationRouteResolver {
  NotificationRouteResolver._();

  /// Resolve data mentah (baik Map FCM, maupun item sys_notification)
  static ResolvedNotificationRoute resolveFromRaw(Map<String, dynamic> raw) {
    // Normalisasi payload jika disimpan sebagai string JSON
    dynamic rawPayload = raw['payload'];
    Map<String, dynamic> payload = {};
    if (rawPayload is String && rawPayload.isNotEmpty) {
      try {
        final decoded = jsonDecode(rawPayload);
        if (decoded is Map<String, dynamic>) {
          payload = decoded;
        }
      } catch (_) {}
    } else if (rawPayload is Map) {
      payload = Map<String, dynamic>.from(rawPayload);
    }

    final url = raw['url']?.toString() ?? payload['url']?.toString();
    final type = raw['type']?.toString() ?? 
        payload['type']?.toString() ?? 
        raw['reference_type']?.toString();
    final notifId = raw['id_notification']?.toString() ?? raw['id']?.toString();

    // Gabungkan data tingkat atas ke payload jika belum ada
    if (!payload.containsKey('id_surat_masuk') && raw.containsKey('id_surat_masuk')) {
      payload['id_surat_masuk'] = raw['id_surat_masuk'];
    }
    if (!payload.containsKey('id_surat_disposisi') && raw.containsKey('id_surat_disposisi')) {
      payload['id_surat_disposisi'] = raw['id_surat_disposisi'];
    }
    if (!payload.containsKey('id_surat_keluar') && raw.containsKey('id_surat_keluar')) {
      payload['id_surat_keluar'] = raw['id_surat_keluar'];
    }
    if (!payload.containsKey('surat_id') && raw.containsKey('surat_id')) {
      payload['surat_id'] = raw['surat_id'];
    }

    return resolve(
      url: url,
      payload: payload,
      type: type,
      notificationId: notifId,
    );
  }

  /// Resolve dari parameter spesifik
  static ResolvedNotificationRoute resolve({
    String? url,
    Map<String, dynamic>? payload,
    String? type,
    String? notificationId,
  }) {
    final cleanUrl = url?.trim() ?? '';
    final typeStr = type?.toLowerCase().trim() ?? '';

    // Ekstraksi ID bantu
    String? idSuratMasuk = payload?['id_surat_masuk']?.toString() ?? 
        payload?['surat_id']?.toString() ?? 
        payload?['reference_id']?.toString();
    String? idSuratDisposisi = payload?['id_surat_disposisi']?.toString();
    String? idSuratKeluar = payload?['id_surat_keluar']?.toString();

    // Cek apakah ada query param surat_id di URL (misal: /surat_masuk_pegawai?surat_id=12)
    if (cleanUrl.isNotEmpty && (idSuratMasuk == null || idSuratMasuk.isEmpty)) {
      final uri = Uri.tryParse(cleanUrl);
      if (uri != null && uri.queryParameters.containsKey('surat_id')) {
        idSuratMasuk = uri.queryParameters['surat_id'];
      }
    }

    // 1. SURAT KELUAR / APPROVAL
    final isApproval = typeStr.contains('approval') ||
        cleanUrl.contains('/surat_keluar/') ||
        cleanUrl.contains('/approval');

    if (isApproval) {
      if (idSuratKeluar == null || idSuratKeluar.isEmpty) {
        // Ambil ID dari URL jika ada: misal /surat_keluar/detail/123 atau /surat_keluar/123
        final match = RegExp(r'/surat_keluar/(?:detail/)?(\d+)').firstMatch(cleanUrl);
        if (match != null) {
          idSuratKeluar = match.group(1);
        }
      }

      return ResolvedNotificationRoute(
        path: '/approval',
        extra: idSuratKeluar != null ? {'highlightId': idSuratKeluar} : null,
        queryParams: idSuratKeluar != null ? {'highlightId': idSuratKeluar} : null,
        notificationId: notificationId,
      );
    }

    // 2. DISPOSISI
    final isDisposisi = typeStr.contains('disposisi') ||
        cleanUrl.contains('/disposisi') ||
        idSuratDisposisi != null;

    if (isDisposisi) {
      if (idSuratDisposisi == null || idSuratDisposisi.isEmpty) {
        final match = RegExp(r'/disposisi/(\d+)').firstMatch(cleanUrl);
        if (match != null) {
          idSuratDisposisi = match.group(1);
        }
      }

      // Jika ada id_surat_masuk terkait, buka detail surat masuk dengan modal disposisi
      if (idSuratMasuk != null && idSuratMasuk.isNotEmpty) {
        return ResolvedNotificationRoute(
          path: '/surat-masuk/$idSuratMasuk',
          extra: {
            'actionType': 'disposisi',
            'idDisposisi': ?idSuratDisposisi,
          },
          notificationId: notificationId,
        );
      }

      // Jika hanya ada ID disposisi atau link umum disposisi
      return ResolvedNotificationRoute(
        path: '/disposisi',
        notificationId: notificationId,
      );
    }

    // 3. SURAT MASUK / INTERNAL LETTER
    final isSuratMasuk = typeStr.contains('internal_letter') ||
        typeStr.contains('surat_masuk') ||
        cleanUrl.contains('/surat_masuk') ||
        cleanUrl.contains('/surat-masuk') ||
        idSuratMasuk != null;

    if (isSuratMasuk) {
      if (idSuratMasuk == null || idSuratMasuk.isEmpty) {
        final match = RegExp(r'/surat[_-]masuk/(?:detail/)?(\d+)').firstMatch(cleanUrl);
        if (match != null) {
          idSuratMasuk = match.group(1);
        }
      }

      if (idSuratMasuk != null && idSuratMasuk.isNotEmpty) {
        return ResolvedNotificationRoute(
          path: '/surat-masuk/$idSuratMasuk',
          notificationId: notificationId,
        );
      }

      return ResolvedNotificationRoute(
        path: '/surat-masuk',
        notificationId: notificationId,
      );
    }

    // 4. FALLBACK: NOTIFIKASI
    return ResolvedNotificationRoute(
      path: '/notifications',
      notificationId: notificationId,
    );
  }

  /// Eksekusi navigasi langsung ke rute hasil resolve
  static void navigateToRoute(
    BuildContext context,
    ResolvedNotificationRoute route,
  ) {
    if (kDebugMode) {
      print('🚀 Navigating to: ${route.path} (extra: ${route.extra})');
    }

    try {
      if (route.path.startsWith('/surat-masuk/') || route.path == '/notifications') {
        context.push(route.path, extra: route.extra);
      } else {
        context.go(route.path, extra: route.extra);
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Navigation failed: $e, fallback to push');
      }
      try {
        context.push(route.path, extra: route.extra);
      } catch (e2) {
        if (kDebugMode) {
          print('❌ Fallback navigation also failed: $e2');
        }
      }
    }
  }
}
