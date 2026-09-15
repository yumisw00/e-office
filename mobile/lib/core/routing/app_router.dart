import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/screens/main_layout_screen.dart';
import '../../presentation/screens/detail_surat_screen.dart';
import '../../presentation/screens/pdf_viewer_screen.dart';
import '../../presentation/screens/login_screen.dart';
import '../../presentation/screens/dashboard_screen.dart';
import '../../presentation/screens/surat_masuk_screen.dart';
import '../../presentation/screens/approval_screen.dart';
import '../../presentation/screens/profil_screen.dart';
import '../../data/models/surat_model.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/dashboard',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) {
          int selectedIndex = 0;
          final location = state.fullPath;
          
          if (location == '/dashboard' || location == '/') {
            selectedIndex = 0;
          } else if (location != null && (location == '/surat-masuk' || location.startsWith('/surat-masuk/'))) {
            selectedIndex = 1;
          } else if (location == '/approval') {
            selectedIndex = 2;
          } else if (location == '/profil') {
            selectedIndex = 3;
          }

          return MainLayoutScreen(
            selectedIndex: selectedIndex,
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/surat-masuk',
            builder: (context, state) => const SuratMasukScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return DetailSuratScreen(idSurat: id);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/approval',
            builder: (context, state) => const ApprovalScreen(),
          ),
          GoRoute(
            path: '/profil',
            builder: (context, state) => const ProfilScreen(),
          ),
        ],
      ),
    ],
  );
});
