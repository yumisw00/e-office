// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:e_office_mobile/main.dart';

void main() {
  testWidgets('EOfficeApp render test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    // Wrap with ProviderScope because EOfficeApp uses Riverpod
    await tester.pumpWidget(const ProviderScope(child: EOfficeApp()));

    // Verify that the initial dashboard is rendered (or at least the app starts)
    // Since we use MaterialApp.router, we might need to pump and settle
    await tester.pumpAndSettle();

    expect(find.text('Login E-Office Dahana'), findsOneWidget);
  });
}
