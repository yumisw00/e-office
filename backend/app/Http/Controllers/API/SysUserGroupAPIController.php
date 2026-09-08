<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

/**
 * Class SysUserGroupAPIController
 */
class SysUserGroupAPIController extends BaseResourceController
{
    private $model_jabatan;
    public function __construct()
    {
        $this->model = new \App\Models\SysUserGroup;
        $this->model_jabatan = new \App\Models\MtSdmJabatan;
        $this->middleware('EnsureHasGroup:sys_user_group', ['only' => ['create', 'store', 'edit', 'delete']]);
    }

    /**
     * Get signers from sys_user_group
     * Returns users grouped by their group membership for penandatangan selection
     */
    public function signers(): JsonResponse
    {
        try {
            $query = DB::table('sys_user_group')
                ->leftJoin('sys_user', 'sys_user.id_user', '=', 'sys_user_group.id_user')
                ->leftJoin('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
                ->leftJoin('mt_sdm_jabatan', function ($join) {
                    $join->on(
                        DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'),
                        '=',
                        DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)')
                    );
                })
                ->whereNull('sys_user.deleted_at')
                ->select([
                    'sys_user.id_user as id',
                    'sys_user.id_user as id_user',
                    'sys_user.name as nama',
                    'sys_user.email',
                    'sys_group.id_group',
                    'sys_group.nama as nama_group',
                    'mt_sdm_jabatan.nama as jabatan',
                ])
                ->orderBy('sys_group.nama', 'asc')
                ->orderBy('sys_user.name', 'asc')
                ->get();

            // Deduplicate by id_user
            $seen = [];
            $data = $query->filter(function ($item) use (&$seen) {
                if (in_array($item->id_user, $seen)) return false;
                $seen[] = $item->id_user;
                return true;
            })->values()->map(function ($item) {
                $jabatan = $item->jabatan;
                if (!$jabatan) {
                    $identity = strtolower(trim(($item->nama ?? '') . ' ' . ($item->nama_group ?? '')));
                    $jabatan = str_contains($identity, 'pimpinan') || str_contains($identity, 'direktur') || str_contains($identity, 'direksi')
                        ? 'Pimpinan'
                        : ($item->nama_group ?: 'Jabatan belum ditentukan');
                }
                return [
                    'id' => $item->id_user,
                    'id_user' => $item->id_user,
                    'nama' => $item->nama,
                    'email' => $item->email,
                    'jabatan' => $jabatan,
                    'nama_group' => $item->nama_group,
                    'label' => $item->nama . ' - ' . $jabatan . ($item->nama_group ? ' (' . $item->nama_group . ')' : ''),
                ];
            });

            return $this->respond(['data' => $data->values()]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
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
        $search = $request->get('q');
        $search = $this->_search($search);
        // if ($search) {
        //     if (!empty($search['nama']))
        //         $search['nama'] = "%" . $search['nama'] . "%";
        //     if (!empty($search['kode']))
        //         $search['kode'] = "%" . $search['kode'] . "%";
        // }
        // $filter = $request->get('q');
        $page = $request->get('page') ?? 1;
        $limit = $request->get('pagesize') ?? $this->limit;
        $db = $this->model->search($search)
            ->leftJoin("mt_sdm_jabatan", function ($join) {
                $join->on(
                    DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)'),
                    '=',
                    DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)')
                );
            })
            ->select(
                "sys_user_group.*",
                "mt_sdm_jabatan.nama as nama_jabatan"
            );
        // dd($db->get()->toArray());
        // dd($db->toSql());

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

        // if($filter)
        // 	$db = $db->where($filter);
        $data = $db->paginate($limit);

        return $this->respond([
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'data' => $data->items(),
            'total_page' => ceil($data->total() / $limit),
            'total_records' => $data->total()
        ]);
    }
    public function get_jabatan(Request $request): JsonResponse
    {
        $search = $request->get('q');
        // var_dump($search);
        $data = [];
        if ($search)
            $data = DB::select("
        select mj.* ,su.nid, mp.nama_lengkap
        from 
            sys_user_group usg
            left join sys_user su on su.id_user = usg.id_user
            join mt_sdm_jabatan mj on mj.id_jabatan = usg.id_jabatan
            /*join mt_sdm_pegawai mp on mp.position_id = mj.position_id*/
            join mt_sdm_pegawai mp on su.nid = mp.nid
        where 
            usg.id_group in (" . $search['id_group'] . ") and 
            usg.deleted_at is null and 
            mj.deleted_at is null
        ");

        return $this->respond([
            "data" => $data,
        ]);
    }

    public function update($id = null, Request $request): JsonResponse
    {
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
        $ret = $this->model->update($id, $updateData, $data_before);
        // if (!$ret) {
        //     return $this->fail($this->model->errors());
        // }
        return $this->respond($updateData, 200, 'data updated');
    }

    /*
    jika ada
        -> jika checked = true
            => tidak melakukan apa"
        -> jika checked = false
            => update deleted_at
    
    jika tidak ada
        -> jika checked = trus
            => insert
        -> jika checked =false
            =>tidak melakukan apa"

     */
    public function update_jabatan_bak(Request $request): JsonResponse
    {
        $request->validate($this->model->rules);

        $all_data = $request->all();



        $ret = true;
        DB::beginTransaction();
        foreach ($all_data['data'] as $data) {
            if (!$ret)
                break;

            $id_group = $data['id_group'];
            $id_jabatan = $data['id_jabatan'];
            $checked = $data['checked'];

            $datas = [];
            $datas = array(
                'id_group' => $id_group,
                'id_jabatan' => $id_jabatan,
            );


            $data = $this->model->where("id_group", $id_group)->where("id_jabatan", $id_jabatan);
            // var_dump($data);
            if ($data->first()) {
                if (!$checked) {
                    $ret = $data->delete() ?: true;
                }
            } else {
                if ($checked)
                    $ret = $id = $this->model->insert($datas);
            }
        }
        // if ($id)
        //     DB::commit();
        // else
        //     DB::rollBack();


        if (!$ret) {
            DB::rollBack();
            return $this->erro_master_notfond("gagal menyimpan");
        } else {
            DB::commit();
            return $this->respond($all_data, 200, 'data updated');
        }
    }

    /**
     * 1. get id_user dengan nid
     *    -> jika tidak ada membuat user terlebih dulu dengan pasword nid
     * 2. jika checked false (tidak dicentang dari frontend)
     *    -> delete sys user group dengan id_jabatan dan user tsb
     * 3. jika checked true (dicentang dari frontend)
     *    -> insert / update sys user group dengan id_jabatan dan user tsb
     */
    public function update_jabatan(Request $request): JsonResponse
    {
        $sys_use = new \App\Models\SysUser();
        $mt_sdm_pegawai = new \App\Models\MtSdmPegawai();

        $request->validate($this->model->rules);

        $all_data = $request->all();



        $date = date('His');
        $ret = true;
        DB::beginTransaction();
        foreach ($all_data['data'] as $data) {
            if (!$ret)
                break;

            $id_user = $sys_use->where("nid", "=", $data['nid'])->value('id_user');
            if (!$id_user) {
                $pegawai = $mt_sdm_pegawai->where("nid", "=", $data['nid'])->first();

                $record_pegawai = [];
                $record_pegawai['name'] = $pegawai->nama_lengkap;
                $record_pegawai['email'] = $pegawai->email;
                $record_pegawai['nid'] = trim($pegawai->nid);
                $record_pegawai['password'] = Hash::make(trim($pegawai->nid + $date));

                $id_user = $sys_use->insert($record_pegawai);
                $id_user = $sys_use->where("nid", "=", $data['nid'])->value('id_user');
            } else {
                $sys_use->where('id_user', '=', $id_user)->update(['deleted_at' => null]);
            }
            $id_group = $data['id_group'];
            $id_jabatan = $data['id_jabatan'];
            $checked = $data['checked'];

            $datas = [];
            $datas = array(
                'id_group' => $id_group,
                'id_jabatan' => $id_jabatan,
                'id_user' => $id_user,
            );


            $data = $this->model
                ->where("id_group", $id_group)
                ->where("id_jabatan", $id_jabatan)
                ->where("id_user", "=", $id_user);
            // var_dump($data);
            if ($data->first()) {
                if (!$checked) {
                    $ret = $data->delete() ?: true;
                }
            } else {
                if ($checked)
                    $ret = $id = $this->model->insert($datas);
            }
        }
        // if ($id)
        //     DB::commit();
        // else
        //     DB::rollBack();


        if (!$ret) {
            DB::rollBack();
            return $this->erro_master_notfond("gagal menyimpan");
        } else {
            DB::commit();
            return $this->respond($all_data, 200, 'data updated');
        }
    }


    public function destroy($id = null): JsonResponse
    {
        if (!$data = $model = $this->model->find($id)) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
                $id
            ));
        }

        $ret = $model->delete();
        if (!$ret) {
            return $this->failNotFound(sprintf(
                'item with id %d not found or already deleted',
                $id
            ));
        }

        $this->model->logging(
            array(
                "action" => "delete",
                "table_name" => $this->model->table,
                "activity" => "Menghapus data",
                "data" => $data->get()->toArray()[0]
            )
        );

        return $this->respondDeleted(['id' => $id], 'data deleted');
    }
}
