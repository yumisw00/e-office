import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HapticNotifier extends StateNotifier<bool> {
  HapticNotifier() : super(false) {
    _load();
  }

  static const _key = 'haptic_enabled';

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getBool(_key);
      if (saved != null) {
        state = saved;
      }
    } catch (_) {
      // Ignore error
    }
  }

  Future<void> toggle() async {
    state = !state;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_key, state);
    } catch (_) {
      // Ignore error
    }
  }

  Future<void> setEnabled(bool enabled) async {
    state = enabled;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_key, state);
    } catch (_) {
      // Ignore error
    }
  }
}

final hapticProvider = StateNotifierProvider<HapticNotifier, bool>((ref) {
  return HapticNotifier();
});
