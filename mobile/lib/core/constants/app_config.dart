/// App configuration constants
/// 
/// This file contains all configurable values for the app.
/// Modify these values according to your environment.
class AppConfig {
  // Backend API Configuration
  // Change this to match your Laravel backend IP and port
  static const String baseUrl = 'http://192.168.0.40:8000/api';
  
  // Alternative: Use environment variable (uncomment if needed)
  // static String get baseUrl => const String.fromEnvironment(
  //   'API_BASE_URL', 
  //   defaultValue: 'http://192.168.0.40:8000/api',
  // );
  
  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Storage keys
  static const String authTokenKey = 'auth_token';
  static const String userDataKey = 'user_data';
  static const String activeGroupKey = 'active_group';
  
  // Feature flags
  static const bool enableLogging = true;
  static const bool enableMockData = false; // Set to false for production
  
  // Private constructor to prevent instantiation
  AppConfig._();
}
