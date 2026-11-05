import 'package:flutter/services.dart';

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

  static void lightImpact() {
    if (_enabled) HapticFeedback.lightImpact();
  }

  static void mediumImpact() {
    if (_enabled) HapticFeedback.mediumImpact();
  }

  static void heavyImpact() {
    if (_enabled) HapticFeedback.heavyImpact();
  }

  static void selectionClick() {
    if (_enabled) HapticFeedback.selectionClick();
  }

  static void vibrate() {
    if (_enabled) HapticFeedback.vibrate();
  }
}
