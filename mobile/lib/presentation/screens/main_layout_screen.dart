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
      body: child,
      bottomNavigationBar: FloatingNavBar(
        selectedIndex: selectedIndex,
        onItemTapped: (index) {
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.go('/surat-masuk');
              break;
            case 2:
              context.go('/disposisi');
              break;
            case 3:
              context.go('/approval');
              break;
            case 4:
              context.go('/profil');
              break;
          }
        },
      ),
    );
  }
}
