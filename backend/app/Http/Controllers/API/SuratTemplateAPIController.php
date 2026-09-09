<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Services\EOffice\MicrosoftGraphService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

class SuratTemplateAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\SuratTemplate;
    }

    protected function prepareFrontendPayload(Request $request, string $mode): array
    {
        $payload = $request->all();

        // File locations and Office links are server-managed values. Never
        // accept an arbitrary storage path or Office URL from a CRUD payload.
        unset($payload['file_path'], $payload['pdf_path'], $payload['file_name'], $payload['office365_document_url']);

        if (!empty($payload['nama_template']) && empty($payload['nama'])) {
            $payload['nama'] = $payload['nama_template'];
        }

        // Jenis pada template harus selalu berasal dari Master Jenis Surat
        // yang masih aktif. Surat keluar kemudian mengambil nilai ini secara
        // otomatis saat template dipilih.
        $jenisNama = trim((string) ($payload['jenis_surat'] ?? ''));
        $jenis = $jenisNama === '' ? null : DB::table('master_jenis_surat')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->whereRaw('LOWER(nama) = ?', [mb_strtolower($jenisNama)])
            ->first(['nama']);

        if (!$jenis) {
            throw ValidationException::withMessages([
                'jenis_surat' => 'Jenis surat wajib dipilih dari Master Jenis Surat yang aktif.',
            ]);
        }

        $payload['jenis_surat'] = $jenis->nama;

        if (empty($payload['kode'])) {
            $payload['kode'] = 'TPL-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(4));
        }

        if ($request->hasFile('file_template')) {
            $request->validate([
                'file_template' => ['file', 'max:10240', 'mimes:doc,docx,pdf'],
            ]);

            $file = $request->file('file_template');
            $filename = now()->format('YmdHis') . '_' . Str::random(8) . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
            $extension = $file->getClientOriginalExtension();

            if ($extension) {
                $filename .= '.' . strtolower($extension);
            }

            $path = $file->storeAs('surat_template', $filename);
            $payload['file_path'] = $path;
            $payload['file_name'] = $file->getClientOriginalName();
            $payload['file_template'] = $file->getClientOriginalName();
        } elseif (!empty($payload['file_template']) && empty($payload['file_name']) && is_string($payload['file_template'])) {
            $payload['file_name'] = basename($payload['file_template']);
        }

        if (array_key_exists('drive_document_url', $payload)) {
            $driveUrl = trim((string) $payload['drive_document_url']);
            if ($driveUrl === '') {
                $payload['drive_document_url'] = null;
            } else {
                $normalizedUrl = $this->normalizeGoogleDriveUrl($driveUrl);
                if (!$normalizedUrl) {
                    throw ValidationException::withMessages([
                        'drive_document_url' => 'URL Google Drive tidak valid.',
                    ]);
                }

                $payload['drive_document_url'] = $normalizedUrl;
            }
        }

        if (array_key_exists('status', $payload) && !array_key_exists('is_active', $payload)) {
            $payload['is_active'] = in_array(strtolower((string) $payload['status']), ['active', 'aktif', 'published', '1', 'true'], true);
        }

        if (!array_key_exists('status', $payload)) {
            $payload['status'] = !empty($payload['is_active']) ? 'active' : 'draft';
        }

        if (!array_key_exists('is_default', $payload)) {
            $payload['is_default'] = false;
        }

        return $payload;
    }

    protected function transformFrontendRecord($record): array
    {
        $data = is_array($record)
            ? $record
            : (method_exists($record, 'toArray') ? $record->toArray() : (array) $record);
        $data['nama_template'] = $data['nama_template'] ?? ($data['nama'] ?? null);
        $data['file_template'] = $data['file_template'] ?? ($data['file_name'] ?? null);

        if (!empty($data['file_path']) && !Storage::exists($data['file_path'])) {
            $data['file_exists'] = false;
        }

        return $data;
    }

    public function convertToPdf(Request $request, int|string $id)
    {
        $template = $this->model->where($this->model->primaryKey, $id)->first();

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template surat tidak ditemukan.',
            ], 404);
        }

        if (empty($template->file_path) || !Storage::exists($template->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File Word template belum tersedia.',
            ], 422);
        }

        $extension = strtolower(pathinfo($template->file_path, PATHINFO_EXTENSION));
        if (!in_array($extension, ['doc', 'docx'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Konversi PDF hanya untuk file Word (.doc/.docx).',
            ], 422);
        }

        $binary = (new ExecutableFinder())->find('soffice') ?: (new ExecutableFinder())->find('libreoffice');
        if (!$binary) {
            return response()->json([
                'success' => false,
                'message' => 'LibreOffice/soffice belum tersedia di server untuk konversi PDF.',
            ], 422);
        }

        $sourcePath = Storage::path($template->file_path);
        $outputDir = storage_path('app/surat_template/pdf');
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $process = new Process([
            $binary,
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            $outputDir,
            $sourcePath,
        ]);
        $process->setTimeout(120);
        $process->run();

        if (!$process->isSuccessful()) {
            \Log::error('Konversi template ke PDF gagal.', [
                'id_surat_template' => $template->{$template->primaryKey} ?? null,
                'exit_code' => $process->getExitCode(),
                'error_output' => trim($process->getErrorOutput() ?: $process->getOutput()),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengonversi template ke PDF.',
            ], 422);
        }

        $convertedName = pathinfo($template->file_path, PATHINFO_FILENAME) . '.pdf';
        $convertedPath = $outputDir . DIRECTORY_SEPARATOR . $convertedName;

        if (!is_file($convertedPath)) {
            return response()->json([
                'success' => false,
                'message' => 'PDF hasil konversi tidak ditemukan.',
            ], 422);
        }

        $targetPath = 'surat_template/pdf/' . now()->format('YmdHis') . '_' . Str::slug(pathinfo($template->file_name ?: $template->file_path, PATHINFO_FILENAME)) . '.pdf';
        Storage::put($targetPath, file_get_contents($convertedPath));
        @unlink($convertedPath);

        DB::table($template->getTable())
            ->where($template->primaryKey, $template->{$template->primaryKey})
            ->update([
                'pdf_path' => $targetPath,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Template berhasil dikonversi ke PDF.',
            'data' => $this->transformFrontendRecord($this->model->where($this->model->primaryKey, $id)->first()),
        ]);
    }

    /**
     * Get list of available letter types (jenis surat)
     * Used for surat keluar jenis surat dropdown
     */
    public function jenisOptions(): \Illuminate\Http\JsonResponse
    {
        // Template hanya boleh menggunakan jenis yang telah didefinisikan
        // pada Master Jenis Surat. Jangan gabungkan nilai dari template
        // sebelumnya karena itu menyebabkan opsi ganda/tidak valid.
        try {
            $jenis = \Illuminate\Support\Facades\DB::table('master_jenis_surat')
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->orderBy('nama')
                ->get(['id_jenis_surat', 'nama'])
                ->map(fn ($item) => [
                    'value' => $item->nama,
                    'label' => $item->nama,
                    'id_jenis_surat' => $item->id_jenis_surat,
                ])
                ->all();

            return response()->json([
                'success' => true,
                'data' => $jenis,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }
    }

    /**
     * Connect a Google Drive document URL to the template.
     * User provides a Google Docs/Drive URL; we validate and normalize it to an edit URL.
     *
     * POST /api/surat_template/create-google-drive-link
     * Body: { drive_document_url: "https://drive.google.com/..." }
     */
    public function createGoogleDriveLink(Request $request)
    {
        $driveUrl = $request->input('drive_document_url');

        if (empty($driveUrl)) {
            return response()->json([
                'success' => false,
                'message' => 'URL Google Drive harus diisi.',
            ], 422);
        }

        // Normalize Google Drive URL to edit URL
        $normalizedUrl = $this->normalizeGoogleDriveUrl($driveUrl);

        if (!$normalizedUrl) {
            return response()->json([
                'success' => false,
                'message' => 'URL Google Drive tidak valid. Pastikan ini adalah tautan dokumen Google Docs.',
            ], 422);
        }

        // If template_id is provided, update the existing template
        $templateId = $request->input('template_id');
        $result = [
            'success' => true,
            'message' => 'Link Google Drive berhasil disimpan.',
            'drive_document_url' => $normalizedUrl,
        ];

        if ($templateId) {
            $template = $this->model->where($this->model->primaryKey, $templateId)->first();
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template tidak ditemukan.',
                ], 404);
            }
            DB::table($template->getTable())
                ->where($template->primaryKey, $template->{$template->primaryKey})
                ->update([
                    'drive_document_url' => $normalizedUrl,
                    'updated_at' => now(),
                ]);
            $result['data'] = $this->transformFrontendRecord($this->model->where($this->model->primaryKey, $templateId)->first());
        }

        return response()->json($result);
    }

    /**
     * Normalize various Google Drive/Docs URLs to an edit URL.
     */
    private function normalizeGoogleDriveUrl(string $url): ?string
    {
        // Extract file ID from various Google Drive/Docs URL formats
        $patterns = [
            // https://docs.google.com/document/d/FILE_ID/edit
            '/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/',
            // https://drive.google.com/file/d/FILE_ID/view
            '/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/',
            // https://drive.google.com/open?id=FILE_ID
            '/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/',
            // https://docs.google.com/document/d/FILE_ID/view
            '/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                $fileId = $matches[1];
                // Return the edit URL in Google Docs
                return "https://docs.google.com/document/d/{$fileId}/edit";
            }
        }

        return null;
    }

    public function createOfficeLink(Request $request, int|string $id, MicrosoftGraphService $graph)
    {
        $template = $this->model->where($this->model->primaryKey, $id)->first();

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template surat tidak ditemukan.',
            ], 404);
        }

        if (empty($template->file_path) || !Storage::exists($template->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File Word template belum tersedia.',
            ], 422);
        }

        $extension = strtolower(pathinfo($template->file_path, PATHINFO_EXTENSION));
        if (!in_array($extension, ['doc', 'docx'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Office 365 collaborative editing hanya mendukung file Word (.doc/.docx).',
            ], 422);
        }

        try {
            $targetName = ($template->file_name ?: ($template->nama ?: 'template-surat') . '.' . $extension);
            $result = $graph->uploadAndCreateEditLink(
                Storage::path($template->file_path),
                $targetName,
                trim(config('office365.folder_path'), '/') . '/Template Surat'
            );
        } catch (\Throwable $exception) {
            \Log::error('Upload template ke Office 365 gagal: ' . $exception->getMessage(), [
                'id_surat_template' => $template->{$template->primaryKey} ?? null,
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah file ke Office 365.',
            ], 422);
        }

        DB::table($template->getTable())
            ->where($template->primaryKey, $template->{$template->primaryKey})
            ->update([
                'office365_document_url' => $result['web_url'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Link Office 365 berhasil dibuat.',
            'data' => $this->transformFrontendRecord($this->model->where($this->model->primaryKey, $id)->first()),
            'office365' => $result,
        ]);
    }

    /**
     * Seed default surat templates into the database.
     * POST /api/surat_template/seed-defaults
     * Only inserts if the table is empty.
     */
    public function seedDefaults(): JsonResponse
    {
        $existingCount = DB::table('surat_template')->whereNull('deleted_at')->count();
        if ($existingCount > 0) {
            return response()->json([
                'success' => true,
                'message' => "Table sudah memiliki {$existingCount} template. Tidak ada yang ditambahkan.",
                'seeded' => 0,
            ]);
        }

        $now = now();
        $userId = auth()->id() ?? 1;
        $userName = auth()->user()->name ?? 'System';

        $templates = [
            ['kode' => 'TPL-UNDANGAN-001',   'nama' => 'Surat Undangan',           'jenis_surat' => 'Surat Undangan',           'deskripsi' => 'Template surat undangan umum.', 'is_default' => true,  'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-UNDANGAN-RAPAT', 'nama' => 'Surat Undangan Rapat',     'jenis_surat' => 'Surat Undangan',           'deskripsi' => 'Template surat undangan rapat.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-TUGAS-001',      'nama' => 'Surat Tugas',              'jenis_surat' => 'Surat Tugas',              'deskripsi' => 'Template surat tugas.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-SK-001',         'nama' => 'Surat Keputusan',          'jenis_surat' => 'Surat Keputusan',          'deskripsi' => 'Template surat keputusan.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-EDARAN-001',     'nama' => 'Surat Edaran',            'jenis_surat' => 'Surat Edaran',            'deskripsi' => 'Template surat edaran.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-PEMBERITAHUAN',  'nama' => 'Surat Pemberitahuan',      'jenis_surat' => 'Surat Pemberitahuan',      'deskripsi' => 'Template surat pemberitahuan.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-PERMOHONAN-001', 'nama' => 'Surat Permohonan',         'jenis_surat' => 'Surat Permohonan',         'deskripsi' => 'Template surat permohonan.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-NOTA-001',       'nama' => 'Nota Dinas',              'jenis_surat' => 'Nota Dinas',              'deskripsi' => 'Template nota dinas.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-MEMO-001',       'nama' => 'Memo Internal',            'jenis_surat' => 'Memo Internal',            'deskripsi' => 'Template memo internal.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-PENGANTAR-001',  'nama' => 'Surat Pengantar',         'jenis_surat' => 'Surat Pengantar',         'deskripsi' => 'Template surat pengantar.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
            ['kode' => 'TPL-KETERANGAN-001','nama' => 'Surat Keterangan',        'jenis_surat' => 'Surat Keterangan',        'deskripsi' => 'Template surat keterangan.', 'is_default' => false, 'is_active' => true, 'status' => 'active'],
        ];

        $inserted = 0;
        foreach ($templates as $tpl) {
            DB::table('surat_template')->insert([
                'kode' => $tpl['kode'],
                'nama' => $tpl['nama'],
                'nama_template' => $tpl['nama'],
                'jenis_surat' => $tpl['jenis_surat'],
                'deskripsi' => $tpl['deskripsi'],
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => $tpl['is_default'],
                'is_active' => $tpl['is_active'],
                'status' => $tpl['status'],
                'metadata' => null,
                'created_by' => $userId,
                'updated_by' => $userId,
                'deleted_by' => null,
                'created_by_desc' => $userName,
                'updated_by_desc' => $userName,
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ]);
            $inserted++;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil menambahkan {$inserted} template surat default.",
            'seeded' => $inserted,
        ]);
    }

    /**
     * Get list of all templates — accessible to all authenticated users.
     * No menu permission required (unlike the standard resource routes).
     * Used by Pegawai/Employee users to populate the template dropdown in Surat Keluar.
     */
    public function templateList(): \Illuminate\Http\JsonResponse
    {
        try {
            $templates = DB::table('surat_template')
                ->whereNull('deleted_at')
                ->orderBy('nama', 'asc')
                ->get();

            \Log::info('[templateList] Count: ' . $templates->count() . ' | First: ' . ($templates->first()->nama ?? 'none'));

            return response()->json([
                'success' => true,
                'data' => $templates,
                'total' => $templates->count(),
            ]);
        } catch (\Throwable $e) {
            \Log::error('[templateList] Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat template: ' . $e->getMessage(),
                'data' => [],
            ], 500);
        }
    }
}
