import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import 'api_endpoints.dart';

const _storage = FlutterSecureStorage();

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: (status) {
        return status != null && status < 500;
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: AppConfig.authTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        if (AppConfig.enableLogging && kDebugMode) {
          final sanitizedHeaders = Map<String, dynamic>.from(options.headers);
          if (sanitizedHeaders.containsKey('Authorization')) {
            sanitizedHeaders['Authorization'] = 'Bearer [HIDDEN]';
          }
          debugPrint('📤 REQUEST[${options.method}] => ${options.uri}');
          debugPrint('   Headers: $sanitizedHeaders');
          if (options.data != null) {
            debugPrint('   Data: ${options.data}');
          }
        }
        handler.next(options);
      },
      onResponse: (response, handler) async {
        if (AppConfig.enableLogging) {
          debugPrint('📥 RESPONSE[${response.statusCode}] <= ${response.requestOptions.uri}');
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        if (AppConfig.enableLogging) {
          debugPrint('❌ ERROR[${error.type}] => ${error.requestOptions.uri}');
          debugPrint('   Message: ${error.message}');
          debugPrint('   Status: ${error.response?.statusCode}');
        }

        // Handle 401 Unauthorized - Token expired atau invalid
        if (error.response?.statusCode == 401) {
          // Hapus token dari storage
          await _storage.delete(key: AppConfig.authTokenKey);
          await _storage.delete(key: AppConfig.userDataKey);
          
          if (AppConfig.enableLogging) {
            debugPrint('⚠️ Token tidak valid, silakan login ulang');
          }
        }

        // Handle 422 Validation Error
        if (error.response?.statusCode == 422) {
          final errors = error.response?.data['errors'];
          if (errors != null) {
            debugPrint('⚠️ Validation Errors: $errors');
          }
        }

        handler.next(error);
      },
    ),
  );

  return dio;
});
