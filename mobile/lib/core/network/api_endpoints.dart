import '../constants/app_config.dart';

class ApiEndpoints {
  // Auth endpoints (MOBILE PIMPINAN)
  static const String login = '/mobile/login';
  static const String logout = '/mobile/logout';
  static const String user = '/mobile/user';

  // Dashboard & Actions (PIMPINAN)
  static const String pimpinanDashboard = '/pimpinan/dashboard';
  static const String myActions = '/pimpinan/my-actions';
  static String tracking(String id) => '/pimpinan/tracking/$id';
  
  // Dashboard Tambahan
  static const String pengumuman = '/pengumuman';
  static const String agendaKegiatan = '/agenda_kegiatan';

  // Detail Surat - PIMPINAN USE THESE
  static String suratMasukDetail(String id) => '/surat_masuk/$id';
  static String suratKeluarDetail(String id) => '/surat_keluar/$id';

  // Surat Keluar - Approve/Reject (Aksi sebelum Sign)
  static String suratKeluarApprove(String id) => '/surat_keluar/$id/approve';
  static String suratKeluarReject(String id) => '/surat_keluar/$id/reject';
  
  // Tanda Tangan Digital (Kontrak Poin 7)
  static String suratKeluarSign(String id) => '/surat_keluar/$id/sign';

  // Disposisi - List, Complete & Upload (Kontrak Poin 8 & 9)
  static const String disposisi = '/surat_disposisi';
  static String disposisiDetail(String id) => '/surat_disposisi/$id';
  static String disposisiComplete(String id) => '/surat_disposisi/$id/complete';
  static String disposisiUploadAttachment(String id) => '/surat_disposisi/$id/upload-attachment';

  // Notifications (EOFFICE GENERAL - Poin 10)
  static const String notifications = '/eoffice/notifications';
  static String notificationMarkRead(String id) => '/eoffice/notifications/$id/read';
  static const String notificationsMarkAllRead = '/eoffice/notifications/read-all';

  // File storage endpoint (Poin 11)
  static String getFile(String path) => '/storage/$path';

  static String buildStorageUrl(String filePath) {
    if (filePath.isEmpty) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    final cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Perhatikan: Base URL sudah termasuk /api, rumus: BASE_URL + "/storage/" + path
    final base = AppConfig.baseUrl.endsWith('/')
        ? AppConfig.baseUrl.substring(0, AppConfig.baseUrl.length - 1)
        : AppConfig.baseUrl;
    
    // Menghilangkan '/api' dari base untuk mengakses folder storage jika di luar folder api
    final rootBase = base.replaceAll('/api', '');
    return '$rootBase/storage/$cleanPath';
  }

  ApiEndpoints._();
}
