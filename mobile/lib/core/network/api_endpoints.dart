import '../constants/app_config.dart';

class ApiEndpoints {
  // Auth endpoints
  static const String login = '/mobile/login'; // FIXED PER USER REAL EXPERIENCE
  static const String logout = '/logout';
  static const String verifyMfa = '/verify-mfa';

  // User endpoint
  static const String user = '/user';

  // FCM registration - BUTUH-BACKEND
  static const String registerFcm = '/register-fcm';

  // Surat Masuk endpoints - DASH VERSION
  static const String suratMasukList = '/surat-masuk';
  static String suratMasukDetail(String id) => '/surat-masuk/$id';
  static String suratMasukTimeline(String id) => '/surat-masuk/$id/timeline';
  static const String suratMasukSummary = '/surat-masuk/summary';

  // Surat Keluar endpoints - DASH VERSION
  static const String suratKeluarList = '/surat-keluar';
  static String suratKeluarDetail(String id) => '/surat-keluar/$id';
  static String suratKeluarSubmit(String id) => '/surat-keluar/$id/submit';
  static String suratKeluarApprove(String id) => '/surat-keluar/$id/approve';
  static String suratKeluarReject(String id) => '/surat-keluar/$id/reject';
  static String suratKeluarSign(String id) => '/surat-keluar/$id/sign';
  static String suratKeluarSend(String id) => '/surat-keluar/$id/send';
  static String suratKeluarArchive(String id) => '/surat-keluar/$id/archive';
  static String suratKeluarTimeline(String id) => '/surat-keluar/$id/timeline';

  // Approval queue endpoint - DASH VERSION
  static const String approvalQueue = '/surat-keluar/approval';

  // Disposisi endpoints - DASH VERSION
  static const String disposisiList = '/disposisi';
  static String disposisiDetail(String id) => '/disposisi/$id';

  // Disposisi upload attachment
  static String disposisiUploadAttachment(String id) => '/disposisi/$id/upload-attachment';

  // Disposisi complete
  static String disposisiComplete(String id) => '/disposisi/$id/complete';

  // Disposisi forward - BUTUH-BACKEND
  static String disposisiForward(String id) => '/disposisi/$id/forward';

  // Disposisi create - BUTUH-BACKEND
  static const String disposisiCreate = '/disposisi'; // POST

  // Notifications - PREFIX EOFFICE
  static const String notifications = '/eoffice/notifications';
  static String notificationMarkRead(String id) => '/eoffice/notifications/$id/read';
  static const String notificationsMarkAllRead = '/eoffice/notifications/read-all';

  // File storage endpoint
  static String getFile(String path) => '/storage/$path';

  static String buildStorageUrl(String filePath) {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    final cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    final base = AppConfig.baseUrl.endsWith('/')
        ? AppConfig.baseUrl.substring(0, AppConfig.baseUrl.length - 1)
        : AppConfig.baseUrl;
    return '$base/storage/$cleanPath';
  }

  // Upload endpoint
  static const String uploadFile = '/upload';
  static const String digitalSignatureVerify = '/digital-signature/verify';
  ApiEndpoints._();
}
