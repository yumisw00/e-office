import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class FloatingNavBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;

  const FloatingNavBar({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final activeColor = theme.colorScheme.primary;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.25)
                    : theme.colorScheme.primary.withValues(alpha: 0.08),
                blurRadius: 16,
                spreadRadius: 1,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark
                      ? theme.colorScheme.surface.withValues(alpha: 0.05)
                      : Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : Colors.black.withValues(alpha: 0.04),
                    width: 1.0,
                  ),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final itemWidth = constraints.maxWidth / 4;
                    return Stack(
                      children: [
                        // Sliding Indicator Capsule
                        AnimatedPositioned(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOutCubic,
                          left: selectedIndex * itemWidth,
                          top: 0,
                          bottom: 0,
                          width: itemWidth,
                          child: Center(
                            child: Container(
                              height: 42,
                              margin: const EdgeInsets.symmetric(horizontal: 6),
                              decoration: BoxDecoration(
                                color: activeColor.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                          ),
                        ),
                        // Tab Items Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _buildTabItem(
                              context,
                              index: 0,
                              activeIcon: Icons.grid_view_rounded,
                              inactiveIcon: Icons.grid_view_outlined,
                            ),
                            _buildTabItem(
                              context,
                              index: 1,
                              activeIcon: Icons.assignment_rounded,
                              inactiveIcon: Icons.assignment_outlined,
                            ),
                            _buildTabItem(
                              context,
                              index: 2,
                              activeIcon: Icons.check_circle_rounded,
                              inactiveIcon: Icons.check_circle_outline_rounded,
                            ),
                            _buildTabItem(
                              context,
                              index: 3,
                              activeIcon: Icons.person_rounded,
                              inactiveIcon: Icons.person_outline_rounded,
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabItem(
    BuildContext context, {
    required int index,
    required IconData activeIcon,
    required IconData inactiveIcon,
  }) {
    final isSelected = selectedIndex == index;
    final theme = Theme.of(context);
    final activeColor = theme.colorScheme.primary;
    final inactiveColor = theme.colorScheme.onSurfaceVariant;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.lightImpact();
          onItemTapped(index);
        },
        child: SizedBox(
          height: 48,
          child: Center(
            child: Icon(
              isSelected ? activeIcon : inactiveIcon,
              color: isSelected ? activeColor : inactiveColor,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}
