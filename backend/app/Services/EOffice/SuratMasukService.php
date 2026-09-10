<?php

namespace App\Services\EOffice;

use App\Models\AiDocumentJob;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SuratMasukService
{
    public const SOURCE_TYPES = ['AI', 'Manual'];
    public const AI_STATUSES = ['berhasil', 'gagal', 'belum_diproses'];
    public const STATUSES = [
        'baru',
        'diproses',
        'menunggu_disposisi',
        'selesai',
        'ai_gagal',
        'manual_input',
    ];

    private const LEGACY_STATUS_MAP = [
        'new' => 'baru',
        'draft' => 'baru',
        'pending' => 'baru',
        'masuk' => 'baru',
        'distributed' => 'menunggu_disposisi',
        'didistribusikan' => 'menunggu_disposisi',
        'didisposisikan' => 'menunggu_disposisi',
        'read' => 'diproses',
        'done' => 'selesai',
        'archived' => 'selesai',
        'arsip' => 'selesai',
    ];

    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    public function normalizePayload(Request $request, string $mode): array
    {
        $payload = $request->except([
            'file_surat',
            'lampiran',
            'file',
            'run_ocr',
            'process_ocr',
            'ocr',
        ]);

        $aliases = [
            'pengirim' => 'asal_surat',
            'penerima' => 'kepada_tujuan',
            'isi' => 'isi_ringkasan',
            'ringkasan' => 'isi_ringkasan',
            'sumber_data' => 'source_type',
            'deadline' => 'tenggat_waktu',
        ];

        foreach ($aliases as $from => $to) {
            if (
                array_key_exists($from, $payload)
                && !array_key_exists($to, $payload)
                && $payload[$from] !== null
                && $payload[$from] !== ''
            ) {
                $payload[$to] = $payload[$from];
            }
        }

        foreach (['file_surat', 'lampiran', 'file'] as $field) {
            $value = $request->input($field);
            if (is_string($value) && $value !== '' && !array_key_exists('file_surat', $payload)) {
                $payload['file_surat'] = $this->validateExistingAttachmentPath($value);
            }
        }

        if (array_key_exists('source_type', $payload)) {
            $payload['source_type'] = $this->normalizeSourceType($payload['source_type']);
        } elseif ($mode === 'store') {
            $payload['source_type'] = 'Manual';
        }

        if (array_key_exists('ai_status', $payload)) {
            $payload['ai_status'] = $this->normalizeAiStatus($payload['ai_status']);
        } elseif ($mode === 'store') {
            $payload['ai_status'] = 'belum_diproses';
        }

        if (array_key_exists('status', $payload)) {
            $payload['status'] = $this->normalizeStatus($payload['status']);
        } elseif ($mode === 'store') {
            $payload['status'] = 'baru';
        }

        return $payload;
    }

    public function storeIncomingAttachment(Request $request): ?array
    {
        foreach (['file_surat', 'lampiran', 'file'] as $field) {
            if ($request->hasFile($field)) {
                return $this->storeUploadedFile($request->file($field));
            }

            $value = $request->input($field);

            // Handle base64 array object {src, type, name}
            if (is_array($value) && !empty($value['src'])) {
                return $this->storeBase64File($value);
            }

            // Handle JSON string (from axios JSON POST)
            if (is_string($value) && Str::startsWith(trim($value), '{')) {
                $decoded = json_decode($value, true);
                if (is_array($decoded) && !empty($decoded['src'])) {
                    return $this->storeBase64File($decoded);
                }
            }
        }

        return null;
    }

    public function getOcrInput(Request $request): mixed
    {
        // Priority 1: actual file upload (multipart/form-data)
        foreach (['file_surat', 'lampiran', 'file'] as $field) {
            if ($request->hasFile($field)) {
                return $request->file($field);
            }
        }

        // Priority 2: JSON body with base64 object {src, type, name}
        // OR a string path to an existing stored file
        foreach (['file_surat', 'lampiran', 'file'] as $field) {
            $value = $request->input($field);
            if ($value !== null && $value !== '') {
                // If it's a JSON string (from axios JSON POST), decode it
                if (is_string($value) && Str::startsWith(trim($value), '{')) {
                    $decoded = json_decode($value, true);
                    if (is_array($decoded) && !empty($decoded)) {
                        return $decoded;
                    }
                }
                // If it's already a decoded array (Laravel handles JSON body decoding)
                if (is_array($value)) {
                    return $value;
                }
                // If it's a string path
                if (is_string($value)) {
                    return $value;
                }
            }
        }

        return null;
    }

    public function isOcrRequested(Request $request): bool
    {
        foreach (['run_ocr', 'process_ocr', 'ocr'] as $field) {
            if ($request->has($field) && filter_var($request->input($field), FILTER_VALIDATE_BOOLEAN)) {
                return true;
            }
        }

        return false;
    }

    public function runOcr(mixed $file): array
    {
        $preparedFile = $this->prepareOcrFile($file);
        $fields = $this->extractWithGemini($preparedFile);
        $normalized = $this->normalizeOcrFields($fields);
        $normalized['source_type'] = 'AI';
        $normalized['ai_status'] = 'berhasil';

        return [
            'fields' => $normalized,
            'prepared_file' => $preparedFile,
        ];
    }

    public function mergeOcrFields(array $payload, array $fields): array
    {
        foreach ($fields as $field => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (!array_key_exists($field, $payload) || $payload[$field] === null || $payload[$field] === '') {
                $payload[$field] = $value;
            }
        }

        $payload['source_type'] = 'AI';
        $payload['ai_status'] = 'berhasil';

        return $payload;
    }

    public function markOcrFailureForPayload(array $payload, \Throwable $exception): array
    {
        $payload['source_type'] = $payload['source_type'] ?? 'Manual';
        $payload['ai_status'] = 'gagal';

        if (empty($payload['status']) || $payload['status'] === 'baru') {
            $payload['status'] = 'ai_gagal';
        }

        $payload['catatan'] = trim(($payload['catatan'] ?? '') . "\nAI OCR gagal: " . $exception->getMessage());

        return $payload;
    }

    public function recordAiJob(
        string $status,
        ?array $preparedFile = null,
        ?array $fields = null,
        ?string $errorMessage = null,
        int|string|null $sourceId = null
    ): void {
        if (!Schema::hasTable('ai_document_job')) {
            return;
        }

        AiDocumentJob::create([
            'job_type' => 'surat_masuk_ocr',
            'source_type' => 'surat_masuk',
            'source_id' => $sourceId,
            'file_path' => $preparedFile['path'] ?? null,
            'extracted_text' => $fields['raw_text'] ?? null,
            'summary' => $fields['isi_ringkasan'] ?? null,
            'result_payload' => $fields,
            'status' => $status,
            'error_message' => $errorMessage,
            'created_by' => auth()->user()?->id_user,
        ]);
    }

    public function generateNomorAgenda(): string
    {
        $year = now()->format('Y');
        $month = now()->format('m');
        $prefix = "SM/{$year}/{$month}/";

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::select('select pg_advisory_xact_lock(?)', [
                (int) ($year . $month),
            ]);
        }

        $lastSequence = DB::table('surat_masuk')
            ->where('nomor_agenda', 'like', $prefix . '%')
            ->pluck('nomor_agenda')
            ->reduce(function (int $max, ?string $nomorAgenda) use ($prefix) {
                if ($nomorAgenda && preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/', $nomorAgenda, $matches)) {
                    return max($max, (int) $matches[1]);
                }

                return $max;
            }, 0);

        return $prefix . str_pad((string) ($lastSequence + 1), 3, '0', STR_PAD_LEFT);
    }

    public function normalizeStatus(mixed $status): string
    {
        $normalized = Str::of((string) $status)->lower()->replace([' ', '-'], '_')->toString();
        $normalized = self::LEGACY_STATUS_MAP[$normalized] ?? $normalized;

        if (!in_array($normalized, self::STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'Status surat masuk tidak valid.',
            ]);
        }

        return $normalized;
    }

    public function validateStatusTransition(?string $currentStatus, string $nextStatus): void
    {
        $current = $currentStatus ? $this->normalizeStatus($currentStatus) : 'baru';
        $next = $this->normalizeStatus($nextStatus);

        if ($current === $next) {
            return;
        }

        $allowed = [
            'baru' => ['diproses', 'menunggu_disposisi', 'selesai', 'ai_gagal', 'manual_input'],
            'ai_gagal' => ['manual_input', 'diproses'],
            'manual_input' => ['diproses', 'menunggu_disposisi', 'selesai'],
            'diproses' => ['menunggu_disposisi', 'selesai'],
            'menunggu_disposisi' => ['diproses', 'selesai'],
            'selesai' => [],
        ];

        if (!in_array($next, $allowed[$current] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => "Perubahan status dari {$current} ke {$next} tidak diperbolehkan.",
            ]);
        }
    }

    public function normalizeSourceType(mixed $sourceType): string
    {
        $normalized = Str::of((string) $sourceType)->lower()->trim()->toString();

        return match ($normalized) {
            'ai' => 'AI',
            'manual' => 'Manual',
            default => throw ValidationException::withMessages([
                'source_type' => 'Source type harus AI atau Manual.',
            ]),
        };
    }

    public function normalizeAiStatus(mixed $status): string
    {
        $normalized = Str::of((string) $status)->lower()->replace([' ', '-'], '_')->toString();
        $normalized = match ($normalized) {
            'success', 'sukses' => 'berhasil',
            'failed', 'fail' => 'gagal',
            'pending', 'belum' => 'belum_diproses',
            default => $normalized,
        };

        if (!in_array($normalized, self::AI_STATUSES, true)) {
            throw ValidationException::withMessages([
                'ai_status' => 'AI status tidak valid.',
            ]);
        }

        return $normalized;
    }

    public function fileInfo(?string $path): ?array
    {
        if (!$path) {
            return null;
        }

        $normalizedPath = ltrim($path, '/');
        $exists = Storage::exists($normalizedPath);

        return [
            'path' => $normalizedPath,
            'name' => basename($normalizedPath),
            'size' => $exists ? Storage::size($normalizedPath) : null,
            'mime_type' => $exists ? Storage::mimeType($normalizedPath) : null,
            'url' => url('/api/getfile/' . $normalizedPath),
            'exists' => $exists,
        ];
    }

    public function filterFillable(array $payload, array $fillable): array
    {
        return collect($payload)->only($fillable)->all();
    }

    private function storeUploadedFile(UploadedFile $file): array
    {
        $this->validateUpload($file->getSize(), $file->getMimeType() ?: $file->getClientMimeType());

        $filename = $this->safeFilename($file->getClientOriginalName() ?: 'surat-masuk');
        $path = $file->storeAs('surat_masuk', $filename);

        return [
            'path' => $path,
            'info' => $this->fileInfo($path),
        ];
    }

    private function storeBase64File(array $file): array
    {
        $src = (string) ($file['src'] ?? '');
        $encoded = str_contains($src, ',') ? explode(',', $src, 2)[1] : $src;
        $binary = base64_decode($encoded, true);

        if ($binary === false) {
            throw ValidationException::withMessages([
                'file_surat' => 'Format file lampiran tidak valid.',
            ]);
        }

        $mimeType = $file['type'] ?? (new \finfo(FILEINFO_MIME_TYPE))->buffer($binary);
        $this->validateUpload(strlen($binary), $mimeType);

        $filename = $this->safeFilename((string) ($file['name'] ?? 'surat-masuk'));
        $path = 'surat_masuk/' . $filename;

        Storage::put($path, $binary);

        return [
            'path' => $path,
            'info' => $this->fileInfo($path),
        ];
    }

    private function validateUpload(?int $size, ?string $mimeType): void
    {
        if (!$mimeType || !in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw ValidationException::withMessages([
                'file_surat' => 'Tipe file lampiran tidak didukung.',
            ]);
        }

        if (($size ?? 0) > $this->maxUploadBytes()) {
            throw ValidationException::withMessages([
                'file_surat' => 'Ukuran file lampiran melebihi batas maksimal.',
            ]);
        }
    }

    private function maxUploadBytes(): int
    {
        return (int) env('EOFFICE_SURAT_MAX_UPLOAD_KB', 10240) * 1024;
    }

    private function safeFilename(string $originalName): string
    {
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $basename = pathinfo($originalName, PATHINFO_FILENAME) ?: 'surat-masuk';
        $filename = now()->format('YmdHis') . '_' . Str::random(8) . '_' . Str::slug($basename);

        return $extension ? "{$filename}.{$extension}" : $filename;
    }

    private function validateExistingAttachmentPath(string $path): string
    {
        $path = ltrim($path, '/');

        if (Str::contains($path, ['..', '\\']) || Str::startsWith($path, ['/'])) {
            throw ValidationException::withMessages([
                'file_surat' => 'Path lampiran tidak valid.',
            ]);
        }

        return $path;
    }

    protected function prepareOcrFile(mixed $file): array
    {
        if ($file instanceof UploadedFile) {
            $this->validateUpload($file->getSize(), $file->getMimeType() ?: $file->getClientMimeType());

            return [
                'data' => base64_encode((string) file_get_contents($file->getRealPath())),
                'mime_type' => $file->getMimeType() ?: $file->getClientMimeType(),
                'name' => $file->getClientOriginalName(),
                'path' => null,
            ];
        }

        if (is_array($file) && !empty($file['src'])) {
            $src = (string) $file['src'];
            $encoded = str_contains($src, ',') ? explode(',', $src, 2)[1] : $src;
            $binary = base64_decode($encoded, true);

            if ($binary === false) {
                throw new \RuntimeException('Format file lampiran tidak valid.');
            }

            $mimeType = $file['type'] ?? (new \finfo(FILEINFO_MIME_TYPE))->buffer($binary);
            $this->validateUpload(strlen($binary), $mimeType);

            return [
                'data' => base64_encode($binary),
                'mime_type' => $mimeType,
                'name' => $file['name'] ?? 'lampiran-surat',
                'path' => null,
            ];
        }

        if (is_string($file) && $file !== '') {
            $path = storage_path('app/' . ltrim($this->validateExistingAttachmentPath($file), '/'));

            if (!is_file($path)) {
                throw new \RuntimeException('File lampiran tidak ditemukan di storage.');
            }

            $mimeType = mime_content_type($path) ?: 'application/octet-stream';
            $this->validateUpload(filesize($path), $mimeType);

            return [
                'data' => base64_encode((string) file_get_contents($path)),
                'mime_type' => $mimeType,
                'name' => basename($path),
                'path' => $file,
            ];
        }

        throw new \RuntimeException('Lampiran surat tidak valid.');
    }

    protected function extractWithGemini(array $file): array
    {
        $apiKey = (string) config('services.gemini.api_key');
        if (!$apiKey) {
            throw new \RuntimeException('Token Gemini belum dikonfigurasi di backend.');
        }

        $model = config('services.gemini.model');
        $baseUrl = rtrim(config('services.gemini.base_url'), '/');
        $url = "{$baseUrl}/models/{$model}:generateContent";

        $client = new Client([
            'timeout' => config('services.gemini.timeout', 60),
        ]);

        $requestOptions = [
            'json' => [
                'contents' => [[
                    'role' => 'user',
                    'parts' => [
                        ['text' => $this->ocrPrompt()],
                        [
                            'inline_data' => [
                                'mime_type' => $file['mime_type'],
                                'data' => $file['data'],
                            ],
                        ],
                    ],
                ]],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ],
        ];

        $authMode = config('services.gemini.auth_mode', 'api_key');
        if ($authMode !== 'bearer') {
            $requestOptions['query'] = ['key' => $apiKey];
        } else {
            $requestOptions['headers'] = ['Authorization' => 'Bearer ' . $apiKey];
        }

        $response = null;
        $maxAttempts = 3;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $response = $client->post($url, $requestOptions);
                break;
            } catch (RequestException $exception) {
                $statusCode = $exception->getResponse()?->getStatusCode();
                $isTemporaryFailure = $statusCode === 429 || ($statusCode !== null && $statusCode >= 500);

                if (!$isTemporaryFailure || $attempt === $maxAttempts) {
                    throw $exception;
                }

                // Gemini dapat mengembalikan 503 saat kapasitas model sedang
                // penuh. Tunggu singkat lalu ulangi dengan request yang sama.
                $retryAfter = (int) ($exception->getResponse()?->getHeaderLine('Retry-After') ?: 0);
                $delaySeconds = $retryAfter > 0 ? min($retryAfter, 10) : $attempt;
                \Log::warning('OCR Gemini gagal sementara; mencoba ulang.', [
                    'attempt' => $attempt,
                    'status_code' => $statusCode,
                    'retry_in_seconds' => $delaySeconds,
                ]);
                usleep($delaySeconds * 1_000_000);
            }
        }

        $payload = json_decode((string) $response->getBody(), true);
        $text = $payload['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!$text) {
            throw new \RuntimeException('Gemini tidak mengembalikan hasil OCR.');
        }

        $decoded = json_decode($text, true);
        if (!is_array($decoded)) {
            $decoded = json_decode($this->extractJsonObject($text), true);
        }

        if (!is_array($decoded)) {
            throw new \RuntimeException('Format hasil OCR dari Gemini tidak valid.');
        }

        return $decoded;
    }

    private function ocrPrompt(): string
    {
        return implode("\n", [
            'Kamu adalah OCR dan parser surat masuk Indonesia.',
            'Baca lampiran surat, lalu isi field form surat masuk.',
            'Kembalikan JSON valid saja tanpa markdown.',
            'Gunakan string kosong jika informasi tidak ditemukan.',
            'Tanggal harus format YYYY-MM-DD jika bisa dikenali.',
            'Field JSON wajib:',
            'nomor_agenda, nomor_surat, jenis, tanggal_surat, tenggat_waktu, asal_surat, kepada_tujuan, unit_kerja, sifat, topik, particulars, tanggal_terima, isi_ringkasan, tembusan, catatan, raw_text.',
            'jenis pilih salah satu bila cocok: Surat Pengumuman, Surat Undangan, Surat Permohonan, Surat Pemberitahuan, Surat Tugas.',
            'sifat pilih salah satu bila cocok: Biasa, Penting, Rahasia, Segera, Sangat Segera.',
            'topik pilih salah satu bila cocok: Kelembagaan, Akademik, Keuangan, Umum, SDM.',
            'isi_ringkasan berisi ringkasan pendek isi surat.',
        ]);
    }

    private function extractJsonObject(string $text): string
    {
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start === false || $end === false || $end <= $start) {
            return $text;
        }

        return substr($text, $start, $end - $start + 1);
    }

    private function normalizeOcrFields(array $fields): array
    {
        $allowed = [
            'nomor_agenda',
            'nomor_surat',
            'jenis',
            'tanggal_surat',
            'tenggat_waktu',
            'asal_surat',
            'kepada_tujuan',
            'unit_kerja',
            'sifat',
            'topik',
            'perihal',
            'tanggal_terima',
            'isi_ringkasan',
            'tembusan',
            'catatan',
            'raw_text',
        ];

        $normalized = [];
        foreach ($allowed as $field) {
            $value = $fields[$field] ?? '';
            $normalized[$field] = is_scalar($value) ? (string) $value : json_encode($value);
        }

        return $normalized;
    }
}
