import 'package:flutter/foundation.dart';

class AppConfig {
  /// Base URL API E-Office yang dinamis. Bisa diatur via build command:
  /// `flutter run --dart-define=BASE_URL=https://eoffice.api.com/api`
  static const String _defaultDevUrl = 'http://192.168.0.5:8000/api';
  static const String _defaultProdUrl = 'https://eoffice.api.com/api'; // WAJIB HTTPS untuk produksi

  static String get baseUrl {
    const envUrl = String.fromEnvironment('BASE_URL');
    if (envUrl.isNotEmpty) {
      if (!kDebugMode && !envUrl.startsWith('https://')) {
        // Keamanan tambahan: Paksa HTTPS di lingkungan rilis produksi
        return envUrl.replaceFirst('http://', 'https://');
      }
      return envUrl;
    }
    return kDebugMode ? _defaultDevUrl : _defaultProdUrl;
  }

  static const Duration connectTimeout = Duration(seconds: 5);
  static const Duration receiveTimeout = Duration(seconds: 5);
  
  static const String authTokenKey = 'auth_token';
  static const String userDataKey = 'user_data';
  static const String activeGroupKey = 'active_group';
  
  static const bool enableLogging = true;
  static const bool enableMockData = false;

  AppConfig._();
}
