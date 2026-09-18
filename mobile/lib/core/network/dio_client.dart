import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import 'api_endpoints.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
});

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
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
        // FIXED: HTTP status >= 400 di-treat sebagai exception agar tertangkap di onError
        return status != null && status < 400;
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: AppConfig.authTokenKey);
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
      onError: (DioException error, handler) async {
        final response = error.response;
        final statusCode = response?.statusCode;
        final responseData = response?.data;

        if (AppConfig.enableLogging) {
          debugPrint('❌ ERROR[${error.type}] => ${error.requestOptions.uri}');
          debugPrint('   Status Code: $statusCode');
          debugPrint('   Body: $responseData');
        }

        String computedMessage = 'Terjadi kesalahan sistem (${statusCode ?? "Koneksi"}).';

        // Penanganan Logout / Unauthenticated Otomatis (401)
        if (statusCode == 401) {
          await storage.delete(key: AppConfig.authTokenKey);
          await storage.delete(key: AppConfig.userDataKey);
          computedMessage = 'Sesi Anda telah berakhir, silakan login kembali.';
        }

        if (responseData is Map<String, dynamic>) {
          final errorCode = responseData['error_code']?.toString();
          
          if (errorCode != null) {
            // Pola A: Custom Exception Handler
            final msg = responseData['message']?.toString();
            final errors = responseData['errors'];

            if (errors is Map) {
              final parsedErrors = errors.values.expand((v) => v is Iterable ? v : [v]).join(', ');
              computedMessage = parsedErrors.isNotEmpty ? parsedErrors : (msg ?? computedMessage);
            } else {
              computedMessage = msg ?? computedMessage;
            }
          } else {
            // Pola B: Default Laravel Handler (NO error_code)
            if (statusCode == 429) {
              computedMessage = 'Terlalu banyak percobaan percobaan, coba lagi dalam beberapa saat.';
            } else if (statusCode == 500) {
              computedMessage = 'Internal Server Error (500). Silakan hubungi admin.';
            } else if (statusCode == 404) {
              computedMessage = 'Endpoint tidak ditemukan di server (404).';
            } else if (responseData.containsKey('message')) {
              computedMessage = responseData['message'].toString();
            }
          }
        } else {
          // Fallback Generic Berdasarkan HTTP Status Code jika body kosong / bukan json
          if (error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout) {
            computedMessage = 'Koneksi ke server timeout. Silakan periksa jaringan Anda.';
          } else if (statusCode == 429) {
            computedMessage = 'Terlalu banyak percobaan percobaan, coba lagi dalam beberapa saat.';
          } else if (statusCode == 403) {
            computedMessage = 'Anda tidak memiliki hak akses untuk fitur ini (403).';
          }
        }

        // Bungkus pesan yang sudah diformat ke dalam custom DioException agar ditangkap secara seragam oleh UI / Repo
        final updatedException = DioException(
          requestOptions: error.requestOptions,
          response: error.response,
          type: error.type,
          error: Exception(computedMessage),
          message: computedMessage,
        );

        handler.next(updatedException);
      },
    ),
  );

  return dio;
});
