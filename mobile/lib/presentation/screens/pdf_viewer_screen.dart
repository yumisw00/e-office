import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import '../../core/constants/app_config.dart';
import '../../core/network/api_endpoints.dart';

class PdfViewerScreen extends ConsumerStatefulWidget {
  final String pdfUrl;
  const PdfViewerScreen({super.key, required this.pdfUrl});

  @override
  ConsumerState<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends ConsumerState<PdfViewerScreen> {
  String? _authToken;
  bool _isLoadingToken = true;

  @override
  void initState() {
    super.initState();
    _loadAuthToken();
  }

  Future<void> _loadAuthToken() async {
    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: AppConfig.authTokenKey);
      if (mounted) {
        setState(() {
          _authToken = token;
          _isLoadingToken = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingToken = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.pdfUrl.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dokumen Surat')),
        body: const Center(child: Text('URL Dokumen tidak valid atau belum diunggah')),
      );
    }

    final fullUrl = ApiEndpoints.buildStorageUrl(widget.pdfUrl);

    if (_isLoadingToken) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dokumen Surat')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final headers = <String, String>{
      'Accept': 'application/pdf, application/octet-stream, */*',
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dokumen Surat'),
      ),
      body: SfPdfViewer.network(
        fullUrl,
        headers: headers,
        onDocumentLoadFailed: (details) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Gagal memuat PDF: ${details.description}'),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        },
      ),
    );
  }
}
