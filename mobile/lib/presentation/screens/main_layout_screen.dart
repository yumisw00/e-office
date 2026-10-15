import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../widgets/floating_nav_bar.dart';

class MainLayoutScreen extends StatelessWidget {
  final Widget child;
  final int selectedIndex;

  const MainLayoutScreen({
    super.key,
    required this.child,
    this.selectedIndex = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: child,
      bottomNavigationBar: FloatingNavBar(
        selectedIndex: selectedIndex,
        onItemTapped: (index) {
          // Tutup modal / bottom sheet yang sedang aktif di root navigator sebelum pindah tab
          if (Navigator.of(context, rootNavigator: true).canPop()) {
            Navigator.of(context, rootNavigator: true).pop();
          }
          
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.go('/surat-masuk');
              break;
            case 2:
              context.go('/approval');
              break;
            case 3:
              context.go('/profil');
              break;
          }
        },
      ),
    );
  }
}
