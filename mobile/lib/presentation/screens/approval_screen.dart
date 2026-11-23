import 'package:dio/dio.dart';
import 'package:e_office_mobile/core/constants/app_colors.dart';
import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../data/models/surat_model.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';
import '../widgets/approval_receipt_modal.dart';
import '../widgets/surat_filter_widgets.dart';

class ApprovalScreen extends ConsumerStatefulWidget {
  final String? highlightId;

  const ApprovalScreen({super.key, this.highlightId});

  @override
  ConsumerState<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends ConsumerState<ApprovalScreen>
    with SingleTickerProviderStateMixin {
  final ScrollController _scrollController = ScrollController();
  String? _lastScrolledHighlightId;
  bool _filterAutoSwitchedForHighlight =
      false; // guard: auto-switch filter hanya sekali
  String _selectedFilter =
      'menunggu'; // 'menunggu', 'disetujui', 'ditolak', 'semua'
  String _keyword = '';
  final TextEditingController _searchController = TextEditingController();

  // Auto-hide filtering saat scroll — menggunakan AnimationController
  late final AnimationController _filterAnimController;
  late final Animation<double> _filterSizeFactor;
  late final Animation<double> _filterOpacity;
  bool _isFilterVisible = true;

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
      ref.read(approvalListProvider.notifier).fetchApprovalList();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _filterAnimController.dispose();
    super.dispose();
  }

