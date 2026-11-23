import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/haptic_helper.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';
import '../widgets/surat_filter_widgets.dart';

class DisposisiScreen extends ConsumerStatefulWidget {
  const DisposisiScreen({super.key});

  @override
  ConsumerState<DisposisiScreen> createState() => _DisposisiScreenState();
}

class _DisposisiScreenState extends ConsumerState<DisposisiScreen>
    with SingleTickerProviderStateMixin {
  // Filter Pengiriman (Sesuai Web frontend/src/pages/(app)/disposisi/page.jsx: 'semua', 'internal', 'eksternal')
  String _selectedPengiriman = 'semua';

  // Filter Jenis Surat (Sesuai Web JenisSuratTabs.jsx)
  String _selectedJenisSurat = 'semua';
  Map<String, int>? _cachedCategoryCounts;

  // Search keyword (nomor_surat, pengirim, penerima, instruksi)
  String _keyword = '';
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;

  // Auto-hide filtering saat scroll — menggunakan AnimationController
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
      value: 1.0,
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
        .read(disposisiListProvider.notifier)
        .fetchDisposisi(
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

    if (notification.metrics.pixels <= 10) {
      _showFilter();
      return false;
    }

    if (notification is ScrollUpdateNotification) {
      final delta = notification.scrollDelta ?? 0.0;
      if (delta > 2.0 && notification.metrics.pixels > 20) {
        _hideFilter();
      } else if (delta < -2.0) {
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

  String _getJenisPengiriman(Map<String, dynamic> item) {
    final surat = item['surat_masuk'] is Map
        ? item['surat_masuk'] as Map<String, dynamic>
        : (item['suratMasuk'] is Map
              ? item['suratMasuk'] as Map<String, dynamic>
              : item);
    final type = (surat['jenis_pengiriman'] ?? item['jenis_pengiriman'] ?? '')
        .toString()
        .trim()
        .toLowerCase();
    if (type == 'internal' || type == 'eksternal') return type;
    return (surat['id_surat_keluar'] != null || item['id_surat_keluar'] != null)
        ? 'internal'
        : 'eksternal';
  }

  String _getJenisSurat(Map<String, dynamic> item) {
    final surat = item['surat_masuk'] is Map
        ? item['surat_masuk'] as Map<String, dynamic>
        : (item['suratMasuk'] is Map
              ? item['suratMasuk'] as Map<String, dynamic>
              : null);
    return (surat?['jenis'] ??
            surat?['jenis_surat'] ??
            item['jenis'] ??
            item['jenis_surat'] ??
            '')
        .toString()
        .trim();
  }

  Map<String, int> _resolveCategoryCounts(
    List<Map<String, dynamic>> rawList,
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

  List<Map<String, dynamic>> _applyPengirimanAndKeywordFilters(
    List<Map<String, dynamic>> list,
  ) {
    return list.where((item) {
      if (_selectedPengiriman != 'semua') {
        if (_getJenisPengiriman(item) != _selectedPengiriman) return false;
      }

      if (_keyword.trim().isNotEmpty) {
        final query = _keyword.trim().toLowerCase();
        final surat = item['surat_masuk'] is Map
            ? item['surat_masuk'] as Map<String, dynamic>
            : null;
        final nomor = (surat?['nomor_surat'] ?? item['nomor_surat'] ?? '')
            .toString()
            .toLowerCase();
        final perihal = (surat?['perihal'] ?? item['perihal'] ?? '')
            .toString()
            .toLowerCase();
        final instruksi = (item['instruksi'] ?? '').toString().toLowerCase();
        final pengirim =
            (surat?['asal_surat'] ??
                    item['asal_surat'] ??
                    item['pengirim'] ??
                    item['nama_pemberi'] ??
                    '')
                .toString()
                .toLowerCase();
        final penerima =
            (item['penerima'] is Map
                    ? (item['penerima']['name'] ??
                          item['penerima']['nama'] ??
                          '')
                    : (item['nama_penerima'] ?? ''))
                .toString()
                .toLowerCase();
        final jenis = _getJenisSurat(item).toLowerCase();

        final match =
            nomor.contains(query) ||
            perihal.contains(query) ||
            instruksi.contains(query) ||
            pengirim.contains(query) ||
            penerima.contains(query) ||
            jenis.contains(query);
        if (!match) return false;
      }

      return true;
    }).toList();
  }

  List<Map<String, dynamic>> _applyLocalFilters(
    List<Map<String, dynamic>> list,
  ) {
    final baseList = _applyPengirimanAndKeywordFilters(list);
    if (_selectedJenisSurat == 'semua') return baseList;
    final targetJenis = _selectedJenisSurat.trim().toLowerCase();
    return baseList
        .where((item) => _getJenisSurat(item).toLowerCase() == targetJenis)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(disposisiListProvider);
    final serverSummary = ref.watch(disposisiCategorySummaryProvider);
    final jenisOptions =
        ref.watch(jenisSuratOptionsProvider).valueOrNull ??
        const <Map<String, String>>[];
    final rawListForFilter =
        provider.valueOrNull ?? const <Map<String, dynamic>>[];
    final categoryCounts = _resolveCategoryCounts(
      rawListForFilter,
      serverSummary,
    );
    final pengirimanAndKeywordList = _applyPengirimanAndKeywordFilters(
      rawListForFilter,
    );
    final jenisCounts = computeJenisSuratCounts(
      pengirimanAndKeywordList.map(_getJenisSurat),
    );
    final fallbackJenisValues = pengirimanAndKeywordList
        .map(_getJenisSurat)
        .where((v) => v.isNotEmpty)
        .toList();

    final theme = Theme.of(context);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight;
    final bottomPadding = MediaQuery.of(context).padding.bottom + 100.0;
    const filterHeight = 160.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(title: 'Daftar Disposisi'),
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
                      message: 'Gagal memuat disposisi: $err',
                      icon: Icons.error_outline_rounded,
                    ),
                  ),
                  data: (list) {
                    // Local filtering as fallback for optimal UX
                    final filteredList = _applyLocalFilters(list);

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
                              _keyword.isNotEmpty ||
                                  _selectedPengiriman != 'semua' ||
                                  _selectedJenisSurat != 'semua'
                              ? 'Tidak ada disposisi yang sesuai kriteria filter.'
                              : 'Belum ada disposisi untuk Anda.',
                          icon: Icons.assignment_turned_in_outlined,
                          onRetry:
                              _keyword.isNotEmpty ||
                                  _selectedPengiriman != 'semua' ||
                                  _selectedJenisSurat != 'semua'
                              ? () {
                                  HapticHelper.lightImpact();
                                  setState(() {
                                    _selectedPengiriman = 'semua';
                                    _selectedJenisSurat = 'semua';
                                    _keyword = '';
                                    _searchController.clear();
                                  });
                                  _loadData();
                                }
                              : null,
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
                        final item = filteredList[index];
                        return _buildDisposisiCard(context, item);
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

  Widget _buildSearchAndFilterBar() {
    return SuratSearchBar(
      controller: _searchController,
      hintText: 'Cari nomor, perihal, pengirim, instruksi...',
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
      color: Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            SuratFilterChip(
              label: 'Semua Disposisi (${categoryCounts['total'] ?? 0})',
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

  Widget _buildDisposisiCard(BuildContext context, Map<String, dynamic> item) {
    final surat = item['surat_masuk'] is Map
        ? item['surat_masuk'] as Map<String, dynamic>
        : null;
    final perihal = surat?['perihal'] ?? item['perihal'] ?? 'Surat Masuk';
    final nomorSurat = surat?['nomor_surat'] ?? item['nomor_surat'] ?? '-';
    final instruksi = item['instruksi'] ?? '-';
    final status = (item['status'] ?? 'baru').toString().toLowerCase();
    final isSelesai = status == 'selesai' || status == 'done';
    final isDibatalkan = status == 'dibatalkan' || status == 'batal';
    final idDisposisi =
        (item['id_surat_disposisi'] ?? item['id'])?.toString() ?? '';
    final idSuratMasuk =
        (item['id_surat_masuk'] ?? surat?['id'] ?? surat?['id_surat_masuk'])
            ?.toString() ??
        '';
    final pemberi = item['pemberi'] is Map
        ? (item['pemberi']['name'] ?? item['pemberi']['nama'])
        : item['nama_pemberi'];
    final tglDisposisi = item['tanggal_disposisi'] ?? item['created_at'];
    final jenisPengiriman = _getJenisPengiriman(item);

    Color statusColor;
    String statusLabel = 'Baru';

    switch (status) {
      case 'selesai':
      case 'done':
        statusColor = const Color(0xFF16A34A); // Green sama seperti surat masuk
        statusLabel = 'Selesai';
        break;
      case 'diproses':
      case 'proses':
        statusColor = Colors.orange.shade700; // Orange sama seperti surat masuk
        statusLabel = 'Diproses';
        break;
      case 'dibatalkan':
      case 'batal':
        statusColor = Colors.red.shade600;
        statusLabel = 'Dibatalkan';
        break;
      default:
        statusColor = AppColors.primary; // Primary sama seperti surat masuk
        statusLabel = 'Baru';
    }

    String formattedDate = '-';
    if (tglDisposisi != null) {
      try {
        final dt = DateTime.parse(tglDisposisi.toString());
        formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(dt);
      } catch (_) {
        formattedDate = tglDisposisi.toString();
      }
    }

    final targetId = idDisposisi.isNotEmpty ? idDisposisi : idSuratMasuk;

    return CustomCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      onTap: () {
        if (targetId.isNotEmpty) {
          context.push(
            '/surat-masuk/$targetId',
            extra: {
              'actionType': 'disposisi',
              'idDisposisi': idDisposisi,
              'idSuratMasuk': idSuratMasuk,
            },
          );
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Builder(
                          builder: (context) {
                            final isInternal = jenisPengiriman == 'internal';
                            final badgeColor = isInternal
                                ? Colors.indigo
                                : Colors.teal;
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: ShapeDecoration(
                                color: badgeColor.withValues(alpha: 0.12),
                                shape: const StadiumBorder(),
                              ),
                              child: Text(
                                jenisPengiriman.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isInternal
                                      ? Colors.indigo.shade400
                                      : Colors.teal.shade400,
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            nomorSurat,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      perihal,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: ShapeDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  shape: StadiumBorder(
                    side: BorderSide(color: statusColor.withValues(alpha: 0.4)),
                  ),
                ),
                child: Text(
                  statusLabel,
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
            'Instruksi: $instruksi',
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                pemberi != null ? 'Dari: $pemberi' : formattedDate,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
              if (!isSelesai && !isDibatalkan)
                TextButton.icon(
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    foregroundColor: AppColors.primary,
                  ),
                  onPressed: () => _showCompleteModal(
                    context,
                    idDisposisi,
                    perihal,
                    idSuratMasuk: idSuratMasuk,
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text(
                    'Selesaikan',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _showCompleteModal(
    BuildContext context,
    String idDisposisi,
    String perihal, {
    String? idSuratMasuk,
  }) {
    if (idDisposisi.isEmpty) return;
    final catatanController = TextEditingController();
    PlatformFile? selectedFile;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (modalContext) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final mediaQuery = MediaQuery.of(ctx);
          final safeBottom = math.max(
            mediaQuery.viewInsets.bottom,
            math.max(mediaQuery.padding.bottom, mediaQuery.viewPadding.bottom),
          );
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, safeBottom + 24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Selesaikan Disposisi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  perihal,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: catatanController,
                  decoration: const InputDecoration(
                    labelText: 'Catatan / Laporan Tindak Lanjut *',
                    hintText:
                        'Tuliskan tindakan atau penyelesaian disposisi...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 14),
                // Lampiran Bukti
                InkWell(
                  onTap: isSubmitting
                      ? null
                      : () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setModalState(() {
                              selectedFile = result.files.first;
                            });
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey.shade50,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selectedFile != null
                              ? Icons.attach_file
                              : Icons.upload_file,
                          color: selectedFile != null
                              ? AppColors.primary
                              : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile != null
                                ? selectedFile!.name
                                : 'Lampirkan Bukti (PDF/Gambar - Opsional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: selectedFile != null
                                  ? Colors.black87
                                  : Colors.grey.shade600,
                              fontWeight: selectedFile != null
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedFile != null)
                          IconButton(
                            icon: const Icon(
                              Icons.cancel,
                              size: 18,
                              color: Colors.red,
                            ),
                            onPressed: () =>
                                setModalState(() => selectedFile = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: const StadiumBorder(),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final catatan = catatanController.text.trim();
                            if (catatan.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Catatan penyelesaian wajib diisi.',
                                  ),
                                ),
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);
                            try {
                              String? fileBuktiPath;
                              if (selectedFile != null &&
                                  selectedFile!.path != null) {
                                final uploadResp = await ref
                                    .read(suratRepositoryProvider)
                                    .uploadAttachment(
                                      idDisposisi,
                                      selectedFile!.path!,
                                    );
                                fileBuktiPath = uploadResp['file_bukti_path']
                                    ?.toString();
                              }

                              await ref
                                  .read(suratRepositoryProvider)
                                  .completeDisposisi(
                                    idDisposisi,
                                    catatan: catatan,
                                    fileBuktiPath: fileBuktiPath,
                                    idSuratMasuk: idSuratMasuk,
                                    asalNilai: 'layar /disposisi',
                                  );

                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Disposisi berhasil diselesaikan.',
                                    ),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                ref
                                    .read(disposisiListProvider.notifier)
                                    .fetchDisposisi();
                                ref.read(myActionsProvider.notifier).refresh();
                                ref
                                    .read(pimpinanDashboardProvider.notifier)
                                    .refresh();
                              }
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Gagal menyelesaikan disposisi: $e',
                                    ),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Selesaikan Disposisi',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
