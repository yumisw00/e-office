import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Handler untuk pesan background
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print("📩 [BACKGROUND] Pesan diterima: ${message.messageId}");
    print("   Data: ${message.data}");
  }
  
  // Kirim notifikasi lokal untuk pesan background
  await _showLocalNotification(
    title: message.notification?.title ?? 'E-Office',
    body: message.notification?.body ?? 'Anda memiliki pesan baru',
    data: message.data,
  );
}

class FirebaseMessagingService {
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    // Inisialisasi notifikasi lokal
    await _initLocalNotifications();
    
    final messaging = FirebaseMessaging.instance;

    // Request permission untuk notifikasi push
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (kDebugMode) {
      print('🔔 User granted permission: ${settings.authorizationStatus}');
    }

    // Background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Foreground listener - tampilkan notifikasi lokal saat app terbuka
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('📩 [FOREGROUND] Pesan diterima!');
        print('   Data: ${message.data}');
        if (message.notification != null) {
          print('   Notifikasi: ${message.notification?.title} / ${message.notification?.body}');
        }
      }
      
      // Tampilkan notifikasi lokal bahkan saat app di foreground
      _showLocalNotification(
        title: message.notification?.title ?? 'E-Office',
        body: message.notification?.body ?? 'Anda memiliki pesan baru',
        data: message.data,
      );
    });

    // Handle saat user mengetuk notifikasi
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('🖱️ User membuka app dari notifikasi: ${message.data}');
      }
      // TODO: Navigasi ke halaman yang sesuai berdasarkan message.data
      // Contoh: jika message.data['type'] == 'disposisi', navigasi ke halaman disposisi
    });
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

  Future<String?> getFCMToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (kDebugMode) {
        print("🔑 FCM Token: $token");
      }
      return token;
    } catch (e) {
      if (kDebugMode) {
        print("❌ Error getting FCM token: $e");
      }
      return null;
    }
  }
  
  Future<void> subscribeToTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      if (kDebugMode) {
        print("✅ Subscribed to topic: $topic");
      }
    } catch (e) {
      if (kDebugMode) {
        print("❌ Error subscribing to topic: $e");
      }
    }
  }
}
