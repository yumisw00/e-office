class AppConfig {
  static const String baseUrl = 'http:
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const String authTokenKey = 'auth_token';
  static const String userDataKey = 'user_data';
  static const String activeGroupKey = 'active_group';
  static const bool enableLogging = true;
  static const bool enableMockData = false; 
  AppConfig._();
}
