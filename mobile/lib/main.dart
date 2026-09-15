import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:e_office_mobile/core/routing/app_router.dart';
import 'package:e_office_mobile/core/network/firebase_messaging_service.dart';
import 'package:e_office_mobile/core/theme/app_theme.dart';
import 'package:e_office_mobile/domain/providers/theme_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await FirebaseMessagingService().init();
  runApp(
    const ProviderScope(
      child: EOfficeApp(),
    ),
  );
}

class EOfficeApp extends ConsumerWidget {
  const EOfficeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeProvider);
    return MaterialApp.router(
      title: 'E-Office PT ABC',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
