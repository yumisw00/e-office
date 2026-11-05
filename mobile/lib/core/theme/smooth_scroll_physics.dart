import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Scroll physics berbasis [ClampingScrollPhysics] yang dioptimalkan untuk
/// layar refresh rate tinggi (90Hz / 120Hz).
///
/// Menggunakan nilai friksi yang lebih rendah sehingga animasi scroll meluncur
/// lebih panjang dan halus, tanpa menimbulkan bug pantulan (bouncing pinball)
/// yang dapat melempar posisi scroll di layar daftar pendek seperti Notifikasi.
class SmoothScrollPhysics extends ClampingScrollPhysics {
  const SmoothScrollPhysics({
    super.parent,
    this.friction = 0.0085,
  });

  /// Nilai friksi deselerasi. Nilai default Android adalah 0.015.
  /// Nilai 0.0085 memungkinkan scroll meluncur ~1.8x lebih jauh dan mulus
  /// tanpa lepas kendali atau menabrak batas secara agresif.
  final double friction;

  @override
  SmoothScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return SmoothScrollPhysics(
      parent: buildParent(ancestor),
      friction: friction,
    );
  }

  @override
  Simulation? createBallisticSimulation(ScrollMetrics position, double velocity) {
    final Tolerance tolerance = toleranceFor(position);
    if (position.outOfRange) {
      double? end;
      if (position.pixels > position.maxScrollExtent) {
        end = position.maxScrollExtent;
      }
      if (position.pixels < position.minScrollExtent) {
        end = position.minScrollExtent;
      }
      assert(end != null);
      return ScrollSpringSimulation(
        spring,
        position.pixels,
        end!,
        math.min(0.0, velocity),
        tolerance: tolerance,
      );
    }
    if (velocity.abs() < tolerance.velocity) {
      return null;
    }
    if (velocity > 0.0 && position.pixels >= position.maxScrollExtent) {
      return null;
    }
    if (velocity < 0.0 && position.pixels <= position.minScrollExtent) {
      return null;
    }
    return ClampingScrollSimulation(
      position: position.pixels,
      velocity: velocity,
      friction: friction,
      tolerance: tolerance,
    );
  }
}

/// ScrollBehavior global yang menerapkan [SmoothScrollPhysics] ke seluruh widget
/// scroll di aplikasi.
class SmoothScrollBehavior extends MaterialScrollBehavior {
  const SmoothScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const SmoothScrollPhysics(
      parent: AlwaysScrollableScrollPhysics(),
    );
  }
}
