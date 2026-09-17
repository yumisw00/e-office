import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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
    String deviceName,
    String fcmToken, {
    String? captchaToken,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = _ref.read(dioProvider);

      final loginData = {
        'email': email,
        'password': password,
        'device_name': deviceName,
        'fcm_token': fcmToken,
      };

      if (captchaToken != null && captchaToken.isNotEmpty) {
        loginData['captcha_token'] = captchaToken;
      }

      final response = await dio.post(
        ApiEndpoints.login,
        data: loginData,
      );

      final responseData = response.data;

      // Handle MFA Required - ASUMSI-API
      if (responseData != null && responseData['mfa_required'] == true) {
        state = const AsyncValue.data(null);
        return {
          'mfa_required': true,
          'mfa_token': responseData['mfa_token'],
        };
      }

      if (responseData != null && responseData['token'] != null) {
        final token = responseData['token'].toString();
        const storage = FlutterSecureStorage();
        
        await storage.write(
          key: AppConfig.authTokenKey,
          value: token,
        );

        UserModel? user;
        if (responseData['user'] != null) {
          user = UserModel.fromJsonApi(responseData['user']);
          await storage.write(
            key: AppConfig.userDataKey,
            value: user.toJson().toString(),
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
      String errorMessage = 'Login Gagal';

      if (e.response == null) {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          errorMessage = 'Koneksi ke server timeout. Pastikan server aktif dan IP benar.';
        } else {
          errorMessage = 'Tidak dapat terhubung ke server. Periksa IP dan pastikan Laravel berjalan';
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

  Future<void> verifyMfa(String mfaToken, String otp) async {
    state = const AsyncValue.loading();
    try {
      final dio = _ref.read(dioProvider);
      final response = await dio.post(
        ApiEndpoints.verifyMfa,
        data: {
          'mfa_token': mfaToken,
          'otp': otp,
        },
      );

      final responseData = response.data;
      if (responseData != null && responseData['token'] != null) {
        final token = responseData['token'].toString();
        const storage = FlutterSecureStorage();
        
        await storage.write(
          key: AppConfig.authTokenKey,
          value: token,
        );

        UserModel? user;
        if (responseData['user'] != null) {
          user = UserModel.fromJsonApi(responseData['user']);
          await storage.write(
            key: AppConfig.userDataKey,
            value: user.toJson().toString(),
          );
        }

        state = AsyncValue.data(user);
      } else {
        throw Exception(
          responseData?['message'] ?? 'OTP tidak valid atau expired.',
        );
      }
    } on DioException catch (e) {
       // standard error handling (could refactor to shared method)
       final msg = e.response?.data?['message'] ?? 'Gagal memverifikasi OTP';
       state = AsyncValue.error(Exception(msg), StackTrace.current);
       throw Exception(msg);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: AppConfig.authTokenKey);
      if (token != null) {
        final dio = _ref.read(dioProvider);
        await dio.post(ApiEndpoints.logout);
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Logout Error (non-fatal): $e');
      }
    } finally {
      const storage = FlutterSecureStorage();
      await storage.delete(key: AppConfig.authTokenKey);
      await storage.delete(key: AppConfig.userDataKey);
      state = const AsyncValue.data(null);
    }
  }

  Future<void> loadUserFromStorage() async {
    try {
      const storage = FlutterSecureStorage();
      final userDataStr = await storage.read(key: AppConfig.userDataKey);
      
      if (userDataStr != null) {
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
