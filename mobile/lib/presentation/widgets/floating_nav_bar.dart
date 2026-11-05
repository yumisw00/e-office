import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'dart:async';
import 'package:flutter/material.dart';

class FloatingNavBar extends StatefulWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;

  const FloatingNavBar({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
  });

  @override
  State<FloatingNavBar> createState() => _FloatingNavBarState();
}

class _FloatingNavBarState extends State<FloatingNavBar> {
  bool _isDragging = false;
  bool _isHeld = false;
  bool _pointerDown = false;
  double _dragLeft = 0.0;
  double _dragStartX = 0.0;
  double _capsuleStartLeft = 0.0;
  late int _effectiveIndex;
  late int _hoveredIndex;
  Timer? _holdTimer;

  @override
  void initState() {
    super.initState();
    _effectiveIndex = widget.selectedIndex;
    _hoveredIndex = widget.selectedIndex;
  }

  @override
  void didUpdateWidget(FloatingNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex && !_isDragging) {
      setState(() {
        _effectiveIndex = widget.selectedIndex;
        _hoveredIndex = widget.selectedIndex;
      });
    }
  }

  @override
  void dispose() {
    _holdTimer?.cancel();
    super.dispose();
  }

  void _onPointerDown(PointerDownEvent event, double itemWidth, double totalWidth) {
    _pointerDown = true;
    _dragStartX = event.position.dx;
    _capsuleStartLeft = _effectiveIndex * itemWidth;
    _dragLeft = _capsuleStartLeft;
    _hoveredIndex = _effectiveIndex;

    _holdTimer?.cancel();
    _holdTimer = Timer(const Duration(milliseconds: 180), () {
      if (mounted && _pointerDown && !_isDragging) {
        setState(() {
          _isHeld = true;
          _isDragging = true;
        });
        HapticHelper.mediumImpact();
      }
    });
  }

  void _onPointerMove(PointerMoveEvent event, double itemWidth, double totalWidth) {
    if (!_pointerDown) return;

    final deltaX = event.position.dx - _dragStartX;

    // Jika belum masuk mode dragging, aktifkan langsung jika gerakan horizontal > 6px
    if (!_isDragging && deltaX.abs() > 6) {
      _holdTimer?.cancel();
      _isDragging = true;
      _isHeld = true;
      HapticHelper.mediumImpact();
    }

    if (_isDragging) {
      final maxLeft = totalWidth - itemWidth;
      final newLeft = (_capsuleStartLeft + deltaX).clamp(0.0, maxLeft);
      final newHovered = (newLeft / itemWidth).round().clamp(0, 3);

      if (newHovered != _hoveredIndex) {
        _hoveredIndex = newHovered;
        HapticHelper.selectionClick();
      }

      setState(() {
        _dragLeft = newLeft;
      });
    }
  }

  void _onPointerUp(double itemWidth) {
    _holdTimer?.cancel();
    final wasDragging = _isDragging;
    _pointerDown = false;

    if (wasDragging) {
      final targetIndex = (_dragLeft / itemWidth).round().clamp(0, 3);
      HapticHelper.mediumImpact();

      setState(() {
        _isDragging = false;
        _isHeld = false;
        _hoveredIndex = targetIndex;
        _effectiveIndex = targetIndex;
        _dragLeft = targetIndex * itemWidth;
      });

      widget.onItemTapped(targetIndex);
    } else {
      // Tap biasa pada tab yang sedang aktif
      HapticHelper.lightImpact();
      widget.onItemTapped(widget.selectedIndex);
    }
  }

  void _onPointerCancel() {
    _holdTimer?.cancel();
    _pointerDown = false;

    if (_isDragging || _isHeld) {
      setState(() {
        _isDragging = false;
        _isHeld = false;
        _hoveredIndex = widget.selectedIndex;
        _effectiveIndex = widget.selectedIndex;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final activeColor = theme.colorScheme.primary;

    const double navBarHeight = 60.0;
    const double navBarRadius = 30.0;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Container(
          height: navBarHeight,
          decoration: BoxDecoration(
            color: isDark
                ? theme.colorScheme.surface.withValues(alpha: 0.94)
                : Colors.white.withValues(alpha: 0.94),
            borderRadius: BorderRadius.circular(navBarRadius),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.10)
                  : Colors.black.withValues(alpha: 0.06),
              width: 1.0,
            ),
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
            borderRadius: BorderRadius.circular(navBarRadius - 1),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final totalWidth = constraints.maxWidth;
                if (totalWidth <= 0) return const SizedBox.shrink();
                final itemWidth = totalWidth / 4;

                final capsuleLeft =
                    _isDragging ? _dragLeft : _effectiveIndex * itemWidth;

                return Stack(
                  children: [
                    // Sliding Indicator Capsule
                    AnimatedPositioned(
                      duration: _isDragging
                          ? Duration.zero
                          : const Duration(milliseconds: 250),
                      curve: Curves.easeOutCubic,
                      left: capsuleLeft,
                      top: 0,
                      bottom: 0,
                      width: itemWidth,
                      child: Center(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          curve: Curves.easeOutCubic,
                          width: double.infinity,
                          height: _isHeld ? navBarHeight : 42,
                          margin: EdgeInsets.symmetric(
                            horizontal: _isHeld ? 0 : 8,
                            vertical: _isHeld ? 0 : 9,
                          ),
                          decoration: BoxDecoration(
                            color: _isHeld
                                ? activeColor.withValues(alpha: 0.28)
                                : activeColor.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(
                              _isHeld ? navBarRadius : 21,
                            ),
                            boxShadow: _isHeld
                                ? [
                                    BoxShadow(
                                      color:
                                          activeColor.withValues(alpha: 0.20),
                                      blurRadius: 8,
                                      spreadRadius: 0,
                                      offset: const Offset(0, 1),
                                    ),
                                  ]
                                : null,
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
                          itemWidth: itemWidth,
                          totalWidth: totalWidth,
                          height: navBarHeight,
                        ),
                        _buildTabItem(
                          context,
                          index: 1,
                          activeIcon: Icons.assignment_rounded,
                          inactiveIcon: Icons.assignment_outlined,
                          itemWidth: itemWidth,
                          totalWidth: totalWidth,
                          height: navBarHeight,
                        ),
                        _buildTabItem(
                          context,
                          index: 2,
                          activeIcon: Icons.check_circle_rounded,
                          inactiveIcon: Icons.check_circle_outline_rounded,
                          itemWidth: itemWidth,
                          totalWidth: totalWidth,
                          height: navBarHeight,
                        ),
                        _buildTabItem(
                          context,
                          index: 3,
                          activeIcon: Icons.person_rounded,
                          inactiveIcon: Icons.person_outline_rounded,
                          itemWidth: itemWidth,
                          totalWidth: totalWidth,
                          height: navBarHeight,
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
    required IconData activeIcon,
    required IconData inactiveIcon,
    required double itemWidth,
    required double totalWidth,
    required double height,
  }) {
    final isCurrentTab = widget.selectedIndex == index;
    final isHighlighted =
        (_isDragging ? _hoveredIndex : _effectiveIndex) == index;
    final theme = Theme.of(context);
    final activeColor = theme.colorScheme.primary;
    final inactiveColor = theme.colorScheme.onSurfaceVariant;

    final content = SizedBox(
      height: height,
      child: Center(
        child: AnimatedScale(
          scale: isHighlighted ? 1.08 : 1.0,
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeOutCubic,
          child: Icon(
            isHighlighted ? activeIcon : inactiveIcon,
            color: isHighlighted ? activeColor : inactiveColor,
            size: 24,
          ),
        ),
      ),
    );

    if (isCurrentTab) {
      return Expanded(
        child: Listener(
          behavior: HitTestBehavior.opaque,
          onPointerDown: (event) => _onPointerDown(event, itemWidth, totalWidth),
          onPointerMove: (event) => _onPointerMove(event, itemWidth, totalWidth),
          onPointerUp: (event) => _onPointerUp(itemWidth),
          onPointerCancel: (event) => _onPointerCancel(),
          child: content,
        ),
      );
    } else {
      return Expanded(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            HapticHelper.lightImpact();
            setState(() {
              _effectiveIndex = index;
            });
            widget.onItemTapped(index);
          },
          child: content,
        ),
      );
    }
  }
}
