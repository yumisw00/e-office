import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:e_office_mobile/core/routing/app_router.dart';
import 'package:e_office_mobile/core/network/firebase_messaging_service.dart';
import 'package:e_office_mobile/core/theme/app_theme.dart';
import 'package:e_office_mobile/core/theme/smooth_scroll_physics.dart';
import 'package:e_office_mobile/domain/providers/theme_provider.dart';
import 'package:e_office_mobile/domain/providers/haptic_provider.dart';
import 'package:e_office_mobile/core/utils/haptic_helper.dart';

import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:e_office_mobile/domain/providers/auth_provider.dart';
import 'package:e_office_mobile/domain/providers/surat_provider.dart';

Future<void> main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  try {
    await Firebase.initializeApp();
    await FirebaseMessagingService().init();
  } catch (e) {
    debugPrint('Firebase initialization skipped/failed on desktop platform: $e');
  }

  // Force high refresh rate (120Hz/90Hz) on supported Android devices (e.g. Redmi Note 13 5G)
  if (Platform.isAndroid) {
    try {
      await FlutterDisplayMode.setHighRefreshRate();
    } catch (e) {
      debugPrint('Error setting high refresh rate: $e');
    }
  }
  
  runApp(
    const ProviderScope(
      child: EOfficeApp(),
    ),
  );
}

class EOfficeApp extends ConsumerStatefulWidget {
  const EOfficeApp({super.key});

  @override
  ConsumerState<EOfficeApp> createState() => _EOfficeAppState();
}

class _EOfficeAppState extends ConsumerState<EOfficeApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ref.read(authProvider.notifier).loadUserFromStorage();

    // Sync HapticHelper with the initial haptic provider state
    HapticHelper.setEnabled(ref.read(hapticProvider));

    // Auto-refresh daftar notifikasi ketika ada push notification di foreground
    FirebaseMessagingService.onForegroundNotificationReceived = (data) {
      ref.read(notificationProvider.notifier).refresh();
    };

    // Tangani pending tap jika aplikasi dibuka dari cold start dan pastikan 120Hz
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FirebaseMessagingService.checkAndHandlePendingNotification();
      _ensureHighRefreshRate();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _ensureHighRefreshRate();
    }
  }

  Future<void> _ensureHighRefreshRate() async {
    if (Platform.isAndroid) {
      try {
        await FlutterDisplayMode.setHighRefreshRate();
      } catch (e) {
        debugPrint('Error ensuring high refresh rate: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(goRouterProvider);
    final themeMode = ref.watch(themeProvider);
    
    // Keep HapticHelper in sync with provider state
    ref.listen<bool>(hapticProvider, (_, next) {
      HapticHelper.setEnabled(next);
    });
    
    return MaterialApp.router(
      title: 'E-Office',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      scrollBehavior: const SmoothScrollBehavior(),
      routerConfig: router,
    );
  }
}
