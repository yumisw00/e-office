import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/haptic_helper.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/theme_provider.dart';
import '../../domain/providers/haptic_provider.dart';

class FloatingProfileSheet extends ConsumerWidget {
  const FloatingProfileSheet({super.key});

  /// Membuka panel profil melayang dari kiri tanpa efek blur (murni transparan demi performa)
  static Future<void> show(BuildContext context) {
    HapticHelper.lightImpact();
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Tutup Profil',
      barrierColor: Colors.black.withValues(alpha: 0.35),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, animation, secondaryAnimation) {
        return const FloatingProfileSheet();
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
          reverseCurve: Curves.easeInCubic,
        );
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(-1.0, 0.0),
            end: Offset.zero,
          ).animate(curvedAnimation),
          child: child,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final mediaQuery = MediaQuery.of(context);
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider);
    final hapticEnabled = ref.watch(hapticProvider);

    String userName = 'Pimpinan';
    String userEmail = 'pimpinan@instansi.go.id';
    String userRole = 'Pimpinan';

    authState.whenData((user) {
      if (user != null) {
        userName = user.nama;
        userEmail = user.email;
        if (user.role.isNotEmpty) {
          userRole = user.role;
        }
      }
    });

    // Menghitung lebar responsif dan adaptif untuk segala ukuran layar:
    // - Ponsel compact (< 360dp): ~85% lebar layar (min 260dp)
    // - Ponsel standar (360–480dp): ~80% lebar layar
    // - Tablet / Foldable (> 600dp): dibatasi maksimal 360dp agar tidak meregang
    final screenWidth = mediaQuery.size.width;
    final sheetWidth = (screenWidth * 0.82).clamp(260.0, 360.0);

    // Menghitung margin atas dan bawah yang adaptif terhadap System Inset:
    // Menghormati punch-hole camera/notch di atas dan 3-button/gesture bar di bawah
    final topInset = mediaQuery.padding.top;
    final bottomInset = mediaQuery.padding.bottom;
    final topMargin = topInset > 0 ? topInset + 10.0 : 20.0;
    final bottomMargin = bottomInset > 0 ? bottomInset + 10.0 : 20.0;

    return SafeArea(
      top: false,
      bottom: false,
      child: Align(
        alignment: Alignment.centerLeft,
        child: GestureDetector(
          // Mendukung gesture swipe ke kiri untuk menutup (native Android drawer gesture)
          onHorizontalDragEnd: (details) {
            if ((details.primaryVelocity ?? 0) < -250) {
              HapticHelper.lightImpact();
              Navigator.of(context).pop();
            }
          },
          child: Container(
            width: sheetWidth,
            margin: EdgeInsets.only(
              top: topMargin,
              bottom: bottomMargin,
              left: 0,
              right: (screenWidth - sheetWidth).clamp(16.0, 48.0),
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: const BorderRadius.horizontal(
                right: Radius.circular(28),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.15),
                  blurRadius: 20,
                  offset: const Offset(4, 0),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: Column(
                children: [
                  // Header Profil
                  _buildHeader(context, userName, userEmail, userRole, theme, isDark),
                  const Divider(height: 1),

                  // Konten Pengaturan & Opsi
                  Expanded(
                    child: ListView(
                      physics: const ClampingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      children: [
                      _buildSectionTitle('PENGATURAN', theme),
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.dark_mode_rounded,
                            color: theme.colorScheme.primary,
                            size: 20,
                          ),
                        ),
                        title: const Text('Mode Gelap', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        value: themeMode == ThemeMode.dark,
                        onChanged: (val) {
                          HapticHelper.selectionClick();
                          ref.read(themeProvider.notifier).setThemeMode(val ? ThemeMode.dark : ThemeMode.light);
                        },
                      ),
                      const SizedBox(height: 8),
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.vibration_rounded,
                            color: theme.colorScheme.primary,
                            size: 20,
                          ),
                        ),
                        title: const Text('Getaran', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        value: hapticEnabled,
                        onChanged: (val) {
                          ref.read(hapticProvider.notifier).setEnabled(val);
                          if (val) {
                            HapticHelper.mediumImpact();
                          }
                        },
                      ),
                    ],
                  ),
                ),

                // Footer Tombol Logout
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade200),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: const Icon(Icons.logout_rounded, size: 20),
                      label: const Text('Keluar dari Akun', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () => _confirmLogout(context, ref),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

  Widget _buildHeader(
    BuildContext context,
    String name,
    String email,
    String role,
    ThemeData theme,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 12, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: theme.colorScheme.primaryContainer,
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'P',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    (role.isNotEmpty && role.toLowerCase() != 'null') ? role.toUpperCase() : 'PIMPINAN',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded, size: 22),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: theme.colorScheme.primary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Konfirmasi Keluar'),
        content: const Text('Apakah Anda yakin ingin keluar dari akun ini?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Batal'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(dialogCtx); // tutup dialog
              Navigator.pop(context); // tutup floating profile
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }
}
