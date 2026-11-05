import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:e_office_mobile/core/constants/app_config.dart';
import 'package:e_office_mobile/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

/// Fake HttpClientAdapter untuk simulasi response HTTP tertentu tanpa jaringan
class _FakeHttpClientAdapter implements HttpClientAdapter {
  final int statusCode;
  final Map<String, dynamic> responseBody;

  _FakeHttpClientAdapter(this.statusCode, this.responseBody);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final jsonStr = jsonEncode(responseBody);
    return ResponseBody.fromString(
      jsonStr,
      statusCode,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

/// Fake in-memory FlutterSecureStorage untuk pengujian
class _FakeSecureStorage extends Fake implements FlutterSecureStorage {
  final Map<String, String> _storage = {};

  @override
  Future<String?> read({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return _storage[key];
  }

  @override
  Future<void> write({
    required String key,
    required String? value,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value != null) {
      _storage[key] = value;
    } else {
      _storage.remove(key);
    }
  }

  @override
  Future<void> delete({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _storage.remove(key);
  }

  @override
  Future<void> deleteAll({
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _storage.clear();
  }
}

void main() {
  group('Dio 401 Interceptor Tests', () {
    test('401 pada /surat_keluar/1/reject tidak menghapus token dan meneruskan body.message', () async {
      final fakeStorage = _FakeSecureStorage();
      await fakeStorage.write(key: AppConfig.authTokenKey, value: 'valid_bearer_token');
      await fakeStorage.write(key: AppConfig.userDataKey, value: '{"id":1,"nama":"Pimpinan"}');

      final container = ProviderContainer(
        overrides: [
          secureStorageProvider.overrideWithValue(fakeStorage),
        ],
      );
      addTearDown(container.dispose);

      final dio = container.read(dioProvider);
      dio.httpClientAdapter = _FakeHttpClientAdapter(401, {
        'message': 'Catatan revisi tidak valid atau tidak memiliki akses.',
      });

      String? capturedMessage;
      try {
        await dio.post('/surat_keluar/1/reject', data: {'catatan_revisi': 'Revisi segera'});
        fail('Seharusnya melempar DioException');
      } on DioException catch (e) {
        capturedMessage = e.message;
      }

      // Verifikasi token & data user TIDAK dihapus
      final tokenAfter = await fakeStorage.read(key: AppConfig.authTokenKey);
      final userAfter = await fakeStorage.read(key: AppConfig.userDataKey);
      final flagAfter = await fakeStorage.read(key: 'session_expired_flag');

      expect(tokenAfter, 'valid_bearer_token', reason: 'Token tidak boleh dihapus pada 401 selain /mobile/ atau /pimpinan/');
      expect(userAfter, isNotNull, reason: 'Data user tidak boleh dihapus');
      expect(flagAfter, isNull, reason: 'session_expired_flag tidak boleh diset');
      expect(capturedMessage, 'Catatan revisi tidak valid atau tidak memiliki akses.', reason: 'Pesan error harus meneruskan body.message apa adanya');
    });

    test('401 pada /pimpinan/dashboard menghapus token, data user, dan mengeset session_expired_flag', () async {
      final fakeStorage = _FakeSecureStorage();
      await fakeStorage.write(key: AppConfig.authTokenKey, value: 'valid_bearer_token');
      await fakeStorage.write(key: AppConfig.userDataKey, value: '{"id":1,"nama":"Pimpinan"}');

      final container = ProviderContainer(
        overrides: [
          secureStorageProvider.overrideWithValue(fakeStorage),
        ],
      );
      addTearDown(container.dispose);

      final dio = container.read(dioProvider);
      dio.httpClientAdapter = _FakeHttpClientAdapter(401, {
        'message': 'Unauthenticated.',
      });

      try {
        await dio.get('/pimpinan/dashboard');
        fail('Seharusnya melempar DioException');
      } on DioException catch (_) {
        // Expected
      }

      // Verifikasi token & data user DIHAPUS, session_expired_flag diset
      final tokenAfter = await fakeStorage.read(key: AppConfig.authTokenKey);
      final userAfter = await fakeStorage.read(key: AppConfig.userDataKey);
      final flagAfter = await fakeStorage.read(key: 'session_expired_flag');

      expect(tokenAfter, isNull, reason: 'Token harus dihapus pada 401 /pimpinan/');
      expect(userAfter, isNull, reason: 'Data user harus dihapus');
      expect(flagAfter, '1', reason: 'session_expired_flag harus diset ke 1');
    });
  });
}
