import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/firebase_messaging_service.dart';
import '../../core/localization/app_localizations.dart';
import '../../domain/providers/auth_provider.dart';
import '../widgets/liquid_glass_container.dart';
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}
class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isCaptchaChecked = false;
  String? _deviceName;
  String? _fcmToken;
  @override
  void initState() {
    super.initState();
    _initializeDeviceInfo();
    _initializeFCM();
  }
  Future<void> _initializeDeviceInfo() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      String name = 'Unknown Device';
      if (defaultTargetPlatform == TargetPlatform.android) {
        final androidInfo = await deviceInfo.androidInfo;
        name = '${androidInfo.brand} ${androidInfo.model}';
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        final iosInfo = await deviceInfo.iosInfo;
        name = 'iPhone ${iosInfo.model}';
      }
      setState(() {
        _deviceName = '$name - ${DateTime.now().millisecondsSinceEpoch}';
      });
      if (kDebugMode) {
        print(' Device Info: $_deviceName');
      }
    } catch (e) {
      if (kDebugMode) {
        print(' Error getting device info: $e');
      }
      setState(() {
        _deviceName = 'Mobile Device - ${DateTime.now().millisecondsSinceEpoch}';
      });
    }
  }
  Future<void> _initializeFCM() async {
    try {
      final fcmService = FirebaseMessagingService();
      final token = await fcmService.getFCMToken();
      setState(() {
        _fcmToken = token;
      });
      if (kDebugMode) {
        print(' FCM Token: ${token?.substring(0, 20)}...');
      }
    } catch (e) {
      if (kDebugMode) {
        print(' Error getting FCM token: $e');
      }
    }
  }
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
  Future<void> _handleLogin() async {
    final localizations = AppLocalizations.of(context);
    if (!_isCaptchaChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(localizations.get('captcha_required'))),
      );
      return;
    }
    if (_deviceName == null || _fcmToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(localizations.get('device_initializing'))),
      );
      await _initializeDeviceInfo();
      await _initializeFCM();
      return;
    }
    try {
      await ref.read(authProvider.notifier).login(
        _emailController.text,
        _passwordController.text,
        _deviceName!,
        _fcmToken!,
      );
    } catch (e) {
      String errorMessage = e.toString();
      if (errorMessage.startsWith('Exception: ')) {
        errorMessage = errorMessage.substring(11);
      }
      errorMessage = errorMessage.replaceAll(RegExp(r'[{}]'), '');
      errorMessage = errorMessage.replaceAll('errors: ', '');
      errorMessage = errorMessage.replaceAll('message: ', '');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage.trim()),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;
    final localizations = AppLocalizations.of(context);
    ref.listen(authProvider, (previous, next) {
      next.whenOrNull(
        data: (user) {
          if (user != null) {
            if (kDebugMode) {
              print(' User logged in: ${user.nama}');
            }
            context.go('/dashboard');
          }
        },
      );
    });
    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.6),
                  Theme.of(context).colorScheme.tertiaryContainer.withValues(alpha: 0.6),
                  Theme.of(context).colorScheme.surface,
                ],
              ),
            ),
          ),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: LiquidGlassContainer(
                borderRadius: 32,
                padding: const EdgeInsets.all(32),
                child: Material(
                  color: Colors.transparent,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(
                      Icons.home,
                      size: 80,
                      color: Colors.blue,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      localizations.get('login_title'),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[900],
                          ),
                    ),
                    const SizedBox(height: 32),
                    TextFormField(
                      controller: _emailController,
                      enabled: !isLoading,
                      decoration: InputDecoration(
                        labelText: localizations.get('email'),
                        prefixIcon: const Icon(Icons.email_outlined),
                        border: const OutlineInputBorder(),
                        filled: true,
                        fillColor: Colors.white12,
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      enabled: !isLoading,
                      obscureText: !_isPasswordVisible,
                      decoration: InputDecoration(
                        labelText: localizations.get('password'),
                        prefixIcon: const Icon(Icons.lock_outline),
                        filled: true,
                        fillColor: Colors.white12,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordVisible
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              _isPasswordVisible = !_isPasswordVisible;
                            });
                          },
                        ),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      value: _isCaptchaChecked,
                      onChanged: isLoading 
                          ? null 
                          : (value) {
                              setState(() {
                                _isCaptchaChecked = value ?? false;
                              });
                            },
                      title: Text(localizations.get('i_am_not_robot')),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: (isLoading || _deviceName == null || _fcmToken == null) 
                            ? null 
                            : _handleLogin,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                localizations.get('login'),
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                      TextButton(
                        onPressed: isLoading ? null : () {},
                        child: Text(localizations.get('forgot_password')),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
