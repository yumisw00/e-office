import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class DisposisiScreen extends ConsumerStatefulWidget {
  const DisposisiScreen({super.key});

  @override
  ConsumerState<DisposisiScreen> createState() => _DisposisiScreenState();
}

class _DisposisiScreenState extends ConsumerState<DisposisiScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(disposisiListProvider.notifier).fetchDisposisi();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(disposisiListProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Daftar Disposisi'),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(disposisiListProvider.notifier).fetchDisposisi(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat disposisi: $err',
            icon: Icons.error_outline_rounded,
          ),
          data: (list) {
            if (list.isEmpty) {
              return const EmptyStateView(
                message: 'Belum ada disposisi untuk Anda.',
                icon: Icons.all_inbox_outlined,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (context, index) {
                final item = list[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(item['perihal'] ?? 'Tanpa Perihal', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Instruksi: ${item['instruksi'] ?? '-'}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _showForwardSheet(context, item['id'].toString()),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  void _showForwardSheet(BuildContext context, String id) {
    final notesController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20, right: 20, top: 20
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Teruskan Disposisi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(labelText: 'Catatan Teruskan', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  try {
                    // // BUTUH-BACKEND: Endpoint POST /disposisi/{id}/forward belum ada di backend
                    await ref.read(suratRepositoryProvider).forwardDisposisi(id, {
                      'notes': notesController.text,
                    });
                    if (context.mounted) {
                      context.pop();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Disposisi berhasil diteruskan')));
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  }
                },
                child: const Text('Kirim'),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
