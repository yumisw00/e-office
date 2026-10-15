import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:e_office_mobile/core/routing/app_router.dart';
import 'package:e_office_mobile/core/network/firebase_messaging_service.dart';
import 'package:e_office_mobile/core/theme/app_theme.dart';
import 'package:e_office_mobile/domain/providers/theme_provider.dart';

import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:e_office_mobile/domain/providers/auth_provider.dart';

Future<void> main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  try {
    await Firebase.initializeApp();
    await FirebaseMessagingService().init();
  } catch (e) {
    debugPrint('Firebase initialization skipped/failed on desktop platform: $e');
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

class _EOfficeAppState extends ConsumerState<EOfficeApp> {
  @override
  void initState() {
    super.initState();
    ref.read(authProvider.notifier).loadUserFromStorage();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(goRouterProvider);
    final themeMode = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'E-Office',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
