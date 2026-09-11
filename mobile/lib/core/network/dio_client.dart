import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../constants/app_config.dart';
part 'dio_client.g.dart';
const _storage = FlutterSecureStorage();
@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
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
        if (AppConfig.enableLogging) {
          debugPrint(' REQUEST[${options.method}] => ${options.uri}');
          debugPrint(' Headers: ${options.headers}');
          if (options.data != null) {
            debugPrint('   Data: ${options.data}');
          }
        }
        handler.next(options);
      },
      onResponse: (response, handler) async {
        if (AppConfig.enableLogging) {
          print(' RESPONSE[${response.statusCode}] <= ${response.requestOptions.uri}');
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        if (AppConfig.enableLogging) {
          print(' ERROR[${error.error}] => ${error.requestOptions.uri}');
        }
        handler.next(error);
      },
    ),
  );
  return dio;
}
