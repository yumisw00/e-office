import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../../core/localization/app_localizations.dart';
import '../widgets/surat_shimmer_list.dart';
import '../widgets/empty_state_view.dart';

class SuratMasukScreen extends ConsumerWidget {
  const SuratMasukScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suratMasukAsync = ref.watch(suratMasukProvider);
    final localizations = AppLocalizations.of(context);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(suratMasukProvider.future),
      child: suratMasukAsync.when(
        loading: () => const SuratShimmerList(),
        error: (error, stackTrace) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: EmptyStateView(
              icon: Icons.error_outline_rounded,
              title: localizations.get('error_loading'),
              message: error.toString(),
              onRetry: () => ref.refresh(suratMasukProvider),
            ),
          ),
        ),
        data: (suratList) {
          if (suratList.isEmpty) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.7,
                child: EmptyStateView(
                  icon: Icons.inbox_outlined,
                  title: localizations.get('no_data'),
                  message: '',
                  onRetry: () => ref.refresh(suratMasukProvider),
                ),
              ),
            );
          }

          return ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            itemCount: suratList.length,
            itemBuilder: (context, index) {
              final surat = suratList[index];
              return Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
                  ),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    context.push('/detail', extra: surat);
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          backgroundColor: _getStatusColor(surat.status).withValues(alpha: 0.1),
                          child: Icon(
                            _getStatusIcon(surat.status),
                            color: _getStatusColor(surat.status),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                surat.nomorSurat,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${localizations.get('sender')}: ${surat.asalSurat}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                surat.perihal,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  height: 1.3,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(surat.status).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      localizations.get(surat.status.toLowerCase()),
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: _getStatusColor(surat.status),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    DateFormat('dd MMM yyyy').format(surat.tanggalDiterima),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
                  .animate()
                  .fade(duration: 350.ms, curve: Curves.easeOutCubic)
                  .slideY(begin: 0.15, end: 0, duration: 350.ms, curve: Curves.easeOutCubic);
            },
          );
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'belum_dibaca':
      case 'unread':
        return Colors.blue;
      case 'disposisi':
      case 'disposition':
        return Colors.orange;
      case 'selesai':
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'belum_dibaca':
      case 'unread':
        return Icons.mark_email_unread_outlined;
      case 'disposisi':
      case 'disposition':
        return Icons.assignment_outlined;
      case 'selesai':
      case 'completed':
        return Icons.verified_outlined;
      default:
        return Icons.email_outlined;
    }
  }
}
