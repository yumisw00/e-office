import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';

class SuratMasukScreen extends ConsumerStatefulWidget {
  const SuratMasukScreen({super.key});

  @override
  ConsumerState<SuratMasukScreen> createState() => _SuratMasukScreenState();
}

class _SuratMasukScreenState extends ConsumerState<SuratMasukScreen> {
  String _selectedCategory = 'semua'; // 'semua', 'approval', 'disposisi'
  String _selectedOrder = 'terbaru';    // 'terbaru', 'terlama'
  DateTimeRange? _selectedDateRange;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myActionsProvider.notifier).fetchMyActions();
    });
  }

  void _showFilterTopSheet() {
    HapticFeedback.lightImpact();
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Filter',
      barrierColor: Colors.black54.withValues(alpha: 0.4),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, animation, secondaryAnimation) {
        return const SizedBox.shrink();
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final topOffset = MediaQuery.of(context).padding.top + kToolbarHeight + 8.0;
        return Stack(
          children: [
            Positioned(
              top: topOffset,
              left: 16,
              right: 16,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, -1),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                )),
                child: FadeTransition(
                  opacity: animation,
                  child: Material(
                    color: Colors.transparent,
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: StatefulBuilder(
                        builder: (context, setModalState) {
                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Filter Surat',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      HapticFeedback.lightImpact();
                                      setState(() {
                                        _selectedCategory = 'semua';
                                        _selectedOrder = 'terbaru';
                                        _selectedDateRange = null;
                                      });
                                      setModalState(() {});
                                    },
                                    child: const Text('Reset'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildCapsuleChip(context, label: 'Semua', isSelected: _selectedCategory == 'semua', onTap: () {
                                    setState(() => _selectedCategory = 'semua');
                                    setModalState(() {});
                                  }),
                                  _buildCapsuleChip(context, label: 'Approval', isSelected: _selectedCategory == 'approval', onTap: () {
                                    setState(() => _selectedCategory = 'approval');
                                    setModalState(() {});
                                  }),
                                  _buildCapsuleChip(context, label: 'Disposisi', isSelected: _selectedCategory == 'disposisi', onTap: () {
                                    setState(() => _selectedCategory = 'disposisi');
                                    setModalState(() {});
                                  }),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text('Urutan Waktu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildCapsuleChip(context, label: 'Terbaru', isSelected: _selectedOrder == 'terbaru', onTap: () {
                                    setState(() => _selectedOrder = 'terbaru');
                                    setModalState(() {});
                                  }),
                                  _buildCapsuleChip(context, label: 'Terlama', isSelected: _selectedOrder == 'terlama', onTap: () {
                                    setState(() => _selectedOrder = 'terlama');
                                    setModalState(() {});
                                  }),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text('Rentang Tanggal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildCapsuleChip(
                                    context,
                                    label: _selectedDateRange == null 
                                        ? 'Pilih Rentang Tanggal' 
                                        : '${DateFormat('dd MMM yy').format(_selectedDateRange!.start)} - ${DateFormat('dd MMM yy').format(_selectedDateRange!.end)}',
                                    isSelected: _selectedDateRange != null,
                                    icon: Icons.date_range_rounded,
                                    onTap: () async {
                                      HapticFeedback.lightImpact();
                                      final picked = await showDateRangePicker(
                                        context: context,
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime(2030),
                                        initialDateRange: _selectedDateRange,
                                      );
                                      if (picked != null) {
                                        setState(() => _selectedDateRange = picked);
                                        setModalState(() {});
                                      }
                                    },
                                  ),
                                  if (_selectedDateRange != null)
                                    _buildCapsuleChip(
                                      context,
                                      label: 'Hapus Rentang',
                                      isSelected: false,
                                      icon: Icons.close_rounded,
                                      onTap: () {
                                        setState(() => _selectedDateRange = null);
                                        setModalState(() {});
                                      },
                                    ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  onPressed: () {
                                    HapticFeedback.mediumImpact();
                                    Navigator.pop(context);
                                  },
                                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
                                  child: const Text('Terapkan Filter'),
                                ),
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
          ],
        );
      },
    );
  }

  Widget _buildCapsuleChip(BuildContext context, {required String label, required bool isSelected, required VoidCallback onTap, IconData? icon}) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(myActionsProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Tindakan Saya',
        leading: IconButton(
          icon: const Icon(Icons.tune_rounded),
          tooltip: 'Filter Surat',
          onPressed: _showFilterTopSheet,
        ),
      ),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async {
          await ref.read(myActionsProvider.notifier).fetchMyActions();
          HapticFeedback.mediumImpact();
        },
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat daftar tindakan: $err',
            icon: Icons.error_outline_rounded,
          ),
          data: (suratList) {
            // Filter logic
            var filteredList = suratList.where((surat) {
              if (_selectedCategory != 'semua') {
                if (surat.actionType != _selectedCategory) return false;
              }
              if (_selectedDateRange != null) {
                final date = surat.tanggalDiterima;
                final start = DateTime(_selectedDateRange!.start.year, _selectedDateRange!.start.month, _selectedDateRange!.start.day);
                final end = DateTime(_selectedDateRange!.end.year, _selectedDateRange!.end.month, _selectedDateRange!.end.day, 23, 59, 59);
                if (date.isBefore(start) || date.isAfter(end)) {
                  return false;
                }
              }
              return true;
            }).toList();

            // Sort logic
            filteredList.sort((a, b) {
              if (_selectedOrder == 'terbaru') {
                return b.tanggalDiterima.compareTo(a.tanggalDiterima);
              } else {
                return a.tanggalDiterima.compareTo(b.tanggalDiterima);
              }
            });

            if (filteredList.isEmpty) {
              return EmptyStateView(
                message: 'Tidak ada surat yang sesuai dengan filter.',
                icon: Icons.filter_alt_off_rounded,
                onRetry: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _selectedCategory = 'semua';
                    _selectedOrder = 'terbaru';
                    _selectedDateRange = null;
                  });
                },
              );
            }

            return ListView.builder(
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
              itemCount: filteredList.length,
              itemBuilder: (context, index) {
                final surat = filteredList[index];
                final isApproval = surat.actionType == 'approval';

                return CustomCard(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: EdgeInsets.zero,
                  onTap: () {
                    if (isApproval) {
                      context.go('/approval');
                    } else {
                      context.push('/surat-masuk/${surat.id}', extra: {
                        'actionType': surat.actionType,
                        'idDisposisi': surat.idDisposisi,
                      });
                    }
                  },
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: CircleAvatar(
                      backgroundColor: isApproval ? Colors.orange.shade100 : Colors.blue.shade100,
                      child: Icon(
                        isApproval ? Icons.task_alt_rounded : Icons.alt_route_rounded,
                        color: isApproval ? Colors.orange.shade800 : Colors.blue.shade800,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      surat.perihal,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(surat.asalSurat, style: const TextStyle(fontSize: 12)),
                        Text(
                          surat.nomorSurat,
                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right, size: 18),
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
