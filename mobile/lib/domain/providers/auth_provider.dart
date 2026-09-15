import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/constants/app_config.dart';
import '../../data/models/user_model.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  AuthNotifier() : super(const AsyncValue.data(null));

  /// Login dengan email, password, device name, dan FCM token
  Future<void> login(
    String email, 
    String password, 
    String deviceName,
    String fcmToken,
  ) async {
    state = const AsyncValue.loading();
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.baseUrl,
          connectTimeout: AppConfig.connectTimeout,
          receiveTimeout: AppConfig.receiveTimeout,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (kDebugMode) {
        print('🔐 Attempting login for: $email');
        print('   Device: $deviceName');
        print('   FCM Token: ${fcmToken.isNotEmpty ? '${fcmToken.substring(0, 10)}...' : 'none'}');
      }

      final response = await dio.post(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
          'device_name': deviceName,
          'fcm_token': fcmToken, 
        },
      );

      if (kDebugMode) {
        print('✅ RESPONSE LOGIN => Status: ${response.statusCode}');
        print('   Data: ${response.data}');
      }

      final responseData = response.data;
      
      if (responseData != null && responseData['token'] != null) {
        final token = responseData['token'].toString();
        const storage = FlutterSecureStorage();
        
        // Simpan token autentikasi
        await storage.write(
          key: AppConfig.authTokenKey,
          value: token,
        );

        // Simpan data user jika ada
        UserModel? user;
        if (responseData['user'] != null) {
          user = UserModel.fromJsonApi(responseData['user']);
          await storage.write(
            key: AppConfig.userDataKey,
            value: user.toJson().toString(),
          );
        }

        state = AsyncValue.data(user);
        
        if (kDebugMode) {
          print('✅ Login berhasil! User: ${user?.nama ?? email}');
        }
      } else {
        throw Exception(
          responseData?['message'] ??
              'Token tidak ditemukan di response server.',
        );
      }
    } on DioException catch (e) {
      if (kDebugMode) {
        print('❌ Login Error Type: ${e.type}');
        print('   Message: ${e.message}');
        print('   Status: ${e.response?.statusCode}');
        print('   Data: ${e.response?.data}');
      }

      final responseData = e.response?.data;
      String errorMessage = 'Login Gagal';

      // Handle network errors
      if (e.response == null) {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          errorMessage =
              'Koneksi ke server timeout. Pastikan server aktif dan IP benar.';
        } else {
          errorMessage =
              'Tidak dapat terhubung ke server. Periksa IP dan pastikan Laravel berjalan';
        }
      }

      // Format error messages dari backend
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

      state = AsyncValue.error(Exception(errorMessage), StackTrace.current);
      throw Exception(errorMessage);
    } catch (e, st) {
      if (kDebugMode) {
        print('❌ Login Unexpected Error: $e');
      }
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  /// Logout - panggil API logout lalu hapus token lokal
  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.baseUrl,
          connectTimeout: AppConfig.connectTimeout,
          receiveTimeout: AppConfig.receiveTimeout,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ),
      );
      // Panggil API logout terlebih dahulu
      await dio.post(ApiEndpoints.logout);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Logout Error (non-fatal): $e');
      }
      // Lanjutkan menghapus token meskipun API logout gagal
    } finally {
      // Hapus token dan data user dari storage
      const storage = FlutterSecureStorage();
      await storage.delete(key: AppConfig.authTokenKey);
      await storage.delete(key: AppConfig.userDataKey);
      state = const AsyncValue.data(null);
    }
  }

  /// Load user data dari storage (untuk auto-login)
  Future<void> loadUserFromStorage() async {
    try {
      const storage = FlutterSecureStorage();
      final userDataStr = await storage.read(key: AppConfig.userDataKey);
      
      if (userDataStr != null) {
        String cleanData = userDataStr;
        if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
          cleanData = cleanData.substring(1, cleanData.length - 1);
        }
        
        try {
          final json = <String, dynamic>{};
          final nameMatch = RegExp(r"'nama':\s*'([^']+)'").firstMatch(userDataStr);
          final emailMatch = RegExp(r"'email':\s*'([^']+)'").firstMatch(userDataStr);
          
          if (nameMatch != null) json['nama'] = nameMatch.group(1);
          if (emailMatch != null) json['email'] = emailMatch.group(1);
          
          if (json.isNotEmpty) {
            state = AsyncValue.data(UserModel.fromJsonApi(json));
          }
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ Failed to parse user data: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error loading user from storage: $e');
      }
    }
  }
}
