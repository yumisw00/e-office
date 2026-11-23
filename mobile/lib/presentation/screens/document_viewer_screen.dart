import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_config.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/utils/haptic_helper.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class DocumentViewerScreen extends ConsumerStatefulWidget {
  final String pdfUrl;
  const DocumentViewerScreen({super.key, required this.pdfUrl});

  @override
  ConsumerState<DocumentViewerScreen> createState() => _DocumentViewerScreenState();
}

class _DocumentViewerScreenState extends ConsumerState<DocumentViewerScreen> {
  String? _authToken;
  bool _isLoadingToken = true;
  bool _hasError = false;
  String _errorMessage = '';
  Key _viewerKey = UniqueKey();

  WebViewController? _webViewController;
  bool _isWebViewLoading = true;
  int _webViewProgress = 0;
  bool _webViewHasError = false;

  @override
  void initState() {
    super.initState();
    _loadAuthToken();
    _initWebViewIfNeeded();
  }

  void _initWebViewIfNeeded() {
    final rawUrl = widget.pdfUrl.trim();
    if (ApiEndpoints.isGoogleDriveUrl(rawUrl)) {
      final previewUrl = ApiEndpoints.toGoogleDrivePreviewUrl(rawUrl);
      try {
        _webViewController = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setNavigationDelegate(
            NavigationDelegate(
              onProgress: (int progress) {
                if (mounted) {
                  setState(() {
                    _webViewProgress = progress;
                  });
                }
              },
              onPageStarted: (String url) {
                if (mounted) {
                  setState(() {
                    _isWebViewLoading = true;
                    _webViewHasError = false;
                  });
                }
              },
              onPageFinished: (String url) {
                if (mounted) {
                  setState(() {
                    _isWebViewLoading = false;
                  });
                }
              },
              onWebResourceError: (WebResourceError error) {
                if (kDebugMode) {
                  debugPrint('📑 WebView error: ${error.description}');
                }
                if (mounted) {
                  setState(() {
                    _webViewHasError = true;
                    _isWebViewLoading = false;
                  });
                }
              },
            ),
          )
          ..loadRequest(Uri.parse(previewUrl));
      } catch (e) {
        if (kDebugMode) {
          debugPrint('📑 WebViewController init failed: $e');
        }
      }
    }
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

  void _retry() {
    HapticHelper.lightImpact();
    setState(() {
      _hasError = false;
      _errorMessage = '';
      _viewerKey = UniqueKey();
      _webViewHasError = false;
      _isWebViewLoading = true;
    });
    if (_webViewController != null) {
      final rawUrl = widget.pdfUrl.trim();
      final previewUrl = ApiEndpoints.toGoogleDrivePreviewUrl(rawUrl);
      _webViewController!.loadRequest(Uri.parse(previewUrl));
    }
  }

  Future<void> _launchExternal() async {
    HapticHelper.lightImpact();
    final url = widget.pdfUrl.trim();
    if (url.isEmpty) return;

    final target = ApiEndpoints.isGoogleDriveUrl(url)
        ? url
        : ApiEndpoints.buildStorageUrl(url);

    try {
      final uri = Uri.parse(target);
      bool launched = false;

      if (ApiEndpoints.isGoogleDriveUrl(url)) {
        // Coba buka di aplikasi Google Docs / Drive (non-browser)
        try {
          launched = await launchUrl(uri, mode: LaunchMode.externalNonBrowserApplication);
        } catch (_) {
          launched = false;
        }
      }

      if (!launched) {
        try {
          launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
        } catch (_) {
          launched = false;
        }
      }

      if (!launched) {
        try {
          launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
        } catch (_) {
          launched = false;
        }
      }

      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak dapat membuka aplikasi eksternal atau browser.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal membuka dokumen: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.pdfUrl.trim().isEmpty) {
      return const Scaffold(
        appBar: CustomAppBar(title: 'Preview Dokumen', showProfileButton: false),
        body: EmptyStateView(
          message: 'URL Dokumen tidak valid atau belum diunggah.',
          icon: Icons.description_outlined,
        ),
      );
    }

    final rawUrl = widget.pdfUrl.trim();
    final isGoogleDocs = ApiEndpoints.isGoogleDriveUrl(rawUrl);
    final isImage = RegExp(r'\.(jpg|jpeg|png|webp|gif)($|\?)', caseSensitive: false).hasMatch(rawUrl);
    final isOffice = RegExp(r'\.(docx?|xlsx?|pptx?)($|\?)', caseSensitive: false).hasMatch(rawUrl);
    final fullUrl = ApiEndpoints.buildStorageUrl(rawUrl);

    if (_isLoadingToken) {
      return const Scaffold(
        appBar: CustomAppBar(title: 'Preview Dokumen', showProfileButton: false),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final headers = <String, String>{
      'Accept': isImage
          ? 'image/*, */*'
          : 'application/pdf, application/octet-stream, */*',
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    if (kDebugMode) {
      debugPrint('📑 DOC VIEWER raw: $rawUrl');
      debugPrint('📑 DOC VIEWER fullUrl: $fullUrl');
      debugPrint('📑 DOC VIEWER isGoogleDocs: $isGoogleDocs | isImage: $isImage | isOffice: $isOffice');
    }

    final actions = <Widget>[
      IconButton(
        icon: const Icon(Icons.open_in_new_rounded),
        tooltip: 'Buka di Google Docs / Browser',
        onPressed: _launchExternal,
      ),
    ];

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Preview Dokumen',
        showProfileButton: false,
        actions: actions,
      ),
      body: isGoogleDocs
          ? _buildGoogleDocsView(context, rawUrl)
          : isOffice
              ? _buildOfficeView(context, rawUrl, fullUrl)
              : _hasError
                  ? _buildErrorView(context, fullUrl)
                  : isImage
                      ? _buildImageView(fullUrl, headers)
                      : _buildPdfView(fullUrl, headers),
    );
  }

  Widget _buildGoogleDocsView(BuildContext context, String url) {
    if (_webViewController != null && !_webViewHasError) {
      return Stack(
        children: [
          WebViewWidget(controller: _webViewController!),
          if (_isWebViewLoading)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                value: _webViewProgress > 0 ? _webViewProgress / 100.0 : null,
                backgroundColor: Colors.transparent,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
        ],
      );
    }

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.article_rounded,
                size: 48,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Pratinjau Google Docs',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 10),
            Text(
              'Dokumen ini terhubung secara online dengan Google Docs. Anda dapat membuka atau mengedit isi surat langsung di Google Docs.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 24),
            if (_webViewHasError) ...[
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _retry,
                icon: const Icon(Icons.refresh_rounded, size: 20),
                label: const Text('Muat Ulang Preview'),
              ),
              const SizedBox(height: 12),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: _launchExternal,
                icon: const Icon(Icons.open_in_new_rounded, size: 20),
                label: const Text(
                  'Buka di Google Docs / Browser',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfficeView(BuildContext context, String rawUrl, String fullUrl) {
    final extMatch = RegExp(r'\.([a-zA-Z0-9]+)($|\?)').firstMatch(rawUrl);
    final ext = extMatch != null ? extMatch.group(1)!.toUpperCase() : 'OFFICE';

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.file_present_rounded,
                size: 48,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Dokumen $ext',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 10),
            Text(
              'File lampiran berformat dokumen $ext. Silakan buka atau unduh file untuk melihat isi lengkapnya.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: _launchExternal,
                icon: const Icon(Icons.download_rounded, size: 20),
                label: const Text(
                  'Buka Dokumen di Aplikasi Luar',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView(BuildContext context, String fullUrl) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 60, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              'Gagal Memuat Dokumen',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage.isNotEmpty ? _errorMessage : 'Terjadi kendala saat mengambil dokumen dari server.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _retry,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Coba Lagi'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _launchExternal,
                    icon: const Icon(Icons.open_in_new_rounded, size: 18),
                    label: const Text('Buka di Browser'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageView(String fullUrl, Map<String, String> headers) {
    return InteractiveViewer(
      maxScale: 4.0,
      child: Center(
        child: Image.network(
          fullUrl,
          headers: headers,
          fit: BoxFit.contain,
          loadingBuilder: (ctx, child, progress) {
            if (progress == null) return child;
            return const Center(child: CircularProgressIndicator());
          },
          errorBuilder: (ctx, err, stack) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.broken_image_outlined, size: 48, color: Colors.grey),
                  const SizedBox(height: 8),
                  const Text('Gagal menampilkan gambar dokumen.'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _retry,
                    child: const Text('Coba Lagi'),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: _launchExternal,
                    icon: const Icon(Icons.open_in_new_rounded, size: 16),
                    label: const Text('Buka di Browser'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildPdfView(String fullUrl, Map<String, String> headers) {
    return SfPdfViewer.network(
      fullUrl,
      key: _viewerKey,
      headers: headers,
      onDocumentLoadFailed: (details) {
        if (kDebugMode) {
          debugPrint('📑 PDF load failed: error=${details.error} | desc=${details.description}');
        }
        setState(() {
          _hasError = true;
          _errorMessage = details.description;
        });
      },
    );
  }
}
