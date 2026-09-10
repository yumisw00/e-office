import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/app_localizations.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/surat_shimmer_list.dart';
final approvalProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  await Future.delayed(const Duration(seconds: 1)); 
  return [
    {
      'id': 1,
      'nomor_surat': '005/SK/V/2026',
      'perihal': 'Undangan Rapat Koordinasi Nasional',
      'jenis': 'Surat Keluar',
      'pemohon': 'Kepala Bagian Umum',
      'tanggal_pengajuan': '2026-05-10',
      'status': 'Menunggu Persetujuan',
      'prioritas': 'Tinggi',
    },
    {
      'id': 2,
      'nomor_surat': '012/MEMO/V/2026',
      'perihal': 'Memo Internal Perubahan Jadwal',
      'jenis': 'Surat Keluar Internal',
      'pemohon': 'Manajer HRD',
      'tanggal_pengajuan': '2026-05-09',
      'status': 'Menunggu Persetujuan',
      'prioritas': 'Sedang',
    },
  ];
});
class ApprovalScreen extends ConsumerWidget {
  const ApprovalScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localizations = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final approvalAsync = ref.watch(approvalProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(approvalProvider);
        await ref.read(approvalProvider.future);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 0,
              color: theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      Icons.approval,
                      color: theme.colorScheme.primary,
                      size: 32,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            localizations.get('pending_approval'),
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.onPrimaryContainer,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Menunggu tindakan Anda',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            approvalAsync.when(
              data: (approvals) {
                if (approvals.isEmpty) {
                  return const EmptyStateView(
                    icon: Icons.check_circle_outline,
                    title: 'Tidak Ada Persetujuan',
                    message: 'Semua surat telah diproses',
                  );
                }
                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: approvals.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = approvals[index];
                    return _buildApprovalCard(context, item, theme);
                  },
                );
              },
              loading: () => const SuratShimmerList(itemCount: 3),
              error: (error, stack) => EmptyStateView(
                icon: Icons.error_outline,
                title: 'Gagal Memuat Data',
                message: error.toString(),
                onRetry: () => ref.refresh(approvalProvider),
              ),
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildApprovalCard(
    BuildContext context, 
    Map<String, dynamic> item, 
    ThemeData theme,
  ) {
    final localizations = AppLocalizations.of(context);
    final isHighPriority = item['prioritas'] == 'Tinggi';
    return Card(
      elevation: 2,
      shadowColor: isHighPriority 
          ? Colors.red.withValues(alpha: 0.3) 
          : theme.colorScheme.shadow.withValues(alpha: 0.1),
      child: InkWell(
        onTap: () {
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      item['nomor_surat'],
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isHighPriority)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        'Prioritas',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item['perihal'],
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoChip(
                      Icons.description_outlined,
                      item['jenis'],
                      theme,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildInfoChip(
                      Icons.person_outline,
                      item['pemohon'],
                      theme,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildInfoChip(
                    Icons.calendar_today_outlined,
                    item['tanggal_pengajuan'],
                    theme,
                    isDate: true,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      item['status'],
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                      },
                      icon: const Icon(Icons.close, size: 18),
                      label: Text(localizations.get('tolak')),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.colorScheme.error,
                        side: BorderSide(color: theme.colorScheme.error),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                      },
                      icon: const Icon(Icons.check, size: 18),
                      label: Text(localizations.get('approve')),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  Widget _buildInfoChip(
    IconData icon, 
    String text, 
    ThemeData theme, {
    bool isDate = false,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
        ),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            text,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              fontSize: isDate ? 11 : 12,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
