<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Http\Controllers\BaseResourceController;
use App\Mail\ApprovalEmail;
use App\Models\SuratDisposisi;
use App\Models\SuratMasuk;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class SuratDisposisiAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new SuratDisposisi;
    }

    public function index(Request $request): JsonResponse
    {
        $pageSize = max(1, min((int) ($request->get('pagesize') ?? $request->get('per_page') ?? 10), 100));
        $query = SuratDisposisi::query()->with(['suratMasuk', 'pemberi', 'penerima']);

        // Disposisi adalah pekerjaan personal. Admin Sistem dapat memantau
        // seluruh disposisi, sementara role lain hanya melihat miliknya.
        if (!$this->isSystemAdmin($request)) {
            $query->where('id_penerima', $this->currentUserId($request));
        }

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
        ]);
    }

    private function buildSummary(Builder $query): array
    {
        return (clone $query)->get(['status'])->reduce(function (array $summary, $record) {
            $summary['total']++;
            in_array(strtolower((string) $record->status), ['selesai', 'arsip'], true)
                ? $summary['selesai']++
                : $summary['berjalan']++;

            return $summary;
        }, ['total' => 0, 'berjalan' => 0, 'selesai' => 0]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $payload = $this->prepareDisposisiPayload($request, 'store');
            $payload['id_pemberi'] = $this->currentUserId($request);
            $payload = $this->filterFillablePayload($payload);
            $this->validatePayload($payload, true);

            if (!$this->canActOnIncomingLetter($request, (int) $payload['id_surat_masuk'], (int) $payload['id_pemberi'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk membuat disposisi pada surat ini.',
                ], 403);
            }

            $id = DB::transaction(function () use ($payload) {
                $id = $this->model->insert($payload);

                if (!empty($payload['id_surat_masuk'])) {
                    SuratMasuk::query()
                        ->where('id', $payload['id_surat_masuk'])
                        ->where('status', '<>', 'selesai')
                        ->update(['status' => 'menunggu_disposisi', 'updated_at' => now()]);
                }

                return $id;
            });

            $record = SuratDisposisi::with(['suratMasuk', 'pemberi', 'penerima'])->find($id);
            $this->sendDispositionEmail($record);

            return response()->json([
                'success' => true,
                'message' => 'Disposisi berhasil dibuat.',
                'data' => $this->transformFrontendRecord(
                    $record
                ),
            ], 201);
        } catch (ValidationException $exception) {
            return $this->validationErrorResponse($exception);
        } catch (Throwable $exception) {
            \Log::error('Disposisi gagal dibuat: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Disposisi gagal dibuat.',
            ], 500);
        }
    }

    public function update($id = null, Request $request): JsonResponse
    {
        try {
            $record = $this->model->find($id);

            if (!$record || (int) $record->id_penerima !== $this->currentUserId($request)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Disposisi tidak ditemukan atau bukan milik Anda.',
                ], 404);
            }

            $previousStatus = $record->status;
            $payload = $this->prepareDisposisiPayload($request, 'update');
            // Penerima dan pemberi tidak dapat dialihkan melalui perubahan
            // status; disposisi tetap menjadi milik penerima awal.
            unset($payload['id_penerima'], $payload['id_pemberi']);

            if (array_key_exists('status', $payload)) {
                $this->validateStatusTransition($record->status, $payload['status']);

                if ($payload['status'] === 'selesai' && empty($payload['tanggal_selesai'])) {
                    $payload['tanggal_selesai'] = now();
                }
            }

            $payload = $this->filterFillablePayload($payload);
            $this->validatePayload($payload, false);
            $this->model->update($id, $payload, $record);

            $updatedRecord = SuratDisposisi::with(['suratMasuk', 'pemberi', 'penerima'])->find($id);
            if ($previousStatus !== 'selesai' && $updatedRecord?->status === 'selesai') {
                $this->sendDispositionCompletedEmail($updatedRecord);
            }

            return response()->json([
                'success' => true,
                'message' => 'Disposisi berhasil diperbarui.',
                'data' => $this->transformFrontendRecord($updatedRecord),
            ]);
        } catch (ValidationException $exception) {
            return $this->validationErrorResponse($exception);
        } catch (Throwable $exception) {
            \Log::error('Disposisi gagal diperbarui: ' . $exception->getMessage(), [
                'id_disposisi' => $id,
                'trace' => $exception->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Disposisi gagal diperbarui.',
            ], 500);
        }
    }

    public function show($id = null): JsonResponse
    {
        $record = SuratDisposisi::with(['suratMasuk', 'pemberi', 'penerima'])->find($id);

        if (!$record || (!$this->isSystemAdmin(request()) && (int) $record->id_penerima !== $this->currentUserId(request()))) {
            return response()->json([
                'success' => false,
                'message' => 'Disposisi tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->transformFrontendRecord($record),
        ]);
    }

    public function timeline($id = null): JsonResponse
    {
        $record = SuratDisposisi::find($id);
        if (!$record || (!$this->isSystemAdmin(request()) && (int) $record->id_penerima !== $this->currentUserId(request()))) {
            return response()->json(['success' => false, 'message' => 'Disposisi tidak ditemukan atau bukan milik Anda.'], 404);
        }

        $events = [[
            'type' => 'created',
            'title' => 'Disposisi dibuat',
            'description' => 'Disposisi dikirim kepada penerima.',
            'status' => $record->status,
            'created_at' => $record->tanggal_disposisi ?? $record->created_at,
            'id_surat_disposisi' => $record->id_surat_disposisi,
        ]];

        if ($record->updated_at && $record->updated_at != $record->created_at) {
            $events[] = [
                'type' => 'updated',
                'title' => 'Disposisi diperbarui',
                'description' => 'Status atau detail disposisi diperbarui.',
                'status' => $record->status,
                'created_at' => $record->updated_at,
                'id_surat_disposisi' => $record->id_surat_disposisi,
            ];
        }

        if ($record->tanggal_selesai) {
            $events[] = [
                'type' => 'completed',
                'title' => 'Disposisi diselesaikan',
                'description' => $record->catatan_penyelesaian,
                'status' => 'selesai',
                'created_at' => $record->tanggal_selesai,
                'id_surat_disposisi' => $record->id_surat_disposisi,
            ];
        }

        return response()->json(['success' => true, 'data' => $events]);
    }

    public function destroy($id = null): JsonResponse
    {
        $record = $this->model->find($id);

        if (!$record || (int) $record->id_penerima !== $this->currentUserId(request())) {
            return response()->json([
                'success' => false,
                'message' => 'Disposisi tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Disposisi berhasil dihapus.',
        ]);
    }

    protected function transformFrontendRecord($record): array
    {
        $data = is_array($record)
            ? $record
            : (method_exists($record, 'toArray') ? $record->toArray() : (array) $record);

        $data['id'] = $data['id'] ?? ($data['id_surat_disposisi'] ?? null);
        $data['surat_id'] = $data['surat_id'] ?? ($data['id_surat_masuk'] ?? null);
        $data['pemberi_disposisi'] = $data['pemberi_disposisi'] ?? ($data['id_pemberi'] ?? null);
        $data['penerima_disposisi'] = $data['penerima_disposisi'] ?? ($data['id_penerima'] ?? null);
        $data['tenggat_waktu'] = $data['tenggat_waktu'] ?? ($data['tanggal_jatuh_tempo'] ?? null);

        // Flat aliases keep the detail frontend compatible with both the
        // legacy API shape and the eager-loaded user relationships.
        $data['nama_pemberi'] = $data['nama_pemberi']
            ?? data_get($data, 'pemberi.name')
            ?? ($data['created_by_desc'] ?? null);
        $data['nama_penerima'] = $data['nama_penerima']
            ?? data_get($data, 'penerima.name');

        if (empty($data['tanggal_disposisi']) && !empty($data['created_at'])) {
            $data['tanggal_disposisi'] = $data['created_at'];
        }

        return $data;
    }

    private function prepareDisposisiPayload(Request $request, string $mode): array
    {
        $payload = $request->all();

        $aliases = [
            'surat_id' => 'id_surat_masuk',
            'pemberi_disposisi' => 'id_pemberi',
            'penerima_disposisi' => 'id_penerima',
            'tenggat_waktu' => 'tanggal_jatuh_tempo',
        ];

        foreach ($aliases as $from => $to) {
            if (array_key_exists($from, $payload) && !array_key_exists($to, $payload)) {
                $payload[$to] = $payload[$from];
            }
        }

        if (!empty($payload['id_surat_masuk'])) {
            $payload['jenis_pengiriman'] = SuratMasuk::query()
                ->where('id', $payload['id_surat_masuk'])
                ->value('jenis_pengiriman') ?: ($payload['jenis_pengiriman'] ?? 'internal');
        }

        if (array_key_exists('status', $payload)) {
            $payload['status'] = $this->normalizeStatus($payload['status']);
        } elseif ($mode === 'store') {
            $payload['status'] = 'baru';
        }

        if ($mode === 'store' && empty($payload['tanggal_disposisi'])) {
            $payload['tanggal_disposisi'] = now();
        }

        // The compact UI no longer asks for free-text instructions, while the
        // legacy database column is still NOT NULL.
        if ($mode === 'store' && empty($payload['instruksi'])) {
            $payload['instruksi'] = 'Tindak lanjuti surat sesuai disposisi.';
        }

        return $payload;
    }

    private function currentUserId(Request $request): int
    {
        $userId = auth()->user()?->id_user
            ?? auth()->user()?->id
            ?? $request->session()->get('id_user');

        if (!$userId) {
            abort(403, 'Akun pengguna tidak ditemukan.');
        }

        return (int) $userId;
    }

    private function isSystemAdmin(Request $request): bool
    {
        $groupId = $request->session()->get('id_group');

        return (bool) ($groupId && DB::table('sys_group')
            ->where('id_group', $groupId)
            ->whereNull('deleted_at')
            ->whereRaw("LOWER(REPLACE(nama, '_', ' ')) = 'admin sistem'")
            ->exists());
    }

    private function sendDispositionEmail(?SuratDisposisi $record): void
    {
        $recipient = $record?->penerima;
        if (!$record || !$recipient || empty($recipient->email)
            || !filter_var($recipient->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $surat = $record->suratMasuk;
        $giverName = $record->pemberi?->name ?? $record->created_by_desc ?? '-';

        try {
            Mail::to($recipient->email)->send(new ApprovalEmail(
                subject: 'Disposisi Baru: ' . ($surat?->perihal ?? 'Surat Masuk'),
                greeting: 'Yth. ' . ($recipient->name ?? $recipient->email),
                body: 'Anda menerima disposisi baru yang perlu ditindaklanjuti di sistem E-Office.',
                detailRows: [
                    ['label' => 'Nomor Surat', 'value' => $surat?->nomor_surat ?? '-'],
                    ['label' => 'Perihal', 'value' => $surat?->perihal ?? '-'],
                    ['label' => 'Pemberi Disposisi', 'value' => $giverName],
                    ['label' => 'Instruksi', 'value' => htmlspecialchars($record->instruksi ?? '-')],
                    ['label' => 'Tenggat Waktu', 'value' => $record->tanggal_jatuh_tempo?->format('d-m-Y') ?? '-'],
                ],
                actionText: 'Buka Disposisi',
                actionUrl: rtrim(config('app.frontend_url'), '/') . '/disposisi/' . $record->id_surat_disposisi,
                footerNote: 'Email ini dikirim secara otomatis oleh sistem E-Office.',
            ));
        } catch (Throwable $exception) {
            Log::warning('Gagal mengirim email notifikasi disposisi.', [
                'id_surat_disposisi' => $record->id_surat_disposisi,
                'id_penerima' => $record->id_penerima,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function sendDispositionCompletedEmail(SuratDisposisi $record): void
    {
        $giver = $record->pemberi;
        if (!$giver || empty($giver->email) || !filter_var($giver->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        try {
            Mail::to($giver->email)->send(new ApprovalEmail(
                subject: 'Disposisi Telah Diselesaikan',
                greeting: 'Yth. ' . ($giver->name ?? $giver->email),
                body: 'Disposisi yang Anda berikan telah diselesaikan oleh penerima.',
                detailRows: [
                    ['label' => 'Nomor Surat', 'value' => $record->suratMasuk?->nomor_surat ?? '-'],
                    ['label' => 'Perihal', 'value' => $record->suratMasuk?->perihal ?? '-'],
                    ['label' => 'Penerima', 'value' => $record->penerima?->name ?? '-'],
                    ['label' => 'Catatan Penyelesaian', 'value' => htmlspecialchars($record->catatan_penyelesaian ?? '-')],
                    ['label' => 'Tanggal Selesai', 'value' => $record->tanggal_selesai?->format('d-m-Y H:i') ?? '-'],
                ],
                actionText: 'Lihat Disposisi',
                actionUrl: rtrim(config('app.frontend_url'), '/') . '/disposisi/' . $record->id_surat_disposisi,
                footerNote: 'Email ini dikirim secara otomatis oleh sistem E-Office.',
            ));
        } catch (Throwable $exception) {
            Log::warning('Gagal mengirim email penyelesaian disposisi.', [
                'id_surat_disposisi' => $record->id_surat_disposisi,
                'id_pemberi' => $record->id_pemberi,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function validatePayload(array $payload, bool $isStore): void
    {
        $rules = $this->model->rules;

        if ($isStore) {
            $rules['id_surat_masuk'] = 'required|integer|exists:surat_masuk,id';
            $rules['id_penerima'] = 'required|integer|exists:sys_user,id_user';
            // Instruksi is optional; the compact disposition form only needs
            // a recipient and (optionally) a deadline.
            $rules['instruksi'] = 'nullable|string';
        }

        $validator = Validator::make($payload, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    private function canActOnIncomingLetter(Request $request, int $suratId, int $userId): bool
    {
        if ($this->isSystemAdmin($request)) {
            return true;
        }

        $surat = SuratMasuk::query()->where('id', $suratId)->whereNull('deleted_at')->first();
        if (!$surat) {
            return false;
        }

        if ((int) ($surat->created_by ?? 0) === $userId) {
            return true;
        }

        return DB::table('surat_distribusi')
            ->where('id_surat_masuk', $suratId)
            ->where('id_user_tujuan', $userId)
            ->whereNull('deleted_at')
            ->exists();
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        $q = $request->query('q', []);
        $jenisPengiriman = strtolower(trim((string) (is_array($q) ? ($q['jenis_pengiriman'] ?? '') : '')));
        if (in_array($jenisPengiriman, ['internal', 'eksternal'], true)) {
            $query->whereHas('suratMasuk', function (Builder $surat) use ($jenisPengiriman) {
                $surat->where('jenis_pengiriman', $jenisPengiriman)
                    ->orWhere(function (Builder $legacy) use ($jenisPengiriman) {
                        $legacy->whereNull('jenis_pengiriman');
                        $jenisPengiriman === 'internal'
                            ? $legacy->whereNotNull('id_surat_keluar')
                            : $legacy->whereNull('id_surat_keluar');
                    });
            });
        }

        if ($request->query('keyword')) {
            $keyword = $request->query('keyword');
            $query->where(function (Builder $inner) use ($keyword) {
                $inner->where('instruksi', 'like', '%' . $keyword . '%')
                    ->orWhere('status', 'like', '%' . $keyword . '%')
                    ->orWhereHas('suratMasuk', function (Builder $surat) use ($keyword) {
                        $surat->where('nomor_surat', 'like', '%' . $keyword . '%')
                            ->orWhere('perihal', 'like', '%' . $keyword . '%')
                            ->orWhere('topik', 'like', '%' . $keyword . '%');
                    });
            });
        }

        if ($request->query('surat_id')) {
            $query->where('id_surat_masuk', $request->query('surat_id'));
        }

        if ($request->query('status')) {
            $statuses = collect(explode(',', (string) $request->query('status')))
                ->map(fn ($status) => $this->normalizeStatus($status))
                ->all();
            $query->whereIn('status', $statuses);
        }

        if ($request->query('penerima_disposisi')) {
            $query->where('id_penerima', $request->query('penerima_disposisi'));
        }
    }

    private function applyListOrdering(Builder $query, Request $request): void
    {
        $order = $request->query('order');
        $allowed = ['id_surat_disposisi', 'id_surat_masuk', 'id_penerima', 'status', 'tanggal_jatuh_tempo', 'tanggal_disposisi', 'created_at'];

        if ($order) {
            foreach (explode(',', $order) as $orderItem) {
                $parts = preg_split('/\s+/', trim($orderItem));
                $column = $parts[0] ?? null;
                $direction = strtolower($parts[1] ?? 'asc') === 'desc' ? 'desc' : 'asc';

                if ($column && in_array($column, $allowed, true)) {
                    $query->orderBy($column, $direction);
                }
            }

            return;
        }

        $query->orderByDesc('tanggal_disposisi')->orderByDesc('id_surat_disposisi');
    }

    private function normalizeStatus(mixed $status): string
    {
        $normalized = str_replace([' ', '-'], '_', strtolower((string) $status));
        $normalized = match ($normalized) {
            'open', 'pending' => 'baru',
            'process', 'proses', 'in_progress' => 'diproses',
            'done', 'completed', 'complete' => 'selesai',
            'cancel', 'cancelled', 'canceled' => 'dibatalkan',
            default => $normalized,
        };

        if (!in_array($normalized, SuratDisposisi::STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'Status disposisi tidak valid.',
            ]);
        }

        return $normalized;
    }

    private function validateStatusTransition(?string $currentStatus, string $nextStatus): void
    {
        $current = $this->normalizeStatus($currentStatus ?: 'baru');
        $next = $this->normalizeStatus($nextStatus);

        if ($current === $next) {
            return;
        }

        $allowed = [
            'baru' => ['diproses', 'selesai', 'dibatalkan'],
            'diproses' => ['selesai', 'dibatalkan'],
            'selesai' => [],
            'dibatalkan' => [],
        ];

        if (!in_array($next, $allowed[$current] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => "Perubahan status disposisi dari {$current} ke {$next} tidak diperbolehkan.",
            ]);
        }
    }

    private function validationErrorResponse(ValidationException $exception): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Validasi data gagal.',
            'error' => $exception->errors(),
        ], 422);
    }
}
