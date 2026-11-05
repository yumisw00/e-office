import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import '../routing/app_router.dart';
import '../routing/notification_route_resolver.dart';
import 'api_endpoints.dart';

final FlutterLocalNotificationsPlugin _localNotifications = 
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel _androidChannel = AndroidNotificationChannel(
  'e_office_channel',
  'E-Office Notifications',
  description: 'Notifikasi surat masuk, disposisi, dan approval',
  importance: Importance.high,
);

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print(" [BACKGROUND] Pesan diterima: ${message.messageId}");
    print("   Data: ${message.data}");
  }

  // PENTING: Jika payload pesan memuat 'notification', OS Android/iOS sudah
  // menampilkannya secara native di system tray. Jangan tampilkan notifikasi lokal
  // lagi agar tidak terjadi duplicate notification.
  if (message.notification == null) {
    final title = message.data['title']?.toString() ?? 'E-Office';
    final body = message.data['message']?.toString() ?? 
        message.data['body']?.toString() ?? 
        'Anda memiliki pesan baru';

    await _showLocalNotification(
      title: title,
      body: body,
      data: message.data,
    );
  }
}

Future<void> _showLocalNotification({
  required String title,
  required String body,
  Map<String, dynamic>? data,
}) async {
  const androidDetails = AndroidNotificationDetails(
    'e_office_channel',
    'E-Office Notifications',
    channelDescription: 'Notifikasi surat masuk, disposisi, dan approval',
    importance: Importance.high,
    priority: Priority.high,
    icon: '@mipmap/ic_launcher',
  );
  const iosDetails = DarwinNotificationDetails(
    presentAlert: true,
    presentBadge: true,
    presentSound: true,
  );

  await _localNotifications.show(
    DateTime.now().millisecondsSinceEpoch ~/ 1000,
    title,
    body,
    const NotificationDetails(android: androidDetails, iOS: iosDetails),
    payload: data != null ? jsonEncode(data) : null,
  );
}

class FirebaseMessagingService {
  final Dio? dio;
  final FlutterSecureStorage storage;
  StreamSubscription<String>? _tokenRefreshSub;

  /// Callback opsional ketika ada push masuk di foreground
  /// Digunakan UI untuk auto-refresh list notifikasi secara real-time
  static void Function(Map<String, dynamic> data)? onForegroundNotificationReceived;

  /// Menyimpan data notifikasi jika pengguna membuka app dari keadaan tertutup
  /// dan router belum siap
  static Map<String, dynamic>? pendingNotificationData;

  FirebaseMessagingService({
    this.dio,
    this.storage = const FlutterSecureStorage(),
  });

  Future<void> init() async {
    await _initLocalNotifications();

    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (kDebugMode) {
      print(' User granted permission: ${settings.authorizationStatus}');
    }

    // Set foreground presentation options untuk iOS
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // 1. Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print(' [FOREGROUND] Pesan diterima!');
        print('   Data: ${message.data}');
        if (message.notification != null) {
          print('   Notifikasi: ${message.notification?.title} / ${message.notification?.body}');
        }
      }

      final title = message.notification?.title ?? 
          message.data['title']?.toString() ?? 
          'E-Office';
      final body = message.notification?.body ?? 
          message.data['message']?.toString() ?? 
          message.data['body']?.toString() ?? 
          'Anda memiliki pesan baru';

      _showLocalNotification(
        title: title,
        body: body,
        data: message.data,
      );

