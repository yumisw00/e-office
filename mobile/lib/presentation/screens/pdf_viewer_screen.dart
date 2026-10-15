import 'package:flutter/foundation.dart';
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
  bool _headerLogged = false; // DEBUG ONLY

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

    // DEBUG ONLY: token tidak dicetak, hanya status terpasang/tidak
    if (kDebugMode && !_headerLogged) {
      _headerLogged = true;
      debugPrint('📑 PDF VIEWER pdfUrl(raw): ${widget.pdfUrl}');
      debugPrint('📑 PDF VIEWER fullUrl: $fullUrl');
      debugPrint('📑 PDF VIEWER Authorization header terpasang: ${headers.containsKey('Authorization')}');
      debugPrint('📑 PDF VIEWER header keys: ${headers.keys.toList()}');
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dokumen Surat'),
      ),
      body: SfPdfViewer.network(
        fullUrl,
        headers: headers,
        onDocumentLoadFailed: (details) {
          if (kDebugMode) {
            debugPrint('📑 PDF VIEWER load failed: error=${details.error} | description=${details.description}');
          }
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
