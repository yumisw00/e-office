
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';

final liquidGlassProvider = StateNotifierProvider<LiquidGlassNotifier, bool>((ref) {
  return LiquidGlassNotifier();
});

class LiquidGlassNotifier extends StateNotifier<bool> {
  static const _key = 'isLiquidGlassEnabled';

  LiquidGlassNotifier() : super(true) {
    _loadPreference();
  }

  Future<void> _loadPreference() async {
    final prefs = await SharedPreferences.getInstance();
    final isEnabled = prefs.getBool(_key);
    if (isEnabled != null) {
      state = isEnabled;
    }
  }

  Future<void> toggle() async {
    final prefs = await SharedPreferences.getInstance();
    state = !state;
    await prefs.setBool(_key, state);
  }

  Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    state = enabled;
    await prefs.setBool(_key, state);
  }
}
