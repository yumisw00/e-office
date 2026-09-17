import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class SuratKeluarScreen extends ConsumerStatefulWidget {
  const SuratKeluarScreen({super.key});

  @override
  ConsumerState<SuratKeluarScreen> createState() => _SuratKeluarScreenState();
}

class _SuratKeluarScreenState extends ConsumerState<SuratKeluarScreen> {
  @override
  Widget build(BuildContext context) {
    // ASUMSI: Menggunakan provider yang sama tapi mungkin butuh filter draft
    final provider = ref.watch(suratMasukProvider); // Placeholder provider

    return Scaffold(
      appBar: const CustomAppBar(title: 'Draft Surat Keluar'),
      body: provider.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => EmptyStateView(icon: Icons.error_outline, message: err.toString()),
        data: (list) {
           return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (context, index) {
                final item = list[index];
                return Card(
                  child: ListTile(
                    title: Text(item.perihal),
                    subtitle: const Text('Status: Draft'),
                    trailing: ElevatedButton(
                      onPressed: () => _showSubmitDialog(context, item.id),
                      child: const Text('Submit'),
                    ),
                  ),
                );
              },
           );
        },
      ),
    );
  }

  void _showSubmitDialog(BuildContext context, String id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Surat'),
        content: const Text('Kirim draft surat ini untuk proses approval?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(suratRepositoryProvider).submitSuratKeluar(id);
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Surat berhasil di-submit')));
                }
              } catch (e) {
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
