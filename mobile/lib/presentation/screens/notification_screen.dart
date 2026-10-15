import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(notificationProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 8.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Notifikasi',
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'Tandai semua dibaca',
            onPressed: () {
              HapticFeedback.lightImpact();
              _showMarkAllReadConfirm(context, ref);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        edgeOffset: topPadding,
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
              padding: EdgeInsets.fromLTRB(8.0, topPadding, 8.0, 100.0),
              itemCount: list.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = list[index];
                final data = item['data'] ?? {};
                final isRead = item['read_at'] != null;
                final createdAt = DateTime.tryParse(item['created_at'] ?? '') ?? DateTime.now();

                return ListTile(
                  tileColor: isRead ? null : Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
                  leading: CircleAvatar(
                    backgroundColor: isRead ? Colors.grey[200] : Theme.of(context).colorScheme.primaryContainer,
                    child: Icon(
                      _getIconForType(item['type']),
                      color: isRead ? Colors.grey : Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    data['message'] ?? 'Notifikasi Baru',
                    style: TextStyle(
                      fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (data['sender_name'] != null)
                        Text('Dari: ${data['sender_name']}', style: const TextStyle(fontSize: 12)),
                      Text(
                        DateFormat('dd MMM yyyy HH:mm').format(createdAt),
                        style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _handleNotificationTap(context, ref, item);
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  IconData _getIconForType(String? type) {
    if (type == null) return Icons.notifications_outlined;
    if (type.contains('Disposisi')) return Icons.assignment_outlined;
    if (type.contains('SuratKeluar')) return Icons.description_outlined;
    if (type.contains('Approval')) return Icons.gavel_outlined;
    return Icons.info_outline;
  }

  void _handleNotificationTap(BuildContext context, WidgetRef ref, Map<String, dynamic> item) async {
    // DEBUG ONLY: cetak map item yang di-tap (tidak mengubah logic di bawah)
    if (kDebugMode) {
      String dump;
      try {
        dump = const JsonEncoder.withIndent('  ').convert(item);
      } catch (_) {
        dump = item.toString();
      }
      for (var i = 0; i < dump.length; i += 800) {
        debugPrint('👆 TAPPED NOTIF ITEM ${dump.substring(i, (i + 800 < dump.length) ? i + 800 : dump.length)}');
      }
    }

    final id = item['id'];
    final data = item['data'] ?? {};
    
    // Mark as read in background
    if (item['read_at'] == null) {
      try {
        await ref.read(notificationProvider.notifier).markRead(id);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal menandai notifikasi dibaca: $e')),
          );
        }
      }
    }

    // Deep link logic
    final actionUrl = data['action_url']?.toString();
    final referenceId = data['reference_id']?.toString() ?? data['surat_id']?.toString();
    final referenceType = data['reference_type']?.toString();

    if (actionUrl != null && actionUrl.isNotEmpty) {
      if (actionUrl.contains('/disposisi/')) {
        final parts = actionUrl.split('/');
        final id = parts[parts.indexOf('disposisi') + 1];
        context.push('/surat-masuk/$id', extra: 'disposisi');
      } else if (actionUrl.contains('/surat_keluar/') || referenceType?.toLowerCase() == 'surat_keluar') {
        context.go('/approval');
      } else if (referenceId != null) {
        context.push('/surat-masuk/$referenceId', extra: 'disposisi');
      }
    } else if (referenceId != null) {
      if (referenceType?.toLowerCase() == 'surat_keluar') {
        context.go('/approval');
      } else {
        context.push('/surat-masuk/$referenceId', extra: 'disposisi');
      }
    }
  }

  void _showMarkAllReadConfirm(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tandai Semua Dibaca'),
        content: const Text('Apakah Anda yakin ingin menandai semua notifikasi sebagai sudah dibaca?'),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Tidak'),
          ),
          TextButton(
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(notificationProvider.notifier).markAllRead();
                await ref.read(notificationProvider.notifier).refresh();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Semua notifikasi ditandai sudah dibaca.')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menandai semua dibaca: $e')),
                  );
                }
              }
            },
            child: const Text('Ya, Tandai'),
          ),
        ],
      ),
    );
  }
}
