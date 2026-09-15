import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class SuratMasukScreen extends ConsumerStatefulWidget {
  const SuratMasukScreen({super.key});

  @override
  ConsumerState<SuratMasukScreen> createState() => _SuratMasukScreenState();
}

class _SuratMasukScreenState extends ConsumerState<SuratMasukScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(suratMasukProvider.notifier).fetchSuratMasuk();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(suratMasukProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Surat Masuk'),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(suratMasukProvider.notifier).fetchSuratMasuk(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat surat: $err',
            icon: Icons.error_outline,
          ),
          data: (suratList) {
            if (suratList.isEmpty) {
              return const EmptyStateView(
                message: 'Belum ada surat masuk.',
                icon: Icons.inbox_outlined,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: suratList.length,
              itemBuilder: (context, index) {
                final surat = suratList[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      child: Icon(Icons.document_scanner, color: Theme.of(context).colorScheme.primary),
                    ),
                    title: Text(
                      surat.perihal ?? 'Tanpa Perihal',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(surat.asalSurat ?? '-', style: const TextStyle(fontSize: 12)),
                        Text(
                          surat.nomorSurat ?? '-',
                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          surat.tanggalDiterima?.toString().substring(0, 10) ?? '-',
                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getStatusColor(surat.status).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            surat.status ?? '-',
                            style: TextStyle(
                              fontSize: 10,
                              color: _getStatusColor(surat.status),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    onTap: () => context.push('/detail-surat/${surat.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'baru':
        return Colors.blue;
      case 'dibaca':
        return Colors.green;
      case 'didisposisi':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
