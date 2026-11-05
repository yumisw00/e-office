import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:e_office_mobile/core/theme/smooth_scroll_physics.dart';

void main() {
  group('SmoothScrollPhysics Tests', () {
    const physics = SmoothScrollPhysics();

    test('1. Is based on ClampingScrollPhysics to prevent pinball bouncing', () {
      expect(physics, isA<ClampingScrollPhysics>());
      expect(physics.friction, equals(0.0085));
    });

    test('2. Boundary conditions prevent scrolling past bounds', () {
      final metrics = FixedScrollMetrics(
        minScrollExtent: 0.0,
        maxScrollExtent: 500.0,
        pixels: 0.0,
        viewportDimension: 600.0,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 3.0,
      );

      // Underscroll past top (pixels = 0, target = -10)
      final topBoundary = physics.applyBoundaryConditions(metrics, -10.0);
      expect(topBoundary, equals(-10.0)); // Rejected/absorbed by boundary

      final metricsAtBottom = FixedScrollMetrics(
        minScrollExtent: 0.0,
        maxScrollExtent: 500.0,
        pixels: 500.0,
        viewportDimension: 600.0,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 3.0,
      );

      // Overscroll past bottom (pixels = 500, target = 510)
      final bottomBoundary = physics.applyBoundaryConditions(metricsAtBottom, 510.0);
      expect(bottomBoundary, equals(10.0)); // Rejected/absorbed by boundary
    });

    test('3. Returns null simulation when already at boundary moving outward', () {
      final metricsAtTop = FixedScrollMetrics(
        minScrollExtent: 0.0,
        maxScrollExtent: 500.0,
        pixels: 0.0,
        viewportDimension: 600.0,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 3.0,
      );

      // At top, trying to fling upwards (negative velocity): should be null, no bouncing down
      final simTop = physics.createBallisticSimulation(metricsAtTop, -1000.0);
      expect(simTop, isNull);

      final metricsAtBottom = FixedScrollMetrics(
        minScrollExtent: 0.0,
        maxScrollExtent: 500.0,
        pixels: 500.0,
        viewportDimension: 600.0,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 3.0,
      );

      // At bottom, trying to fling downwards (positive velocity): should be null, no bouncing up
      final simBottom = physics.createBallisticSimulation(metricsAtBottom, 1000.0);
      expect(simBottom, isNull);
    });

    test('4. Creates ClampingScrollSimulation with custom friction for smooth glide', () {
      final metricsInMiddle = FixedScrollMetrics(
        minScrollExtent: 0.0,
        maxScrollExtent: 1000.0,
        pixels: 300.0,
        viewportDimension: 600.0,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 3.0,
      );

      final sim = physics.createBallisticSimulation(metricsInMiddle, 1500.0);
      expect(sim, isNotNull);
      expect(sim, isA<ClampingScrollSimulation>());
      
      final clampingSim = sim! as ClampingScrollSimulation;
      expect(clampingSim.friction, equals(0.0085));
    });

    test('5. Applies cleanly to ancestor', () {
      final applied = physics.applyTo(const AlwaysScrollableScrollPhysics());
      expect(applied, isA<SmoothScrollPhysics>());
      expect(applied.parent, isA<AlwaysScrollableScrollPhysics>());
    });
  });
}
