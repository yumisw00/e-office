import 'package:flutter/services.dart';
import 'dart:async';

/// Centralized haptic feedback utility that respects the user's vibration preference.
///
/// Call [HapticHelper.init] with the current haptic-enabled value whenever the
/// provider state changes. All haptic calls throughout the app should go through
/// the static methods on this class.
class HapticHelper {
  HapticHelper._();

  static bool _enabled = false;

  /// Update the enabled state. Called by the provider listener.
  static void setEnabled(bool enabled) {
    _enabled = enabled;
  }

  /// Whether haptic feedback is currently enabled.
  static bool get isEnabled => _enabled;

  /// Getaran ringan untuk klik tombol / interaksi ringan.
  static void lightImpact() {
    if (_enabled) HapticFeedback.lightImpact();
  }

  /// Getaran sedang untuk peringatan / aksi sedang.
  static void mediumImpact() {
    if (_enabled) HapticFeedback.mediumImpact();
  }

  /// Getaran kuat untuk error / aksi kritis.
  static void heavyImpact() {
    if (_enabled) HapticFeedback.heavyImpact();
  }

  /// Getaran untuk seleksi item daftar.
  static void selectionClick() {
    if (_enabled) HapticFeedback.selectionClick();
  }

  /// Getaran untuk long-press / context menu.
  static void longPressStart() {
    if (_enabled) HapticFeedback.selectionClick();
  }

  /// Getaran untuk sukses (disetujui, tersimpan, dll).
  /// Pola: lightImpact + jeda 30ms + lightImpact lagi.
  static Future<void> playSuccess() async {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
    await Future.delayed(const Duration(milliseconds: 30));
    if (_enabled) HapticFeedback.lightImpact();
  }

  /// Getaran untuk peringatan (ditolak, gagal, dll).
  /// Pola: mediumImpact berulang 2x dengan jeda 50ms.
  static Future<void> playWarning() async {
    if (!_enabled) return;
    HapticFeedback.mediumImpact();
    await Future.delayed(const Duration(milliseconds: 50));
    if (_enabled) HapticFeedback.mediumImpact();
  }

  /// Getaran untuk error (jaringan putus, login gagal, dll).
  /// Pola: heavyImpact 1x.
  static Future<void> playError() async {
    if (!_enabled) return;
    HapticFeedback.heavyImpact();
  }

  static void vibrate() {
    if (_enabled) HapticFeedback.vibrate();
  }
}
