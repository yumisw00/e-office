import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class DisposisiScreen extends ConsumerStatefulWidget {
  const DisposisiScreen({super.key});

  @override
  ConsumerState<DisposisiScreen> createState() => _DisposisiScreenState();
}

class _DisposisiScreenState extends ConsumerState<DisposisiScreen> {
  String _selectedFilter = 'semua'; // 'semua', 'proses', 'selesai'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(disposisiListProvider.notifier).fetchDisposisi();
    });
  }

  void _onFilterChanged(String filter) {
    setState(() => _selectedFilter = filter);
    final statusParam = filter == 'semua' ? null : filter;
    ref.read(disposisiListProvider.notifier).fetchDisposisi(status: statusParam);
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(disposisiListProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Daftar Disposisi'),
      body: Column(
        children: [
          _buildFilterTabs(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                final statusParam = _selectedFilter == 'semua' ? null : _selectedFilter;
                await ref.read(disposisiListProvider.notifier).fetchDisposisi(status: statusParam);
              },
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
                      icon: Icons.assignment_turned_in_outlined,
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      final item = list[index];
                      return _buildDisposisiCard(context, item);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: Theme.of(context).colorScheme.surface,
      child: Row(
        children: [
          _buildFilterChip('Semua', 'semua'),
          const SizedBox(width: 8),
          _buildFilterChip('Perlu Tindakan', 'proses'),
          const SizedBox(width: 8),
          _buildFilterChip('Selesai', 'selesai'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    final primary = Theme.of(context).colorScheme.primary;

    return FilterChip(
      selected: isSelected,
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.white : Colors.grey.shade700,
        ),
      ),
      backgroundColor: Colors.grey.shade100,
      selectedColor: primary,
      checkmarkColor: Colors.white,
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? primary : Colors.grey.shade300,
          width: 1,
        ),
      ),
      onSelected: (_) => _onFilterChanged(value),
    );
  }

  Widget _buildDisposisiCard(BuildContext context, Map<String, dynamic> item) {
    final surat = item['surat_masuk'] is Map ? item['surat_masuk'] as Map<String, dynamic> : null;
    final perihal = surat?['perihal'] ?? item['perihal'] ?? 'Surat Masuk';
    final nomorSurat = surat?['nomor_surat'] ?? item['nomor_surat'] ?? '-';
    final instruksi = item['instruksi'] ?? '-';
    final status = (item['status'] ?? 'baru').toString().toLowerCase();
    final isSelesai = status == 'selesai' || status == 'done';
    final idDisposisi = (item['id_surat_disposisi'] ?? item['id'])?.toString() ?? '';
    final idSuratMasuk = (item['id_surat_masuk'] ?? surat?['id'] ?? surat?['id_surat_masuk'])?.toString() ?? '';
    final pemberi = item['pemberi'] is Map ? (item['pemberi']['name'] ?? item['pemberi']['nama']) : item['nama_pemberi'];
    final tglDisposisi = item['tanggal_disposisi'] ?? item['created_at'];

    String formattedDate = '-';
    if (tglDisposisi != null) {
      try {
        final dt = DateTime.parse(tglDisposisi.toString());
        formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(dt);
      } catch (_) {
        formattedDate = tglDisposisi.toString();
      }
    }

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          if (idSuratMasuk.isNotEmpty) {
            context.push(
              '/surat-masuk/$idSuratMasuk',
              extra: {
                'actionType': 'disposisi',
                'idDisposisi': idDisposisi,
              },
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nomorSurat,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          perihal,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSelesai ? Colors.green.shade50 : Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelesai ? Colors.green.shade300 : Colors.amber.shade300,
                      ),
                    ),
                    child: Text(
                      isSelesai ? 'Selesai' : 'Perlu Tindakan',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isSelesai ? Colors.green.shade800 : Colors.amber.shade800,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.format_quote_rounded, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Instruksi: $instruksi',
                      style: const TextStyle(fontSize: 12, color: Colors.black87),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    pemberi != null ? 'Dari: $pemberi' : formattedDate,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  ),
                  if (!isSelesai)
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: const Color(0xFF138A98),
                      ),
                      onPressed: () => _showCompleteModal(context, idDisposisi, perihal),
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Selesaikan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCompleteModal(BuildContext context, String idDisposisi, String perihal) {
    if (idDisposisi.isEmpty) return;
    final catatanController = TextEditingController();
    PlatformFile? selectedFile;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (modalContext) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Selesaikan Disposisi',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  perihal,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: catatanController,
                  decoration: const InputDecoration(
                    labelText: 'Catatan / Laporan Tindak Lanjut *',
                    hintText: 'Tuliskan tindakan atau penyelesaian disposisi...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 14),
                // Lampiran Bukti
                InkWell(
                  onTap: isSubmitting
                      ? null
                      : () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setModalState(() {
                              selectedFile = result.files.first;
                            });
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey.shade50,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selectedFile != null ? Icons.attach_file : Icons.upload_file,
                          color: selectedFile != null ? const Color(0xFF138A98) : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile != null
                                ? selectedFile!.name
                                : 'Lampirkan Bukti (PDF/Gambar - Opsional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: selectedFile != null ? Colors.black87 : Colors.grey.shade600,
                              fontWeight: selectedFile != null ? FontWeight.w600 : FontWeight.normal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedFile != null)
                          IconButton(
                            icon: const Icon(Icons.cancel, size: 18, color: Colors.red),
                            onPressed: () => setModalState(() => selectedFile = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF138A98),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final catatan = catatanController.text.trim();
                            if (catatan.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Catatan penyelesaian wajib diisi.')),
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);
                            try {
                              String? fileBuktiPath;
                              if (selectedFile != null && selectedFile!.path != null) {
                                final uploadResp = await ref
                                    .read(suratRepositoryProvider)
                                    .uploadAttachment(idDisposisi, selectedFile!.path!);
                                fileBuktiPath = uploadResp['file_bukti_path']?.toString();
                              }

                              await ref.read(suratRepositoryProvider).completeDisposisi(
                                    idDisposisi,
                                    catatan: catatan,
                                    fileBuktiPath: fileBuktiPath,
                                  );

                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Disposisi berhasil diselesaikan.'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                ref.read(disposisiListProvider.notifier).fetchDisposisi();
                                ref.read(myActionsProvider.notifier).refresh();
                                ref.read(pimpinanDashboardProvider.notifier).refresh();
                              }
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Gagal menyelesaikan disposisi: $e'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Selesaikan Disposisi', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
