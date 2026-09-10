<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Http\Controllers\BaseResourceController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SuratArsipAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\SuratArsip;
    }

    /**
     * Create an archive directly from its source letter.
     * Archive metadata is always sourced from the selected surat, so users do
     * not need to retype the letter number, subject, or file location.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = Validator::make($request->all(), [
            'jenis_surat' => 'required|in:surat_masuk,surat_keluar',
            'id_surat_masuk' => 'nullable',
            'id_surat_keluar' => 'nullable',
            'lokasi_fisik' => 'nullable|string|max:255',
            'tanggal_arsip' => 'nullable|date',
        ])->validate();

        $isSuratMasuk = $payload['jenis_surat'] === 'surat_masuk';
        $sourceId = $payload[$isSuratMasuk ? 'id_surat_masuk' : 'id_surat_keluar'] ?? null;

        if (!$sourceId) {
            return response()->json([
                'success' => false,
                'message' => $isSuratMasuk
                    ? 'Pilih ID Surat Masuk yang akan diarsipkan.'
                    : 'Pilih ID Surat Keluar yang akan diarsipkan.',
            ], 422);
        }

        $source = $isSuratMasuk
            ? \App\Models\SuratMasuk::find($sourceId)
            : \App\Models\SuratKeluar::find($sourceId);

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' => 'Surat sumber tidak ditemukan.',
            ], 404);
        }

        $sourceColumn = $isSuratMasuk ? 'id_surat_masuk' : 'id_surat_keluar';
        $alreadyArchived = $this->model
            ->where('jenis_surat', $payload['jenis_surat'])
            ->where($sourceColumn, $sourceId)
            ->whereNull('deleted_at')
            ->exists();

        if ($alreadyArchived) {
            return response()->json([
                'success' => false,
                'message' => 'Surat ini sudah ada di arsip.',
            ], 409);
        }

        $filePath = $isSuratMasuk
            ? $source->file_surat
            : ($source->file_pdf_path ?: $source->file_draft_path);

        $record = $this->model->create([
            'jenis_surat' => $payload['jenis_surat'],
            'jenis_pengiriman' => $source->jenis_pengiriman
                ?? ($isSuratMasuk && $source->id_surat_keluar ? 'internal' : 'eksternal'),
            'id_surat_masuk' => $isSuratMasuk ? $sourceId : null,
            'id_surat_keluar' => $isSuratMasuk ? null : $sourceId,
            'nomor_surat' => $source->nomor_surat,
            'perihal' => $source->perihal,
            'file_path' => $filePath,
            'hash_file' => $filePath && is_file(storage_path('app/' . ltrim($filePath, '/')))
                ? hash_file('sha256', storage_path('app/' . ltrim($filePath, '/')))
                : null,
            'lokasi_fisik' => $payload['lokasi_fisik'] ?? null,
            'tanggal_arsip' => $payload['tanggal_arsip'] ?? now()->toDateString(),
            'created_by' => auth()->user()?->id_user,
            'created_by_desc' => auth()->user()?->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Arsip surat berhasil dibuat otomatis.',
            'data' => $record,
        ], 201);
    }
}
