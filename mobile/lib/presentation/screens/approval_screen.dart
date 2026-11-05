import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';
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

class ApprovalScreen extends ConsumerStatefulWidget {
  final String? highlightId;

  const ApprovalScreen({
    super.key,
    this.highlightId,
  });

  @override
  ConsumerState<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends ConsumerState<ApprovalScreen> {
  final ScrollController _scrollController = ScrollController();
  String? _lastScrolledHighlightId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myActionsProvider.notifier).fetchMyActions();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToHighlightIfNeeded(List<SuratModel> items) {
    final highlightId = widget.highlightId;
    if (highlightId == null || highlightId.isEmpty || highlightId == _lastScrolledHighlightId) return;
    final index = items.indexWhere((it) => it.id == highlightId);
    if (index >= 0) {
      _lastScrolledHighlightId = highlightId;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scrollController.hasClients) return;
        final targetOffset = (index * 220.0).clamp(0.0, _scrollController.position.maxScrollExtent);
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

  void _showApproveConfirm(BuildContext context, SuratModel surat) {
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
              backgroundColor: const Color(0xFF138A98),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticHelper.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(myActionsProvider.notifier).approveSurat(surat.id);
                if (context.mounted) {
                  final user = ref.read(authProvider).value;
                  final approverName = user?.nama ?? 'Pimpinan';

                  // Langsung tampilkan modal Tanda Terima Approval QR sesuai tampilan frontend
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: approverName,
                    approvalTime: DateTime.now(),
                  );
                }
              } catch (e) {
                if (context.mounted) {
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

  void _showRejectDialog(BuildContext context, SuratModel surat) {
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
              try {
                await ref.read(myActionsProvider.notifier).rejectSurat(surat.id, reason);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Surat berhasil ditolak.')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menolak surat: $e')),
                  );
                }
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
      default:
        return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(myActionsProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(title: 'Antrian Persetujuan'),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async => ref.read(myActionsProvider.notifier).fetchMyActions(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat antrian: $err',
            icon: Icons.info_outline_rounded,
          ),
          data: (queueList) {
            final approvalTasks = queueList.where((item) => item.actionType == 'approval').toList();
            _scrollToHighlightIfNeeded(approvalTasks);

            if (approvalTasks.isEmpty) {
              return const EmptyStateView(
                message: 'Tidak ada surat yang menunggu persetujuan.',
                icon: Icons.check_circle_outline_rounded,
              );
            }

            return ListView.builder(
              controller: _scrollController,
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
              itemCount: approvalTasks.length,
              itemBuilder: (context, index) {
                final item = approvalTasks[index];
                final status = item.status.toLowerCase();
                final isApproved = status == 'approved';
                final statusColor = _getStatusColor(status);
                final isHighlighted = widget.highlightId != null && item.id == widget.highlightId;

                return _BlinkingHighlightCard(
                  key: ValueKey('highlight_${item.id}'),
                  isHighlighted: isHighlighted,
                  margin: const EdgeInsets.only(bottom: 16),
                  borderRadius: 20.0,
                  child: CustomCard(
                    margin: EdgeInsets.zero,
                    padding: const EdgeInsets.all(16),
                    onTap: () {
                      context.push('/surat-masuk/${item.id}', extra: {'actionType': 'approval'});
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
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: statusColor.withValues(alpha: 0.4)),
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
                      Row(
                        children: [
                          const Icon(Icons.tag_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Nomor: ${item.nomorSurat}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.person_outline_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Pengaju: ${item.pemohon ?? '-'}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      if (item.tanggalSurat != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 15, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text(
                              'Tanggal: ${DateFormat('dd MMMM yyyy').format(item.tanggalSurat!)}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (isApproved)
                            ElevatedButton.icon(
                              onPressed: () {
                                final user = ref.read(authProvider).value;
                                ApprovalReceiptModal.show(
                                  context,
                                  surat: item,
                                  approverName: user?.nama ?? 'Pimpinan',
                                  approvalTime: item.tanggalDiterima,
                                );
                              },
                              icon: const Icon(Icons.qr_code_2_rounded, size: 18),
                              label: const Text('Tanda Terima QR'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF138A98),
                                foregroundColor: Colors.white,
                              ),
                            )
                          else ...[
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Theme.of(context).colorScheme.error,
                                side: BorderSide(color: Theme.of(context).colorScheme.error),
                              ),
                              onPressed: () => _showRejectDialog(context, item),
                              icon: const Icon(Icons.close_rounded, size: 18),
                              label: const Text('Tolak'),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              onPressed: () => _showApproveConfirm(context, item),
                              icon: const Icon(Icons.check_rounded, size: 18),
                              label: const Text('Setujui'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF22A06B), // Green as in React frontend
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

class _BlinkingHighlightCardState extends State<_BlinkingHighlightCard> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    // 2 kedipan (pulse 2 kali: 0 -> 1 -> 0 -> 1 -> 0)
    _animation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0).chain(CurveTween(curve: Curves.easeOutQuad)),
        weight: 25,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0).chain(CurveTween(curve: Curves.easeInQuad)),
        weight: 25,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0).chain(CurveTween(curve: Curves.easeOutQuad)),
        weight: 25,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0).chain(CurveTween(curve: Curves.easeInQuad)),
        weight: 25,
      ),
    ]).animate(_controller);

    if (widget.isHighlighted) {
      Future.delayed(const Duration(milliseconds: 350), () {
        if (mounted) {
          _controller.forward();
        }
      });
    }
  }

  @override
  void didUpdateWidget(covariant _BlinkingHighlightCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isHighlighted && !oldWidget.isHighlighted) {
      _controller.forward(from: 0.0);
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
      if (widget.margin != null) {
        return Padding(padding: widget.margin!, child: widget.child);
      }
      return widget.child;
    }

    return Padding(
      padding: widget.margin ?? EdgeInsets.zero,
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          final v = _animation.value;
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(widget.borderRadius),
              border: v > 0.01
                  ? Border.all(
                      color: const Color(0xFF138A98).withValues(alpha: v * 0.95),
                      width: 2.5,
                    )
                  : null,
              boxShadow: [
                if (v > 0.01)
                  BoxShadow(
                    color: const Color(0xFF138A98).withValues(alpha: v * 0.5),
                    blurRadius: 18 * v,
                    spreadRadius: 3 * v,
                  ),
              ],
            ),
            child: Stack(
              children: [
                child!,
                if (v > 0.01)
                  Positioned.fill(
                    child: IgnorePointer(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(widget.borderRadius > 2 ? widget.borderRadius - 2 : widget.borderRadius),
                          color: const Color(0xFF138A98).withValues(alpha: v * 0.15),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
        child: widget.child,
      ),
    );
  }
}
