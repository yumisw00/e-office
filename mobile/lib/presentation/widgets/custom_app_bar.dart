import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'floating_profile_sheet.dart';

class CustomAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final double? leadingWidth;
  final bool showProfileButton;

  const CustomAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.leadingWidth,
    this.showProfileButton = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final canPop = Navigator.canPop(context);

    Widget? effectiveLeading = leading;

    // Jika leading tidak dispesifikasikan:
    // 1. Jika halaman bisa di-pop (halaman sub-detail): tampilkan tombol kembali (back)
    // 2. Jika halaman root dan showProfileButton true: tampilkan tombol pemicu Floating Profile Sheet
    if (effectiveLeading == null) {
      if (canPop) {
        effectiveLeading = IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () {
            HapticHelper.lightImpact();
            context.pop();
          },
        );
      } else if (showProfileButton) {
        effectiveLeading = IconButton(
          icon: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.person_rounded,
              size: 20,
              color: theme.colorScheme.primary,
            ),
          ),
          tooltip: 'Menu Profil',
          onPressed: () => FloatingProfileSheet.show(context),
        );
      }
    }

    // Alpha 0.84 digunakan agar konten scroll terlihat di balik AppBar dengan luas pandangan nyaman.
    // AnimatedContainer diganti Container biasa — warna tidak berubah saat
    // scroll sehingga animasi tidak diperlukan, menghilangkan layout pass
    // per-frame tanpa mengorbankan efek transparan.
    final baseColor = isDark
        ? theme.colorScheme.surface
        : Colors.white;

    final borderColor = isDark
        ? Colors.white.withValues(alpha: 0.08)
        : Colors.black.withValues(alpha: 0.04);

    return AppBar(
      leading: effectiveLeading,
      leadingWidth: leadingWidth,
      title: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
      ),
      centerTitle: true,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      backgroundColor: Colors.transparent,
      // Container biasa (bukan AnimatedContainer) — tidak ada state yang perlu
      // dianimasikan, cukup tampil transparan konsisten.
      flexibleSpace: Container(
        decoration: BoxDecoration(
          color: baseColor.withValues(alpha: 0.84),
          border: Border(
            bottom: BorderSide(
              color: borderColor,
              width: 1.0,
            ),
          ),
        ),
      ),
      actions: actions ?? [
        IconButton(
          icon: const Icon(Icons.notifications_none_rounded),
          onPressed: () {
            HapticHelper.lightImpact();
            context.push('/notifications');
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}
