import '../constants/app_config.dart';

class ApiEndpoints {
  // Auth endpoints (MOBILE PIMPINAN)
  static const String login = '/mobile/login';
  static const String logout = '/mobile/logout';
  static const String user = '/mobile/user';
  static const String updateFcmToken = '/mobile/fcm-token';

  // Dashboard & Actions (PIMPINAN)
  static const String pimpinanDashboard = '/pimpinan/dashboard';
  static const String myActions = '/pimpinan/my-actions';
  static String tracking(String id) => '/pimpinan/tracking/$id';

  // Dashboard Tambahan
  static const String pengumuman = '/pengumuman';
  static const String agendaKegiatan = '/agenda_kegiatan';

  // Detail Surat - PIMPINAN USE THESE
  static const String suratMasuk = '/surat_masuk';
  static const String suratMasukMasterData = '/surat_masuk/master-data';
  static const String suratMasukMasterDataFallback = '/surat_masuk/master_data';
  static String suratMasukDetail(String id) => '/surat_masuk/$id';
  static String suratMasukArchive(String id) => '/surat_masuk/$id/archive';
  static const String suratApproval = '/surat_approval';
  static String suratKeluarDetail(String id) => '/surat_keluar/$id';

  // Surat Keluar - Approve/Reject (Aksi sebelum Sign)
  static String suratKeluarApprove(String id) => '/surat_keluar/$id/approve';
  static String suratKeluarReject(String id) => '/surat_keluar/$id/reject';

  // Tanda Tangan Digital (Kontrak Poin 7)
  static String suratKeluarSign(String id) => '/surat_keluar/$id/sign';

  // Disposisi - List, Complete & Upload (Kontrak Poin 8 & 9)
  static const String disposisi = '/surat_disposisi';
  static const String disposisiRecipients = '/surat_keluar/recipients';
  static String disposisiDetail(String id) => '/surat_disposisi/$id';
  static String disposisiComplete(String id) => '/surat_disposisi/$id/complete';
  static String disposisiUploadAttachment(String id) =>
      '/surat_disposisi/$id/upload-attachment';
  static String disposisiTimeline(String id) => '/surat_disposisi/$id/timeline';

  // Notifications (EOFFICE GENERAL - Poin 10)
  static const String notifications = '/eoffice/notifications';
  static String notificationMarkRead(String id) =>
      '/eoffice/notifications/$id/read';
  static const String notificationsMarkAllRead =
      '/eoffice/notifications/read-all';

  // File retrieval endpoint (Sesuai rute backend: /api/getfile/{path})
  static String getFile(String path) => '/getfile/$path';

  static String buildStorageUrl(String filePath) {
    if (filePath.isEmpty) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    // Normalisasi path: bersihkan prefix slash, api/getfile/, atau storage/ jika ada
    var cleanPath = filePath.trim();
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    if (cleanPath.startsWith('api/getfile/')) {
      cleanPath = cleanPath.substring('api/getfile/'.length);
    } else if (cleanPath.startsWith('getfile/')) {
      cleanPath = cleanPath.substring('getfile/'.length);
    } else if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.substring('storage/'.length);
    }

    final base = AppConfig.baseUrl.endsWith('/')
        ? AppConfig.baseUrl.substring(0, AppConfig.baseUrl.length - 1)
        : AppConfig.baseUrl;

    // Sesuai route backend routes/api.php: Route::get('getfile/{path}') -> /api/getfile/{path}
    return '$base/getfile/$cleanPath';
  }

  /// Cek apakah URL merupakan tautan Google Docs / Drive
  static bool isGoogleDriveUrl(String url) {
    if (url.isEmpty) return false;
    return RegExp(
      r'(^https?:\/\/)?(docs|drive)\.google\.com\/',
      caseSensitive: false,
    ).hasMatch(url);
  }

  /// Konversi URL Google Docs / Drive ke URL pratinjau (/preview)
  static String toGoogleDrivePreviewUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final docMatch = RegExp(
        r'^\/(document|spreadsheets|presentation)\/d\/([^/]+)',
        caseSensitive: false,
      ).firstMatch(uri.path);
      if (docMatch != null) {
        return 'https://docs.google.com/${docMatch.group(1)}/d/${docMatch.group(2)}/preview';
      }
      final fileMatch = RegExp(
        r'^\/file\/d\/([^/]+)',
        caseSensitive: false,
      ).firstMatch(uri.path);
      if (fileMatch != null) {
        return 'https://drive.google.com/file/d/${fileMatch.group(1)}/preview';
      }
      final fileId = uri.queryParameters['id'];
      if (fileId != null && fileId.isNotEmpty) {
        return 'https://drive.google.com/file/d/$fileId/preview';
      }
      return url;
    } catch (_) {
      return url;
    }
  }

  ApiEndpoints._();
}
