import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:e_office_mobile/data/models/user_model.dart';
import 'package:e_office_mobile/domain/providers/auth_provider.dart';
import 'package:e_office_mobile/presentation/widgets/floating_profile_sheet.dart';

class FakeAuthNotifier extends AuthNotifier {
  FakeAuthNotifier(super.ref, UserModel? user) {
    state = AsyncValue.data(user);
  }
}

void main() {
  Widget buildTestableSheet({
    UserModel? user,
    Size screenSize = const Size(390, 844),
  }) {
    final effectiveUser = user ??
        UserModel(
          id: '1',
          nama: 'Bapak Direktur',
          email: 'direktur@perusahaan.com',
          jabatan: 'Pimpinan Utama',
          groups: const ['Pimpinan'],
        );

    return ProviderScope(
      overrides: [
        authProvider.overrideWith((ref) => FakeAuthNotifier(ref, effectiveUser)),
      ],
      child: MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(
            size: screenSize,
            padding: const EdgeInsets.only(top: 44, bottom: 34),
          ),
          child: const Scaffold(
            body: FloatingProfileSheet(),
          ),
        ),
      ),
    );
  }

  testWidgets('FloatingProfileSheet renders user info correctly', (tester) async {
    await tester.pumpWidget(buildTestableSheet());
    await tester.pumpAndSettle();

    expect(find.text('Bapak Direktur'), findsOneWidget);
    expect(find.text('direktur@perusahaan.com'), findsOneWidget);
    expect(find.text('PIMPINAN UTAMA'), findsOneWidget);
    expect(find.text('Mode Gelap'), findsOneWidget);
    expect(find.text('Getaran'), findsOneWidget);
    expect(find.text('Keluar dari Akun'), findsOneWidget);
  });

  testWidgets('FloatingProfileSheet adapts width gracefully on compact screen (320dp)', (tester) async {
    await tester.pumpWidget(
      buildTestableSheet(screenSize: const Size(320, 640)),
    );
    await tester.pumpAndSettle();

    final containerFinder = find.byType(Container).first;
    expect(containerFinder, findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('FloatingProfileSheet clamps width gracefully on tablet screen (800dp)', (tester) async {
    await tester.pumpWidget(
      buildTestableSheet(screenSize: const Size(800, 1200)),
    );
    await tester.pumpAndSettle();

    expect(find.text('Bapak Direktur'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('FloatingProfileSheet swipe-to-dismiss invokes pop on fast left swipe', (tester) async {
    bool popped = false;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => FakeAuthNotifier(ref, null)),
        ],
        child: MaterialApp(
          home: Navigator(
            onPopPage: (route, result) {
              popped = true;
              return route.didPop(result);
            },
            pages: const [
              MaterialPage(child: Scaffold(body: Text('Background Screen'))),
              MaterialPage(child: FloatingProfileSheet()),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Targetkan widget di dalam sheet (CircleAvatar)
    final avatarFinder = find.byType(CircleAvatar);
    expect(avatarFinder, findsOneWidget);

    await tester.fling(avatarFinder, const Offset(-400, 0), 1000);
    await tester.pumpAndSettle();

    expect(popped, isTrue);
  });
}
