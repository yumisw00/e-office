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
  ) async {
    state = const AsyncValue.loading();
    try {
      final dio = _ref.read(dioProvider);

      // FIXED: Per kontrak, body hanya { email, password, device_name }
      // fcm_token REMOVED dari login payload (handled separately in Langkah 9)
      final loginData = {
        'email': email,
        'password': password,
        'device_name': deviceName,
      };

      final response = await dio.post(
        ApiEndpoints.login,
        data: loginData,
      );

      final responseData = response.data;

      // Handle 429 Rate Limiting - khusus untuk login
      // Contract: 429 returns default Laravel format (NO error_code)
      // FIXED: Check this before other conditions

      // Handle MFA Required - FIXED FIELD NAMES PER CONTRACT
      // Contract: { "message": "MFA verification required", "requires_mfa": true, "mfa_challenge_token": "<JWT>", "user": {...} }
      final rawMfaRequired = responseData != null && (responseData['requires_mfa'] == true || responseData['mfa_required'] == true);
      final rawMfaChallengeToken = responseData?['mfa_challenge_token'] ?? responseData?['mfa_token'];

      if (rawMfaRequired) {
        state = const AsyncValue.data(null);
        return {
          'requires_mfa': true,
          'mfa_challenge_token': rawMfaChallengeToken,
          'message': responseData?['message'] ?? 'MFA verification required',
          'user': responseData?['user'],
        };
      }

      final rawToken = responseData?['access_token'] ?? responseData?['token'];
      if (responseData != null && rawToken != null) {
        final token = rawToken.toString();
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
      
      // FIXED: Handle 429 Rate Limit untuk login - tampilkan pesan khusus
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
        // Contract Point 9: Two error formats
        // Pola A (custom handler): has 'error_code' field
        // Pola B (default Laravel): NO 'error_code', just rely on HTTP status
        
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

  Future<void> verifyMfa(String mfaChallengeToken, String otpCode) async {
    state = const AsyncValue.loading();
    try {
      final dio = _ref.read(dioProvider);
      // FIXED: Per kontrak, request body field names changed:
      // { "mfa_challenge_token": string required, "otp_code": string required exactly 6 digit }
      final response = await dio.post(
        ApiEndpoints.verifyMfa,
        data: {
          'mfa_challenge_token': mfaChallengeToken,
          'otp_code': otpCode,
        },
      );

      final responseData = response.data;
      final rawVerifyToken = responseData?['access_token'] ?? responseData?['token'];
      
      if (responseData != null && rawVerifyToken != null) {
        final token = rawVerifyToken.toString();
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
      final responseData = e.response?.data;
      
      // FIXED: Handle MFA-specific 422 errors per contract point 2
      // AUTH_002: token expired/invalid → arahkan user untuk login ulang dari awal
      // AUTH_004: OTP salah → biarkan user coba input ulang OTP-nya
      final errorCode = responseData?['error_code']?.toString();
      
      if (errorCode == 'AUTH_002') {
        state = AsyncValue.error(
          Exception('Sesi OTP telah kadaluarsa, silakan login ulang dari awal.'),
          StackTrace.current,
        );
        throw Exception('Sesi OTP telah kadaluarsa, silakan login ulang dari awal.');
      } else if (errorCode == 'AUTH_004') {
        // OTP salah - biarkan user coba lagi dengan token yang sama
        state = AsyncValue.error(
          Exception('Kode OTP salah, silakan coba lagi.'),
          StackTrace.current,
        );
        throw Exception('Kode OTP salah, silakan coba lagi.');
      }
      
      // Fallback untuk error lain
      final msg = e.response?.data?['message'] ?? 'Gagal memverifikasi OTP';
      state = AsyncValue.error(Exception(msg.toString()), StackTrace.current);
      throw Exception(msg.toString());
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: AppConfig.authTokenKey);
      if (token != null) {
        final dio = _ref.read(dioProvider);
        // FIXED: Using correct endpoint /logout per contract
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