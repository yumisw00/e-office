import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/network/dio_client.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<bool> build() {
    return const AsyncData(false);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();

    try {
      final dio = ref.read(dioProvider);

      if (kDebugMode) {
        print('Attempting login for: $email');
      }
      final response = await dio.post(
        '/mobile/login',
        data: {
          'email': email,
          'password': password,
          'device_name': 'Xiaomi 12 - ${DateTime.now().millisecondsSinceEpoch}',
        },
      );

      // Debugging: Cetak response dari Laravel
      if (kDebugMode) {
        print('=== RESPONSE LOGIN ===');
        print(response.data);
      }

      final responseData = response.data;

      // Cek apakah token ada di dalam response
      if (responseData != null && responseData['token'] != null) {
        final token = responseData['token'].toString();

        // Simpan token
        await const FlutterSecureStorage().write(
          key: 'auth_token',
          value: token,
        );

        // Sukses, ubah state
        state = const AsyncData(true);
      } else {
        // Jika format tidak sesuai tapi status 200
        throw Exception(
          responseData?['message'] ??
              'Token tidak ditemukan di response server.',
        );
      }
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Login Error Type: ${e.type}');
        print('Login Error Message: ${e.message}');
        print('Login Error Status: ${e.response?.statusCode}');
        print('Login Error Data: ${e.response?.data}');
      }
      final responseData = e.response?.data;
      String errorMessage = 'Login Gagal';

      if (e.response == null) {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          errorMessage =
              'Koneksi ke server timeout. Pastikan server aktif dan IP benar.';
        } else {
          errorMessage =
              'Tidak dapat terhubung ke server (Connection Refused). Periksa IP 192.168.0.* dan pastikan Laravel berjalan dengan --host=0.0.0.0.';
        }
      }

      String formatErrorValue(dynamic val) {
        if (val is Map) {
          return val.values.expand((v) => v is Iterable ? v : [v]).join(', ');
        } else if (val is List) {
          return val.join(', ');
        } else {
          return val.toString();
        }
      }

      if (responseData is Map) {
        final messages = responseData['messages'];
        if (messages != null) {
          if (messages is Map) {
            final errs = messages['errors'] ?? messages['message'];
            if (errs != null) {
              errorMessage = formatErrorValue(errs);
            } else {
              errorMessage = formatErrorValue(messages);
            }
          } else {
            errorMessage = messages.toString();
          }
        } else if (responseData['errors'] != null) {
          errorMessage = formatErrorValue(responseData['errors']);
        } else if (responseData['message'] != null) {
          errorMessage = responseData['message'].toString();
        }
      } else if (responseData != null) {
        errorMessage = responseData.toString();
      }
      state = AsyncError(Exception(errorMessage), StackTrace.current);
      throw Exception(errorMessage);
    } catch (e, st) {
      if (kDebugMode) {
        print('Login Unexpected Error: $e');
      }
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/mobile/logout');
    } catch (e) {
      if (kDebugMode) {
        print('Logout Error: $e');
      }
    } finally {
      await const FlutterSecureStorage().delete(key: 'auth_token');
      state = const AsyncData(false);
    }
  }
}
