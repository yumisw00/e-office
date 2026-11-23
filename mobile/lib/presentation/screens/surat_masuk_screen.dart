import 'dart:async';
import 'dart:math' as math;
import 'package:e_office_mobile/core/constants/app_colors.dart';
import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../data/models/surat_model.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';
import '../widgets/surat_filter_widgets.dart';

class SuratMasukScreen extends ConsumerStatefulWidget {
  const SuratMasukScreen({super.key});

  @override
  ConsumerState<SuratMasukScreen> createState() => _SuratMasukScreenState();
}

class _SuratMasukScreenState extends ConsumerState<SuratMasukScreen>
    with SingleTickerProviderStateMixin {
  // Filter Tabs Pengiriman (Persis seperti Web: Semua Surat, Internal, Eksternal)
  String _selectedPengiriman = 'semua'; // 'semua', 'internal', 'eksternal'

  // Filter Jenis Surat (Persis seperti Web JenisSuratTabs.jsx)
  String _selectedJenisSurat = 'semua';
  Map<String, int>? _cachedCategoryCounts;

  // Pencarian Kata Kunci langsung di halaman utama
  String _keyword = '';
  final TextEditingController _searchController = TextEditingController();
  // Debounce: tunda fetch API sampai user berhenti mengetik selama 400ms
  Timer? _searchDebounce;

  // Auto-hide filtering saat scroll — menggunakan AnimationController
  // agar transisi height + opacity berjalan bersamaan dan halus
  late final AnimationController _filterAnimController;
  late final Animation<double> _filterSizeFactor;
  late final Animation<double> _filterOpacity;
  bool _isFilterVisible = true;

  @override
  void initState() {
    super.initState();
    _filterAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
      value: 1.0, // mulai dalam keadaan terlihat
    );
    _filterSizeFactor = CurvedAnimation(
      parent: _filterAnimController,
      curve: Curves.easeInOutCubic,
    );
    _filterOpacity = CurvedAnimation(
      parent: _filterAnimController,
      curve: const Interval(0.0, 0.7, curve: Curves.easeIn),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchDebounce?.cancel();
    _filterAnimController.dispose();
    super.dispose();
  }

  void _loadData() {
    final pengirimanParam = _selectedPengiriman == 'semua'
        ? null
        : _selectedPengiriman;
    final keywordParam = _keyword.trim().isEmpty ? null : _keyword.trim();
    ref
        .read(suratMasukListProvider.notifier)
        .fetchSuratMasuk(
          jenisPengiriman: pengirimanParam,
          keyword: keywordParam,
        );
  }

  void _onPengirimanChanged(String pengiriman) {
    HapticHelper.lightImpact();
    setState(() => _selectedPengiriman = pengiriman);
    _loadData();
  }

  void _onJenisSuratChanged(String jenisSurat) {
    HapticHelper.lightImpact();
    setState(() => _selectedJenisSurat = jenisSurat);
  }

  void _showFilter() {
    if (!_isFilterVisible) {
      _isFilterVisible = true;
      _filterAnimController.forward();
    }
  }

  void _hideFilter() {
    if (_isFilterVisible) {
      FocusScope.of(context).unfocus();
      _isFilterVisible = false;
      _filterAnimController.reverse();
    }
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (notification.metrics.axis != Axis.vertical) return false;

    // Jika scroll kembali ke puncak atas, tampilkan filter
    if (notification.metrics.pixels <= 10) {
      _showFilter();
      return false;
    }

    if (notification is ScrollUpdateNotification) {
      final delta = notification.scrollDelta ?? 0.0;
      // Scroll ke bawah — sembunyikan
      if (delta > 2.0 && notification.metrics.pixels > 20) {
        _hideFilter();
      } else if (delta < -2.0) {
        // Scroll ke atas — tampilkan
        _showFilter();
      }
    } else if (notification is UserScrollNotification) {
      if (notification.direction == ScrollDirection.reverse &&
          notification.metrics.pixels > 20) {
        _hideFilter();
      } else if (notification.direction == ScrollDirection.forward) {
        _showFilter();
      }
    }
    return false;
  }

  Widget _buildFilterSection(
    ThemeData theme, {
    required Map<String, int> categoryCounts,
    required List<Map<String, String>> jenisOptions,
    required Map<String, int> jenisCounts,
    required List<String> fallbackJenisValues,
  }) {
    final isDark = theme.brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? theme.colorScheme.surface.withValues(alpha: 0.84)
            : Colors.white.withValues(alpha: 0.84),
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.04),
            width: 1.0,
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildSearchAndFilterBar(),
          _buildTopTabs(categoryCounts),
          JenisSuratFilterRow(
            selectedValue: _selectedJenisSurat,
            options: jenisOptions,
            counts: jenisCounts,
            fallbackJenisValues: fallbackJenisValues,
            onSelected: _onJenisSuratChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilterBar() {
    return SuratSearchBar(
      controller: _searchController,
      hintText: 'Cari nomor surat, perihal, pengirim...',
      hasText: _keyword.isNotEmpty,
      onChanged: (value) {
        if (_keyword != value) {
          setState(() => _keyword = value);
        }
        _searchDebounce?.cancel();
        _searchDebounce = Timer(const Duration(milliseconds: 400), () {
          _loadData();
        });
      },
      onSubmitted: (value) {
        HapticHelper.lightImpact();
        _searchDebounce?.cancel();
        setState(() => _keyword = value);
        _loadData();
      },
      onClear: () {
        _searchDebounce?.cancel();
        setState(() => _keyword = '');
        _loadData();
      },
    );
  }

  Widget _buildTopTabs(Map<String, int> categoryCounts) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      color: Colors.transparent,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            SuratFilterChip(
              label: 'Semua Surat (${categoryCounts['total'] ?? 0})',
              selected: _selectedPengiriman == 'semua',
              onSelected: () => _onPengirimanChanged('semua'),
            ),
            const SizedBox(width: 8),
            SuratFilterChip(
              label: 'Internal (${categoryCounts['internal'] ?? 0})',
              selected: _selectedPengiriman == 'internal',
              onSelected: () => _onPengirimanChanged('internal'),
            ),
            const SizedBox(width: 8),
            SuratFilterChip(
              label: 'Eksternal (${categoryCounts['eksternal'] ?? 0})',
              selected: _selectedPengiriman == 'eksternal',
              onSelected: () => _onPengirimanChanged('eksternal'),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'baru':
      case 'draft':
      case 'masuk':
        return AppColors.primary;
      case 'dikirim':
      case 'disposisi':
      case 'didistribusikan':
        return Colors.indigo.shade600;
      case 'dibaca':
      case 'read':
        return Colors.teal.shade700;
      case 'proses':
      case 'diproses':
        return Colors.orange.shade700;
      case 'selesai':
      case 'arsip':
      case 'diarsipkan':
        return const Color(0xFF16A34A); // Green
      default:
        return Colors.blueGrey;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'baru':
      case 'draft':
      case 'masuk':
        return 'Baru';
      case 'dikirim':
      case 'disposisi':
      case 'didistribusikan':
        return 'Didistribusikan';
      case 'dibaca':
      case 'read':
        return 'Dibaca';
      case 'proses':
      case 'diproses':
        return 'Diproses';
      case 'selesai':
        return 'Selesai';
      case 'arsip':
      case 'diarsipkan':
        return 'Arsip';
      default:
        return status.toUpperCase();
    }
  }

  String _getJenisPengiriman(SuratModel surat) {
    final raw = (surat.jenisPengiriman ?? '').trim().toLowerCase();
    if (raw == 'internal' || raw == 'eksternal') return raw;
    return (surat.idSuratKeluar != null && surat.idSuratKeluar!.isNotEmpty)
        ? 'internal'
        : 'eksternal';
  }

  Map<String, int> _resolveCategoryCounts(
    List<SuratModel> rawList,
    Map<String, int>? serverSummary,
  ) {
    var internalLoaded = 0;
    var eksternalLoaded = 0;
    for (final item in rawList) {
      if (_getJenisPengiriman(item) == 'internal') {
        internalLoaded++;
      } else {
        eksternalLoaded++;
      }
    }
    final loadedCounts = {
      'total': rawList.length,
      'internal': internalLoaded,
      'eksternal': eksternalLoaded,
    };

    if (_selectedPengiriman == 'semua' && _keyword.trim().isEmpty) {
      _cachedCategoryCounts = loadedCounts;
    }

    if (serverSummary != null) {
      final serverTotal = serverSummary['total'] ?? 0;
      final internal = math.max(serverSummary['internal'] ?? 0, internalLoaded);
      var eksternal = math.max(serverSummary['eksternal'] ?? 0, eksternalLoaded);
      final categorizedTotal = internal + eksternal;
      if (serverTotal > categorizedTotal) {
        eksternal += serverTotal - categorizedTotal;
      }
      final total = math.max(serverTotal, internal + eksternal);
      return {
        'total': total,
        'internal': internal,
        'eksternal': eksternal,
      };
    }

    return _cachedCategoryCounts ?? loadedCounts;
  }

  List<SuratModel> _applyPengirimanAndKeywordFilters(List<SuratModel> list) {
    return list.where((surat) {
      // 1. Pengiriman filter
      if (_selectedPengiriman != 'semua') {
        if (_getJenisPengiriman(surat) != _selectedPengiriman) {
          return false;
        }
      }

      // 2. Keyword filter
      if (_keyword.trim().isNotEmpty) {
        final kw = _keyword.trim().toLowerCase();
        final text =
            '${surat.nomorSurat} ${surat.nomorAgenda ?? ''} ${surat.perihal} ${surat.asalSurat} ${surat.pengirim ?? ''} ${surat.penerima ?? ''} ${surat.jenisSurat ?? ''}'
                .toLowerCase();
        if (!text.contains(kw)) return false;
      }

      return true;
    }).toList();
  }

  List<SuratModel> _applyLocalFilters(List<SuratModel> list) {
    final baseList = _applyPengirimanAndKeywordFilters(list);
    if (_selectedJenisSurat == 'semua') return baseList;
    final targetJenis = _selectedJenisSurat.trim().toLowerCase();
    return baseList.where((surat) {
      return (surat.jenisSurat ?? '').trim().toLowerCase() == targetJenis;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(suratMasukListProvider);
    final serverSummary = ref.watch(suratMasukCategorySummaryProvider);
    final jenisOptions =
        ref.watch(jenisSuratOptionsProvider).valueOrNull ??
        const <Map<String, String>>[];
    final rawListForFilter = provider.valueOrNull ?? const <SuratModel>[];
    final categoryCounts = _resolveCategoryCounts(
      rawListForFilter,
      serverSummary,
    );
    final pengirimanAndKeywordList = _applyPengirimanAndKeywordFilters(
      rawListForFilter,
    );
    final jenisCounts = computeJenisSuratCounts(
      pengirimanAndKeywordList.map((s) => s.jenisSurat),
    );
    final fallbackJenisValues = pengirimanAndKeywordList
        .map((s) => s.jenisSurat ?? '')
        .where((v) => v.trim().isNotEmpty)
        .toList();

    final theme = Theme.of(context);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight;
    final bottomPadding = MediaQuery.of(context).padding.bottom + 100.0;

    const filterHeight = 160.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(title: 'Surat Masuk'),
      body: Stack(
        children: [
          // 1. Layer Scrollable (ListView) yang membentang dari puncak layar (y = 0) sehingga tembus di balik CustomAppBar
          Positioned.fill(
            child: NotificationListener<ScrollNotification>(
              onNotification: _onScrollNotification,
              child: RefreshIndicator(
                edgeOffset: topPadding + filterHeight,
                onRefresh: () async {
                  ref.invalidate(jenisSuratOptionsProvider);
                  _loadData();
                  HapticHelper.mediumImpact();
                },
                child: provider.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.fromLTRB(
                      16.0,
                      topPadding + filterHeight + 40,
                      16.0,
                      bottomPadding,
                    ),
                    child: EmptyStateView(
                      message: 'Gagal memuat surat masuk: $err',
                      icon: Icons.error_outline_rounded,
                    ),
                  ),
                  data: (rawList) {
                    final filteredList = _applyLocalFilters(rawList);

                    if (filteredList.isEmpty) {
                      return SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: EdgeInsets.fromLTRB(
                          16.0,
                          topPadding + filterHeight + 40,
                          16.0,
                          bottomPadding,
                        ),
                        child: EmptyStateView(
                          message:
                              _selectedPengiriman == 'semua' &&
                                  _selectedJenisSurat == 'semua' &&
                                  _keyword.isEmpty
                              ? 'Belum ada surat masuk.'
                              : 'Tidak ada surat masuk yang sesuai filter.',
                          icon: Icons.inbox_outlined,
                          onRetry: () {
                            HapticHelper.lightImpact();
                            setState(() {
                              _selectedPengiriman = 'semua';
                              _selectedJenisSurat = 'semua';
                              _keyword = '';
                              _searchController.clear();
                            });
                            _loadData();
                          },
                        ),
                      );
                    }

                    return ListView.builder(
                      padding: EdgeInsets.fromLTRB(
                        16.0,
                        topPadding + filterHeight + 16.0,
                        16.0,
                        bottomPadding,
                      ),
                      itemCount: filteredList.length,
                      itemBuilder: (context, index) {
                        final surat = filteredList[index];
                        final statusColor = _getStatusColor(surat.status);
                        final hasAttachment =
                            surat.activeFilePath != null &&
                            surat.activeFilePath!.isNotEmpty;

                        return CustomCard(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          onTap: () {
                            context.push(
                              '/surat-masuk/${surat.id}',
                              extra: {'actionType': 'surat_masuk'},
                            );
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      surat.perihal,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: ShapeDecoration(
                                      color: statusColor.withValues(
                                        alpha: 0.12,
                                      ),
                                      shape: StadiumBorder(
                                        side: BorderSide(
                                          color: statusColor.withValues(
                                            alpha: 0.4,
                                          ),
                                        ),
                                      ),
                                    ),
                                    child: Text(
                                      _formatStatusLabel(surat.status),
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: statusColor,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 20),
                              Text(
                                'Nomor: ${surat.nomorSurat}',
                                style: const TextStyle(fontSize: 13),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Pengirim: ${surat.asalSurat}',
                                style: const TextStyle(fontSize: 13),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    DateFormat(
                                      'dd MMMM yyyy',
                                    ).format(surat.tanggalDiterima),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  if (hasAttachment)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: ShapeDecoration(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .primaryContainer
                                            .withValues(alpha: 0.5),
                                        shape: const StadiumBorder(),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.attach_file_rounded,
                                            size: 12,
                                            color: Theme.of(
                                              context,
                                            ).colorScheme.primary,
                                          ),
                                          const SizedBox(width: 2),
                                          Text(
                                            'Dokumen',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: Theme.of(
                                                context,
                                              ).colorScheme.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ),
          // 2. Layer Filter Section yang menempel tepat di bawah CustomAppBar (top: topPadding)
          Positioned(
            top: topPadding,
            left: 0,
            right: 0,
            child: ClipRect(
              child: FadeTransition(
                opacity: _filterOpacity,
                child: SizeTransition(
                  sizeFactor: _filterSizeFactor,
                  fixedCrossAxisSizeFactor: 1.0,
                  child: _buildFilterSection(
                    theme,
                    categoryCounts: categoryCounts,
                    jenisOptions: jenisOptions,
                    jenisCounts: jenisCounts,
                    fallbackJenisValues: fallbackJenisValues,
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
