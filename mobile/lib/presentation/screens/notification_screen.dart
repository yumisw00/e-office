import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:e_office_mobile/core/utils/connectivity_helper.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/routing/notification_route_resolver.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(notificationProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final topPadding =
        MediaQuery.of(context).padding.top + kToolbarHeight + 8.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Notifikasi',
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'Tandai semua dibaca',
            onPressed: () {
              HapticHelper.lightImpact();
              _showMarkAllReadConfirm(context, ref);
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Layer Scrollable (ListView) yang membentang dari puncak layar (y = 0) sehingga tembus di balik CustomAppBar
          Positioned.fill(
            child: RefreshIndicator(
              edgeOffset: topPadding,
              onRefresh: () =>
                  ref.read(notificationProvider.notifier).refresh(),
              child: provider.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, st) => EmptyStateView(
                  icon: Icons.error_outline,
                  message: err.toString(),
                ),
                data: (list) {
                  if (list.isEmpty) {
                    return const EmptyStateView(
                      icon: Icons.notifications_none_rounded,
                      title: 'Tidak Ada Notifikasi',
                      message: 'Anda belum memiliki notifikasi baru.',
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.fromLTRB(8.0, topPadding, 8.0, 100.0),
                    itemCount: list.length,
                    separatorBuilder: (context, index) =>
                        const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = list[index] is Map
                          ? Map<String, dynamic>.from(list[index] as Map)
                          : <String, dynamic>{};

                      // Ekstraksi data sesuai kontrak backend API (GET /eoffice/notifications)
                      final payload = item['payload'] is Map
                          ? Map<String, dynamic>.from(item['payload'] as Map)
                          : <String, dynamic>{};
                      final title =
                          item['title']?.toString() ?? 'Notifikasi Baru';
                      final message = item['message']?.toString() ?? '';
                      final url =
                          item['url']?.toString() ?? payload['url']?.toString();
                      final type =
                          payload['type']?.toString() ??
                          item['type']?.toString();
                      final isRead = item['read_at'] != null;
                      final createdAt =
                          DateTime.tryParse(
                            item['created_at']?.toString() ?? '',
                          ) ??
                          DateTime.now();
                      final isApproval = _isApprovalType(type, url, title);

                      // Fitur 5: Swipe action untuk menandai dibaca / hapus
                      return Dismissible(
                        key: ValueKey('notif_${item['id'] ?? index}'),
                        background: Container(
                          color: Colors.green,
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 20),
                          child: const Icon(
                            Icons.check_rounded,
                            color: Colors.white,
                          ),
                        ),
                        secondaryBackground: Container(
                          color: Colors.red,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(
                            Icons.delete_outline_rounded,
                            color: Colors.white,
                          ),
                        ),
                        onDismissed: (direction) async {
                          if (direction == DismissDirection.startToEnd) {
                            // Tandai dibaca
                            final notificationId =
                                item['id_notification']?.toString() ??
                                item['id']?.toString();
                            if (notificationId != null) {
                              await ref
                                  .read(notificationProvider.notifier)
                                  .markRead(notificationId);
                              await HapticHelper.playSuccess();
                            }
                          } else {
                            // Hapus notifikasi
                            HapticHelper.selectionClick();
                          }
                          ref.read(notificationProvider.notifier).refresh();
                        },
                        child: ListTile(
                          tileColor: isRead
                              ? null
                              : Theme.of(
                                  context,
                                ).colorScheme.primary.withValues(alpha: 0.05),
                          leading: CircleAvatar(
                            backgroundColor: isRead
                                ? (isDark
                                      ? theme
                                            .colorScheme
                                            .surfaceContainerHighest
                                            .withValues(alpha: 0.4)
                                      : Colors.grey[200])
                                : (isApproval
                                      ? Colors.orange.withValues(alpha: 0.15)
                                      : Colors.blue.withValues(alpha: 0.15)),
                            child: Icon(
                              isApproval
                                  ? Icons.task_alt_rounded
                                  : Icons.shortcut_rounded,
                              color: isRead
                                  ? Colors.grey
                                  : (isApproval ? Colors.orange : Colors.blue),
                              size: 20,
                            ),
                          ),
                          title: Text(
                            title,
                            style: TextStyle(
                              fontWeight: isRead
                                  ? FontWeight.normal
                                  : FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (message.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(
                                    top: 2.0,
                                    bottom: 4.0,
                                  ),
                                  child: Text(
                                    message,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[800],
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              Text(
                                DateFormat(
                                  'dd MMM yyyy HH:mm',
                                ).format(createdAt),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          onTap: () {
                            HapticHelper.lightImpact();
                            _handleNotificationTap(context, ref, item);
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
          // 2. Indikator offline menempel tepat di bawah CustomAppBar jika offline
          Positioned(
            top: topPadding,
            left: 0,
            right: 0,
            child: StreamBuilder<bool>(
              stream: ConnectivityHelper.isConnectedStream,
              builder: (context, snapshot) {
                final isConnected = snapshot.data ?? true;
                if (!isConnected) {
                  return Container(
                    color: Colors.orange,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.wifi_off_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Tidak ada koneksi internet',
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  bool _isApprovalType(String? type, String? url, String? title) {
    final combined = '${type ?? ''} ${url ?? ''} ${title ?? ''}'.toLowerCase();
    return combined.contains('approval') ||
        combined.contains('persetujuan') ||
        combined.contains('surat_keluar') ||
        combined.contains('keluar');
  }

  void _handleNotificationTap(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) async {
    if (kDebugMode) {
      String dump;
      try {
        dump = const JsonEncoder.withIndent('  ').convert(item);
      } catch (_) {
        dump = item.toString();
      }
      for (var i = 0; i < dump.length; i += 800) {
        debugPrint(
          '👆 TAPPED NOTIF ITEM ${dump.substring(i, (i + 800 < dump.length) ? i + 800 : dump.length)}',
        );
      }
    }

    final notificationId =
        item['id_notification']?.toString() ?? item['id']?.toString();

    // Tandai dibaca di server jika belum dibaca
    if (item['read_at'] == null && notificationId != null) {
      ref
          .read(notificationProvider.notifier)
          .markRead(notificationId)
          .then((_) {
            // Refresh lokal list secara asinkron
            ref.read(notificationProvider.notifier).refresh();
          })
          .catchError((e) {
            if (kDebugMode) print('⚠️ Gagal tandai notifikasi dibaca: $e');
          });
    }

    // Navigasi menggunakan Unified Route Resolver yang sama dengan push notification
    final resolved = NotificationRouteResolver.resolveFromRaw(item);
    if (context.mounted) {
      NotificationRouteResolver.navigateToRoute(context, resolved);
    }
  }

  void _showMarkAllReadConfirm(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tandai Semua Dibaca'),
        content: const Text(
          'Apakah Anda yakin ingin menandai semua notifikasi sebagai sudah dibaca?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticHelper.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Tidak'),
          ),
          TextButton(
            onPressed: () async {
              HapticHelper.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(notificationProvider.notifier).markAllRead();
                await ref.read(notificationProvider.notifier).refresh();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Semua notifikasi ditandai sudah dibaca.'),
                    ),
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
