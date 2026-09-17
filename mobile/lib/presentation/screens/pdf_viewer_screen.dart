import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import '../../domain/providers/surat_provider.dart';

class PdfViewerScreen extends ConsumerStatefulWidget {
  final String pdfUrl;
  const PdfViewerScreen({super.key, required this.pdfUrl});

  @override
  ConsumerState<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends ConsumerState<PdfViewerScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(suratRepositoryProvider).logAuditTrail('view_pdf_attachment', {
        'url': widget.pdfUrl,
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.pdfUrl.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dokumen Surat')),
        body: const Center(child: Text('URL Dokumen tidak valid')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dokumen Surat'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_outlined),
            onPressed: () {
              ref.read(suratRepositoryProvider).logAuditTrail('download_pdf_attachment', {
                'url': widget.pdfUrl,
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Fitur download sedang disiapkan')),
              );
            },
          ),
        ],
      ),
      body: SfPdfViewer.network(
        widget.pdfUrl,
        onDocumentLoadFailed: (details) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal memuat PDF: ${details.description}')),
          );
        },
      ),
    );
  }
}
