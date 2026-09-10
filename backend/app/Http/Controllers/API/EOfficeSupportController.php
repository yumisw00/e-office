<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\SysAction;

class EOfficeSupportController extends Controller
{
    public function suratMasukMasterData(): JsonResponse
    {
        $data = [
            'jenis' => $this->options([
                'Surat Pengumuman',
                'Surat Undangan',
                'Surat Permohonan',
                'Surat Pemberitahuan',
                'Surat Tugas',
            ]),
            'sifat' => $this->options([
                'Biasa',
                'Penting',
                'Rahasia',
                'Segera',
                'Sangat Segera',
            ]),
            'topik' => $this->options([
                'Kelembagaan',
                'Akademik',
                'Keuangan',
                'Umum',
                'SDM',
            ]),
            'status' => $this->options([
                'baru',
                'diproses',
                'menunggu_disposisi',
                'selesai',
            ]),
            'source_type' => $this->options([
                'AI',
                'Manual',
            ]),
            'ai_status' => $this->options([
                'berhasil',
                'gagal',
                'belum_diproses',
            ]),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'flat' => collect($data)
                ->map(fn ($items) => collect($items)->pluck('value')->values())
                ->all(),
        ]);
    }

    /**
     * Get list of all surat templates for dropdown.
     * No menu permission required — accessible to all authenticated users.
     */
    public function suratTemplateList(): JsonResponse
    {
        try {
            $templates = DB::table('surat_template')
                ->whereNull('deleted_at')
                ->orderBy('nama', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'total' => $templates->count(),
            ]);
        } catch (\Throwable $e) {
            \Log::error('[suratTemplateList] Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat template',
                'data' => [],
            ], 500);
        }
    }

    public function suratMasukTimeline(int|string $id): JsonResponse
    {
        $surat = DB::table('surat_masuk')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        if (!$surat) {
            return response()->json([
                'success' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        // Ownership check: user must be related to this letter (creator, recipient, or admin).
        $currentUserId = (int) auth()->user()?->id_user;
        if (!$this->isAdminSession()) {
            $isCreator = (int) ($surat->created_by ?? 0) === $currentUserId;
            $isDistribusiRecipient = DB::table('surat_distribusi')
                ->where('id_surat_masuk', $id)
                ->where('id_user_tujuan', $currentUserId)
                ->whereNull('deleted_at')
                ->exists();
            $isDisposisiRecipient = DB::table('surat_disposisi')
                ->where('id_surat_masuk', $id)
                ->where('id_penerima', $currentUserId)
                ->whereNull('deleted_at')
                ->exists();
            if (!$isCreator && !$isDistribusiRecipient && !$isDisposisiRecipient) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $events = collect();

        $events->push($this->timelineItem(
            'created',
            'Surat masuk dibuat',
            $surat->status,
            $surat->created_at,
            $surat->created_by,
            [
                'nomor_surat' => $surat->nomor_surat ?? null,
                'perihal' => $surat->perihal ?? null,
            ]
        ));

        if (!empty($surat->updated_at) && $surat->updated_at !== $surat->created_at) {
            $events->push($this->timelineItem(
                'updated',
                'Surat masuk diperbarui',
                $surat->status,
                $surat->updated_at,
                $surat->updated_by,
                [
                    'nomor_surat' => $surat->nomor_surat ?? null,
                    'perihal' => $surat->perihal ?? null,
                ]
            ));
        }

        DB::table('surat_distribusi')
            ->where('id_surat_masuk', $surat->id)
            ->whereNull('deleted_at')
            ->orderBy('created_at')
            ->get()
            ->each(function ($row) use ($events) {
                $events->push($this->timelineItem(
                    'distributed',
                    'Surat didistribusikan',
                    $row->status,
                    $row->tanggal_distribusi ?? $row->created_at,
                    $row->created_by,
                    [
                        'id_surat_distribusi' => $row->id_surat_distribusi,
                        'id_unit_tujuan' => $row->id_unit_tujuan,
                        'id_user_tujuan' => $row->id_user_tujuan,
                        'catatan' => $row->catatan,
                    ]
                ));

                if (!empty($row->tanggal_dibaca)) {
                    $events->push($this->timelineItem(
                        'read',
                        'Surat dibaca penerima',
                        'dibaca',
                        $row->tanggal_dibaca,
                        $row->id_user_tujuan,
                        [
                            'id_surat_distribusi' => $row->id_surat_distribusi,
                        ]
                    ));
                }
            });

        DB::table('surat_disposisi')
            ->where('id_surat_masuk', $surat->id)
            ->whereNull('deleted_at')
            ->orderBy('created_at')
            ->get()
            ->each(function ($row) use ($events) {
                $events->push($this->timelineItem(
                    'disposition',
                    'Disposisi dibuat',
                    $row->status,
                    $row->created_at,
                    $row->id_pemberi,
                    [
                        'id_surat_disposisi' => $row->id_surat_disposisi,
                        'id_penerima' => $row->id_penerima,
                        'instruksi' => $row->instruksi,
                        'tanggal_jatuh_tempo' => $row->tanggal_jatuh_tempo,
                    ]
                ));

                if (!empty($row->tanggal_selesai)) {
                    $events->push($this->timelineItem(
                        'disposition_completed',
                        'Disposisi diselesaikan',
                        $row->status,
                        $row->tanggal_selesai,
                        $row->id_penerima,
                        [
                            'id_surat_disposisi' => $row->id_surat_disposisi,
                            'catatan_penyelesaian' => $row->catatan_penyelesaian,
                            'file_bukti_path' => $row->file_bukti_path,
                        ]
                    ));
                }
            });

        DB::table('surat_arsip')
            ->where('id_surat_masuk', $surat->id)
            ->whereNull('deleted_at')
            ->orderBy('created_at')
            ->get()
            ->each(function ($row) use ($events) {
                $events->push($this->timelineItem(
                    'archived',
                    'Surat diarsipkan',
                    'arsip',
                    $row->tanggal_arsip ?? $row->created_at,
                    $row->created_by,
                    [
                        'id_surat_arsip' => $row->id_surat_arsip,
                        'file_path' => $row->file_path,
                        'hash_file' => $row->hash_file,
                    ]
                ));
            });

        return response()->json([
            'success' => true,
            'data' => $events
                ->filter(fn ($event) => !empty($event['created_at']))
                ->sortBy('created_at')
                ->values()
                ->all(),
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $currentUserId = auth()->user()?->id_user;
        $requestedUserId = $request->query('id_user');

        if ($requestedUserId && (int) $requestedUserId !== (int) $currentUserId && !$this->canManageNotifications()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $idUser = $requestedUserId ?: $currentUserId;
        $limit = min((int) $request->query('limit', 50), 100);

        $query = DB::table('sys_notification')
            ->where('channel', 'eoffice')
            ->whereNull('deleted_at')
            ->orderByDesc('created_at');

        if ($idUser) {
            $query->where('id_user', $idUser);
        }

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        $rows = $query->limit($limit)->get()->map(fn ($row) => $this->notificationPayload($row))->values();

        return response()->json([
            'success' => true,
            'unread_count' => $rows->whereNull('read_at')->count(),
            'data' => $rows,
            'result' => $rows,
            'total_records' => $rows->count(),
            'total' => $rows->count(),
        ]);
    }

    private function canManageNotifications(): bool
    {
        // Admin Sistem (id_group=1) and Admin Konten (id_group=2) can manage notifications
        $idGroup = (int) session('id_group');
        if (in_array($idGroup, [1, 2], true)) {
            return true;
        }

        // Also check by nama_group for session-based auth
        $namaGroup = strtolower(trim(session('nama_group') ?? ''));
        if (in_array($namaGroup, ['admin sistem', 'admin_konten', 'adminkonten'], true)) {
            return true;
        }

        // Fallback: check sys_action for sys_notification menu
        if ($idGroup) {
            try {
                if ((new SysAction())->access('index', 'sys_notification', $idGroup) > 0) {
                    return true;
                }
            } catch (\Throwable $e) {
                // sys_notification menu may not exist in sys_menu; ignore
            }
        }

        return false;
    }

    public function notificationRecipients(): JsonResponse
    {
        if (!$this->canManageNotifications()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // ===== UNITS =====
        $units = collect();
        if (Schema::hasTable('mt_sdm_unit')) {
            $unitsQuery = DB::table('mt_sdm_unit')
                ->select('id_unit', 'nama')
                ->orderBy('nama');

            if (Schema::hasColumn('mt_sdm_unit', 'deleted_at')) {
                $unitsQuery->whereNull('deleted_at');
            }

            $units = $unitsQuery->get()->map(fn ($unit) => [
                'value' => $unit->id_unit,
                'label' => $unit->nama ?: $unit->id_unit,
            ]);
        }

        // ===== USERS =====
        // Get all active users with their sys_user_group info
        $usersQuery = DB::table('sys_user')
            ->leftJoin('sys_user_group', function ($join) {
                $join->on('sys_user_group.id_user', '=', 'sys_user.id_user')
                    ->whereNull('sys_user_group.deleted_at');
            })
            ->leftJoin('sys_group', function ($join) {
                $join->on('sys_group.id_group', '=', 'sys_user_group.id_group')
                    ->whereNull('sys_group.deleted_at');
            })
            ->select(
                'sys_user.id_user',
                'sys_user.name',
                'sys_user.email',
                'sys_user_group.id_jabatan',
                'sys_group.id_group',
                'sys_group.nama as group_nama'
            );

        if (Schema::hasColumn('sys_user', 'deleted_at')) {
            $usersQuery->whereNull('sys_user.deleted_at');
        }

        // Build jabatan -> unit mapping from mt_sdm_jabatan
        $jabatanToUnit = [];
        if (Schema::hasTable('mt_sdm_jabatan')) {
            $jabRows = DB::table('mt_sdm_jabatan')
                ->select('id_jabatan', 'id_unit', 'nama')
                ->whereNotNull('id_unit')
                ->when(Schema::hasColumn('mt_sdm_jabatan', 'deleted_at'), fn ($q) => $q->whereNull('deleted_at'))
                ->get();
            foreach ($jabRows as $jr) {
                if (!empty($jr->id_jabatan)) {
                    $jabatanToUnit[$jr->id_jabatan] = [
                        'id_unit' => $jr->id_unit,
                        'nama_jabatan' => $jr->nama,
                    ];
                }
            }
        }

        // Build group -> unit mapping for users without valid jabatan assignment
        $groupToUnit = [
            'admin_sistem' => 'DIR-UTAMA',
            'admin_konten' => 'DIV-SDM',
        ];

        // Build unit name lookup
        $unitNameMap = [];
        if (Schema::hasTable('mt_sdm_unit')) {
            $unitRows = DB::table('mt_sdm_unit')
                ->select('id_unit', 'nama')
                ->when(Schema::hasColumn('mt_sdm_unit', 'deleted_at'), fn ($q) => $q->whereNull('deleted_at'))
                ->get();
            foreach ($unitRows as $u) {
                $unitNameMap[$u->id_unit] = $u->nama;
            }
        }

        $users = $usersQuery
            ->get()
            ->unique('id_user')
            ->values()
            ->map(function ($user) use ($jabatanToUnit, $groupToUnit, $unitNameMap) {
                // First try to find id_unit via sys_user_group.id_jabatan (INTEGER) -> mt_sdm_jabatan.id_jabatan (VARCHAR)
                $jabatanKey = $user->id_jabatan !== null ? (string) $user->id_jabatan : null;
                $jabatanInfo = $jabatanKey && isset($jabatanToUnit[$jabatanKey]) ? $jabatanToUnit[$jabatanKey] : null;
                $idUnit = $jabatanInfo['id_unit'] ?? null;

                // Fallback: infer unit from sys_group name for Admin group members
                if (!$idUnit && $user->group_nama) {
                    $groupKey = preg_replace('/[\\s-]+/', '_', strtolower(trim($user->group_nama)));
                    if (isset($groupToUnit[$groupKey])) {
                        $idUnit = $groupToUnit[$groupKey];
                    }
                }

                $namaUnit = $idUnit ? ($unitNameMap[$idUnit] ?? null) : null;

                return [
                    'value' => (string) $user->id_user,
                    'label' => trim($user->name ?: $user->email ?: 'User ' . $user->id_user),
                    'email' => $user->email,
                    'id_unit' => $idUnit,
                    'nama_unit' => $namaUnit,
                ];
            });

        return response()->json([
            'success' => true,
            'units' => $units->values(),
            'users' => $users,
            'data' => [
                'units' => $units->values(),
                'users' => $users,
            ],
        ]);
    }

    public function storeNotification(Request $request): JsonResponse
    {
        if (!$this->canManageNotifications()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'id_user' => ['nullable', 'integer'],
            'id_users' => ['nullable', 'array'],
            'id_users.*' => ['integer'],
            'target_role' => ['nullable', 'in:pegawai,admin_konten,admin_sistem,semua'],
            'title' => ['required', 'string', 'max:200'],
            'message' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:255'],
            'payload' => ['nullable', 'array'],
        ]);

        $idUsers = collect($validated['id_users'] ?? [])
            ->push($validated['id_user'] ?? null)
            ->merge($this->resolveNotificationRecipients($validated['target_role'] ?? null))
            ->filter()
            ->unique()
            ->values();

        if ($idUsers->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Penerima notifikasi belum dipilih.',
            ], 422);
        }

        $now = now();
        $created = $idUsers->map(function ($idUser) use ($validated, $now) {
            $id = DB::table('sys_notification')->insertGetId([
                'id_user' => $idUser,
                'channel' => 'eoffice',
                'title' => $validated['title'],
                'message' => $validated['message'] ?? null,
                'url' => $validated['url'] ?? null,
                'payload' => json_encode($validated['payload'] ?? []),
                'created_at' => $now,
                'updated_at' => $now,
            ], 'id_notification');

            return DB::table('sys_notification')->where('id_notification', $id)->first();
        })->map(fn ($row) => $this->notificationPayload($row))->values();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi e-office berhasil dibuat.',
            'data' => $created,
            'result' => $created,
            'total_records' => $created->count(),
            'total' => $created->count(),
        ]);
    }

    public function markNotificationRead(int|string $id): JsonResponse
    {
        $currentUserId = (int) auth()->user()?->id_user;
        if (!$currentUserId) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi pengguna diperlukan.',
            ], 403);
        }

        $notification = DB::table('sys_notification')
            ->where('id_notification', $id)
            ->where('channel', 'eoffice')
            ->where('id_user', $currentUserId)
            ->whereNull('deleted_at')
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $currentUserId = auth()->user()?->id_user;
        if ((int) $notification->id_user !== (int) $currentUserId && !$this->canManageNotifications()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        DB::table('sys_notification')
            ->where('id_notification', $id)
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'data' => $this->notificationPayload(
                DB::table('sys_notification')->where('id_notification', $id)->first()
            ),
        ]);
    }

    private function options(array $values): array
    {
        return collect($values)
            ->map(fn ($value) => [
                'value' => $value,
                'label' => $value,
            ])
            ->all();
    }

    private function timelineItem(string $type, string $title, ?string $status, ?string $createdAt, $actorId = null, array $payload = []): array
    {
        return [
            'type' => $type,
            'title' => $title,
            'status' => $status,
            'description' => $title,
            'actor' => $this->actorLabel($actorId),
            'target' => $this->targetLabel($payload),
            'created_at' => $createdAt,
            'actor_id' => $actorId,
            'payload' => $payload,
        ];
    }

    private function actorLabel($actorId): ?string
    {
        if (!$actorId) {
            return null;
        }

        try {
            $user = DB::table('sys_user')->where('id_user', $actorId)->first();

            foreach (['name', 'nama', 'username', 'email'] as $column) {
                if (!empty($user->{$column})) {
                    return (string) $user->{$column};
                }
            }
        } catch (\Throwable) {
            //
        }

        return (string) $actorId;
    }

    private function targetLabel(array $payload): ?string
    {
        if (!empty($payload['target'])) {
            return (string) $payload['target'];
        }

        if (!empty($payload['id_user_tujuan'])) {
            return $this->actorLabel($payload['id_user_tujuan']);
        }

        if (!empty($payload['id_penerima'])) {
            return $this->actorLabel($payload['id_penerima']);
        }

        if (!empty($payload['id_unit_tujuan'])) {
            try {
                $unit = DB::table('mt_sdm_unit')->where('id_unit', $payload['id_unit_tujuan'])->first();

                if (!empty($unit->nama)) {
                    return (string) $unit->nama;
                }
            } catch (\Throwable) {
                //
            }

            return (string) $payload['id_unit_tujuan'];
        }

        return null;
    }

    private function notificationPayload($row): array
    {
        $payload = $row->payload ?? null;

        if (is_string($payload)) {
            $payload = json_decode($payload, true) ?: [];
        }

        return [
            'id_notification' => $row->id_notification,
            'id_user' => $row->id_user,
            'channel' => $row->channel,
            'title' => $row->title,
            'message' => $row->message,
            'url' => $row->url,
            'payload' => $payload ?: [],
            'read_at' => $row->read_at,
            'created_at' => $row->created_at,
        ];
    }

    private function resolveNotificationRecipients(?string $targetRole): array
    {
        if (!$targetRole) {
            return [];
        }

        $users = DB::table('sys_user')->select('sys_user.id_user as recipient_id');
        $users = DB::table('sys_user')
            ->select('sys_user.id_user as recipient_id');

        if (Schema::hasColumn('sys_user', 'deleted_at')) {
            $users->whereNull('sys_user.deleted_at');
        }

        if ($targetRole === 'semua') {
            return $users
                ->distinct()
                ->get()
                ->pluck('recipient_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        $roleNames = [
            'pegawai' => ['Pegawai'],
            'admin_konten' => ['Admin Konten'],
            'admin_sistem' => ['Admin Sistem'],
        ][$targetRole] ?? [];

        if (!$roleNames) {
            return [];
        }

        return $users
            ->join('sys_user_group', 'sys_user_group.id_user', '=', 'sys_user.id_user')
            ->join('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
            ->when(Schema::hasColumn('sys_user_group', 'deleted_at'), fn ($query) => $query->whereNull('sys_user_group.deleted_at'))
            ->when(Schema::hasColumn('sys_group', 'deleted_at'), fn ($query) => $query->whereNull('sys_group.deleted_at'))
            ->whereIn('sys_group.nama', $roleNames)
            ->distinct()
            ->get()
            ->pluck('recipient_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Check if the current session belongs to an admin group.
     * Used for ownership checks that allow admin bypass.
     */
    private function isAdminSession(): bool
    {
        $namaGroup = strtolower(session('nama_group') ?? '');

        return in_array($namaGroup, ['admin_sistem', 'admin konten', 'admin_konten'], true);
    }
}
