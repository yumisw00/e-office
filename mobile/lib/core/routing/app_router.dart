import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import '../../domain/providers/auth_provider.dart';
import '../../data/models/user_model.dart';
import '../../presentation/screens/main_layout_screen.dart';
import '../../presentation/screens/detail_surat_screen.dart';
import '../../presentation/screens/login_screen.dart';
import '../../presentation/screens/mfa_screen.dart';
import '../../presentation/screens/dashboard_screen.dart';
import '../../presentation/screens/surat_masuk_screen.dart';
import '../../presentation/screens/disposisi_screen.dart';
import '../../presentation/screens/approval_screen.dart';
import '../../presentation/screens/notification_screen.dart';
import '../../presentation/screens/pdf_viewer_screen.dart';
import '../../presentation/screens/profil_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authStateListenable = ValueNotifier<AsyncValue<UserModel?>>(ref.read(authProvider));
  
  ref.listen<AsyncValue<UserModel?>>(authProvider, (previous, next) {
    authStateListenable.value = next;
  });

  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: authStateListenable,
    redirect: (context, state) async {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: AppConfig.authTokenKey);
      final isLoggedIn = token != null && token.isNotEmpty;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }
      if (isLoggedIn && isLoggingIn) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/mfa',
        pageBuilder: (context, state) {
          final mfaToken = state.extra as String? ?? '';
          return NoTransitionPage(
            child: MfaScreen(mfaToken: mfaToken),
          );
        },
      ),
      ShellRoute(
        builder: (context, state, child) {
          int selectedIndex = 0;
          final location = state.fullPath;
          
          if (location == '/dashboard' || location == '/') {
            selectedIndex = 0;
          } else if (location != null && (location == '/surat-masuk' || location.startsWith('/surat-masuk/'))) {
            selectedIndex = 1;
          } else if (location == '/disposisi') {
            selectedIndex = 2;
          } else if (location == '/approval') {
            selectedIndex = 3;
          } else if (location == '/profil') {
            selectedIndex = 4;
          }

          return MainLayoutScreen(
            selectedIndex: selectedIndex,
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/surat-masuk',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SuratMasukScreen(),
            ),
            routes: [
              GoRoute(
                path: ':id',
                pageBuilder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return NoTransitionPage(
                    child: DetailSuratScreen(idSurat: id),
                  );
                },
              ),
            ],
          ),
          GoRoute(
            path: '/disposisi',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DisposisiScreen(),
            ),
          ),
          GoRoute(
            path: '/approval',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ApprovalScreen(),
            ),
          ),
          GoRoute(
            path: '/notifications',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: NotificationScreen(),
            ),
          ),
          GoRoute(
            path: '/profil',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfilScreen(),
            ),
          ),
          GoRoute(
            path: '/pdf',
            pageBuilder: (context, state) {
              final url = state.extra as String? ?? '';
              return NoTransitionPage(
                child: PdfViewerScreen(pdfUrl: url),
              );
            },
          ),
        ],
      ),
    ],
  );
});