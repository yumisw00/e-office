import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:e_office_mobile/core/routing/notification_route_resolver.dart';

void main() {
  group('NotificationRouteResolver Tests', () {
    test('1. Resolves approval request payload to /approval with highlightId', () {
      final rawFCM = {
        'url': '/surat_keluar/detail/45',
        'type': 'approval_request',
        'id_surat_keluar': '45',
        'id_notification': '101',
      };

      final resolved = NotificationRouteResolver.resolveFromRaw(rawFCM);

      expect(resolved.path, equals('/approval'));
      expect(resolved.extra, equals({'highlightId': '45'}));
      expect(resolved.queryParams, equals({'highlightId': '45'}));
      expect(resolved.notificationId, equals('101'));
    });

    test('2. Resolves disposisi with id_surat_masuk to /surat-masuk/:id with extra', () {
      final rawNotification = {
        'id_notification': 202,
        'title': 'Disposisi baru',
        'message': 'Anda menerima disposisi baru',
        'url': '/disposisi/12',
        'payload': {
          'id_surat_disposisi': 12,
          'id_surat_masuk': 88,
        },
      };

      final resolved = NotificationRouteResolver.resolveFromRaw(rawNotification);

      expect(resolved.path, equals('/surat-masuk/88'));
      expect(resolved.extra, equals({
        'actionType': 'disposisi',
        'idDisposisi': '12',
      }));
      expect(resolved.notificationId, equals('202'));
    });

    test('3. Resolves disposisi without id_surat_masuk to /disposisi', () {
      final rawNotification = {
        'id_notification': '303',
        'url': '/disposisi/15',
        'payload': {
          'id_surat_disposisi': '15',
        },
      };

      final resolved = NotificationRouteResolver.resolveFromRaw(rawNotification);

      expect(resolved.path, equals('/disposisi'));
      expect(resolved.notificationId, equals('303'));
    });

    test('4. Resolves internal letter to /surat-masuk/:id', () {
      final rawNotification = {
        'id_notification': '404',
        'url': '/surat_masuk_pegawai?surat_id=77',
        'type': 'internal_letter',
        'id_surat_masuk': '77',
      };

      final resolved = NotificationRouteResolver.resolveFromRaw(rawNotification);

      expect(resolved.path, equals('/surat-masuk/77'));
      expect(resolved.notificationId, equals('404'));
    });

    test('5. Handles stringified JSON payload column gracefully', () {
      final rawNotification = {
        'id_notification': '505',
        'url': '/surat_keluar/detail/99',
        'payload': jsonEncode({
          'type': 'approval_request',
          'id_surat_keluar': 99,
        }),
      };

      final resolved = NotificationRouteResolver.resolveFromRaw(rawNotification);

      expect(resolved.path, equals('/approval'));
      expect(resolved.extra, equals({'highlightId': '99'}));
      expect(resolved.notificationId, equals('505'));
    });

    test('6. Fallbacks to /notifications when no route can be matched', () {
      final rawNotification = {
        'id_notification': '606',
        'title': 'Pengumuman umum',
        'message': 'Sistem akan maintenance',
        'url': '/pengumuman',
      };

      final resolved = NotificationRouteResolver.resolveFromRaw(rawNotification);

      expect(resolved.path, equals('/notifications'));
      expect(resolved.notificationId, equals('606'));
    });
  });
}
