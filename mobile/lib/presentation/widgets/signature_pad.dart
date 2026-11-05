import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:signature/signature.dart';

class SignaturePad extends StatefulWidget {
  final Function(String base64Image) onSaved;

  const SignaturePad({super.key, required this.onSaved});

  @override
  State<SignaturePad> createState() => _SignaturePadState();
}

class _SignaturePadState extends State<SignaturePad> {
  final SignatureController _controller = SignatureController(
    penStrokeWidth: 4,
    penColor: Colors.black,
    exportBackgroundColor: Colors.transparent,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (_controller.isEmpty) {
      HapticFeedback.vibrate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan bubuhkan tanda tangan terlebih dahulu')),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    final Uint8List? data = await _controller.toPngBytes();
    if (data != null) {
      final base64String = base64Encode(data);
      // Format: data:image/png;base64,<...> as requested in contract point 7
      widget.onSaved('data:image/png;base64,$base64String');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          height: 250,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Signature(
              controller: _controller,
              backgroundColor: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  _controller.clear();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Hapus'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                onPressed: _handleSave,
                icon: const Icon(Icons.check),
                label: const Text('Simpan'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.teal.shade700,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
