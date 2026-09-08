<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Query\JoinClause;


/**
 * Class SysUserAPIController
 */
class SysUserAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysUserModel;
        $this->middleware('EnsureHasGroup:sys_user', ['only' => ['index', 'create', 'store', 'edit', 'delete']]);
    }

    protected function _search(array $search = null)
    {
        if (!$search)
            return $search;

        if (!empty($search['nama']))
            $search['nama'] = "%" . $search['nama'] . "%";
        if (!empty($search['kode']))
            $search['kode'] = "%" . $search['kode'] . "%";

        return $search;
    }

    public function index(Request $request): JsonResponse
    {
        // DB::enableQueryLog();
        $search = $request->get('q');
        $id_jabatan = null;
        $id_group = null;
        $id_unit = null;
        if (!empty($search['id_jabatan']) && $search['id_jabatan'] != 'null') {
            $id_jabatan = $search['id_jabatan'];
            unset($search['id_jabatan']);
        }
        if (!empty($search['id_group']) && $search['id_group'] != 'null') {
            $id_group = $search['id_group'];
            unset($search['id_group']);
        }
        if (!empty($search['id_unit']) && $search) {
            $id_unit = $search['id_unit'];
            unset($search['id_unit']);
        }
        // if ($search) {
        //     if (!empty($search['nama']))
        //         $search['nama'] = "%" . $search['nama'] . "%";
        //     if (!empty($search['kode']))
        //         $search['kode'] = "%" . $search['kode'] . "%";
        // }
        $search = $this->_search($search);
        // $filter = $request->get('q');
        $page = $request->get('page') ?? 1;
        $limit = $request->get('pagesize') ?? $this->limit;
        $db = $this->model->search($search);

        $db = $db->selectRaw("sys_user.*, mt_sdm_jabatan.*, sys_user_group.id_group");

        $orderby = $request->get('order');
        if ($orderby) {
            $orderby = explode(",", $orderby);
            if (!is_array($orderby))
                $orderby = array($orderby);

            foreach ($orderby as $v) {
                $exp = explode(" ", $v);
                $column = $exp[0];
                if ($exp[1])
                    $sc = $exp[1];

                $db = $db->orderBy($column, $sc);
            }
        } else if ($this->model->orderDefault) {
            $exp = explode(",", $this->model->orderDefault);
            if (!is_array($exp))
                $exp = array($exp);

            foreach ($exp as $v)
                $db = $db->orderByRaw(trim($v));
        } else if ($this->model->primaryKey) {
            $db = $db->orderBy($this->model->primaryKey);
        }


        $db = $db->leftJoin(
            "sys_user_group",
            function (JoinClause $join) {
                $join->on($this->model->table . ".id_user", "=", "sys_user_group.id_user")
                    ->whereRaw('sys_user_group.deleted_at is null');
            }
        );
        $db = $db->leftJoin(
            "sys_group",
            "sys_group.id_group",
            "=",
            "sys_user_group.id_group"
        );
        $db = $db->leftJoin(
            "mt_sdm_pegawai",
            function (JoinClause $join) {
                $join->on(
                    DB::raw('CAST(' . $this->model->table . '.id_pegawai AS TEXT)'),
                    '=',
                    DB::raw('CAST(mt_sdm_pegawai.id_pegawai AS TEXT)')
                )->whereRaw('mt_sdm_pegawai.deleted_at is null');
            }
        );
        $db = $db->leftJoin(
            "mt_sdm_jabatan",
            function (JoinClause $join) {
                $join->on(
                    DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'),
                    '=',
                    DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)')
                );
            }
        );
        $db = $db->leftJoin(
            "mt_sdm_jabatan as mt_sdm_jabatan_pegawai",
            function (JoinClause $join) {
                $join->on(
                    DB::raw('CAST(mt_sdm_pegawai.id_jabatan AS TEXT)'),
                    '=',
                    DB::raw('CAST(mt_sdm_jabatan_pegawai.id_jabatan AS TEXT)')
                );
            }
        );

        if ($id_group) {
            $db = $db->whereRaw(" sys_user_group.id_group = ?", $id_group);
        }

        if ($id_jabatan) {
            $db = $db->whereRaw(" COALESCE(sys_user_group.id_jabatan, mt_sdm_pegawai.id_jabatan) = ?", $id_jabatan);
        }
        $db = $db->select(
            "sys_user.*",
            "sys_user_group.id_group",
            DB::raw("COALESCE(mt_sdm_jabatan.nama, mt_sdm_jabatan_pegawai.nama, mt_sdm_pegawai.nama_jabatan) as nama_jabatan"),
            DB::raw("COALESCE(CAST(sys_user_group.id_jabatan AS TEXT), CAST(mt_sdm_pegawai.id_jabatan AS TEXT)) as id_jabatan"),
            "sys_group.nama as nama_group"
        );
        // if($filter)
        // 	$db = $db->where($filter);
        // echo $this->getSqlWithBindings($sql, $params);
        $data = $db->paginate($limit);
        // var_dump($data);

        // $groupm = new \App\Models\SysUserGroup();
        // $jabatanm = new \App\Models\MtSdmJabatan();
        // foreach ($data as $i => &$r) {
        //     $group = $groupm->select($groupm->table . '.id_jabatan', $groupm->table . '.id_group', 'mt_sdm_jabatan.id_unit');
        //     $group = $group->leftJoin('mt_sdm_jabatan', $groupm->table . '.id_jabatan', '=', 'mt_sdm_jabatan.id_jabatan');
        //     $group = $group->where('id_user', $r->id_user)->get();

        //     $r->detail = $group;
        // }

        foreach ($data->items() as &$item) {
            $item->password = null;
        }

        return $this->respond([
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'data' => $data->items(),
            'total_page' => ceil($data->total() / $limit),
            'total_records' => $data->total()
        ]);
        // return $this->respond([
        //     'page' => $this->model->pager->getCurrentPage(),
        //     'page_size' => $limit,
        //     'data' => $data,
        //     'total_page' => $this->model->pager->getPageCount(),
        //     'total_records' => $this->model->pager->getDataCount()
        // ]);
    }

    public function store(Request $request): JsonResponse
    {
        $arr_group = $request->get('dataAll', []);
        $request->request->remove('dataAll');
        $request->validate($this->model->rules);

        $data = $request->all();
        $data['password'] = Hash::make($request->password);
        // Akun yang baru dibuat dapat langsung masuk ke dashboard. Perubahan
        // sandi paksa tetap dipakai untuk reset atau insiden keamanan.
        $data['need_update_pass'] = false;
        $data['reason_reset_pass'] = null;

        DB::beginTransaction();
        try {
            $id = $this->model->insert($data);

            foreach ($arr_group as $group) {
                if (empty($group['id_group'])) {
                    continue;
                }

                DB::table('sys_user_group')->insert([
                    'id_user' => $id,
                    'id_group' => $group['id_group'],
                    'id_jabatan' => $group['id_jabatan'] ?? null,
                ]);
            }

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }

        $data['id_user'] = $id;

        return $this->respondCreated($data, 'data created');
    }
    public function show($id = null): JsonResponse
    {
        $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();
        $sys_user_delegasi = new \App\Models\SysUserDelegasi();
        $sys_user_model = new \App\Models\SysUserModel;

        $record = $this->model->find($id);
        $record['password'] = '';
        if (!$record) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
                $id
            ));
        }

        $record->delegasi = $sys_user_delegasi
            ->join('sys_user', 'sys_user_delegasi.id_user', '=', 'sys_user.id_user')
            ->where('id_user_parent', '=', $id)
            ->select('sys_user.*', 'sys_user_delegasi.id_user_delegasi')
            ->get();

        foreach ($record->delegasi as &$delegasi) {
            $delegasi['password'] = '';
            $sys_user_group = new \App\Models\SysUserGroup();

            $sys_user_group = $sys_user_group->where('id_user', '=', $delegasi->id_user)->select('id_jabatan');

            $jabatanm = $mt_sdm_jabatan->whereIn('id_jabatan', $sys_user_group)->pluck('nama')->toArray();

            $delegasi->nama = implode(", ", $jabatanm);
        }

        return $this->respond($record);
    }

    public function update($id = null, Request $request): JsonResponse
    {
        $arr_group = $request->get('dataAll');
        $request->request->remove('dataAll');
        $this->model->rules['password'] = 'string|max:255';
        $request->validate($this->model->rules);

        if (!$data_before = $this->model->find($id)) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
                $id
            ));
        }

        // $data       = $request->getRawInput();		
        // $updateData = array_filter($data);
        $updateData = $request->all();
        if ($request->password) {

            $passwordSecurityService = new \App\Services\PasswordSecurityService;

            $validation = $passwordSecurityService->fullValidation($data_before, $request->password, true);

            if (!$validation['valid']) {
                return $this->failValidationError(implode('. ', $validation['errors']));
            }

            $updateData['password'] = Hash::make($request->password);
        }

        $ret = $this->model->update($id, $updateData, $data_before);

        DB::beginTransaction();
        $ret = true;
        $cek = DB::table('sys_user_group')->where('id_user', '=', $id)->get();

        if (!empty($cek[0]->id_user)) {
            $ret = DB::table('sys_user_group')->where('id_user', '=', $id)->delete();
        }
        if ($ret) {
            foreach ($arr_group as $v) {
                $v['id_user'] = $id;
                $ret = DB::table('sys_user_group')->insert($v);
            }
            if ($ret) {
                DB::commit();
            } else {
                DB::rollBack();
            }
        }

        $updateData['id_user'] = $id;
        if ($ret) {

            return $this->respond($arr_group[0]['id_group'], 200, 'data updated');
        } else {
            return $this->fail("tambah gagal");
        }
    }

    public function update_profile(Request $request): JsonResponse
    {
        $this->model->rules['password'] = 'string|max:255';
        $request->validate($this->model->rules);

        $id = $request->user()->id_user;
        if (!$data_before = $this->model->find($id)) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
                $id
            ));
        }

        $updateData = $request->all();
        if ($request->password) {

            $passwordSecurityService = new \App\Services\PasswordSecurityService;

            $validation = $passwordSecurityService->fullValidation($data_before, $request->password, true);

            if (!$validation['valid']) {
                return $this->failValidationError(implode('. ', $validation['errors']));
            }

            $updateData['password'] = Hash::make($request->password);
        }
        $updateData['need_update_pass'] = false;
        $updateData['security_incident_flag'] = false;
        $updateData['reason_reset_pass'] = null;

        $ret = $this->model->update($id, $updateData, $data_before);

        $updateData['id_user'] = $id;
        return $this->respond($updateData, 200, 'data updated');
    }

    /**
     * Toggle user active status (enable/disable)
     */
    public function toggleActive(Request $request, int|string $id): JsonResponse
    {
        $currentUserId = auth()->user()?->id_user;
        if (!$currentUserId) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        // Prevent self-deactivation
        if ((int) $id === (int) $currentUserId) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menonaktifkan akun Anda sendiri.',
            ], 422);
        }

        $user = DB::table('sys_user')->where('id_user', $id)->whereNull('deleted_at')->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $newStatus = (bool) !($user->is_active ?? true);

        DB::table('sys_user')->where('id_user', $id)->update([
            'is_active' => $newStatus,
            'updated_at' => now(),
            'updated_by' => $currentUserId,
        ]);

        $statusLabel = $newStatus ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Pengguna berhasil {$statusLabel}.",
            'data' => [
                'id_user' => $id,
                'is_active' => $newStatus,
            ],
        ]);
    }

    public function create_user()
    {
        /*
        $mt_sdm_pewagai = new \App\Models\MtSdmPegawai();
        $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();
        $sys_user_group = new \App\Models\SysUserGroup();

        $all_pegawai = $mt_sdm_pewagai->whereRaw("email is not null")->whereRaw("position_id is not null")->get();

        $ret = true;
        foreach ($all_pegawai as $pegawai) {
            $id_user = null;

            if (!$ret)
                exit;


            # check user sudah ada
            $check_exists = $id_user = $this->model->where("nid", "=", $pegawai->nid)->value('id_user');
            if (!$check_exists) {
                // continue;

                $record = [];
                $record['email'] = $pegawai->email;
                $record['name'] = $pegawai->nama_lengkap;
                $record['nid'] = $pegawai->nid;
                $record['password'] = Hash::make(trim($pegawai->nid));

                $ret = $id_user = $this->model->insert($record);
            }


            if ($ret) {
                $id_jabatan_pegawai = $mt_sdm_jabatan->where("position_id", "=", $pegawai->position_id)->value("id_jabatan");

                # check jabatan user
                $check_jabatan = $sys_user_group->where("id_jabatan", "=", $id_jabatan_pegawai)->where("id_user", "=", $id_user)->count();

                if ($check_jabatan)
                    continue;

                    // $ret = 
            }
        }
        */
    }

    /**
     * Get list of authorized signers/penanda tangan
     * Used for surat keluar penandatangan selection
     */
    public function signers(): JsonResponse
    {
        try {
            // Build the base query: all users with their jabatan via sys_user_group
            $baseQuery = DB::table('sys_user')
                ->leftJoin('sys_user_group', 'sys_user.id_user', '=', 'sys_user_group.id_user')
                ->leftJoin('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
                ->leftJoin('mt_sdm_jabatan', function (JoinClause $join) {
                    $join->on(
                        DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'),
                        '=',
                        DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)')
                    );
                })
                ->select([
                    'sys_user.id_user as id',
                    'sys_user.id_user',
                    'sys_user.name as nama',
                    'sys_user.email',
                    'mt_sdm_jabatan.nama as jabatan',
                    'sys_group.nama as nama_group',
                ]);

            // Build signer conditions
            $conditions = [];
            if (Schema::hasColumn('sys_user', 'is_penanda_tangan')) {
                $conditions[] = ['sys_user.is_penanda_tangan', '=', true];
            }
            if (Schema::hasColumn('sys_user', 'is_signer')) {
                $conditions[] = ['sys_user.is_signer', '=', true];
            }

            // If any signer flag exists, apply conditions
            if (count($conditions) > 0) {
                $signers = (clone $baseQuery)
                    ->where(function($q) use ($conditions) {
                        foreach ($conditions as $cond) {
                            $q->orWhere($cond[0], $cond[1], $cond[2]);
                        }
                    })
                    ->orWhere('sys_user_group.id_group', 2)
                    ->orWhereNotNull('sys_user_group.id_jabatan')
                    ->groupBy('sys_user.id_user', 'sys_user.name', 'sys_user.email', 'mt_sdm_jabatan.nama', 'sys_group.nama')
                    ->orderBy('sys_user.name', 'asc')
                    ->get();
            } else {
                // No signer flags exist yet — return all users (with or without jabatan)
                $signers = (clone $baseQuery)
                    ->groupBy('sys_user.id_user', 'sys_user.name', 'sys_user.email', 'mt_sdm_jabatan.nama', 'sys_group.nama')
                    ->orderBy('sys_user.name', 'asc')
                    ->get();
            }

            // Transform to include label (deduplicate by id_user)
            $seen = [];
            $data = $signers->map(function($user) {
                $identity = strtolower(trim(($user->nama ?? '') . ' ' . ($user->nama_group ?? '')));
                $jabatan = $user->jabatan;

                // Sistem lama menyimpan id_jabatan numerik, sedangkan master
                // jabatan baru memakai kode. Tetap tampilkan jabatan fungsional
                // yang bisa diidentifikasi dari identitas akun sampai data lama
                // selesai dimigrasikan.
                if (!$jabatan) {
                    $jabatan = str_contains($identity, 'pimpinan') || str_contains($identity, 'direktur') || str_contains($identity, 'direksi')
                        ? 'Pimpinan'
                        : ($user->nama_group ?: 'Jabatan belum ditentukan');
                }
                return [
                    'id' => $user->id,
                    'id_user' => $user->id_user,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'jabatan' => $jabatan,
                    'label' => $user->nama . ' - ' . $jabatan,
                ];
            })->filter(function($user) use (&$seen) {
                if (isset($seen[$user['id_user']])) return false;
                $seen[$user['id_user']] = true;
                return true;
            })->values();

            return response()->json([
                'data' => $data,
                'success' => true,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get penanda tangans: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => true,
                'message' => 'Gagal mengambil daftar penandatangan',
            ], 500);
        }
    }

    /**
     * Get list of authorized reviewers/pemeriksa
     * Used for surat keluar pemeriksa selection
     */
    public function reviewers(): JsonResponse
    {
        try {
            $reviewers = DB::table('sys_user')
                ->leftJoin('sys_user_group', 'sys_user.id_user', '=', 'sys_user_group.id_user')
                ->leftJoin('mt_sdm_jabatan', function (JoinClause $join) {
                    $join->on(
                        DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'),
                        '=',
                        DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)')
                    );
                })
                ->where(function($query) {
                    // Users in admin_konten group (id_group = 3) with jabatan
                    $query->where('sys_user_group.id_group', 3)
                          ->whereNotNull('sys_user_group.id_jabatan');
                })
                ->orWhereNotNull('sys_user_group.id_jabatan')
                ->select([
                    'sys_user.id_user as id',
                    'sys_user.id_user',
                    'sys_user.name as nama',
                    'sys_user.email',
                    'mt_sdm_jabatan.nama as jabatan',
                ])
                ->groupBy('sys_user.id_user', 'sys_user.name', 'sys_user.email', 'mt_sdm_jabatan.nama')
                ->orderBy('sys_user.name', 'asc')
                ->get();

            // Transform to include label
            $data = $reviewers->map(function($user) {
                $jabatan = $user->jabatan ?? 'Jabatan belum ditentukan';
                return [
                    'id' => $user->id,
                    'id_user' => $user->id_user,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'jabatan' => $jabatan,
                    'label' => $user->nama . ' - ' . $jabatan,
                ];
            });

            return response()->json([
                'data' => $data,
                'success' => true,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get pemeriksa: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => true,
                'message' => 'Gagal mengambil daftar pemeriksa',
            ], 500);
        }
    }
}
