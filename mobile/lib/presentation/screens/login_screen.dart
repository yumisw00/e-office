import 'package:device_info_plus/deviceInfoPlus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/firebase_messaging_service.dart';
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

  /// Inisialisasi informasi device (nama perangkat)
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
        print('📱 Device Info: $_deviceName');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error getting device info: $e');
      }
      // Fallback ke nama generik
      setState(() {
        _deviceName = 'Mobile Device - ${DateTime.now().millisecondsSinceEpoch}';
      });
    }
  }

  /// Inisialisasi FCM Token
  Future<void> _initializeFCM() async {
    try {
      final fcmService = FirebaseMessagingService();
      final token = await fcmService.getFCMToken();
      
      setState(() {
        _fcmToken = token;
      });

      if (kDebugMode) {
        print('🔔 FCM Token: ${token?.substring(0, 20)}...');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error getting FCM token: $e');
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
    if (!_isCaptchaChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan verifikasi Captcha terlebih dahulu')),
      );
      return;
    }

    if (_deviceName == null || _fcmToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Menginisialisasi perangkat... Silakan coba lagi')),
      );
      // Re-initialize jika masih null
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
      // Bersihkan teks error
      String errorMessage = e.toString();
      
      // Hapus awalan "Exception: " bawaan Dart
      if (errorMessage.startsWith('Exception: ')) {
        errorMessage = errorMessage.substring(11);
      }
      
      // Bersihkan karakter JSON jika backend masih mengirim string map
      errorMessage = errorMessage.replaceAll(RegExp(r'[{}]'), '');
      errorMessage = errorMessage.replaceAll('errors: ', '');
      errorMessage = errorMessage.replaceAll('message: ', '');
      
      // Tampilkan di SnackBar
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

    // Listen to auth state changes for navigation and error feedback
    ref.listen(authProvider, (previous, next) {
      next.whenOrNull(
        data: (user) {
          if (user != null) {
            if (kDebugMode) {
              print('✅ User logged in: ${user.nama}');
            }
            context.go('/dashboard');
          }
        },
      );
    });

    return Scaffold(
      body: Stack(
        children: [
          // Vibrant Gradient Background for Glassmorphism
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
          // Form Content
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
                      Icons.business,
                      size: 80,
                      color: Colors.blue,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Login E-Office Dahana',
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
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email_outlined),
                        border: OutlineInputBorder(),
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
                        labelText: 'Password',
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
                      title: const Text('Saya bukan robot (Verification)'),
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
                            : const Text(
                                'Masuk',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                      TextButton(
                        onPressed: isLoading ? null : () {},
                        child: const Text('Lupa Password?'),
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
