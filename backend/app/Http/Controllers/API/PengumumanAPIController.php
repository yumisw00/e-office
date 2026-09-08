<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PengumumanAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\Pengumuman;
    }

    /**
     * Pengumuman is a content-management resource.  Its management API is
     * deliberately restricted on the server, rather than relying on a hidden
     * client-side menu.
     */
    public function index(Request $request): JsonResponse
    {
        $isAdmin = $this->canViewAllPengumuman($request);

        $filters = $request->input('q', []);
        $filters = is_array($filters) ? $filters : ['keyword' => $filters];
        Validator::make($filters, [
            'kategori' => 'nullable|in:informasi,penting,acara,pengumuman_layanan,edukasi',
            'status' => 'nullable|in:draft,publish',
            'target_role' => 'nullable|string|max:100',
            'tanggal_dari' => 'nullable|date_format:Y-m-d',
            'tanggal_sampai' => 'nullable|date_format:Y-m-d',
        ])->validate();
        $pageSize = min(max((int) $request->input('pagesize', 12), 1), 100);

        $query = $this->model->newQuery();

        // Non-admin users only see published pengumuman
        if (!$isAdmin) {
            $now = now();
            $query->where('status', 'publish')
                ->whereNotNull('published_at')
                ->where('published_at', '<=', $now)
                ->where(function (Builder $activeQuery) use ($now) {
                    $activeQuery->whereNull('expired_at')->orWhere('expired_at', '>=', $now);
                });

            $activeGroupId = $request->session()->get('id_group');
            $activeGroupName = $activeGroupId
                ? DB::table('sys_group')->where('id_group', $activeGroupId)->value('nama')
                : null;
            $legacyRole = strtolower(str_replace([' ', '-'], '_', trim((string) $activeGroupName)));
            $roleTargets = array_filter([
                'semua',
                $activeGroupId ? 'group:' . $activeGroupId : null,
                $legacyRole ?: null,
                str_contains($legacyRole, 'pimpinan') ? 'pegawai' : null,
            ]);
            $query->whereIn('target_role', $roleTargets);

            $divisionIds = $this->currentUserDivisionIds($request);
            $query->where(function (Builder $divisionQuery) use ($divisionIds) {
                $divisionQuery->whereNotExists(function ($subQuery) {
                    $subQuery->selectRaw('1')
                        ->from('pengumuman_divisi')
                        ->whereColumn('pengumuman_divisi.id_pengumuman', 'pengumuman.id_pengumuman');
                });
                if ($divisionIds !== []) {
                    $divisionQuery->orWhereExists(function ($subQuery) use ($divisionIds) {
                        $subQuery->selectRaw('1')
                            ->from('pengumuman_divisi')
                            ->whereColumn('pengumuman_divisi.id_pengumuman', 'pengumuman.id_pengumuman')
                            ->whereIn('pengumuman_divisi.id_divisi', $divisionIds);
                    });
                }
            });


        }

        $this->applyFilters($query, $filters);
        $this->applySafeOrdering($query, (string) $request->input('order', ''));

        $data = $query->paginate($pageSize);
        $items = collect($data->items())
            ->map(fn ($record) => $this->transformFrontendRecord($record))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'result' => $items,
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'total_page' => (int) ceil($data->total() / $pageSize),
            'total_records' => $data->total(),
            'total' => $data->total(),
        ]);
    }

    public function show($id = null): JsonResponse
    {
        $this->authorizeContentManager(request());

        $record = $this->model->find($id);
        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => sprintf('Data dengan id %s tidak ditemukan.', $id),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->transformFrontendRecord($record),
        ]);
    }

    /** List roles from Hak Akses Role for the announcement target selector. */
    public function roles(Request $request): JsonResponse
    {
        $this->authorizeContentManager($request);

        return response()->json([
            'success' => true,
            'data' => DB::table('sys_group')
                ->whereNull('deleted_at')
                ->orderBy('nama')
                ->get(['id_group', 'nama'])
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->saveFrontendRecord($request, 'store');
    }

    public function update($id = null, Request $request): JsonResponse
    {
        if (!$this->model->find($id)) {
            return response()->json([
                'success' => false,
                'message' => sprintf('Data dengan id %s tidak ditemukan.', $id),
            ], 404);
        }

        return $this->saveFrontendRecord($request, 'update', $id);
    }

    public function destroy($id = null): JsonResponse
    {
        return parent::destroy($id);
    }

    protected function prepareFrontendPayload(Request $request, string $mode): array
    {
        $payload = $request->all();

        if (array_key_exists('isi', $payload) && !array_key_exists('konten', $payload)) {
            $payload['konten'] = $payload['isi'];
        }

        if (array_key_exists('tanggal_publish', $payload) && !array_key_exists('published_at', $payload)) {
            $payload['published_at'] = $payload['tanggal_publish'];
        }

        if (array_key_exists('tanggal_expired', $payload) && !array_key_exists('expired_at', $payload)) {
            $payload['expired_at'] = $payload['tanggal_expired'];
        }

        if (!array_key_exists('status', $payload)) {
            $payload['status'] = 'draft';
        }

        if (($payload['status'] ?? null) === 'published') {
            $payload['status'] = 'publish';
        }

        if (!array_key_exists('kategori', $payload)) {
            $payload['kategori'] = 'informasi';
        }

        if (!array_key_exists('target_role', $payload)) {
            $payload['target_role'] = 'semua';
        }

        if (($payload['status'] ?? null) === 'publish' && empty($payload['published_at'])) {
            $payload['published_at'] = now();
        }

        return $payload;
    }

    protected function transformFrontendRecord($record): array
    {
        $data = is_array($record)
            ? $record
            : (method_exists($record, 'toArray') ? $record->toArray() : (array) $record);
        $data['isi'] = $data['isi'] ?? ($data['konten'] ?? null);
        $data['tanggal_publish'] = $data['tanggal_publish'] ?? ($data['published_at'] ?? null);
        $data['tanggal_expired'] = $data['tanggal_expired'] ?? ($data['expired_at'] ?? null);
        $announcementId = $data['id_pengumuman'] ?? null;
        if ($announcementId) {
            $divisions = DB::table('pengumuman_divisi')
                ->leftJoin('mt_sdm_divisi', 'mt_sdm_divisi.id_divisi', '=', 'pengumuman_divisi.id_divisi')
                ->where('pengumuman_divisi.id_pengumuman', $announcementId)
                ->orderBy('mt_sdm_divisi.nama')
                ->get(['pengumuman_divisi.id_divisi', 'mt_sdm_divisi.nama']);
            $data['target_divisi_ids'] = $divisions->pluck('id_divisi')->all();
            $data['target_divisi_list'] = $divisions->map(fn ($division) => [
                'id_divisi' => $division->id_divisi,
                'nama' => $division->nama,
            ])->all();
        }
        return $data;
    }

    private function saveFrontendRecord(Request $request, string $mode, $id = null): JsonResponse
    {
        $divisionIds = collect($request->input('target_divisi_ids', []))
            ->map(fn ($divisionId) => trim((string) $divisionId))
            ->filter()
            ->unique()
            ->values();

        $validDivisionIds = DB::table('mt_sdm_divisi')
            ->whereIn('id_divisi', $divisionIds)
            ->whereNull('deleted_at')
            ->pluck('id_divisi');
        if ($validDivisionIds->count() !== $divisionIds->count()) {
            return response()->json(['success' => false, 'message' => 'Target divisi tidak valid.'], 422);
        }

        $payloadDivisionNames = DB::table('mt_sdm_divisi')
            ->whereIn('id_divisi', $validDivisionIds)
            ->orderBy('nama')
            ->pluck('nama')
            ->implode(', ');

        $payload = $this->prepareFrontendPayload($request, $mode);
        unset($payload['target_divisi_ids']);
        $payload['target_divisi'] = $payloadDivisionNames ?: null;
        $payload = $this->filterFillablePayload($payload);

        Validator::make($payload, $this->rulesFor($mode))->validate();

        if ($mode === 'store') {
            $id = DB::transaction(function () use ($payload, $divisionIds) {
                $id = $this->model->insert($payload);
                $this->syncDivisions($id, $divisionIds->all());
                return $id;
            });
            $record = $this->model->find($id);

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil dibuat.',
                'data' => $this->transformFrontendRecord($record),
            ], 201);
        }

        $record = $this->model->find($id);
        DB::transaction(function () use ($id, $payload, $record, $divisionIds) {
            $this->model->update($id, $payload, $record);
            $this->syncDivisions($id, $divisionIds->all());
        });

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui.',
            'data' => $this->transformFrontendRecord($this->model->find($id)),
        ]);
    }

    private function rulesFor(string $mode): array
    {
        $rules = $this->model->rules;

        if ($mode === 'update') {
            $rules['judul'] = 'sometimes|required|string|max:200';
            $rules['konten'] = 'sometimes|required|string';
        }

        return $rules;
    }

    private function syncDivisions(int|string $announcementId, array $divisionIds): void
    {
        DB::table('pengumuman_divisi')->where('id_pengumuman', $announcementId)->delete();
        foreach ($divisionIds as $divisionId) {
            DB::table('pengumuman_divisi')->insert([
                'id_pengumuman' => $announcementId,
                'id_divisi' => $divisionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function currentUserDivisionIds(Request $request): array
    {
        $employeeId = $request->user()?->id_pegawai;
        if (!$employeeId) {
            return [];
        }

        $unitId = DB::table('mt_sdm_pegawai')->where('id_pegawai', $employeeId)->whereNull('deleted_at')->value('id_unit');
        if (!$unitId) {
            return [];
        }

        return DB::table('mt_sdm_divisi')
            ->whereNull('deleted_at')
            ->where(function ($query) use ($unitId) {
                $query->where('id_unit', $unitId)->orWhere('id_divisi', $unitId);
            })
            ->pluck('id_divisi')
            ->map(fn ($id) => (string) $id)
            ->all();
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $keyword = trim((string) ($filters['keyword'] ?? $filters['search'] ?? ''));
        if ($keyword !== '') {
            $query->where(function (Builder $keywordQuery) use ($keyword) {
                $keywordQuery->where('judul', 'like', '%' . $keyword . '%')
                    ->orWhere('konten', 'like', '%' . $keyword . '%');
            });
        }

        foreach (['kategori', 'status', 'target_role'] as $field) {
            $value = trim((string) ($filters[$field] ?? ''));
            if ($value !== '') {
                $query->where($field, $value);
            }
        }

        $targetDivisi = trim((string) ($filters['target_divisi'] ?? ''));
        if ($targetDivisi !== '') {
            $query->where('target_divisi', 'like', '%' . $targetDivisi . '%');
        }

        $dateFrom = $filters['tanggal_dari'] ?? null;
        if ($dateFrom) {
            $query->whereDate('published_at', '>=', Carbon::parse($dateFrom)->toDateString());
        }

        $dateTo = $filters['tanggal_sampai'] ?? null;
        if ($dateTo) {
            $query->whereDate('published_at', '<=', Carbon::parse($dateTo)->toDateString());
        }
    }

    private function applySafeOrdering(Builder $query, string $order): void
    {
        $sortable = ['judul', 'kategori', 'target_role', 'status', 'published_at', 'created_at', 'updated_at'];
        $hasOrder = false;

        foreach (explode(',', $order) as $part) {
            [$column, $direction] = array_pad(preg_split('/\s+/', trim($part)), 2, 'asc');
            if (in_array($column, $sortable, true)) {
                $query->orderBy($column, strtolower($direction) === 'desc' ? 'desc' : 'asc');
                $hasOrder = true;
            }
        }

        if (!$hasOrder) {
            $query->orderByDesc('published_at')->orderByDesc('id_pengumuman');
        }
    }

    private function authorizeContentManager(Request $request): void
    {
        $groupNames = collect([(string) $request->session()->get('nama_group', '')]);
        $userId = $request->user()?->id_user;

        if ($groupNames->filter()->isEmpty() && $userId) {
            $groupNames = DB::table('sys_user_group')
                ->join('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
                ->where('sys_user_group.id_user', $userId)
                ->whereNull('sys_user_group.deleted_at')
                ->whereNull('sys_group.deleted_at')
                ->pluck('sys_group.nama');
        }

        $isAllowed = $groupNames
            ->filter()
            ->map(fn ($name) => strtolower((string) $name))
            ->contains(fn ($name) => str_contains($name, 'admin konten')
                || str_contains($name, 'admin sistem')
                || str_contains($name, 'administrator'));

        if (!$isAllowed) {
            abort(response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengelola pengumuman.',
            ], 403));
        }
    }

    private function canViewAllPengumuman(Request $request): bool
    {
        $groupNames = collect([(string) $request->session()->get('nama_group', '')]);
        $userId = $request->user()?->id_user;

        if ($groupNames->filter()->isEmpty() && $userId) {
            $groupNames = DB::table('sys_user_group')
                ->join('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
                ->where('sys_user_group.id_user', $userId)
                ->whereNull('sys_user_group.deleted_at')
                ->whereNull('sys_group.deleted_at')
                ->pluck('sys_group.nama');
        }

        $isAdministrator = $groupNames
            ->filter()
            ->map(fn ($name) => strtolower((string) $name))
            ->contains(fn ($name) => str_contains($name, 'admin konten')
                || str_contains($name, 'admin sistem')
                || str_contains($name, 'administrator'));

        if ($isAdministrator) {
            return true;
        }

        $groupId = $request->session()->get('id_group');
        if (!$groupId) {
            return false;
        }

        return DB::table('sys_group_action')
            ->join('sys_group_menu', 'sys_group_menu.id_group_menu', '=', 'sys_group_action.id_group_menu')
            ->join('sys_action', 'sys_action.id_action', '=', 'sys_group_action.id_action')
            ->join('sys_menu', 'sys_menu.id_menu', '=', 'sys_group_menu.id_menu')
            ->where('sys_group_menu.id_group', $groupId)
            ->where('sys_menu.url', 'pengumuman')
            ->whereIn('sys_action.nama', ['add', 'edit', 'delete'])
            ->whereNull('sys_group_menu.deleted_at')
            ->whereNull('sys_group_action.deleted_at')
            ->whereNull('sys_action.deleted_at')
            ->whereNull('sys_menu.deleted_at')
            ->exists();
    }
}
