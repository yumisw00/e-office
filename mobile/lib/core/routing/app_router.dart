import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_config.dart';
import '../network/dio_client.dart';
import '../../domain/providers/auth_provider.dart';
import '../../data/models/user_model.dart';
import '../../presentation/screens/disposisi_screen.dart';
import '../../presentation/screens/main_layout_screen.dart';
import '../../presentation/screens/detail_surat_screen.dart';
import '../../presentation/screens/login_screen.dart';
import '../../presentation/screens/dashboard_screen.dart';
import '../../presentation/screens/surat_masuk_screen.dart';
import '../../presentation/screens/approval_screen.dart';
import '../../presentation/screens/notification_screen.dart';
import '../../presentation/screens/document_viewer_screen.dart';
import '../../presentation/screens/profil_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

final goRouterProvider = Provider<GoRouter>((ref) {
  final authStateListenable = ValueNotifier<AsyncValue<UserModel?>>(ref.read(authProvider));
  
  ref.listen<AsyncValue<UserModel?>>(authProvider, (previous, next) {
    authStateListenable.value = next;
  });

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/dashboard',
    refreshListenable: authStateListenable,
    redirect: (context, state) async {
      final storage = ref.read(secureStorageProvider);
      final token = await storage.read(key: AppConfig.authTokenKey);
      final isLoggedIn = token != null && token.isNotEmpty;
      final isLoggingIn = state.uri.path == '/login';

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
        path: '/notifications',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: NotificationScreen(),
        ),
      ),
      GoRoute(
        path: '/pdf',
        pageBuilder: (context, state) {
          final url = state.extra as String? ?? '';
          return NoTransitionPage(
            child: DocumentViewerScreen(pdfUrl: url),
          );
        },
      ),
      GoRoute(
        path: '/profil',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: ProfilScreen(),
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainLayoutScreen(
            navigationShell: navigationShell,
          );
        },
        branches: [
          // Index 0: Dashboard
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: DashboardScreen(),
                ),
              ),
            ],
          ),
          // Index 1: Surat Masuk
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/surat-masuk',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: SuratMasukScreen(),
                ),
                routes: [
                  GoRoute(
                    parentNavigatorKey: rootNavigatorKey,
                    path: ':id',
                    pageBuilder: (context, state) {
                      final id = state.pathParameters['id']!;
                      final extra = state.extra;
                      final actionType = extra is Map
                          ? extra['actionType']?.toString()
                          : extra as String?;
                      final idDisposisi = extra is Map
                          ? extra['idDisposisi']?.toString()
                          : null;
                      return NoTransitionPage(
                        child: DetailSuratScreen(
                          idSurat: id,
                          actionType: actionType,
                          idDisposisi: idDisposisi,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          // Index 2: Disposisi
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/disposisi',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: DisposisiScreen(),
                ),
              ),
            ],
          ),
          // Index 3: Approval
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/approval',
                pageBuilder: (context, state) {
                  final extra = state.extra;
                  String? highlightId;
                  if (extra is Map) {
                    highlightId = extra['highlightId']?.toString();
                  } else if (extra is String) {
                    highlightId = extra;
                  }
                  highlightId ??= state.uri.queryParameters['highlightId'];
                  return NoTransitionPage(
                    child: ApprovalScreen(highlightId: highlightId),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
