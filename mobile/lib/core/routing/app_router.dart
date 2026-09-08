import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../presentation/screens/main_layout_screen.dart';
import '../../presentation/screens/detail_surat_screen.dart';
import '../../presentation/screens/pdf_viewer_screen.dart';
import '../../presentation/screens/login_screen.dart';
import '../../data/models/surat_model.dart';

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(Ref ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const MainLayoutScreen(),
      ),
      GoRoute(
        path: '/detail',
        builder: (context, state) {
          final surat = state.extra as SuratModel;
          return DetailSuratScreen(surat: surat);
        },
      ),
      GoRoute(
        path: '/pdf',
        builder: (context, state) {
          final pdfUrl = state.extra as String;
          return PdfViewerScreen(pdfUrl: pdfUrl);
        },
      ),
    ],
  );
}
