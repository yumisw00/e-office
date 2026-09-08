import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/custom_app_bar.dart';
import 'dashboard_screen.dart';
import 'surat_masuk_screen.dart';
import 'surat_keluar_screen.dart';
import 'profil_screen.dart';
import '../widgets/floating_nav_bar.dart';
import '../../core/localization/app_localizations.dart';

class MainLayoutScreen extends ConsumerStatefulWidget {
  const MainLayoutScreen({super.key});

  @override
  ConsumerState<MainLayoutScreen> createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends ConsumerState<MainLayoutScreen> {
  late final PageController _pageController;
  int _selectedIndex = 0;
  double _pageValue = 0.0;
  bool _usePageSync = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _selectedIndex);
    _pageController.addListener(() {
      if (_pageController.hasClients) {
        final isUserDrag =
            _pageController.position.userScrollDirection !=
            ScrollDirection.idle;
        setState(() {
          _pageValue = _pageController.page ?? _selectedIndex.toDouble();
          if (isUserDrag) {
            _usePageSync = true;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _selectedIndex = index;
      _usePageSync = false;
    });
  }

  void _onTabTapped(int index) {
    setState(() {
      _usePageSync = false;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOutCubic,
    );
  }

  void _handleCapsuleDrag(DragUpdateDetails details) {
    if (_pageController.hasClients) {
      final position = _pageController.position;
      final maxScroll = position.maxScrollExtent;
      final minScroll = position.minScrollExtent;

      final screenWidth = MediaQuery.of(context).size.width;
      final navbarWidth = screenWidth - 48; // Left/Right margin sum
      final activeDragRange =
          navbarWidth * 0.75; // 4 tabs = 3 intervals of drag

      if (activeDragRange > 0) {
        setState(() {
          _usePageSync = true;
        });
        final scrollDelta =
            details.delta.dx * (maxScroll - minScroll) / activeDragRange;
        final targetOffset = (_pageController.offset + scrollDelta).clamp(
          minScroll,
          maxScroll,
        );
        _pageController.position.moveTo(targetOffset);
      }
    }
  }

  void _handleCapsuleDragEnd(DragEndDetails details) {
    if (_pageController.hasClients) {
      final screenWidth = MediaQuery.of(context).size.width;
      final fractionalPage = _pageController.offset / screenWidth;
      final targetPage = fractionalPage.round();
      setState(() {
        _usePageSync = true;
      });
      _pageController
          .animateToPage(
            targetPage,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
          )
          .then((_) {
            if (mounted) {
              setState(() {
                _usePageSync = false;
              });
            }
          });
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    final theme = Theme.of(context);

    // Dynamic Title based on selectedIndex
    final String titleText;
    switch (_selectedIndex) {
      case 0:
        titleText = localizations.get('dashboard');
        break;
      case 1:
        titleText = localizations.get('surat_masuk');
        break;
      case 2:
        titleText = localizations.get('surat_keluar');
        break;
      case 3:
        titleText = localizations.get('profile');
        break;
      default:
        titleText = localizations.get('title');
    }

    return Scaffold(
      extendBody: true,
      appBar: CustomAppBar(
        title: Text(
          titleText,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),

      body: PageView(
        controller: _pageController,
        physics: const BouncingScrollPhysics(),
        onPageChanged: _onPageChanged,
        children: const [
          DashboardScreen(),
          SuratMasukScreen(),
          SuratKeluarScreen(),
          ProfilScreen(),
        ],
      ),
      bottomNavigationBar: FloatingNavBar(
        selectedIndex: _selectedIndex,
        pageValue: _pageValue,
        usePageSync: _usePageSync,
        onTabTapped: _onTabTapped,
        onCapsuleDrag: _handleCapsuleDrag,
        onCapsuleDragEnd: _handleCapsuleDragEnd,
      ),
    );
  }
}
