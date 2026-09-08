<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DigitalSignatureAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\DigitalSignature;
    }

    /**
     * Verify a digital signature by its verification code (UUID from QR).
     * GET /api/digital-signature/verify/{code}
     */
    public function verify(string $code)
    {
        $signature = DB::table('digital_signature')
            ->whereNull('deleted_at')
            ->get()
            ->first(function ($row) use ($code) {
                $url = (string) ($row->verification_url ?? '');
                // Support both old format (/verify/signature/{code}) and new API format
                return Str::endsWith($url, '/verify/signature/' . $code)
                    || Str::contains($url, '/verify/signature/' . $code . '?')
                    || Str::endsWith($url, '/digital-signature/verify/' . $code)
                    || Str::contains($url, '/digital-signature/verify/' . $code . '?');
            });

        if (!$signature) {
            return response()->json([
                'success' => false,
                'message' => 'Signature not found.',
            ], 404);
        }

        // Fetch related surat keluar (handles both surat_keluar and surat_keluar_approval)
        $surat = null;
        $signer = null;
        $fileUrl = null;
        $integrityValid = false;

        if (in_array($signature->source_type, ['surat_keluar', 'surat_keluar_approval'])) {
            $surat = DB::table('surat_keluar')
                ->where('id_surat_keluar', $signature->source_id)
                ->whereNull('deleted_at')
                ->first();

            if ($surat) {
                $signer = DB::table('sys_user')
                    ->where('id_user', $signature->id_penandatangan)
                    ->first();

                // Resolve file URL
                $path = $signature->signed_file_path
                    ?: ($surat->file_pdf_path ?: $surat->file_draft_path);
                if ($path) {
                    $fileUrl = url('/api/getfile/' . ltrim($path, '/'));
                    $absolutePath = storage_path('app/' . ltrim($path, '/'));
                    if (is_file($absolutePath)) {
                        $currentHash = hash_file('sha256', $absolutePath);
                        $integrityValid = hash_equals(
                            (string) $signature->hash_file,
                            (string) $currentHash
                        );
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'found' => true,
                'signature' => [
                    'id' => $signature->id_digital_signature,
                    'source_type' => $signature->source_type,
                    'source_id' => $signature->source_id,
                    'certificate_serial' => $signature->certificate_serial,
                    'qr_code_path' => $signature->qr_code_path,
                    'qr_code_url' => $signature->qr_code_path
                        ? url('api/getfile/' . ltrim($signature->qr_code_path, '/'))
                        : null,
                    'qr_code_svg_base64' => $signature->qr_code_path
                        ? 'data:image/svg+xml;base64,' . base64_encode(Storage::get($signature->qr_code_path) ?: '')
                        : null,
                    'signed_at' => $signature->signed_at,
                    'verification_url' => $signature->verification_url,
                    'hash_file' => $signature->hash_file,
                    'integrity_valid' => $integrityValid,
                ],
                'surat' => $surat ? [
                    'id' => $surat->id_surat_keluar,
                    'nomor_surat' => $surat->nomor_surat,
                    'kode_draft' => $surat->kode_draft,
                    'perihal' => $surat->perihal,
                    'jenis' => $surat->jenis ?? $surat->jenis_surat,
                    'status' => $surat->status,
                    'tanggal_surat' => $surat->tanggal_surat,
                    'file_url' => $fileUrl,
                ] : null,
                'signer' => $signer ? [
                    'id' => $signer->id_user,
                    'name' => $signer->name ?? $signer->nama ?? $signer->email,
                    'email' => $signer->email,
                    'jabatan' => $signer->jabatan ?? $signer->nama_jabatan,
                ] : null,
            ],
        ]);
    }
}
