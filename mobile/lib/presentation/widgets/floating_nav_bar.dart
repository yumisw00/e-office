
import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import 'liquid_glass_container.dart';

class FloatingNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTabTapped;
  final ValueChanged<DragUpdateDetails>? onCapsuleDrag;
  final ValueChanged<DragEndDetails>? onCapsuleDragEnd;
  final double? pageValue;
  final bool usePageSync;

  const FloatingNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTabTapped,
    this.onCapsuleDrag,
    this.onCapsuleDragEnd,
    this.pageValue,
    this.usePageSync = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.colorScheme.primary;
    final localizations = AppLocalizations.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      child: LiquidGlassContainer(
        borderRadius: 33,
        child: SizedBox(
          height: 66,
          child: GestureDetector(
            onHorizontalDragUpdate: onCapsuleDrag,
            onHorizontalDragEnd: onCapsuleDragEnd,
            behavior: HitTestBehavior.opaque,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final totalWidth = constraints.maxWidth;
                final tabWidth = totalWidth / 4;

                // Use fractional pageValue when page syncing (dragging/swiping), otherwise use selectedIndex
                final double displayIndex = usePageSync ? (pageValue ?? selectedIndex.toDouble()) : selectedIndex.toDouble();
                final Duration duration = usePageSync ? Duration.zero : const Duration(milliseconds: 350);
                final Curve curve = usePageSync ? Curves.linear : Curves.easeOutBack;

                return Stack(
                  children: [
                    // Moving Capsule Indicator
                    AnimatedPositioned(
                      duration: duration,
                      curve: curve,
                      left: displayIndex * tabWidth,
                      top: 6,
                      bottom: 6,
                      child: Container(
                        width: tabWidth,
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Container(
                          decoration: BoxDecoration(
                            color: primaryColor.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(27),
                            border: Border.all(
                              color: primaryColor.withValues(alpha: 0.35),
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                  // Row of Interactive Tabs
                  Row(
                    children: [
                      _buildTabItem(
                        context,
                        index: 0,
                        label: localizations.get('dashboard'),
                        activeIcon: Icons.dashboard_rounded,
                        inactiveIcon: Icons.dashboard_outlined,
                      ),
                      _buildTabItem(
                        context,
                        index: 1,
                        label: localizations.get('surat_masuk'),
                        activeIcon: Icons.mark_email_read_rounded,
                        inactiveIcon: Icons.mark_email_unread_outlined,
                      ),
                      _buildTabItem(
                        context,
                        index: 2,
                        label: localizations.get('surat_keluar'),
                        activeIcon: Icons.send_rounded,
                        inactiveIcon: Icons.send_outlined,
                      ),
                      _buildTabItem(
                        context,
                        index: 3,
                        label: localizations.get('profile'),
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
  );
}


  Widget _buildTabItem(
    BuildContext context, {
    required int index,
    required String label,
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
        onTap: () => onTabTapped(index),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: isSelected ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                isSelected ? activeIcon : inactiveIcon,
                color: isSelected ? activeColor : inactiveColor,
                size: 24,
              ),
            ),
            const SizedBox(height: 3),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? activeColor : inactiveColor,
              ),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