      // Beri tahu UI agar me-refresh daftar notifikasi jika sedang aktif
      try {
        onForegroundNotificationReceived?.call(message.data);
      } catch (e) {
        if (kDebugMode) print('⚠️ Error onForegroundNotificationReceived: $e');
      }
    });
    
    // 2. Handle notification tap saat app di background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        print(' User membuka app dari notifikasi (background): ${message.data}');
      }
      _handleNotificationTap(message.data);
    });
    
    // 3. Handle notification tap saat app mati (cold start)
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      if (kDebugMode) {
        print(' App dibuka dari notifikasi (cold start): ${initialMessage.data}');
      }
      _handleNotificationTap(initialMessage.data);
    }

    // Cek juga launch details dari local notifications
    final localLaunchDetails = await _localNotifications.getNotificationAppLaunchDetails();
    if (localLaunchDetails != null && 
        localLaunchDetails.didNotificationLaunchApp &&
        localLaunchDetails.notificationResponse?.payload != null) {
      try {
        final decoded = jsonDecode(localLaunchDetails.notificationResponse!.payload!);
        if (decoded is Map<String, dynamic>) {
          _handleNotificationTap(decoded);
        }
      } catch (e) {
        if (kDebugMode) print('⚠️ Gagal parse localLaunchDetails payload: $e');
      }
    }

    // 4. Listen to token refresh
    _tokenRefreshSub = messaging.onTokenRefresh.listen((newToken) {
      if (kDebugMode) {
        print('🔑 FCM Token Refreshed: $newToken');
      }
      registerFcmToken(newToken);
    });
  }
  
  /// Handle navigasi deep linking dari notifikasi menggunakan Unified Route Resolver
  void _handleNotificationTap(Map<String, dynamic> data) {
    final resolved = NotificationRouteResolver.resolveFromRaw(data);

    if (kDebugMode) {
      print('🔔 Notification tap resolved to: $resolved');
    }

    final context = rootNavigatorKey.currentContext;
    if (context != null && context.mounted) {
      NotificationRouteResolver.navigateToRoute(context, resolved);
    } else {
      // Router belum siap (misal saat cold start), simpan pending data
      pendingNotificationData = data;
    }
  }

  /// Panggil metode ini setelah Router / App UI siap untuk mengecek pending tap
  static void checkAndHandlePendingNotification() {
    if (pendingNotificationData != null) {
      final data = pendingNotificationData!;
      pendingNotificationData = null;
      final resolved = NotificationRouteResolver.resolveFromRaw(data);
      final context = rootNavigatorKey.currentContext;
      if (context != null && context.mounted) {
        NotificationRouteResolver.navigateToRoute(context, resolved);
      }
    }
  }
  
  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        final payloadStr = response.payload;
        if (payloadStr != null && payloadStr.isNotEmpty) {
          try {
            final decoded = jsonDecode(payloadStr);
            if (decoded is Map<String, dynamic>) {
              _handleNotificationTap(decoded);
            }
          } catch (e) {
            if (kDebugMode) {
              print('⚠️ Error parsing local notification response: $e');
            }
          }
        }
      },
    );

    // Daftarkan Channel Android secara eksplisit untuk Android 8.0+
    final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_androidChannel);
  }
  
  Future<String?> getFCMToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (kDebugMode) {
        print("🔑 FCM Token: $token");
      }
      return token;
    } catch (e) {
      if (kDebugMode) {
        print(" Error getting FCM token: $e");
      }
      return null;
    }
  }
  
  /// Registrasikan FCM token ke backend setelah login atau saat refresh
  Future<void> registerFcmToken(String fcmToken) async {
    try {
      // 1. Simpan token baru secara lokal
      await storage.write(key: AppConfig.fcmTokenKey, value: fcmToken);

      // 2. Jika user sedang aktif/login, kirim token ke backend
      final authToken = await storage.read(key: AppConfig.authTokenKey);
      if (authToken != null && authToken.isNotEmpty) {
        final dioClient = dio ?? Dio(BaseOptions(baseUrl: AppConfig.baseUrl));
        final deviceName = Platform.isAndroid ? 'Android Device' : 'iOS Device';

        await dioClient.post(
          ApiEndpoints.updateFcmToken,
          data: {
            'fcm_token': fcmToken,
            'device_name': deviceName,
          },
          options: Options(
            headers: {
              'Authorization': 'Bearer $authToken',
              'Accept': 'application/json',
            },
            receiveTimeout: const Duration(seconds: 15),
          ),
        );

        if (kDebugMode) {
          print('✅ FCM token successfully synced to backend (Refresh)');
        }
      } else {
        if (kDebugMode) {
          print('ℹ️ FCM token saved locally. Will be sent on next login.');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error saving/syncing FCM token: $e');
      }
    }
  }
  
  Future<void> subscribeToTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      if (kDebugMode) {
        print(" Subscribed to topic: $topic");
      }
    } catch (e) {
      if (kDebugMode) {
        print(" Error subscribing to topic: $e");
      }
    }
  }
  
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
      if (kDebugMode) {
        print(" Unsubscribed from topic: $topic");
      }
    } catch (e) {
      if (kDebugMode) {
        print(" Error unsubscribing from topic: $e");
      }
    }
  }

  void dispose() {
    _tokenRefreshSub?.cancel();
  }
}
