import 'package:flutter/material.dart';

/// Helper untuk menentukan apakah layar termasuk kategori tablet/desktop.
/// Ambang batas: lebar layar > 600 dp dianggap tablet/desktop.
class ResponsiveHelper {
  ResponsiveHelper._();

  static const double tabletBreakpoint = 600.0;

  /// Cek apakah layar saat ini adalah tablet atau lebih lebar.
  static bool isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width > tabletBreakpoint;
  }

  /// Cek apakah layar saat ini adalah ponsel (lebih sempit dari 600 dp).
  static bool isPhone(BuildContext context) {
    return MediaQuery.of(context).size.width <= tabletBreakpoint;
  }

  /// Dapatkan jumlah kolom untuk grid berdasarkan lebar layar.
  static int gridColumnCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 4;
    if (width > 600) return 3;
    return 2;
  }
}