  void _scrollToHighlightIfNeeded(List<SuratModel> items) {
    final highlightId = widget.highlightId;
    if (highlightId == null ||
        highlightId.isEmpty ||
        highlightId == _lastScrolledHighlightId) {
      return;
    }
    final index = items.indexWhere(
      (it) =>
          it.id == highlightId ||
          it.idSuratKeluar == highlightId ||
          it.idSuratApproval == highlightId,
    );
    if (index >= 0) {
      _lastScrolledHighlightId = highlightId;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scrollController.hasClients) return;
        final targetOffset = (index * 220.0).clamp(
          0.0,
          _scrollController.position.maxScrollExtent,
        );
        if (targetOffset > 0) {
          _scrollController.animateTo(
            targetOffset,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOutCubic,
          );
        }
      });
    }
  }

  void _showApproveConfirm(SuratModel surat) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text(
          'Apakah Anda yakin ingin menyetujui surat keluar:\n\n'
          'Nomor: ${surat.nomorSurat}\n'
          'Perihal: ${surat.perihal}',
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticHelper.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticHelper.mediumImpact();
              Navigator.pop(ctx);
              final targetId = surat.idSuratKeluar ?? surat.id;
              try {
                await ref
                    .read(approvalListProvider.notifier)
                    .approveSurat(
                      targetId,
                      idSuratApproval: surat.idSuratApproval,
                    );
                if (!mounted) return;
                final user = ref.read(authProvider).value;
                final approverName = user?.nama ?? 'Pimpinan';

                // Tampilkan modal Tanda Terima Approval QR sesuai tampilan frontend
                ApprovalReceiptModal.show(
                  context,
                  surat: surat,
                  approverName: approverName,
                  approvalTime: DateTime.now(),
                );
              } catch (e) {
                // Jika terjadi receiveTimeout, backend mungkin sudah selesai commit transaksi
                bool wasActuallyApproved = false;
                if (e is DioException &&
                    e.type == DioExceptionType.receiveTimeout) {
                  try {
                    await ref
                        .read(approvalListProvider.notifier)
                        .fetchApprovalList();
                    final remaining =
                        ref.read(approvalListProvider).value ?? [];
                    if (!remaining.any(
                      (it) =>
                          it.id == targetId ||
                          it.idSuratApproval == surat.idSuratApproval,
                    )) {
                      wasActuallyApproved = true;
                    }
                  } catch (_) {}
                }

                if (!mounted) return;
                if (wasActuallyApproved) {
                  final user = ref.read(authProvider).value;
                  final approverName = user?.nama ?? 'Pimpinan';
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: approverName,
                    approvalTime: DateTime.now(),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menyetujui surat: $e')),
                  );
                }
              }
            },
            child: const Text('Setujui'),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog(SuratModel surat) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nomor: ${surat.nomorSurat}'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Catatan Revisi *',
                hintText: 'Tuliskan alasan penolakan / revisi...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticHelper.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final reason = controller.text.trim();
              if (reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Catatan revisi wajib diisi.')),
                );
                return;
              }
              HapticHelper.mediumImpact();
              Navigator.pop(ctx);
              final targetId = surat.idSuratKeluar ?? surat.id;
              try {
                await ref
                    .read(approvalListProvider.notifier)
                    .rejectSurat(
                      targetId,
                      reason,
                      idSuratApproval: surat.idSuratApproval,
                    );
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Surat berhasil ditolak.')),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Gagal menolak surat: $e')),
                );
              }
            },
            child: const Text('Tolak'),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return const Color(0xFF16A34A); // Green
      case 'review':
        return Colors.purple;
      case 'waiting':
      case 'pending':
        return Colors.orange.shade700;
      case 'rejected':
        return Colors.red.shade700;
      default:
        return Colors.blueGrey;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Disetujui';
      case 'review':
        return 'Sedang Direview';
      case 'waiting':
        return 'Menunggu Persetujuan';
      case 'pending':
        return 'Antrian Persetujuan';
      case 'rejected':
        return 'Ditolak';
      default:
        return status.toUpperCase();
    }
  }

  List<SuratModel> _getFilteredList(List<SuratModel> items) {
    List<SuratModel> filtered;
    if (_selectedFilter == 'semua') {
      filtered = items;
    } else if (_selectedFilter == 'menunggu') {
      filtered = items.where((it) {
        final s = it.status.toLowerCase();
        return s == 'pending' || s == 'waiting' || s == 'review' || s == 'baru';
      }).toList();
    } else if (_selectedFilter == 'disetujui') {
      filtered = items
          .where((it) => it.status.toLowerCase() == 'approved')
          .toList();
    } else if (_selectedFilter == 'ditolak') {
      filtered = items
          .where((it) => it.status.toLowerCase() == 'rejected')
          .toList();
    } else {
      filtered = items;
    }

    if (_keyword.trim().isNotEmpty) {
      final kw = _keyword.trim().toLowerCase();
      filtered = filtered.where((it) {
        final text =
            '${it.nomorSurat} ${it.perihal} ${it.pemohon ?? ''} ${it.asalSurat} ${it.pengirim ?? ''} ${it.jenisSurat ?? ''}'
                .toLowerCase();
        return text.contains(kw);
      }).toList();
    }

    return filtered;
  }

  Widget _buildFilterSection(ThemeData theme) {
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
          SuratSearchBar(
            controller: _searchController,
            hintText: 'Cari nomor surat, perihal, pengaju...',
            hasText: _keyword.isNotEmpty,
            onChanged: (value) {
              if (_keyword != value) {
                setState(() => _keyword = value);
              }
            },
            onSubmitted: (value) {
              HapticHelper.lightImpact();
              setState(() => _keyword = value);
            },
            onClear: () {
              setState(() => _keyword = '');
            },
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 2, 16, 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Menunggu', 'menunggu'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Disetujui', 'disetujui'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Ditolak', 'ditolak'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Semua', 'semua'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    return SuratFilterChip(
      label: label,
      selected: _selectedFilter == value,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      onSelected: () {
        HapticHelper.lightImpact();
        setState(() => _selectedFilter = value);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(approvalListProvider);
    final theme = Theme.of(context);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight;
    final bottomPadding = MediaQuery.of(context).padding.bottom + 100.0;
    const filterHeight = 114.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(title: 'Antrian Persetujuan'),
      body: Stack(
        children: [
          // 1. Layer Scrollable (ListView) yang membentang dari puncak layar (y = 0) sehingga tembus di balik CustomAppBar
          Positioned.fill(
            child: NotificationListener<ScrollNotification>(
              onNotification: _onScrollNotification,
              child: RefreshIndicator(
                edgeOffset: topPadding + filterHeight,
                onRefresh: () async =>
                    ref.read(approvalListProvider.notifier).fetchApprovalList(),
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
                      message: 'Gagal memuat antrian: $err',
                      icon: Icons.info_outline_rounded,
                    ),
                  ),
                  data: (queueList) {
                    // Auto-switch filter ke 'semua' hanya SEKALI saat pertama data tiba
                    // agar surat dari notifikasi (highlightId) terlihat — tidak diulangi tiap rebuild
                    // sehingga user tetap bisa mengganti filter secara bebas sesudahnya.
                    if (!_filterAutoSwitchedForHighlight &&
                        widget.highlightId != null &&
                        queueList.any(
                          (it) =>
                              it.id == widget.highlightId ||
                              it.idSuratKeluar == widget.highlightId,
                        ) &&
                        !_getFilteredList(queueList).any(
                          (it) =>
                              it.id == widget.highlightId ||
                              it.idSuratKeluar == widget.highlightId,
                        )) {
                      _filterAutoSwitchedForHighlight = true;
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) setState(() => _selectedFilter = 'semua');
                      });
                    }

                    final approvalTasks = _getFilteredList(queueList);
                    _scrollToHighlightIfNeeded(approvalTasks);

                    if (approvalTasks.isEmpty) {
                      return SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: EdgeInsets.fromLTRB(
                          16.0,
                          topPadding + filterHeight + 40,
                          16.0,
                          bottomPadding,
                        ),
                        child: EmptyStateView(
                          message: _keyword.trim().isNotEmpty
                              ? 'Tidak ada surat persetujuan yang sesuai pencarian.'
                              : _selectedFilter == 'menunggu'
                              ? 'Tidak ada surat yang menunggu persetujuan.'
                              : _selectedFilter == 'disetujui'
                              ? 'Belum ada surat yang disetujui.'
                              : _selectedFilter == 'ditolak'
                              ? 'Tidak ada surat yang ditolak.'
                              : 'Belum ada data approval.',
                          icon: Icons.check_circle_outline_rounded,
                          onRetry: _keyword.trim().isNotEmpty
                              ? () {
                                  HapticHelper.lightImpact();
                                  _searchController.clear();
                                  setState(() => _keyword = '');
                                }
                              : null,
                        ),
                      );
                    }

                    return ListView.builder(
                      controller: _scrollController,
                      padding: EdgeInsets.fromLTRB(
                        16.0,
                        topPadding + filterHeight + 16.0,
                        16.0,
                        bottomPadding,
                      ),
                      itemCount: approvalTasks.length,
                      itemBuilder: (context, index) {
                        final item = approvalTasks[index];
                        final status = item.status.toLowerCase();
                        final isApproved = status == 'approved';
                        final statusColor = _getStatusColor(status);
                        final isHighlighted =
                            widget.highlightId != null &&
                            (item.id == widget.highlightId ||
                                item.idSuratKeluar == widget.highlightId ||
                                item.idSuratApproval == widget.highlightId);

                        return _BlinkingHighlightCard(
                          key: ValueKey('highlight_${item.id}'),
                          isHighlighted: isHighlighted,
                          margin: const EdgeInsets.only(bottom: 16),
                          borderRadius: 20.0,
                          child: CustomCard(
                            margin: EdgeInsets.zero,
                            padding: const EdgeInsets.all(16),
                            onTap: () {
                              final targetId = item.idSuratKeluar ?? item.id;
                              context.push(
                                '/surat-masuk/$targetId',
                                extra: {
                                  'actionType': 'approval',
                                  'idSuratApproval': item.idSuratApproval,
                                },
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
                                        item.perihal,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
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
                                        _formatStatusLabel(status),
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: statusColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 24),
                                Text(
                                  'Nomor: ${item.nomorSurat}',
                                  style: const TextStyle(fontSize: 13),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Pengaju: ${item.pemohon ?? item.asalSurat}',
                                  style: const TextStyle(fontSize: 13),
                                ),
                                if (item.tanggalSurat != null) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    'Tanggal: ${DateFormat('dd MMMM yyyy').format(item.tanggalSurat!)}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    if (isApproved)
                                      ElevatedButton.icon(
                                        onPressed: () {
                                          final user = ref
                                              .read(authProvider)
                                              .value;
                                          ApprovalReceiptModal.show(
                                            context,
                                            surat: item,
                                            approverName:
                                                user?.nama ?? 'Pimpinan',
                                            approvalTime: item.tanggalDiterima,
                                          );
                                        },
                                        icon: const Icon(
                                          Icons.qr_code_2_rounded,
                                          size: 18,
                                        ),
                                        label: const Text('Tanda Terima QR'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primary,
                                          foregroundColor: Colors.white,
                                        ),
                                      )
                                    else if (status != 'rejected') ...[
                                      OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: Theme.of(
                                            context,
                                          ).colorScheme.error,
                                          side: BorderSide(
                                            color: Theme.of(
                                              context,
                                            ).colorScheme.error,
                                          ),
                                        ),
                                        onPressed: () =>
                                            _showRejectDialog(item),
                                        icon: const Icon(
                                          Icons.close_rounded,
                                          size: 18,
                                        ),
                                        label: const Text('Tolak'),
                                      ),
                                      const SizedBox(width: 8),
                                      ElevatedButton.icon(
                                        onPressed: () =>
                                            _showApproveConfirm(item),
                                        icon: const Icon(
                                          Icons.check_rounded,
                                          size: 18,
                                        ),
                                        label: const Text('Setujui'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(
                                            0xFF22A06B,
                                          ),
                                          foregroundColor: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
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
                  child: _buildFilterSection(theme),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget untuk animasi kedipan 2 kali pada kartu surat yang dipilih
class _BlinkingHighlightCard extends StatefulWidget {
  final bool isHighlighted;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final Widget child;

  const _BlinkingHighlightCard({
    super.key,
    required this.isHighlighted,
    this.margin,
    this.borderRadius = 20.0,
    required this.child,
  });

  @override
  State<_BlinkingHighlightCard> createState() => _BlinkingHighlightCardState();
}

class _BlinkingHighlightCardState extends State<_BlinkingHighlightCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _animation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).chain(CurveTween(curve: Curves.easeIn)),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.0,
          end: 0.2,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 0.2,
          end: 1.0,
        ).chain(CurveTween(curve: Curves.easeIn)),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.0,
          end: 0.0,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 40,
      ),
    ]).animate(_controller);

    if (widget.isHighlighted) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(covariant _BlinkingHighlightCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isHighlighted && !oldWidget.isHighlighted) {
      _controller.reset();
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isHighlighted) {
      return Padding(
        padding: widget.margin ?? EdgeInsets.zero,
        child: widget.child,
      );
    }

    // Ganti animasi BoxShadow (blurRadius & spreadRadius dinamis) dengan
    // FadeTransition + DecoratedBox shadow nilai tetap.
    // BoxShadow dengan nilai berubah per-frame memaksa GPU re-rasterize shadow
    // setiap tick — sangat boros pada layar 120 fps.
    return Padding(
      padding: widget.margin ?? EdgeInsets.zero,
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          final colorScheme = Theme.of(context).colorScheme;
          final highlightColor = colorScheme.primary;
          final t = _animation.value;

          return DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(widget.borderRadius),
              // Shadow nilai tetap, hanya opacity yang dianimasikan
              boxShadow: [
                BoxShadow(
                  color: highlightColor.withValues(alpha: 0.40 * t),
                  blurRadius: 16,
                  spreadRadius: 3,
                ),
              ],
            ),
            child: widget.child,
          );
        },
      ),
    );
  }
}
