import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import 'api_endpoints.dart';

final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print(" [BACKGROUND] Pesan diterima: ${message.messageId}");
    print("   Data: ${message.data}");
  }
  await _showLocalNotification(
    title: message.notification?.title ?? 'E-Office',
    body: message.notification?.body ?? 'Anda memiliki pesan baru',
    data: message.data,
  );
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
    payload: data != null ? 
        data.entries.map((e) => '${e.key}=${e.value}').join('&') : null,
  );
}

class FirebaseMessagingService {
  final Dio? _dio;
  final FlutterSecureStorage _storage;
  
  FirebaseMessagingService({Dio? dio}) 
      : _dio = dio,
        _storage = const FlutterSecureStorage();

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
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print(' [FOREGROUND] Pesan diterima!');
        print('   Data: ${message.data}');
        if (message.notification != null) {
          print('   Notifikasi: ${message.notification?.title} / ${message.notification?.body}');
        }
      }
      _showLocalNotification(
        title: message.notification?.title ?? 'E-Office',
        body: message.notification?.body ?? 'Anda memiliki pesan baru',
        data: message.data,
      );
    });
    
    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        print(' User membuka app dari notifikasi: ${message.data}');
      }
      _handleNotificationTap(message.data);
    });
    
    // Check if app was opened from notification
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      if (kDebugMode) {
        print(' App dibuka dari notifikasi: ${initialMessage.data}');
      }
      _handleNotificationTap(initialMessage.data);
    }
  }
  
  /// Handle navigasi deep linking dari notifikasi
  void _handleNotificationTap(Map<String, dynamic> data) {
    // TODO: Implement navigation logic based on notification type
    // Contoh: jika ada 'surat_id', navigate ke detail surat
    final suratId = data['surat_id'];
    final tipeNotif = data['tipe'];
    
    if (kDebugMode) {
      print('🔔 Notification tap - Type: $tipeNotif, Surat ID: $suratId');
    }
    
    // Navigasi akan di-handle oleh router di main.dart
    // Bisa menggunakan callback atau event bus
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
    );
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
  
  /// Registrasikan FCM token ke backend setelah login
  Future<void> registerFcmToken(String fcmToken) async {
    try {
      if (_dio == null || fcmToken.isEmpty) return;
      
      // // BUTUH-BACKEND: Endpoint POST /register-fcm belum ada di backend dev dan kolom fcm_token sys_user belum pasti di-migration
      await _dio.post(
        ApiEndpoints.registerFcm,
        data: {'fcm_token': fcmToken},
      );
      
      if (kDebugMode) {
        print('✅ FCM token registered to backend');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error registering FCM token: $e');
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
}
