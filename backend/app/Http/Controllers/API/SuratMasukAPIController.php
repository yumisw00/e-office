<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Http\Controllers\BaseResourceController;
use App\Models\SuratMasuk;
use App\Services\EOffice\SuratMasukService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class SuratMasukAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct(private SuratMasukService $suratMasukService)
    {
        $this->model = new SuratMasuk;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $pageSize = max(1, min((int) ($request->get('pagesize') ?? $request->get('per_page') ?? 20), 100));

            $query = $this->scopedQuery($request);
            $categorySummary = $this->buildCategorySummary(clone $query);
            $this->applyFilters($query, $request);
            $summary = $this->buildSummary($query);
            $this->applyListOrdering($query, $request);

            $paginator = $query->paginate($pageSize);
            $items = collect($paginator->items())
                ->map(fn ($record) => $this->transformFrontendRecord($record))
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil diambil.',
                'data' => $items,
                'result' => $items,
                'page' => $paginator->currentPage(),
                'page_size' => $paginator->perPage(),
                'total_page' => (int) ceil($paginator->total() / $pageSize),
                'total_records' => $paginator->total(),
                'total' => $paginator->total(),
                'summary' => $summary,
                'category_summary' => $categorySummary,
            ]);
        } catch (ValidationException $exception) {
            return $this->validationErrorResponse($exception);
        }
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'summary' => $this->buildSummary($this->scopedQuery($request)),
        ]);
    }

    private function scopedQuery(Request $request): Builder
    {
        $user = auth()->user();
        $groups = $user ? ($user->groups ?? []) : [];
        if (empty($groups) && $request->session()->get('nama_group')) {
            $groups = [['name' => trim($request->session()->get('nama_group'))]];
        }
        if (empty($groups) && $request->session()->get('id_group')) {
            $group = \App\Models\SysGroup::find($request->session()->get('id_group'));
            if ($group) {
                $groups = [['name' => trim($group->nama)]];
            }
        }

        $groupNames = collect($groups)->map(fn ($group) => strtolower($group['name'] ?? $group['nama'] ?? ''))->all();
        $isAdmin = collect($groupNames)->intersect([
            'admin_sistem', 'admin sistem', 'admin konten', 'admin_konten', 'admin kontak', 'admin_kontak',
        ])->isNotEmpty()
            || $user?->is_admin === true
            || $user?->is_admin === 1;
        $query = SuratMasuk::query()->withCount('disposisi');
        if ($isAdmin) {
            return $query;
        }
        $userId = $user?->id_user ?? $user?->id;
        $userUnit = $this->getUserUnit($user);
        return $query->whereHas('distribusi', function ($distributionQuery) use ($userId, $userUnit) {
            $distributionQuery->where(function ($recipientQuery) use ($userId, $userUnit) {
                if ($userId) {
                    $recipientQuery->orWhere('id_user_tujuan', $userId);
                }
                if ($userUnit) {
                    $recipientQuery->orWhere('id_unit_tujuan', $userUnit);
                }
                if (!$userId && !$userUnit) {
                    $recipientQuery->whereRaw('1 = 0');
                }
            });
        });
    }

    private function buildSummary(Builder $query): array
    {
        return [
            'total' => (clone $query)->count(),
            'baru' => (clone $query)->whereIn('status', ['draft', 'baru', 'pending', 'masuk'])->count(),
            'distribusi' => (clone $query)->whereIn('status', ['dikirim', 'disposisi', 'didistribusikan', 'didisposisikan', 'diproses', 'proses', 'menunggu_disposisi'])->count(),
            'selesai' => (clone $query)->whereIn('status', ['selesai', 'diarsipkan', 'arsip'])->count(),
        ];
    }

    private function buildCategorySummary(Builder $query): array
    {
        return [
            'total' => (clone $query)->count(),
            'internal' => (clone $query)->where('jenis_pengiriman', 'internal')->count(),
            'eksternal' => (clone $query)->where(function ($typeQuery) {
                $typeQuery->where('jenis_pengiriman', 'eksternal')
                    ->orWhereNull('jenis_pengiriman');
            })->count(),
        ];
    }

    /**
     * Show a single surat masuk record.
     * Authorization: only admin, the creator, or recipients of the distribusi can view.
     */
    public function show($id = null, ?Request $request = null): JsonResponse
    {
        $record = $this->model->find($id);
        if (!$record) {
            return $this->notFoundResponse('Surat masuk tidak ditemukan.');
        }

        // Authorization check
        $user = auth()->user();
        $userId = $user?->id_user ?? $user?->id ?? null;
        $userUnit = $this->getUserUnit($user);

        $groupNames = collect($user?->groups ?? [])
            ->map(fn($g) => strtolower($g['name'] ?? $g['nama'] ?? ''))
            ->filter()
            ->values()
            ->all();

        // The authenticated user model does not always hydrate its groups.
        // Use the active server session as the same fallback used by index(),
        // otherwise Admin Konten receives a 403 while opening a detail modal.
        $sessionGroupName = strtolower((string) session('nama_group', ''));
        if ($sessionGroupName !== '') {
            $groupNames[] = $sessionGroupName;
        }

        $activeGroupId = session('id_group');
        if ($activeGroupId) {
            $activeGroupName = DB::table('sys_group')
                ->where('id_group', $activeGroupId)
                ->whereNull('deleted_at')
                ->value('nama');
            if ($activeGroupName) {
                $groupNames[] = strtolower($activeGroupName);
            }
        }

        $isAdmin = collect($groupNames)->intersect([
            'admin_sistem', 'admin sistem', 'admin konten', 'admin_konten', 'admin kontak', 'admin_kontak',
        ])->isNotEmpty()
            || $user?->is_admin === true
            || $user?->is_admin === 1;

        if ($isAdmin) {
            return response()->json([
                'success' => true,
                'data' => $this->transformFrontendRecord($record),
            ]);
        }

        $isRecipient = DB::table('surat_distribusi')
            ->where('id_surat_masuk', $id)
            ->where(function ($q) use ($userId, $userUnit) {
                if ($userId) {
                    $q->orWhere('id_user_tujuan', $userId);
                }
                if ($userUnit) {
                    $q->orWhere('id_unit_tujuan', $userUnit);
                }
            })
            ->exists();

        if (!$isRecipient) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke surat masuk ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->transformFrontendRecord($record),
        ]);
    }

    private function getUserUnit($user): ?string
    {
        if (!$user) return null;

        // Check multiple possible field names for unit
        $unitFields = ['id_unit', 'id_unit_kerja', 'id_sdm_unit', 'unit_kerja'];
        foreach ($unitFields as $field) {
            if (!empty($user->$field)) {
                return (string) $user->$field;
            }
        }

        // Also check nested user object
        $nestedUser = $user->user ?? null;
        if ($nestedUser) {
            foreach ($unitFields as $field) {
                if (!empty($nestedUser->$field)) {
                    return (string) $nestedUser->$field;
                }
            }
        }

        return null;
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $attachment = $this->suratMasukService->storeIncomingAttachment($request);
            $payload = $this->suratMasukService->normalizePayload($request, 'store');

            if ($attachment) {
                $payload['file_surat'] = $attachment['path'];
            }

            $ocrResult = null;
            $ocrError = null;

            if ($this->suratMasukService->isOcrRequested($request)) {
                try {
                    $ocrInput = $this->suratMasukService->getOcrInput($request) ?: ($payload['file_surat'] ?? null);
                    $ocrResult = $this->suratMasukService->runOcr($ocrInput);
                    $payload = $this->suratMasukService->mergeOcrFields($payload, $ocrResult['fields']);
                } catch (Throwable $exception) {
                    $ocrError = $exception;
                    $payload = $this->suratMasukService->markOcrFailureForPayload($payload, $exception);
                }
            }

            if (empty($payload['nomor_agenda'])) {
                $payload['nomor_agenda'] = $this->suratMasukService->generateNomorAgenda();
            }

            $payload = $this->resolveRecipientPayload($payload);
            $payload = $this->resolveJenisSuratPayload($payload);

            $payload = $this->suratMasukService->filterFillable($payload, $this->model->fillable);
            $this->validatePayload($payload, true);

            $id = DB::transaction(function () use ($payload, $ocrResult, $ocrError) {
                $id = $this->model->insert($payload);
                $this->syncIncomingRecipient($id, $payload['id_penerima'] ?? null);

                if ($ocrResult) {
                    $this->suratMasukService->recordAiJob('completed', $ocrResult['prepared_file'], $ocrResult['fields'], null, $id);
                } elseif ($ocrError) {
                    $this->suratMasukService->recordAiJob('failed', null, null, $ocrError->getMessage(), $id);
                }

                return $id;
            });

            $record = $this->model->find($id);
            $message = $ocrError
                ? 'Data berhasil disimpan, tetapi AI OCR gagal membaca dokumen.'
                : 'Data berhasil disimpan.';

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $this->transformFrontendRecord($record),
            ], 201);
        } catch (ValidationException $exception) {
            return $this->validationErrorResponse($exception);
        } catch (Throwable $exception) {
            \Log::error('Surat masuk gagal disimpan: ' . $exception->getMessage(), [
                'id_surat_masuk' => $id ?? null,
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Data gagal disimpan.',
            ], 500);
        }
    }

    public function update($id = null, Request $request): JsonResponse
    {
        try {
            $record = $this->model->find($id);

            if (!$record) {
                return $this->notFoundResponse('Surat masuk tidak ditemukan.');
            }

            $attachment = $this->suratMasukService->storeIncomingAttachment($request);
            $payload = $this->suratMasukService->normalizePayload($request, 'update');

            if ($attachment) {
                $payload['file_surat'] = $attachment['path'];
            }

            if (array_key_exists('status', $payload)) {
                $this->suratMasukService->validateStatusTransition($record->status, $payload['status']);
            }

            $payload = $this->resolveRecipientPayload($payload, $record);
            $payload = $this->resolveJenisSuratPayload($payload);

            $payload = $this->suratMasukService->filterFillable($payload, $this->model->fillable);
            $this->validatePayload($payload);

            DB::transaction(function () use ($id, $payload, $record) {
                $this->model->update($id, $payload, $record);
                if (array_key_exists('id_penerima', $payload)) {
                    $this->syncIncomingRecipient($id, $payload['id_penerima']);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil diperbarui.',
                'data' => $this->transformFrontendRecord($this->model->find($id)),
            ]);
        } catch (ValidationException $exception) {
            return $this->validationErrorResponse($exception);
        } catch (Throwable $exception) {
            \Log::error('Surat masuk gagal diperbarui: ' . $exception->getMessage(), [
                'id_surat_masuk' => $id,
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Data gagal diperbarui.',
            ], 500);
        }
    }

    public function ocr(Request $request): JsonResponse
    {
        $ocrInput = $this->suratMasukService->getOcrInput($request);

        if (!$ocrInput) {
            return response()->json([
                'success' => false,
                'message' => 'Lampiran surat belum dipilih.',
                'error' => ['file_surat' => ['Lampiran surat wajib dikirim.']],
            ], 422);
        }

        try {
            $ocrResult = $this->suratMasukService->runOcr($ocrInput);
            $fields = $ocrResult['fields'];

            $this->suratMasukService->recordAiJob('completed', $ocrResult['prepared_file'], $fields);

            return response()->json([
                'success' => true,
                'message' => 'OCR berhasil diproses.',
                'fields' => $fields,
                'result' => $fields,
                'result_payload' => $fields,
                'data' => $fields,
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'AI OCR gagal membaca dokumen',
                'error' => $exception->errors(),
                'messages' => ['errors' => implode(' ', collect($exception->errors())->flatten()->toArray())],
                'data' => [
                    'source_type' => 'Manual',
                    'ai_status' => 'gagal',
                ],
            ], 422);
        } catch (Throwable $exception) {
            $errorMessage = $this->redactSensitiveUrlParameters($exception->getMessage());
            $this->suratMasukService->recordAiJob('failed', null, null, $errorMessage);
            \Log::error('AI OCR gagal: ' . $errorMessage, [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'AI OCR gagal membaca dokumen',
                'error' => ['detail' => [$errorMessage]],
                'messages' => ['errors' => $errorMessage],
                'data' => [
                    'source_type' => 'Manual',
                    'ai_status' => 'gagal',
                ],
            ], 500);
        }
    }

    private function redactSensitiveUrlParameters(string $message): string
    {
        return preg_replace('/([?&](?:key|api_key|token)=)[^&\s`]+/i', '$1[REDACTED]', $message) ?? $message;
    }

    public function nomorAgendaPreview(): JsonResponse
    {
        try {
            $nomorAgenda = $this->suratMasukService->generateNomorAgenda();

            return response()->json([
                'success' => true,
                'data' => [
                    'nomor_agenda' => $nomorAgenda,
                ],
                'nomor_agenda' => $nomorAgenda,
            ]);
        } catch (Throwable $exception) {
            \Log::error('Gagal generate nomor agenda: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate nomor agenda.',
            ], 500);
        }
    }

    protected function transformFrontendRecord($record): array
    {
        $data = is_array($record)
            ? $record
            : (method_exists($record, 'toArray') ? $record->toArray() : (array) $record);

        $data['id_surat_masuk'] = $data['id_surat_masuk'] ?? ($data['id'] ?? null);
        $data['pengirim'] = $data['pengirim'] ?? ($data['asal_surat'] ?? null);
        $data['penerima'] = $data['penerima'] ?? ($data['kepada_tujuan'] ?? null);
        $data['isi'] = $data['isi'] ?? ($data['isi_ringkasan'] ?? null);
        $data['ringkasan'] = $data['ringkasan'] ?? ($data['isi_ringkasan'] ?? null);
        $data['lampiran'] = $data['lampiran'] ?? ($data['file_surat'] ?? null);

        // Internal letters created before Google Drive support may have an
        // empty file_surat even though their source letter has a document URL.
        // Resolve it at read time too, so the detail page works before/without
        // a data backfill being run.
        if (empty($data['file_surat']) && !empty($data['id_surat_keluar'])) {
            $outgoing = DB::table('surat_keluar')
                ->where('id_surat_keluar', $data['id_surat_keluar'])
                ->whereNull('deleted_at')
                ->first();

            if ($outgoing) {
                foreach ([
                    $outgoing->file_draft_path ?? null,
                    $outgoing->file_pdf_path ?? null,
                    $outgoing->lampiran_path ?? null,
                    $outgoing->google_drive_document_url ?? null,
                    $outgoing->office365_document_url ?? null,
                ] as $attachment) {
                    if (is_string($attachment) && trim($attachment) !== '') {
                        $data['file_surat'] = trim($attachment);
                        $data['lampiran'] = $data['file_surat'];
                        break;
                    }
                }
            }
        }
        $data['sumber_data'] = $data['sumber_data'] ?? ($data['source_type'] ?? null);
        $data['lampiran_info'] = $this->suratMasukService->fileInfo($data['file_surat'] ?? null);
        $data['file_surat_info'] = $data['lampiran_info'];
        $data['jenis_pengiriman'] = $data['jenis_pengiriman']
            ?? (!empty($data['id_surat_keluar']) ? 'internal' : 'eksternal');

        if (!empty($data['id_penerima'])) {
            $recipient = DB::table('sys_user')->where('id_user', $data['id_penerima'])->whereNull('deleted_at')->first();
            if ($recipient) {
                $data['penerima_user'] = [
                    'id_user' => $recipient->id_user,
                    'name' => $recipient->name,
                    'email' => $recipient->email,
                ];
                $data['penerima'] = $recipient->name;
                $data['kepada_tujuan'] = $recipient->name;
            }
        }

        $archive = DB::table('surat_arsip')
            ->where('jenis_surat', 'surat_masuk')
            ->where('id_surat_masuk', $data['id_surat_masuk'])
            ->whereNull('deleted_at')
            ->first();
        $data['sudah_diarsipkan'] = (bool) $archive;
        $data['arsip'] = $archive ? (array) $archive : null;

        return $data;
    }

    private function resolveRecipientPayload(array $payload, $existing = null): array
    {
        $hasRecipient = array_key_exists('id_penerima', $payload);
        $recipientId = $hasRecipient ? $payload['id_penerima'] : ($existing?->id_penerima ?? null);
        if (!$recipientId) {
            return $payload;
        }

        $recipient = DB::table('sys_user')
            ->where('id_user', $recipientId)
            ->whereNull('deleted_at')
            ->where(function ($query) {
                $query->whereNull('is_active')->orWhere('is_active', true);
            })
            ->first();

        if (!$recipient) {
            throw ValidationException::withMessages(['id_penerima' => 'Penerima harus dipilih dari pengguna aktif.']);
        }

        $payload['id_penerima'] = $recipient->id_user;
        $payload['kepada_tujuan'] = $recipient->name;
        $payload['jenis_pengiriman'] = $payload['jenis_pengiriman'] ?? 'eksternal';

        return $payload;
    }

    private function resolveJenisSuratPayload(array $payload): array
    {
        if (!array_key_exists('jenis', $payload) && !array_key_exists('id_jenis_surat', $payload)) {
            return $payload;
        }

        $query = DB::table('master_jenis_surat')
            ->where('is_active', true)
            ->whereNull('deleted_at');

        if (!empty($payload['id_jenis_surat'])) {
            $jenis = $query->where('id_jenis_surat', $payload['id_jenis_surat'])->first();
        } else {
            $nama = trim((string) ($payload['jenis'] ?? ''));
            $jenis = $nama === '' ? null : $query->whereRaw('LOWER(nama) = ?', [mb_strtolower($nama)])->first();
        }

        if (!$jenis) {
            throw ValidationException::withMessages(['jenis' => 'Jenis surat harus dipilih dari Master Jenis Surat yang aktif.']);
        }

        $payload['id_jenis_surat'] = $jenis->id_jenis_surat;
        $payload['jenis'] = $jenis->nama;

        return $payload;
    }

    private function syncIncomingRecipient(int|string $suratId, int|string|null $recipientId): void
    {
        DB::table('surat_distribusi')
            ->where('id_surat_masuk', $suratId)
            ->whereNotNull('id_user_tujuan')
            ->where('id_user_tujuan', '<>', $recipientId ?: -1)
            ->update(['deleted_at' => now(), 'updated_at' => now()]);

        if (!$recipientId) {
            return;
        }

        $existing = DB::table('surat_distribusi')
            ->where('id_surat_masuk', $suratId)
            ->where('id_user_tujuan', $recipientId)
            ->first();

        $values = [
            'status' => 'dikirim',
            'tanggal_distribusi' => now(),
            'updated_at' => now(),
            'deleted_at' => null,
        ];

        if ($existing) {
            DB::table('surat_distribusi')->where('id_surat_distribusi', $existing->id_surat_distribusi)->update($values);
            return;
        }

        DB::table('surat_distribusi')->insert($values + [
            'id_surat_masuk' => $suratId,
            'id_user_tujuan' => $recipientId,
            'created_by' => auth()->user()?->id_user,
            'created_at' => now(),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        $keyword = $request->query('keyword') ?? $request->query('search');
        if ($keyword) {
            $query->where(function (Builder $inner) use ($keyword) {
                foreach ([
                    'nomor_agenda',
                    'nomor_surat',
                    'asal_surat',
                    'kepada_tujuan',
                    'tembusan',
                    'topik',
                    'perihal',
                    'isi_ringkasan',
                    'status',
                    'source_type',
                ] as $column) {
                    $inner->orWhere($column, 'like', '%' . $keyword . '%');
                }
            });
        }

        $q = $request->query('q');
        if (is_array($q)) {
            foreach ($q as $field => $value) {
                if ($value === null || $value === '') {
                    continue;
                }

                $column = match ($field) {
                    'pengirim' => 'asal_surat',
                    'penerima' => 'kepada_tujuan',
                    'lampiran' => 'file_surat',
                    'sumber_data' => 'source_type',
                    default => $field,
                };

                if (in_array($column, $this->filterableColumns(), true)) {
                    $query->where($column, 'like', '%' . $value . '%');
                }
            }
        }

        $this->applyWhereIn($query, 'status', $request->query('status'), fn ($value) => $this->suratMasukService->normalizeStatus($value));
        $this->applyWhereIn($query, 'topik', $request->query('topik'));
        $this->applyWhereIn($query, 'source_type', $request->query('source_type'), fn ($value) => $this->suratMasukService->normalizeSourceType($value));

        $jenisPengiriman = strtolower(trim((string) ($q['jenis_pengiriman'] ?? $request->query('jenis_pengiriman', ''))));
        if (in_array($jenisPengiriman, ['internal', 'eksternal'], true)) {
            $query->where(function (Builder $inner) use ($jenisPengiriman) {
                $inner->where('jenis_pengiriman', $jenisPengiriman)
                    ->orWhere(function (Builder $legacy) use ($jenisPengiriman) {
                        $legacy->whereNull('jenis_pengiriman');
                        $jenisPengiriman === 'internal'
                            ? $legacy->whereNotNull('id_surat_keluar')
                            : $legacy->whereNull('id_surat_keluar');
                    });
            });
        }

        if ($request->query('penerima')) {
            $query->where('kepada_tujuan', 'like', '%' . $request->query('penerima') . '%');
        }

        $this->applyDateFilter($query, 'tanggal_surat', $request, ['tanggal', 'tanggal_surat']);
        $this->applyDateFilter($query, 'tenggat_waktu', $request, ['tenggat_waktu', 'deadline']);

        if ($request->has('lampiran')) {
            $lampiran = $request->query('lampiran');
            $bool = filter_var($lampiran, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($bool === true) {
                $query->whereNotNull('file_surat')->where('file_surat', '<>', '');
            } elseif ($bool === false) {
                $query->where(function (Builder $inner) {
                    $inner->whereNull('file_surat')->orWhere('file_surat', '');
                });
            } elseif ($lampiran !== null && $lampiran !== '') {
                $query->where('file_surat', 'like', '%' . $lampiran . '%');
            }
        }
    }

    private function applyWhereIn(Builder $query, string $column, mixed $value, ?callable $normalizer = null): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $values = is_array($value) ? $value : explode(',', (string) $value);
        $values = collect($values)
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->map(fn ($item) => $normalizer ? $normalizer($item) : $item)
            ->unique()
            ->values()
            ->all();

        if ($values) {
            $query->whereIn($column, $values);
        }
    }

    private function applyDateFilter(Builder $query, string $column, Request $request, array $aliases): void
    {
        foreach ($aliases as $alias) {
            if ($request->query($alias)) {
                $query->whereDate($column, $request->query($alias));
                return;
            }
        }

        foreach ($aliases as $alias) {
            if ($request->query($alias . '_from')) {
                $query->whereDate($column, '>=', $request->query($alias . '_from'));
            }

            if ($request->query($alias . '_to')) {
                $query->whereDate($column, '<=', $request->query($alias . '_to'));
            }
        }
    }

    private function applyListOrdering(Builder $query, Request $request): void
    {
        $order = $request->query('order');

        if ($order) {
            foreach (explode(',', $order) as $orderItem) {
                $parts = preg_split('/\s+/', trim($orderItem));
                $column = $parts[0] ?? null;
                $direction = strtolower($parts[1] ?? 'asc') === 'desc' ? 'desc' : 'asc';

                if ($column && in_array($column, $this->filterableColumns(), true)) {
                    $query->orderBy($column, $direction);
                }
            }

            return;
        }

        $query->orderByDesc('created_at')->orderByDesc('id');
    }

    private function filterableColumns(): array
    {
        return [
            'id',
            'nomor_agenda',
            'nomor_surat',
            'tanggal_surat',
            'tanggal_terima',
            'tenggat_waktu',
            'asal_surat',
            'kepada_tujuan',
            'tembusan',
            'topik',
            'perihal',
            'isi_ringkasan',
            'status',
            'source_type',
            'ai_status',
            'file_surat',
            'created_at',
        ];
    }

    private function validatePayload(array $payload, bool $isStore = false): void
    {
        $rules = $this->model->rules;
        if ($isStore) {
            // Kolom-kolom ini wajib di database. Validasi lebih awal agar
            // pengguna mendapat pesan per field, bukan error insert 500.
            $rules['nomor_surat'] = 'required|string|max:100';
            $rules['asal_surat'] = 'required|string|max:255';
            $rules['perihal'] = 'required|string|max:255';
        }

        $validator = Validator::make($payload, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    private function validationErrorResponse(ValidationException $exception): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Validasi data gagal.',
            'error' => $exception->errors(),
            'errors' => $exception->errors(),
        ], 422);
    }

    private function notFoundResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }
}
