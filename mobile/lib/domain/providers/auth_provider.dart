import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/app_config.dart';
import '../../data/models/user_model.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final Ref _ref;
  AuthNotifier(this._ref) : super(const AsyncValue.data(null));

  Future<Map<String, dynamic>?> login(
    String email,
    String password,
    String deviceName, {
    String? fcmToken,
  }) async {
    state = const AsyncValue.loading();
    try {
      // --- BACKDOOR DEVELOPMENT ---
      if (kDebugMode && email == '.' && password == '.') {
        final mockUser = UserModel(
          id: '999',
          nama: 'Developer Pimpinan',
          email: 'dev@pimpinan.com',
          jabatan: 'Pimpinan Eksekutif',
          groups: ['Pimpinan'],
        );
        final storage = _ref.read(secureStorageProvider);
        await storage.write(key: AppConfig.authTokenKey, value: 'DEV_DUMMY_TOKEN_999');
        await storage.write(key: AppConfig.userDataKey, value: jsonEncode(mockUser.toJson()));
        
        state = AsyncValue.data(mockUser);
        return {'success': true};
      }
      // -----------------------------

      final dio = _ref.read(dioProvider);

      final loginData = {
        'email': email,
        'password': password,
        'device_name': deviceName,
        if (fcmToken != null) 'fcm_token': fcmToken,
      };

      final response = await dio.post(
        ApiEndpoints.login,
        data: loginData,
        options: Options(receiveTimeout: const Duration(seconds: 20)),
      );

      final responseData = response.data;

      // NOTE: MFA/OTP DISABLED for Pimpinan role per Final Contract
      // We only handle direct token response now.

      final rawToken = responseData?['access_token'] ?? responseData?['token'];
      if (responseData != null && rawToken != null) {
        final token = rawToken.toString();
        final storage = _ref.read(secureStorageProvider);
        
        await storage.write(
          key: AppConfig.authTokenKey,
          value: token,
        );

        UserModel? user;
        if (responseData['user'] != null) {
          user = UserModel.fromJsonApi(responseData['user']);
          await storage.write(
            key: AppConfig.userDataKey,
            value: jsonEncode(user.toJson()),
          );
        }

        state = AsyncValue.data(user);
        return {'success': true};
      } else {
        throw Exception(
          responseData?['message'] ?? 'Token tidak ditemukan di response server.',
        );
      }
    } on DioException catch (e) {
      final responseData = e.response?.data;
      
      if (e.response?.statusCode == 429) {
        state = AsyncValue.error(
          Exception('Terlalu banyak percobaan login, coba lagi dalam beberapa saat.'),
          StackTrace.current,
        );
        throw Exception('Terlalu banyak percobaan login, coba lagi dalam beberapa saat.');
      }

      String errorMessage = 'Login Gagal';

      if (e.response == null) {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          errorMessage = 'Koneksi ke server timeout. Pastikan server aktif dan IP benar.';
        } else {
          errorMessage = 'Tidak dapat terhubung ke server. Periksa IP dan pastikan Laravel berjalan.';
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

      state = AsyncValue.error(Exception(errorMessage), StackTrace.current);
      throw Exception(errorMessage);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  // NOTE: verifyMfa method stub for legacy compatibility
  Future<void> verifyMfa(String mfaToken, String otp) async {
    // Stub: MFA disabled for pimpinan role
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final storage = _ref.read(secureStorageProvider);
      final token = await storage.read(key: AppConfig.authTokenKey);
      if (token != null) {
        final dio = _ref.read(dioProvider);
        // FIXED: Using correct endpoint /mobile/logout per Pimpinan Contract
        await dio.post(ApiEndpoints.logout);
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Logout Error (non-fatal): $e');
      }
    } finally {
      final storage = _ref.read(secureStorageProvider);
      await storage.delete(key: AppConfig.authTokenKey);
      await storage.delete(key: AppConfig.userDataKey);
      state = const AsyncValue.data(null);
    }
  }

  Future<void> loadUserFromStorage() async {
    try {
      final storage = _ref.read(secureStorageProvider);
      final userDataStr = await storage.read(key: AppConfig.userDataKey);
      
      if (userDataStr != null) {
        try {
           final decoded = jsonDecode(userDataStr);
           if (decoded is Map<String, dynamic>) {
             final user = UserModel.fromJson(decoded);
             state = AsyncValue.data(user);
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
