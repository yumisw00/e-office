import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(notificationProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Notifikasi'),
      body: RefreshIndicator(
        onRefresh: () => ref.read(notificationProvider.notifier).refresh(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, st) => EmptyStateView(icon: Icons.error_outline, message: err.toString()),
          data: (list) {
            if (list.isEmpty) {
              return const EmptyStateView(
                icon: Icons.notifications_none_rounded,
                title: 'Tidak Ada Notifikasi',
                message: 'Anda belum memiliki notifikasi baru.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                final item = list[index];
                return ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.info_outline)),
                  title: Text(item['title'] ?? 'Judul Notifikasi'),
                  subtitle: Text(item['body'] ?? 'Isi notifikasi'),
                  onTap: () {
                    // Logic navigasi berdasarkan data notifikasi
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}
