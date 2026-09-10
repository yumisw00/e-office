import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/network/dio_client.dart';
import '../models/user_model.dart';
part 'auth_provider.g.dart';
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<UserModel?> build() {
    return const AsyncData(null);
  }
  Future<void> login(
    String email, 
    String password, 
    String deviceName,
    String fcmToken,
  ) async {
    state = const AsyncLoading();
    try {
      final dio = ref.read(dioProvider);
      if (kDebugMode) {
        print('🔐 Attempting login for: $email');
        print(' Device: $deviceName');
        print(' FCM Token: ${fcmToken.isNotEmpty ? '${fcmToken.substring(0, 10)}...' : 'none'}');
      }

      final response = await dio.post(
        '/mobile/login',
        data: {
          'email': email,
          'password': password,
          'device_name': deviceName,
          'fcm_token': fcmToken, 
        },
      );
      if (kDebugMode) {
        print(' RESPONSE LOGIN => Status: ${response.statusCode}');
        print('   Data: ${response.data}');
      }
      final responseData = response.data;
      if (responseData != null && responseData['token'] != null) {
        final token = responseData['token'].toString();
        const storage = FlutterSecureStorage();
        await storage.write(
          key: 'auth_token',
          value: token,
        );
        UserModel? user;
        if (responseData['user'] != null) {
          user = UserModel.fromJsonApi(responseData['user']);
          await storage.write(
            key: 'user_data',
            value: user.toJson().toString(),
          );
        }
        state = AsyncData(user);
        if (kDebugMode) {
          print(' Login berhasil! User: ${user?.nama ?? email}');
        }
      } else {
        throw Exception(
          responseData?['message'] ??
              'Token tidak ditemukan di response server.',
        );
      }
    } on DioException catch (e) {
      if (kDebugMode) {
        print(' Login Error Type: ${e.type}');
        print('   Message: ${e.message}');
        print('   Status: ${e.response?.statusCode}');
        print('   Data: ${e.response?.data}');
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
              'Tidak dapat terhubung ke server (Connection Refused). Periksa IP dan pastikan Laravel berjalan dengan --host=0.0.0.0.';
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
        print(' Login Unexpected Error: $e');
      }
      state = AsyncError(e, st);
      rethrow;
    }
  }
  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/mobile/logout');
    } catch (e) {
      if (kDebugMode) {
        print(' Logout Error: $e');
      }
    } finally {
      const storage = FlutterSecureStorage();
      await storage.delete(key: 'auth_token');
      await storage.delete(key: 'user_data');
      state = const AsyncData(null);
    }
  }
  Future<void> loadUserFromStorage() async {
    try {
      const storage = FlutterSecureStorage();
      final userDataStr = await storage.read(key: 'user_data');
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
            state = AsyncData(UserModel.fromJsonApi(json));
          }
        } catch (e) {
          if (kDebugMode) {
            print(' Failed to parse user data: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print(' Error loading user from storage: $e');
      }
    }
  }
}
