import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:e_office_mobile/data/repositories/surat_repository.dart';
import 'package:flutter_test/flutter_test.dart';

/// Adapter palsu: mengembalikan status + body JSON tertentu tanpa jaringan.
class _FakeAdapter implements HttpClientAdapter {
  final int status;
  final Object body;
  _FakeAdapter(this.status, this.body);

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    return ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

ApiSuratRepository _repo(int status, Object body) {
  final dio = Dio(BaseOptions(baseUrl: 'http://fake.local/api'))..httpClientAdapter = _FakeAdapter(status, body);
  return ApiSuratRepository(dio);
}

void main() {
  test('200: data[] langsung dipetakan (title/status/created_at, pelaku kosong)', () async {
    final repo = _repo(200, {
      'success': true,
      'data': [
        {'type': 'created', 'title': 'Surat keluar dibuat', 'status': 'diproses', 'created_at': '2026-09-09 10:00:00'},
        {'type': 'approved', 'title': 'Disetujui pimpinan', 'status': 'approved', 'created_at': '2026-09-10 08:30:00'},
      ],
    });

    final events = await repo.getTracking('1', 'approval');
    for (final e in events) {
      // ignore: avoid_print
      print('EVENT judul="${e.judul}" deskripsi="${e.deskripsi}" tanggal=${e.tanggal} pelaku="${e.pelaku}"');
    }

    expect(events.length, 2);
    expect(events[0].judul, 'Surat keluar dibuat');
    expect(events[0].deskripsi, 'diproses');
    expect(events[0].tanggal, DateTime(2026, 9, 9, 10, 0, 0));
    expect(events[0].pelaku, '');
    expect(events[1].judul, 'Disetujui pimpinan');
  });

  test('403: melempar TrackingException berisi body.message', () async {
    final repo = _repo(403, {'success': false, 'message': 'Akses khusus Pimpinan.'});
    try {
      await repo.getTracking('1', 'approval');
      fail('Harus melempar');
    } on TrackingException catch (e) {
      // ignore: avoid_print
      print('403 -> TrackingException(statusCode=${e.statusCode}, message="${e.message}")');
      expect(e.statusCode, 403);
      expect(e.message, 'Akses khusus Pimpinan.');
    }
  });

  test('404: melempar TrackingException berisi body.message', () async {
    final repo = _repo(404, {'success': false, 'message': 'Surat tidak ditemukan.'});
    try {
      await repo.getTracking('999', 'disposisi');
      fail('Harus melempar');
    } on TrackingException catch (e) {
      // ignore: avoid_print
      print('404 -> TrackingException(statusCode=${e.statusCode}, message="${e.message}")');
      expect(e.statusCode, 404);
      expect(e.message, 'Surat tidak ditemukan.');
    }
  });

  test('500: tidak ditelan, DioException di-rethrow', () async {
    final repo = _repo(500, {'message': 'Server Error'});
    await expectLater(repo.getTracking('1', null), throwsA(isA<DioException>()));
    // ignore: avoid_print
    print('500 -> DioException di-rethrow (tidak return [])');
  });
}
