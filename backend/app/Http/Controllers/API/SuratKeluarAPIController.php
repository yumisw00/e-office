<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Services\EOffice\MicrosoftGraphService;
use App\Services\EOfficeNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;

class SuratKeluarAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat {
        store as protected storeFrontend;
        update as protected updateFrontend;
    }

    public function __construct()
    {
        $this->model = new \App\Models\SuratKeluar;
    }

    /**
     * List outgoing letters using the active server session as the source of
     * truth. Every role has a personal outbox, so a client-supplied creator
     * filter can never expose a letter created by another user.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $this->_search($request->get('q')) ?: [];
        unset($search['created_by']);

        $user = auth()->user();
        $userId = $user?->id_user
            ?? $user?->id
            ?? data_get($request->session()->get('user'), 'id_user')
            ?? $request->session()->get('id_user');
        $isAdmin = $this->isAdminSession();
        $applyVisibilityScope = function ($query) use ($isAdmin, $userId) {
            if (!$isAdmin) {
                // Internal letters are private to their explicit recipients
                // (including copies and designated approvers). A creator or
                // administrator gains no visibility merely from their role.
                // External correspondence remains the sender's own record.
                if ($userId) {
                    $query->where(function ($visibilityQuery) use ($userId) {
                        $visibilityQuery
                            ->where(function ($internalQuery) use ($userId) {
                                $internalQuery->where('jenis_pengiriman', 'internal')
                                    ->where(function ($recipientQuery) use ($userId) {
                                        $recipientQuery->where('created_by', $userId)
                                            ->orWhereExists(function ($query) use ($userId) {
                                                $query->select(DB::raw(1))
                                                    ->from('surat_keluar_penerima')
                                                    ->whereColumn('surat_keluar_penerima.id_surat_keluar', 'surat_keluar.id_surat_keluar')
                                                    ->where('surat_keluar_penerima.id_user', $userId);
                                            })
                                            ->orWhereExists(function ($query) use ($userId) {
                                                $query->select(DB::raw(1))
                                                    ->from('surat_keluar_tembusan')
                                                    ->whereColumn('surat_keluar_tembusan.id_surat_keluar', 'surat_keluar.id_surat_keluar')
                                                    ->where('surat_keluar_tembusan.id_user', $userId);
                                            })
                                            ->orWhereExists(function ($query) use ($userId) {
                                                $query->select(DB::raw(1))
                                                    ->from('surat_approval')
                                                    ->whereColumn('surat_approval.id_surat_keluar', 'surat_keluar.id_surat_keluar')
                                                    ->where('surat_approval.id_approver', $userId)
                                                    ->whereNull('surat_approval.deleted_at');
                                            });
                                    });
                            })
                            ->orWhere(function ($externalQuery) use ($userId) {
                                $externalQuery->where(function ($typeQuery) {
                                    $typeQuery->whereNull('jenis_pengiriman')
                                        ->orWhere('jenis_pengiriman', '!=', 'internal');
                                })->where('created_by', $userId);
                            });
                        });
                } else {
                    $query->whereRaw('1 = 0');
                }
            }

            return $query;
        };

        // Jumlah tab selalu mencakup seluruh surat yang dapat diakses.
        $categorySummary = $this->buildSummary($applyVisibilityScope($this->model->newQuery()));

        $pageSize = max(1, min((int) ($request->get('pagesize') ?? $this->limit), 100));
        $query = $applyVisibilityScope($this->model->search($search));
        $summary = $this->buildSummary(clone $query);

        $order = $request->get('order');
        if ($order) {
            foreach (explode(',', $order) as $value) {
                $parts = preg_split('/\s+/', trim($value));
                $column = $parts[0] ?? null;
                $direction = strtolower($parts[1] ?? 'asc') === 'desc' ? 'desc' : 'asc';
                if ($column) $query->orderBy($column, $direction);
            }
        } else {
            $query->orderByDesc('id_surat_keluar');
        }

        $paginator = $query->paginate($pageSize);
        $items = collect($paginator->items())
            ->map(fn ($record) => $this->transformFrontendRecord($record))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
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
    }

    private function buildSummary($query): array
    {
        $rows = $query->get(['status', 'jenis_pengiriman', 'tujuan_id']);

        return $rows->reduce(function (array $summary, $record) {
            $status = strtolower((string) ($record->status ?: 'draft'));
            $jenisPengiriman = strtolower((string) ($record->jenis_pengiriman ?: ($record->tujuan_id ? 'internal' : 'eksternal')));

            $summary['total']++;
            if ($jenisPengiriman === 'internal') $summary['internal']++;
            if ($jenisPengiriman === 'eksternal') $summary['eksternal']++;
            if (in_array($status, ['draft', 'revisi'], true)) $summary['draft']++;
            if (in_array($status, ['submitted', 'review', 'diajukan'], true)) $summary['proses']++;
            if (in_array($status, ['approved', 'disetujui', 'signed', 'ditandatangani', 'sent', 'dikirim', 'archived', 'arsip', 'selesai'], true)) $summary['selesai']++;

            return $summary;
        }, [
            'total' => 0,
            'draft' => 0,
            'proses' => 0,
            'selesai' => 0,
            'internal' => 0,
            'eksternal' => 0,
        ]);
    }

    /**
     * Minimal internal-recipient directory for outgoing letters. The user
     * directory management endpoint remains separately protected.
     */
    public function recipients()
    {
        $recipients = DB::table('sys_user')
            ->whereNull('sys_user.deleted_at')
            ->where(function ($query) {
                $query->whereNull('sys_user.is_active')->orWhere('sys_user.is_active', true);
            })
            ->select('sys_user.id_user', 'sys_user.name', 'sys_user.email')
            ->orderBy('sys_user.name')
            ->get();

        $groupsByUser = DB::table('sys_user_group')
            ->join('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
            ->whereIn('sys_user_group.id_user', $recipients->pluck('id_user'))
            ->whereNull('sys_group.deleted_at')
            ->orderBy('sys_group.nama')
            ->get(['sys_user_group.id_user', 'sys_group.nama'])
            ->groupBy('id_user')
            ->map(fn ($groups) => $groups->pluck('nama')->filter()->unique()->implode(', '));

        $recipients->each(function ($recipient) use ($groupsByUser) {
            $recipient->nama_group = $groupsByUser->get($recipient->id_user, '');
        });

        return response()->json(['data' => $recipients]);
    }

    public function show($id = null): JsonResponse
    {
        $surat = $this->model->find($id);
        if (!$surat) {
            return response()->json(['success' => false, 'message' => 'Surat keluar tidak ditemukan.'], 404);
        }

        $userId = (int) (auth()->user()?->id_user ?? 0);
        $isInternal = strtolower((string) $surat->jenis_pengiriman) === 'internal';
        $isCreator = (int) $surat->created_by === $userId;
        $isExplicitRecipient = DB::table('surat_keluar_penerima')->where('id_surat_keluar', $id)->where('id_user', $userId)->exists()
            || DB::table('surat_keluar_tembusan')->where('id_surat_keluar', $id)->where('id_user', $userId)->exists()
            || DB::table('surat_approval')->where('id_surat_keluar', $id)->where('id_approver', $userId)->whereNull('deleted_at')->exists();
        $canView = $isInternal
            ? ($isCreator || $isExplicitRecipient)
            : $isCreator;

        if (!$canView) {
            return response()->json(['success' => false, 'message' => 'Anda tidak memiliki akses ke surat keluar ini.'], 403);
        }

        return response()->json(['success' => true, 'data' => $this->transformFrontendRecord($surat)]);
    }

    /**
     * Validate the unique document number before attempting an insert so the
     * client receives a useful 422 validation response instead of a database
     * constraint error. On edit, keep the current record's number valid.
     */
    protected function frontendRules(string $mode): array
    {
        $rules = $this->model->rules;
        $uniqueNomorSurat = Rule::unique('surat_keluar', 'nomor_surat');

        // Surat keluar must be created from a template. The selected template
        // determines the letter type on the server, so clients cannot submit a
        // free-form `jenis` value.
        $rules['id_surat_template'] = ['required', 'integer'];

        if ($mode === 'update') {
            $id = request()->route('surat_keluar') ?? request()->route('id');

            if ($id !== null) {
                $uniqueNomorSurat->ignore($id, 'id_surat_keluar');
            }
        }

        $rules['nomor_surat'] = [
            'nullable',
            'string',
            'max:100',
            $uniqueNomorSurat,
        ];

        return $rules;
    }

    protected function prepareFrontendPayload(Request $request, string $mode): array
    {
        $payload = $request->all();

        // Perihal tidak lagi diinput pada form Surat Keluar. Kolom legacy ini
        // masih wajib di database, jadi gunakan nomor surat yang digenerate
        // server sebagai nilai internal yang aman.
        if (empty(trim((string) ($payload['perihal'] ?? '')))) {
            $payload['perihal'] = $payload['nomor_surat'] ?? 'Surat Keluar';
        }

        $payload = $this->resolveTemplateJenisSuratPayload($payload);
        $payload = $this->resolveJenisSuratPayload($payload);

        // Workflow status and Office links are set only by their dedicated
        // server-side workflows. A client may only attach a file stored by the
        // outgoing-letter upload endpoint.
        unset($payload['status'], $payload['office365_document_url'], $payload['created_by'], $payload['created_by_desc']);

        if ($mode === 'store') {
            $creatorId = auth()->user()?->id_user
                ?? auth()->user()?->id
                ?? $request->session()->get('id_user');

            if ($creatorId) {
                $payload['created_by'] = $creatorId;
                $payload['created_by_desc'] = auth()->user()?->name;
            }
        }

        foreach (['file_draft_path', 'file_pdf_path'] as $field) {
            if (!array_key_exists($field, $payload)) {
                continue;
            }

            $payload[$field] = $this->validatedOutgoingStoragePath($payload[$field]);
        }

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

    /**
     * A selected template is the source of truth for the letter type. This
     * prevents a browser request from saving a type that differs from the
     * template selected by the user.
     */
    private function resolveTemplateJenisSuratPayload(array $payload): array
    {
        $templateId = $payload['id_surat_template'] ?? null;
        if (!$templateId) {
            throw ValidationException::withMessages([
                'id_surat_template' => 'Template surat wajib dipilih.',
            ]);
        }

        $template = DB::table('surat_template')
            ->where('id_surat_template', $templateId)
            ->whereNull('deleted_at')
            ->where(function ($query) {
                $query->whereNull('is_active')->orWhere('is_active', true);
            })
            ->first(['jenis_surat', 'nama']);

        if (!$template) {
            throw ValidationException::withMessages([
                'id_surat_template' => 'Template surat tidak ditemukan atau tidak aktif.',
            ]);
        }

        $templateJenis = trim((string) $template->jenis_surat);

        // Older templates may not yet have jenis_surat. Their name is the
        // fallback mapping (e.g. "surat permohonan" -> "Surat Permohonan").
        if ($templateJenis === '' && !empty($template?->nama)) {
            $templateJenis = trim((string) DB::table('master_jenis_surat')
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->whereRaw('LOWER(nama) = ?', [mb_strtolower(trim($template->nama))])
                ->value('nama'));
        }

        if ($templateJenis === '') {
            throw ValidationException::withMessages([
                'id_surat_template' => 'Template surat belum memiliki jenis surat.',
            ]);
        }

        $payload['jenis'] = $templateJenis;
        unset($payload['id_jenis_surat']);

        return $payload;
    }

    public function createOfficeLink(Request $request, int|string $id, MicrosoftGraphService $graph)
    {
        $surat = $this->model->where($this->model->primaryKey, $id)->first();

        if (!$surat) {
            return response()->json([
                'success' => false,
                'message' => 'Surat keluar tidak ditemukan.',
            ], 404);
        }

        try {
            $source = $this->resolveOfficeSource($surat);
            $result = $graph->uploadAndCreateEditLink(
                $source['absolute_path'],
                $source['target_name'],
                trim(config('office365.folder_path'), '/') . '/Surat Keluar'
            );
        } catch (\Throwable $exception) {
            \Log::error('Upload ke Office 365 gagal: ' . $exception->getMessage(), [
                'id_surat_keluar' => $source['id_surat_keluar'] ?? null,
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah file ke Office 365.',
            ], 422);
        }

        $updates = [
            'office365_document_url' => $result['web_url'],
            'updated_at' => now(),
        ];

        if (!empty($source['file_draft_path'])) {
            $updates['file_draft_path'] = $source['file_draft_path'];
        }

        DB::table($surat->getTable())
            ->where($surat->primaryKey, $surat->{$surat->primaryKey})
            ->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Link Office 365 untuk draft surat berhasil dibuat.',
            'data' => $this->model->find($id),
            'office365' => $result,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->prepareDeliveryPayload($request);
        $this->syncGoogleDriveUrlFromTemplate($request);

        // Step 1: Create surat_keluar inside a transaction (atomic)
        $result = DB::transaction(function () use ($request) {
            $request->merge([
                'nomor_agenda' => $this->generateNomorAgenda(),
                'kode_draft' => $this->generateSequentialNumber('kode_draft'),
                'nomor_surat' => $this->generateNomorSurat(),
            ]);

            $storeResponse = $this->storeFrontend($request);

            if ($storeResponse->getStatusCode() >= 400) {
                return ['response' => $storeResponse, 'suratId' => null];
            }

            $data = $storeResponse->getData(true);
            $suratId = data_get($data, 'data.' . $this->model->primaryKey);

            $autoSubmitted = false;
            if ($suratId) {
                $this->syncRecipientRelations((int) $suratId, $request);
                $autoSubmitted = $this->autoSubmitForApproval((int) $suratId);
                if (!$autoSubmitted) {
                    DB::table('surat_keluar')->where('id_surat_keluar', $suratId)->update([
                        'status' => 'diproses',
                        'updated_at' => now(),
                    ]);
                }
            }

            if ($autoSubmitted) {
                $data['data'] = $this->transformFrontendRecord($this->model->find($suratId));
            }

            return [
                'response' => response()->json($data, $storeResponse->getStatusCode()),
                'suratId' => $suratId,
                'jenis_pengiriman' => $request->input('jenis_pengiriman'),
                'penerima_ids' => $this->normalizedUserIds($request->input('penerima_ids', [$request->input('tujuan_id')])),
            ];
        });

        // Step 2: Route internal letter AFTER transaction commits (non-blocking)
        // This is a secondary feature — surat_keluar is already saved successfully
        return $result['response'];
    }

    /**
     * When a surat_keluar is created as an internal letter (jenis_pengiriman = 'internal'),
     * create a corresponding surat_masuk entry and distribute it to the recipient
     * so it appears in the recipient's incoming letter list.
     *
     * This runs AFTER the surat_keluar transaction commits.
     * Approach: insert into surat_distribusi with id_user_tujuan so the recipient
     * sees the letter in their surat masuk list.
     */
    public function routeInternalLetterToRecipient(int $suratId, ?string $jenisPengiriman, int $tujuanId): void
    {
        if ($jenisPengiriman !== 'internal' || !$tujuanId) {
            return;
        }

        $surat = DB::table('surat_keluar')
            ->where('id_surat_keluar', $suratId)
            ->whereNull('deleted_at')
            ->first();

        if (!$surat) {
            return;
        }

        // Get the sender's name for display
        $senderName = DB::table('sys_user')
            ->where('id_user', $surat->created_by)
            ->value('name');

        $now = now();
        $nowDate = $now->toDateString();

        // Map surat_keluar status to surat_masuk status
        $statusMap = [
            'signed' => 'dikirim',
            'sent' => 'dikirim',
            'dikirim' => 'dikirim',
            'selesai' => 'selesai',
            'archived' => 'diarsipkan',
        ];
        $suratMasukStatus = $statusMap[$surat->status] ?? 'dikirim';

        // An update/retry must amend the same incoming letter, never create a
        // second inbox item for the recipient.
        $idSuratMasuk = null;
        $existingIncoming = $this->columnExists('surat_masuk', 'id_surat_keluar')
            ? DB::table('surat_masuk')->where('id_surat_keluar', $suratId)->whereNull('deleted_at')->first()
            : null;

        $insertData = [
            // Keep the incoming record faithful to its internal outgoing
            // source so these fields are available on the Surat Masuk detail.
            'nomor_agenda' => $surat->nomor_agenda,
            'nomor_surat' => $surat->nomor_surat,
            'jenis' => $surat->jenis,
            'jenis_pengiriman' => 'internal',
            'id_jenis_surat' => $surat->id_jenis_surat ?? null,
            'tanggal_surat' => $surat->tanggal_surat ?? $nowDate,
            'tanggal_terima' => $nowDate,
            'asal_surat' => $senderName ?? 'Internal',
            'kepada_tujuan' => $surat->tujuan_nama,
            'perihal' => $surat->perihal,
            'isi_ringkasan' => $surat->ringkasan ?: $surat->isi_surat,
            // A template can exist only as a Google Drive/Office URL. Preserve
            // that URL for internal recipients when no local document was
            // uploaded, rather than creating an inbox item with no attachment.
            'file_surat' => $this->resolveIncomingAttachment($surat),
            'status' => $suratMasukStatus,
            'source_type' => 'Manual',
            'ai_status' => 'belum_diproses',
            'updated_at' => $now,
        ];

        // Insert/update surat_masuk — id_surat_keluar is the stable source key.
        try {
            if ($existingIncoming) {
                DB::table('surat_masuk')->where('id', $existingIncoming->id)->update($insertData);
                $idSuratMasuk = (int) $existingIncoming->id;
            } else {
                $insertData['created_by'] = $surat->created_by;
                $insertData['created_at'] = $now;

                if ($this->columnExists('surat_masuk', 'id_surat_keluar')) {
                $insertData['id_surat_keluar'] = $suratId;
                }

                $idSuratMasuk = DB::table('surat_masuk')->insertGetId($insertData, 'id');
            }
        } catch (\Throwable $e) {
            \Log::warning('routeInternalLetterToRecipient: gagal insert surat_masuk: ' . $e->getMessage());
            return;
        }

        // Create distribusi record so the recipient sees it in their surat masuk.
        // Scope the lookup to the recipient: one internal letter may be routed
        // to several users and each needs their own distribution record.
        $isNewDistribution = false;
        try {
            $distribution = DB::table('surat_distribusi')
                ->where('id_surat_masuk', $idSuratMasuk)
                ->where('id_user_tujuan', $tujuanId)
                ->first();

            $distributionData = [
                'id_user_tujuan' => $tujuanId,
                'status' => 'distributed',
                'tanggal_distribusi' => $now,
                'updated_at' => $now,
            ];

            if ($distribution) {
                DB::table('surat_distribusi')
                    ->where('id_surat_distribusi', $distribution->id_surat_distribusi)
                    ->update($distributionData);
                $idDistribusi = (int) $distribution->id_surat_distribusi;
            } else {
                $isNewDistribution = true;
                $idDistribusi = DB::table('surat_distribusi')->insertGetId($distributionData + [
                    'id_surat_masuk' => $idSuratMasuk,
                    'created_by' => $surat->created_by,
                    'created_at' => $now,
                ], 'id_surat_distribusi');
            }
        } catch (\Throwable $e) {
            \Log::warning('routeInternalLetterToRecipient: gagal insert surat_distribusi: ' . $e->getMessage());
            return;
        }

        // Notify only for a new route, so editing a letter does not repeatedly
        // add the same notification to the recipient's inbox.
        if ($isNewDistribution) {
            $this->createInternalLetterNotification(
                (int) $tujuanId,
                (int) $idSuratMasuk,
                $idDistribusi,
                $surat->perihal ?? 'Surat Internal Baru',
                $senderName ?? 'Pegawai',
                (int) $surat->id_surat_keluar
            );
        }
    }

    /**
     * Check if a column exists in a table.
     */
    private function columnExists(string $table, string $column): bool
    {
        try {
            return \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Return the most useful document reference for the recipient inbox.
     * Local files take precedence, followed by the externally hosted template.
     */
    private function resolveIncomingAttachment(object $surat): ?string
    {
        foreach ([
            $surat->file_draft_path ?? null,
            $surat->file_pdf_path ?? null,
            $surat->lampiran_path ?? null,
            $surat->google_drive_document_url ?? null,
            $surat->office365_document_url ?? null,
        ] as $attachment) {
            $attachment = is_string($attachment) ? trim($attachment) : '';

            if ($attachment !== '') {
                return $attachment;
            }
        }

        return null;
    }

    /**
     * Create a notification for the recipient of an internal letter.
     */
    private function createInternalLetterNotification(
        int $recipientUserId,
        int $idSuratMasuk,
        int $idDistribusi,
        string $perihal,
        string $senderName,
        int $suratId
    ): void {
        try {
            app(EOfficeNotificationService::class)->send(
                $recipientUserId,
                'Surat Internal Baru',
                "Surat dari {$senderName}: {$perihal}",
                '/surat_masuk_pegawai?surat_id=' . $idSuratMasuk,
                [
                    'id_surat_masuk' => $idSuratMasuk,
                    'id_surat_distribusi' => $idDistribusi,
                    'id_surat_keluar' => $suratId,
                    'type' => 'internal_letter',
                ]
            );
        } catch (\Throwable $e) {
            \Log::warning('Gagal membuat notifikasi surat internal: ' . $e->getMessage());
        }
    }

    public function nomorAgendaPreview(): JsonResponse
    {
        $nomorAgenda = $this->generateNomorAgenda();
        $kodeDraft = $this->generateSequentialNumber('kode_draft');
        $nomorSurat = $this->generateNomorSurat();

        return response()->json([
            'success' => true,
            'data' => [
                'nomor_agenda' => $nomorAgenda,
                'kode_draft' => $kodeDraft,
                'nomor_surat' => $nomorSurat,
            ],
            'nomor_agenda' => $nomorAgenda,
            'kode_draft' => $kodeDraft,
            'nomor_surat' => $nomorSurat,
        ]);
    }

    public function update($id = null, Request $request): JsonResponse
    {
        $this->prepareDeliveryPayload($request, $id);
        $this->syncGoogleDriveUrlFromTemplate($request);
        $response = $this->updateFrontend($id, $request);

        if ($response->getStatusCode() < 400) {
            $surat = $this->model->find($id);
            if ($surat) {
                $this->syncRecipientRelations((int) $surat->id_surat_keluar, $request);
                $this->syncInternalLetterRoute($surat);
                $this->autoSubmitForApproval((int) $surat->id_surat_keluar);
            }
        }

        return $response;
    }

    private function syncInternalLetterRoute($surat): void
    {
        if ($surat->jenis_pengiriman === 'internal') {
            $recipientIds = DB::table('surat_keluar_penerima')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->pluck('id_user');
            foreach ($recipientIds as $recipientId) {
                $this->routeInternalLetterToRecipient((int) $surat->id_surat_keluar, $surat->jenis_pengiriman, (int) $recipientId);
            }
            return;
        }

        // A draft may be corrected from internal to external.  Remove only the
        // derived inbox/distribution records, identified by their source ID.
        if (!$this->columnExists('surat_masuk', 'id_surat_keluar')) {
            return;
        }

        $incomingIds = DB::table('surat_masuk')
            ->where('id_surat_keluar', $surat->id_surat_keluar)
            ->pluck('id');

        if ($incomingIds->isEmpty()) {
            return;
        }

        DB::table('surat_distribusi')->whereIn('id_surat_masuk', $incomingIds)->delete();
        DB::table('surat_masuk')->whereIn('id', $incomingIds)->update([
            'deleted_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Normalise the delivery type on the server.  The recipient label is never
     * trusted from the browser: it is resolved from sys_user so an internal
     * letter is always routed to the intended employee.
     */
    private function prepareDeliveryPayload(Request $request, int|string|null $suratId = null): void
    {
        $existing = $suratId ? $this->model->find($suratId) : null;
        $type = $request->input('jenis_pengiriman', $existing?->jenis_pengiriman);
        $type = strtolower(trim((string) $type));

        if (!in_array($type, ['internal', 'eksternal'], true)) {
            throw ValidationException::withMessages([
                'jenis_pengiriman' => 'Jenis pengiriman wajib dipilih: internal atau eksternal.',
            ]);
        }

        $ccIds = $this->normalizedUserIds($request->input('tembusan_ids', []));
        $validCcCount = DB::table('sys_user')->whereIn('id_user', $ccIds)->whereNull('deleted_at')->count();
        if ($validCcCount !== count($ccIds)) {
            throw ValidationException::withMessages(['tembusan_ids' => 'Tembusan harus berasal dari daftar pengguna aktif.']);
        }
        $request->merge(['tembusan_ids' => $ccIds]);

        if ($type === 'eksternal') {
            $recipientName = trim((string) $request->input('tujuan_nama', $existing?->tujuan_nama));
            if ($recipientName === '') {
                throw ValidationException::withMessages([
                    'tujuan_nama' => 'Nama penerima eksternal wajib diisi.',
                ]);
            }

            $recipientEmail = trim((string) $request->input('tujuan_email', $existing?->tujuan_email));
            $autoEmail = filter_var($request->input('kirim_email_otomatis'), FILTER_VALIDATE_BOOLEAN);
            if ($autoEmail && filter_var($recipientEmail, FILTER_VALIDATE_EMAIL) === false) {
                throw ValidationException::withMessages([
                    'tujuan_email' => 'Isi email tujuan yang valid untuk mengaktifkan kirim email otomatis.',
                ]);
            }

            $request->merge([
                'jenis_pengiriman' => $type,
                'tujuan_id' => null,
                'tujuan_email' => $recipientEmail,
                'kirim_email_otomatis' => $autoEmail,
            ]);
            return;
        }

        $recipientIds = $this->normalizedUserIds($request->input('penerima_ids', [$request->input('tujuan_id', $existing?->tujuan_id)]));
        $recipients = DB::table('sys_user')
            ->whereIn('id_user', $recipientIds)
            ->whereNull('deleted_at')
            ->where(function ($query) {
                $query->whereNull('is_active')->orWhere('is_active', true);
            })
            ->get();

        if ($recipientIds === [] || $recipients->count() !== count($recipientIds)) {
            throw ValidationException::withMessages([
                'penerima_ids' => 'Pilih minimal satu penerima internal dari daftar pengguna aktif.',
            ]);
        }

        $primaryRecipient = $recipients->first();
        $request->merge([
            'jenis_pengiriman' => $type,
            'penerima_ids' => $recipientIds,
            'tembusan_ids' => $ccIds,
            'tujuan_id' => $primaryRecipient->id_user,
            'tujuan_nama' => $recipients->pluck('name')->implode(', '),
            'tujuan_email' => $recipients->pluck('email')->filter()->implode(','),
            'tujuan_alamat' => null,
            'tujuan_kontak' => null,
            'tujuan_jabatan' => null,
            'kirim_email_otomatis' => false,
        ]);
    }

    public function uploadAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg',
            ],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $baseName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'lampiran';
        $filename = now()->format('YmdHis') . '_' . Str::random(8) . '_' . $baseName . '.' . $extension;
        $path = $file->storeAs('surat_keluar/lampiran', $filename);

        return response()->json([
            'success' => true,
            'message' => 'Lampiran berhasil diunggah.',
            'path' => $path,
            'file_path' => $path,
        ]);
    }

    private function syncGoogleDriveUrlFromTemplate(Request $request): void
    {
        $hasGoogleDriveColumn = Schema::hasColumn('surat_keluar', 'google_drive_document_url');

        if (!$hasGoogleDriveColumn) {
            $request->request->remove('google_drive_document_url');
        }

        if (!$request->has('id_surat_template')) {
            // Jangan izinkan URL Drive dikirim langsung dari klien.
            $request->merge(['google_drive_document_url' => null]);
            return;
        }

        $template = $this->findTemplate($request->input('id_surat_template'));
        $googleDriveUrl = trim((string) ($template->drive_document_url ?? ''));

        if ($googleDriveUrl === '') {
            $legacyUrl = trim((string) ($template->office365_document_url ?? ''));
            if (preg_match('/(?:drive|docs)\.google\.com/i', $legacyUrl)) {
                $googleDriveUrl = $legacyUrl;
            }
        }

        if ($hasGoogleDriveColumn) {
            $request->merge([
                'google_drive_document_url' => $googleDriveUrl ?: null,
            ]);
            return;
        }

        // Compatibility for databases that have not run the latest migration.
        // The field was previously used by the frontend to retain template links.
        $request->merge([
            'office365_document_url' => $googleDriveUrl ?: null,
        ]);
    }

    private function generateNomorAgenda(): string
    {
        return $this->generateSequentialNumber('nomor_agenda');
    }

    /**
     * Queue approval follows the selected examiner and signer, not the
     * letter recipient. A letter may be sent to an employee while still
     * requiring the Pimpinan's approval/signature.
     */
    private function autoSubmitForApproval(int $suratId): bool
    {
        $surat = DB::table('surat_keluar')
            ->where('id_surat_keluar', $suratId)
            ->whereNull('deleted_at')
            ->first();

        if (!$surat || !in_array($surat->status, ['draft', 'rejected'], true)) {
            return false;
        }

        $approvers = collect([
            $surat->id_pemeriksa ?? null,
            $surat->id_penandatangan ?? null,
        ])->filter()
            ->map(fn ($userId) => (int) $userId)
            ->reject(fn ($userId) => $userId === (int) $surat->created_by)
            ->unique()
            ->values();

        // Compatibility for old drafts which selected Pimpinan as their
        // recipient instead of selecting them as a signer.
        if ($approvers->isEmpty() && !empty($surat->tujuan_id) && $this->isPimpinanUser((int) $surat->tujuan_id)) {
            $approvers->push((int) $surat->tujuan_id);
        }

        if ($approvers->isEmpty()) {
            return false;
        }

        $queued = false;
        DB::transaction(function () use ($surat, $approvers, &$queued) {
            $alreadyQueued = DB::table('surat_approval')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->whereNull('deleted_at')
                ->exists();

            if ($alreadyQueued) {
                return;
            }

            $queued = true;

            DB::table('surat_keluar')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->update([
                    'status' => 'diproses',
                    'updated_at' => now(),
                ]);

            $now = now();
            DB::table('surat_approval')->insert($approvers->map(fn ($approverId, $index) => [
                'id_surat_keluar' => $surat->id_surat_keluar,
                'id_approver' => $approverId,
                'urutan' => $index + 1,
                'status' => $index === 0 ? 'waiting' : 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ])->all());
        });

        if ($queued) {
            $firstApproverId = (int) $approvers->first();
            app(EOfficeNotificationService::class)->send(
                $firstApproverId,
                'Persetujuan surat menunggu Anda',
                'Surat keluar "' . ($surat->perihal ?? $surat->nomor_surat ?? 'Tanpa Perihal') . '" menunggu persetujuan Anda.',
                '/surat_keluar/detail/' . $surat->id_surat_keluar,
                ['id_surat_keluar' => $surat->id_surat_keluar, 'type' => 'approval_request']
            );
        }

        return $queued;
    }

    private function isPimpinanUser(int $userId): bool
    {
        return DB::table('sys_user_group')
            ->join('mt_sdm_jabatan', function ($join) {
                $join->on(
                    DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'),
                    '=',
                    DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)')
                );
            })
            ->where('sys_user_group.id_user', $userId)
            ->where(function ($query) {
                $query->whereRaw("LOWER(COALESCE(mt_sdm_jabatan.nama, '')) LIKE ?", ['%pimpinan%'])
                    ->orWhereRaw("LOWER(COALESCE(mt_sdm_jabatan.nama, '')) LIKE ?", ['%direksi%']);
            })
            ->exists();
    }

    private function generateNomorSurat(): string
    {
        return $this->generateSequentialNumber('nomor_surat');
    }

    private function generateSequentialNumber(string $column): string
    {
        $year = now()->format('Y');
        $month = now()->format('m');
        $prefix = $column === 'nomor_agenda'
            ? "AGK/{$year}/{$month}/"
            : "SK/{$year}/{$month}/";

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::select('select pg_advisory_xact_lock(?)', [(int) ($year . $month)]);
        }

        $lastSequence = DB::table('surat_keluar')
            ->where($column, 'like', $prefix . '%')
            ->pluck($column)
            ->reduce(function (int $max, ?string $number) use ($prefix) {
                if ($number && preg_match('/^' . preg_quote($prefix, '/') . '(\\d+)$/', $number, $matches)) {
                    return max($max, (int) $matches[1]);
                }

                return $max;
            }, 0);

        return $prefix . str_pad((string) ($lastSequence + 1), 3, '0', STR_PAD_LEFT);
    }

    private function resolveOfficeSource($surat): array
    {
        $paths = [
            $surat->file_draft_path,
            optional($this->findTemplate($surat->id_surat_template))->file_path,
        ];

        foreach ($paths as $path) {
            if (!$this->isEditableWordPath($path)) continue;
            if (!Storage::exists($path)) continue;

            return [
                'absolute_path' => Storage::path($path),
                'target_name' => $this->draftFileName($surat, pathinfo($path, PATHINFO_EXTENSION)),
                'file_draft_path' => $surat->file_draft_path ?: null,
            ];
        }

        return $this->generateDraftDocument($surat);
    }

    private function findTemplate($templateId)
    {
        if (!$templateId) return null;

        return DB::table('surat_template')
            ->where('id_surat_template', $templateId)
            ->whereNull('deleted_at')
            ->first();
    }

    protected function transformFrontendRecord($record): array
    {
        // This controller overrides the trait method to enrich template data.
        // The trait is not a parent class, therefore calling parent here causes
        // Laravel to dispatch to __call() and the list endpoint fails.
        if (!$record) {
            return [];
        }

        $data = is_array($record)
            ? $record
            : (method_exists($record, 'toArray') ? $record->toArray() : (array) $record);

        if (!empty($data['id_surat_template'])) {
            $template = $this->findTemplate($data['id_surat_template']);
            $driveUrl = trim((string) ($template->drive_document_url ?? ''));

            if (empty($data['google_drive_document_url']) && $driveUrl !== '') {
                $data['google_drive_document_url'] = $driveUrl;
            }

            if (empty($data['template_nama']) && $template) {
                $data['template_nama'] = $template->nama ?? null;
            }
        }

        $suratId = $data['id_surat_keluar'] ?? null;
        if ($suratId) {
            $data['penerima_internal'] = $this->relatedUsers('surat_keluar_penerima', $suratId);
            $data['tembusan_internal'] = $this->relatedUsers('surat_keluar_tembusan', $suratId);
            $data['penerima_ids'] = collect($data['penerima_internal'])->pluck('id_user')->values()->all();
            $data['tembusan_ids'] = collect($data['tembusan_internal'])->pluck('id_user')->values()->all();
            $data['approval'] = DB::table('surat_approval')
                ->leftJoin('sys_user', 'sys_user.id_user', '=', 'surat_approval.id_approver')
                ->where('surat_approval.id_surat_keluar', $suratId)
                ->whereNull('surat_approval.deleted_at')
                ->orderBy('surat_approval.urutan')
                ->get([
                    'surat_approval.id_surat_approval',
                    'surat_approval.id_approver',
                    'surat_approval.urutan',
                    'surat_approval.status',
                    'surat_approval.catatan_revisi',
                    'surat_approval.tanggal_aksi',
                    'sys_user.name as nama_approver',
                ])->map(fn ($approval) => (array) $approval)->all();
            $data['arsip'] = DB::table('surat_arsip')
                ->where('jenis_surat', 'surat_keluar')
                ->where('id_surat_keluar', $suratId)
                ->whereNull('deleted_at')
                ->first();
            $data['sudah_diarsipkan'] = (bool) $data['arsip'];
        }

        return $data;
    }

    private function syncRecipientRelations(int $suratId, Request $request): void
    {
        $recipientIds = $request->input('jenis_pengiriman') === 'internal'
            ? $this->normalizedUserIds($request->input('penerima_ids', [$request->input('tujuan_id')]))
            : [];
        $ccIds = $this->normalizedUserIds($request->input('tembusan_ids', []));

        $this->syncUserPivot('surat_keluar_penerima', $suratId, $recipientIds);
        $this->syncUserPivot('surat_keluar_tembusan', $suratId, $ccIds);
    }

    private function syncUserPivot(string $table, int $suratId, array $userIds): void
    {
        DB::table($table)->where('id_surat_keluar', $suratId)->whereNotIn('id_user', $userIds ?: [-1])->delete();
        foreach ($userIds as $userId) {
            DB::table($table)->updateOrInsert(
                ['id_surat_keluar' => $suratId, 'id_user' => $userId],
                ['updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    private function normalizedUserIds(mixed $value): array
    {
        $values = is_array($value) ? $value : explode(',', (string) $value);
        return collect($values)->map(fn ($id) => (int) $id)->filter()->unique()->values()->all();
    }

    private function relatedUsers(string $pivotTable, int|string $suratId): array
    {
        return DB::table($pivotTable)
            ->join('sys_user', 'sys_user.id_user', '=', $pivotTable . '.id_user')
            ->leftJoin('sys_user_group', 'sys_user_group.id_user', '=', 'sys_user.id_user')
            ->leftJoin('sys_group', function ($join) {
                $join->on('sys_group.id_group', '=', 'sys_user_group.id_group')
                    ->whereNull('sys_group.deleted_at');
            })
            ->where($pivotTable . '.id_surat_keluar', $suratId)
            ->whereNull('sys_user.deleted_at')
            ->orderBy('sys_user.name')
            ->groupBy('sys_user.id_user', 'sys_user.name', 'sys_user.email')
            ->get([
                'sys_user.id_user',
                'sys_user.name',
                'sys_user.email',
                DB::raw("STRING_AGG(DISTINCT sys_group.nama, ', ') as nama_group"),
            ])
            ->map(fn ($user) => (array) $user)
            ->all();
    }

    private function isAdminSession(): bool
    {
        // Surat Keluar is private to its creator for every role. This method
        // is also used by show(), so an administrator cannot bypass the same
        // ownership rule by opening another user's letter directly.
        return false;
    }

    private function activeGroupName(Request $request): string
    {
        $groupName = trim((string) $request->session()->get('nama_group', ''));
        if ($groupName !== '') {
            return $groupName;
        }

        $groupId = $request->session()->get('id_group');
        if (!$groupId) {
            return '';
        }

        return trim((string) DB::table('sys_group')
            ->where('id_group', $groupId)
            ->whereNull('deleted_at')
            ->value('nama'));
    }

    private function isLegacyGroupRecipient($surat, Request $request): bool
    {
        if (!$surat || empty($surat->tujuan_nama)) {
            return false;
        }

        $hasExplicitRecipients = DB::table('surat_keluar_penerima')
            ->where('id_surat_keluar', $surat->id_surat_keluar)
            ->exists();
        if ($hasExplicitRecipients) {
            return false;
        }

        $activeGroupName = mb_strtolower($this->activeGroupName($request));
        $legacyTargets = collect(preg_split('/[,;]+/', mb_strtolower((string) $surat->tujuan_nama)))
            ->map(fn ($target) => trim(str_replace('_', ' ', $target)))
            ->filter();

        return $activeGroupName !== ''
            && $legacyTargets->contains(trim(str_replace('_', ' ', $activeGroupName)));
    }

    private function isEditableWordPath(?string $path): bool
    {
        if (!$path) return false;

        return in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), ['doc', 'docx'], true);
    }

    private function validatedOutgoingStoragePath(mixed $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (!is_string($path)) {
            throw ValidationException::withMessages([
                'file_path' => 'Path lampiran tidak valid.',
            ]);
        }

        $path = ltrim(str_replace('\\', '/', $path), '/');
        if (str_contains($path, '..') || !Str::startsWith($path, 'surat_keluar/')) {
            throw ValidationException::withMessages([
                'file_path' => 'Path lampiran tidak valid.',
            ]);
        }

        if (!Storage::exists($path)) {
            throw ValidationException::withMessages([
                'file_path' => 'File lampiran tidak ditemukan.',
            ]);
        }

        return $path;
    }

    private function generateDraftDocument($surat): array
    {
        $path = 'surat_keluar/draft/' . now()->format('YmdHis') . '_' . Str::slug($surat->kode_draft ?: $surat->nomor_surat ?: 'draft-surat') . '.docx';
        $absolutePath = Storage::path($path);
        $directory = dirname($absolutePath);

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $phpWord = new PhpWord();
        $section = $phpWord->addSection();
        $section->addText($surat->nomor_surat ?: $surat->kode_draft ?: 'Draft Surat', ['bold' => true, 'size' => 14]);
        $section->addTextBreak();
        $section->addText('Tanggal: ' . ($surat->tanggal_surat ?: now()->format('Y-m-d')));
        $section->addText('Kepada: ' . ($surat->tujuan_nama ?: '-'));
        $section->addText('Perihal: ' . ($surat->perihal ?: '-'));
        $section->addTextBreak();

        $content = trim((string) ($surat->isi_surat ?: $surat->ringkasan ?: ''));
        if ($content === '') {
            $content = 'Isi surat belum diisi.';
        }

        foreach (preg_split('/\R/', $content) as $line) {
            $section->addText($line ?: ' ');
        }

        IOFactory::createWriter($phpWord, 'Word2007')->save($absolutePath);

        return [
            'absolute_path' => $absolutePath,
            'target_name' => $this->draftFileName($surat, 'docx'),
            'file_draft_path' => $path,
        ];
    }

    private function draftFileName($surat, string $extension = 'docx'): string
    {
        $base = $surat->nomor_surat ?: $surat->kode_draft ?: $surat->perihal ?: 'draft-surat';

        return Str::slug($base) . '.' . strtolower($extension ?: 'docx');
    }
}
