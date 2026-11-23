import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:e_office_mobile/presentation/widgets/floating_nav_bar.dart';

void main() {
  Widget buildTestableNavBar({
    required int selectedIndex,
    required void Function(int) onItemTapped,
  }) {
    return MaterialApp(
      home: Scaffold(
        bottomNavigationBar: FloatingNavBar(
          selectedIndex: selectedIndex,
          onItemTapped: onItemTapped,
        ),
      ),
    );
  }

  group('FloatingNavBar Tap Tests', () {
    testWidgets('Tapping inactive tab triggers onItemTapped immediately',
        (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 0,
          onItemTapped: (index) {
            tappedIndex = index;
          },
        ),
      );

      // Tab 1 is Surat Masuk (Icons.arrow_circle_down_outlined)
      final tab1Finder = find.byIcon(Icons.arrow_circle_down_outlined);
      expect(tab1Finder, findsOneWidget);

      await tester.tap(tab1Finder);
      await tester.pumpAndSettle();

      expect(tappedIndex, 1);
    });

    testWidgets('Tapping active tab triggers onItemTapped with current index',
        (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 0,
          onItemTapped: (index) {
            tappedIndex = index;
          },
        ),
      );

      // Tab 0 is Dashboard (active: Icons.grid_view_rounded)
      final tab0Finder = find.byIcon(Icons.grid_view_rounded);
      expect(tab0Finder, findsOneWidget);

      await tester.tap(tab0Finder);
      await tester.pumpAndSettle();

      expect(tappedIndex, 0);
    });
  });

  group('FloatingNavBar Drag & Release Tests (iPhone Style)', () {
    testWidgets('Dragging active selector changes hovered icon and only navigates on release',
        (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 0,
          onItemTapped: (index) {
            tappedIndex = index;
          },
        ),
      );

      final tab0Finder = find.byIcon(Icons.grid_view_rounded);
      final tab0Center = tester.getCenter(tab0Finder);

      // Start gesture on active tab
      final gesture = await tester.startGesture(tab0Center);
      await tester.pump(const Duration(milliseconds: 50));

      // Drag right by 200 pixels (towards Tab 2 / Tab 3)
      await gesture.moveBy(const Offset(200, 0));
      await tester.pump();

      // WHILE dragging, onItemTapped must NOT have been called yet
      expect(tappedIndex, -1);

      // Release finger
      await gesture.up();
      await tester.pumpAndSettle();

      // Now navigation has executed with nearest index (> 0)
      expect(tappedIndex, greaterThan(0));
    });

    testWidgets('Dragging far to right clamps to index 3 (Profil)',
        (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 0,
          onItemTapped: (index) {
            tappedIndex = index;
          },
        ),
      );

      final tab0Finder = find.byIcon(Icons.grid_view_rounded);
      final tab0Center = tester.getCenter(tab0Finder);

      final gesture = await tester.startGesture(tab0Center);
      await tester.pump(const Duration(milliseconds: 50));

      // Drag 1000 pixels to the right (beyond right edge)
      await gesture.moveBy(const Offset(1000, 0));
      await tester.pump();

      // Release
      await gesture.up();
      await tester.pumpAndSettle();

      // Clamped to tab 3
      expect(tappedIndex, 3);
    });

    testWidgets('Dragging far to left clamps to index 0 (Dashboard)',
        (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 2,
          onItemTapped: (index) {
            tappedIndex = index;
          },
        ),
      );

      final tab2Finder = find.byIcon(Icons.shortcut_rounded);
      final tab2Center = tester.getCenter(tab2Finder);

      final gesture = await tester.startGesture(tab2Center);
      await tester.pump(const Duration(milliseconds: 50));

      // Drag 1000 pixels to the left (beyond left edge)
      await gesture.moveBy(const Offset(-1000, 0));
      await tester.pump();

      // Release
      await gesture.up();
      await tester.pumpAndSettle();

      // Clamped to tab 0
      expect(tappedIndex, 0);
    });

    testWidgets('Holding in place for 200ms enters held state without moving',
        (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 1,
          onItemTapped: (index) {
            tappedIndex = index;
          },
        ),
      );

      final tab1Finder = find.byIcon(Icons.arrow_circle_down_rounded);
      final tab1Center = tester.getCenter(tab1Finder);

      final gesture = await tester.startGesture(tab1Center);
      // Wait past the 180ms hold timer
      await tester.pump(const Duration(milliseconds: 250));

      // Still no navigation triggered
      expect(tappedIndex, -1);

      // Release without dragging
      await gesture.up();
      await tester.pumpAndSettle();

      // Snapped to same tab (1)
      expect(tappedIndex, 1);
    });

    testWidgets(
        'Holding expands capsule to fill navbar height (60) and shrinks back on release without bounce',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 0,
          onItemTapped: (_) {},
        ),
      );

      final tab0Finder = find.byIcon(Icons.grid_view_rounded);
      final tab0Center = tester.getCenter(tab0Finder);

      // Verify initial resting state padding is (h: 8, v: 9)
      AnimatedPadding padding =
          tester.widget<AnimatedPadding>(find.byType(AnimatedPadding));
      expect(padding.padding, const EdgeInsets.symmetric(horizontal: 8, vertical: 9));

      // Hold gesture
      final gesture = await tester.startGesture(tab0Center);
      await tester.pump(const Duration(milliseconds: 200));

      // AnimatedPadding should animate toward zero padding (filling 60px height)
      await tester.pump(const Duration(milliseconds: 200));
      padding =
          tester.widget<AnimatedPadding>(find.byType(AnimatedPadding));
      expect(padding.padding, EdgeInsets.zero);

      // Release gesture
      await gesture.up();
      await tester.pumpAndSettle();

      // Should return to resting padding
      padding =
          tester.widget<AnimatedPadding>(find.byType(AnimatedPadding));
      expect(padding.padding, const EdgeInsets.symmetric(horizontal: 8, vertical: 9));
    });

    testWidgets(
        'Holding on tab 3 (Approval) expands capsule seamlessly to fill full navbar (margin zero, height 60)',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestableNavBar(
          selectedIndex: 3,
          onItemTapped: (_) {},
        ),
      );

      final tab3Finder = find.byIcon(Icons.check_circle_rounded);
      final tab3Center = tester.getCenter(tab3Finder);

      // Resting state: padding has 8px horizontal, 9px vertical
      AnimatedPadding padding =
          tester.widget<AnimatedPadding>(find.byType(AnimatedPadding));
      expect(padding.padding, const EdgeInsets.symmetric(horizontal: 8, vertical: 9));

      // Hold gesture on tab 3
      final gesture = await tester.startGesture(tab3Center);
      await tester.pump(const Duration(milliseconds: 250));
      await tester.pump(const Duration(milliseconds: 200));

      // Held state: padding is completely ZERO and fills full navbar
      padding =
          tester.widget<AnimatedPadding>(find.byType(AnimatedPadding));
      expect(padding.padding, EdgeInsets.zero);

      // Release gesture
      await gesture.up();
      await tester.pumpAndSettle();

      // Returns to resting padding
      padding =
          tester.widget<AnimatedPadding>(find.byType(AnimatedPadding));
      expect(padding.padding, const EdgeInsets.symmetric(horizontal: 8, vertical: 9));
    });
  });
}
