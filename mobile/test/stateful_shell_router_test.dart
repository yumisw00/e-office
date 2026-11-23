import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:e_office_mobile/presentation/screens/main_layout_screen.dart';
import 'package:e_office_mobile/presentation/widgets/floating_nav_bar.dart';

void main() {
  group('StatefulShellRoute & MainLayoutScreen Tests', () {
    testWidgets('MainLayoutScreen renders navigationShell and FloatingNavBar correctly',
        (tester) async {
      final testRouter = GoRouter(
        initialLocation: '/tab0',
        routes: [
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) {
              return MainLayoutScreen(
                navigationShell: navigationShell,
              );
            },
            branches: [
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/tab0',
                    builder: (context, state) => const Scaffold(
                      body: Text('Tab 0 Screen - Dashboard'),
                    ),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/tab1',
                    builder: (context, state) => const Scaffold(
                      body: Text('Tab 1 Screen - Surat Masuk'),
                    ),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/tab2',
                    builder: (context, state) => const Scaffold(
                      body: Text('Tab 2 Screen - Disposisi'),
                    ),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/tab3',
                    builder: (context, state) => const Scaffold(
                      body: Text('Tab 3 Screen - Approval'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp.router(
          routerConfig: testRouter,
        ),
      );
      await tester.pumpAndSettle();

      // Tab 0 should be visible
      expect(find.text('Tab 0 Screen - Dashboard'), findsOneWidget);
      expect(find.byType(FloatingNavBar), findsOneWidget);

      // Verify that IndexedStack is used in the widget tree (which proves stateful preservation)
      expect(find.byType(IndexedStack), findsOneWidget);

      // Tap on Tab 1 icon (Surat Masuk)
      final tab1Finder = find.byIcon(Icons.move_to_inbox_outlined);
      expect(tab1Finder, findsOneWidget);
      await tester.tap(tab1Finder);
      await tester.pumpAndSettle();

      // Tab 1 Screen should now be active
      expect(find.text('Tab 1 Screen - Surat Masuk'), findsOneWidget);

      // Tab 2 (Disposisi)
      final tab2Finder = find.byIcon(Icons.shortcut_outlined);
      expect(tab2Finder, findsOneWidget);
      await tester.tap(tab2Finder);
      await tester.pumpAndSettle();
      expect(find.text('Tab 2 Screen - Disposisi'), findsOneWidget);

      // Tab 3 (Approval)
      final tab3Finder = find.byIcon(Icons.check_circle_outline_rounded);
      expect(tab3Finder, findsOneWidget);
      await tester.tap(tab3Finder);
      await tester.pumpAndSettle();
      expect(find.text('Tab 3 Screen - Approval'), findsOneWidget);

      // Go back to Tab 0 (Dashboard)
      final tab0Finder = find.byIcon(Icons.grid_view_outlined);
      expect(tab0Finder, findsOneWidget);
      await tester.tap(tab0Finder);
      await tester.pumpAndSettle();
      expect(find.text('Tab 0 Screen - Dashboard'), findsOneWidget);
    });

    testWidgets('Tapping active tab calls goBranch with initialLocation: true',
        (tester) async {
      final testRouter = GoRouter(
        initialLocation: '/branch0/nested',
        routes: [
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) {
              return MainLayoutScreen(
                navigationShell: navigationShell,
              );
            },
            branches: [
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/branch0',
                    builder: (context, state) => const Scaffold(
                      body: Text('Root Branch 0'),
                    ),
                    routes: [
                      GoRoute(
                        path: 'nested',
                        builder: (context, state) => const Scaffold(
                          body: Text('Nested in Branch 0'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/branch1',
                    builder: (context, state) => const Scaffold(
                      body: Text('Root Branch 1'),
                    ),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/branch2',
                    builder: (context, state) => const Scaffold(
                      body: Text('Root Branch 2'),
                    ),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/branch3',
                    builder: (context, state) => const Scaffold(
                      body: Text('Root Branch 3'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp.router(
          routerConfig: testRouter,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Nested in Branch 0'), findsOneWidget);

      // Tap active tab (Tab 0) -> should reset to initialLocation of Branch 0 (/branch0)
      final tab0Finder = find.byIcon(Icons.grid_view_rounded);
      expect(tab0Finder, findsOneWidget);
      await tester.tap(tab0Finder);
      await tester.pumpAndSettle();

      // Now it popped the nested route and reset to Root Branch 0
      expect(find.text('Root Branch 0'), findsOneWidget);
    });
  });
}
