<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use ErrorException;
use \App\Jobs\DuplikatCSA;

class BaseResourceController extends ResourceController
{
    /**
     *
     * @var int limit data to show
     */
    protected $limit = 20;

    protected $data = [];

    public $user_admin = ['admin', 'system', 'administrator'];

    private $menu_escape = ['task_user', 'profile'];

    public $nama_setting = 'entitas';

    public $urutan_proses = array("csa", "tod", "toe");

    public $max_size_file = 1024 * 1024;

    public $escape_group = [1];

    public $access_all = false;

    public $id_unit_kantor_pusat = 'KP';

    public $id_subbid_bid_ris = 'NI04';

    public $id_group_reviewer_tod = 11;

    public $id_group_reviewer_too = 11;

    public $modelfile;

    public $template = 'api.main';
    public $layout = 'api.layout';
    public $view = null;

    public $allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/bmp',
        'image/png',  // image types
        'application/pdf',  // PDF
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // Excel
        'application/zip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
        'application/wps-office.docx', // Word
        'application/wps-office.doc', // Word
    ];

    public $mt_ruang_lingkup_arr = [5 => 'tlc', 6 => 'elc', 7 => 'itgc'];

    public $status_proses = [
        'csa' => [1, 2, 3, 4, 5, 15],
        'too' => [20, 21, 22, 23, 6],
        'tod' => [6, 7, 8, 9, 10],
        // 'too' => [8, 9, 10],
        'toe' => [10, 11, 12, 13, 14, 19, 18],
    ];

    public $ruang_lingkup_pendapatan = [
        'laba_rugi_sebelum_pajak',
        'aset',
        'beban',
        'pendapatan',
    ];

    public function __construct()
    {
        $file_size = DB::select("select * from sys_setting where deleted_at is null and nama = ?", ['upload_max_filesize']);

        $this->max_size_file = ((float)$file_size[0]->isi ?: 5) * $this->max_size_file;
    }

    public function edit_able_periode($id_periode = null, $jadwal = null)
    {
        $periode = new \App\Models\Periode();
        return $periode->edit_able_periode($id_periode, $jadwal)->value('periode.id_periode');
    }

    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return array	an array
     */

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
        $db = $this->model->search($search);
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
        // return $this->respond([
        //     'page' => $this->model->pager->getCurrentPage(),
        //     'page_size' => $limit,
        //     'data' => $data,
        //     'total_page' => $this->model->pager->getPageCount(),
        //     'total_records' => $this->model->pager->getDataCount()
        // ]);
    }

    /**
     * Return the properties of a resource object
     *
     * @return array	an array
     */
    public function show($id = null): JsonResponse
    {
        $record = $this->model->find($id);
        if (!$record) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
                $id
            ));
        }

        return $this->respond($record);
    }

    /**
     * Create a new resource object, from "posted" parameters
     *
     * @return array	an array
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate($this->model->rules);

            $data = $validated;

            $id = $this->model->insert($data);
            // if (!$id) {
            //     return $this->fail($this->model->errors());
            // }
            $data[$this->model->primaryKey] = $id;

            return $this->respondCreated($data, 'data created');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal. Pastikan semua field terisi dengan benar.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Add or update a model resource, from "posted" properties
     *
     * @return array	an array
     */
    public function update($id = null, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate($this->model->rules);

            if (!$data_before = $this->model->find($id)) {
                return $this->failNotFound(sprintf(
                    'item with id %d not found',
                    $id
                ));
            }

            // $data       = $request->getRawInput();
            // $updateData = array_filter($data);
            $updateData = $validated;
            $ret = $this->model->update($id, $updateData, $data_before);
            // if (!$ret) {
            //     return $this->fail($this->model->errors());
            // }
            return $this->respond($updateData, 200, 'data updated');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal. Pastikan semua field terisi dengan benar.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Delete the designated resource object from the model
     *
     * @return array	an array
     */
    public function destroy($id = null): JsonResponse
    {
        if (!$data = $model = $this->model->find($id)) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
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

        $ret = $model->delete();
        if (!$ret) {
            return $this->failNotFound(sprintf(
                'item with id %d not found or already deleted',
                $id
            ));
        }

        return $this->respondDeleted(['id' => $id], 'data deleted');
    }

    protected function filterArray($array, $filter)
    {
        return array_values(array_filter($array, $filter))[0];
    }

    public function read_doc()
    {
        $word = new \PhpOffice\PhpWord\PhpWord;
    }

    protected function before_print($id = null) {}
    public function go_print($id = null)
    {
        $this->before_print($id);

        $html = $this->html();

        return response($html)
            ->header('Content-Type', 'text/html');
    }

    protected function html()
    {
        if (!$this->view)
            throw ValidationException::withMessages(['view tidak disetting']);

        $data = $this->data;
        $content = view($this->view, compact('data'))->render();

        $layout = view($this->layout, compact('content'))->render();

        $html = view($this->template, compact('layout'))->render();

        return $html;
    }
    /**
     * get semua penerima sesuai proses
     * jika penerima tidak ada return gagal
     * insert rcm_msg
     * insert rcm_msg_penerima
     */
    /*
    public function create_notifikasi($proses, $id, array $msg, array $penerima = []): array
    {
        # $list_peroses = ['rcm', 'csa', 'tod', 'toe', 'remediasi'];
        $ret = true;
        $msg = null;

        # get semua penerima sesuai proses
        if ($proses == 'kuesioner') { # ketika distribusi kuesioner

            $penerima_query = [];
        } else if ($proses == 'perubahan_kuesioner') { # kerika ada yang mengisi kuesioner (ya)

            $penerima_query = [];
        } else if ($proses == 'distribusi_csa') { # ketika distribusi rcm ke csa

            $rcm_csa = new \App\Models\RcmCsa();

            $penerima_query = $rcm_csa->preparer_penerima_notif_by_csa($id)->toArray();

            #
        } else if ($proses == 'ajuan_csa') { # perarer csa mengajukan reviwere csa

            $rcm_csa = new \App\Models\RcmCsa();

            $penerima_query = $rcm_csa->rewiewer_penerima_notif_by_csa($id)->toArray();

            #
        } else if ($proses == 'approve_csa') { # reviewer csa mengajukan ke preparer tod

            $rcm_tod = new \App\Models\RcmTod();

            $penerima_query = $rcm_tod->preparer_penerima_notif_by_tod($id)->toArray();

            #
        } else if ($proses == 'ajuan_tod') { # preparer tod mengajukan ke reviewer tod

            $rcm_tod = new \App\Models\RcmTod();

            $penerima_query = $rcm_tod->rewiewer_penerima_notif_by_tod($id)->toArray();

            #
        } else if ($proses == 'approve_tod') { # reviewer tod mengajukan ke preparer toe
            $rcm_toe = new \App\Models\RcmToe();

            $penerima_query = $rcm_toe->preparer_penerima_notif_by_toe($id)->toArray();

            #
        } else if ($proses == 'ajuan_toe') { # preparer toe mengajukan ke reviewer toe
            $rcm_toe = new \App\Models\RcmToe();

            $penerima_query = $rcm_toe->rewiewer_penerima_notif_by_toe($id)->toArray();

            #
        } else if ($proses == 'approve_toe') { # reviewer toe approve rcm
            $penerima_query = [];
        }


        # merge penerima hasil queri dan penerima tambahan
        if ($penerima_query && $penerima)
            $penerima = array_merge($penerima_query, $penerima);
        else if ($penerima_query && !$penerima)
            $penerima = $penerima_query;


        # jika penerima tidak ada return gagal
        if (!$penerima)
            return [false, 'penerima notifikasi tidak ditemukan'];


        $insert_notif = $this->create_msg_insert($msg, $penerima);
        $ret = $insert_notif[0];
        $msg = $insert_notif[1];


        return [$ret, $msg];
    }

    private function create_msg_insert($msg, $penerima): array
    {
        $rcm_msg = new \App\Models\RcmMsg();
        $rcm_msg_penerima = new \App\Models\RcmMsgPenerima();

        # insert rcm_msg
        $id_msg = $ret = $rcm_msg->insert($msg);
        if (!$ret)
            $msg = 'gagal menyimpan notifikasi';

        # insert rcm_msg_penerima
        if ($id_msg && $penerima) {
            foreach ($penerima as $user) {
                if (!$ret)
                    break;

                $record = [];
                $record['id_msg'] = $id_msg;
                $record['id_user'] = $user['id_user'];
                $record['id_group'] = $user['id_group'];

                $ret = $rcm_msg_penerima->insert($record);
            }

            if (!$ret)
                $msg = 'gagal mengirim notifikasi';
        }

        return [$ret, $msg];
    }
    */


    function GenerateTreeEasyUi(
        &$row,
        $colparent,
        $colid,
        $collabel,
        $valparent = null,
        $level = 0,
        $idarr = array(),
        $assessment = array(),

    ) {

        if (!empty($idarr[$valparent]))
            return;

        $idarr[$valparent] = 1;

        $level++;
        $return = [];
        $i = 0;
        foreach ($row as $idkey => $value) {
            # code...

            if (isset($assessment[$value->id_assessment_type])) {
                $value->text = $value->{$collabel} . ' (' . $assessment[$value->id_assessment_type] . ')';
            } else {
                $value->text = $value->{$collabel};
            }
            $value->id = $value->{$colid};

            if (trim($value->{$colparent}) == trim($valparent) && ($value->{$colparent} or $valparent === null)) {

                if (!empty($idarr[$value->{$colid}]))
                    $value->{$colparent} = null;

                unset($row[$idkey]);

                $val = $value;
                $val->id = $value->{$colid};
                if (isset($assessment[$value->id_assessment_type])) {
                    $value->text = $value->{$collabel} . ' (' . $assessment[$value->id_assessment_type] . ')';
                } else {
                    $value->text = $value->{$collabel};
                }
                $children = $this->GenerateTreeEasyUi($row, $colparent, $colid, $collabel, $value->{$colid}, $level, $idarr, $assessment);
                $val->children = $children;
                if (!empty($val->id_parent_register) && !empty($val->children)) {
                    $val->state = 'closed';
                }
                $return[$i] = $val;
                $i++;
            }
        }

        if (!$valparent && $row) {
            foreach ($row as $k => $v) {
                $row[$k]->{$colparent} = null;
            }

            $return = array_merge($return, $row);
        }

        return $return;
    }

    public $curent_periode = array();
    public function periode_run()
    {
        $periode = new \App\Models\Periode();
        $periode_jadwal = new \App\Models\PeriodeJadwal();

        $current_date = date('Y-m-d');
        $data_periode = $periode_jadwal
            ->whereRaw("to_date('$current_date','YYY-MM-DD') between tgl_mulai and tgl_selesai")
            ->whereIn('id_periode', function ($query) {
                $query->select('id_periode')
                    ->from('periode')
                    ->where('status', '!=', 'draft')
                    ->whereRaw('deleted_at is null');
            })
            ->orderBy($periode->primaryKey, "desc")
            ->get();

        $in_run_periode = [];
        foreach ($data_periode as &$per) {
            $per->data_periode = $periode->find($per->id_periode)->toArray();
            $in_run_periode[$per->jadwal][] = $per->toArray();
        }

        $this->curent_periode = $in_run_periode;
    }

    public $rcm_data_can_edit = [];
    public function access_adeit_data_periode()
    {
        $rcm_csa = new \App\Models\RcmCsa();
        $check_csa = [
            'id_proses',
            'id_risiko',
            'id_kontrol',
            'id_rcm',
        ];
        $result_check = [];


        $periode_toe = [];
        if (!empty($this->curent_periode['toe']))
            foreach ($this->curent_periode['toe'] as $value) {

                $data_csa = $rcm_csa->select($check_csa)->where("id_periode", "=", $value['data_periode']['id_periode'])->get()->toArray();
                foreach ($check_csa as $index) {
                    foreach ($data_csa as $csa) {
                        $result_check[$index][$csa[$index]] = $csa[$index];
                    }
                }
            }

        $periode_tod = [];
        if (!empty($this->curent_periode['tod']))
            foreach ($this->curent_periode['tod'] as $value) {

                $data_csa = $rcm_csa->select($check_csa)->where("id_periode", "=", $value['data_periode']['id_periode'])->get()->toArray();
                foreach ($check_csa as $index) {
                    foreach ($data_csa as $csa) {
                        $result_check[$index][$csa[$index]] = $csa[$index];
                    }
                }
            }

        $periode_csa = [];
        if (!empty($this->curent_periode['csa']))
            foreach ($this->curent_periode['csa'] as $value) {

                $data_csa = $rcm_csa->select($check_csa)->where("id_periode", "=", $value['data_periode']['id_periode'])->get()->toArray();
                foreach ($check_csa as $index) {
                    foreach ($data_csa as $csa) {
                        $result_check[$index][$csa[$index]] = $csa[$index];
                    }
                }
            }


        $periode_kuesioner = [];
        if (!empty($this->curent_periode['kuisioner']))
            foreach ($this->curent_periode['kuisioner'] as $value) {
                $data_csa = $rcm_csa->select($check_csa)->where("id_periode", "=", $value['data_periode']['id_periode'])->get()->toArray();
                foreach ($check_csa as $index) {
                    foreach ($data_csa as $csa) {
                        unset($result_check[$index][$csa[$index]]);
                    }
                }
            }

        $this->rcm_data_can_edit = $result_check;

        /*
        echo "<pre>";
        var_dump($this->curent_periode);
        var_dump($this->rcm_data_can_edit);
        echo "</pre>";
        */
    }

    public function access_edit($id, string $colom)
    {
        return [true, ""];
        # $this->periode_run();
        # $this->access_adeit_data_periode();
        # if (!empty($this->rcm_data_can_edit[$colom][$id]))
        #     return [false, "Data sedang digunakan pada periode berjalan, tunggu sampai periode berjalan selesai"];
        # else
        #     return [true, ""];
    }

    public function access_status($id_status, $id_ruang_lingkup, $id_group = null)
    {
        if (!$id_group)
            $id_group = session('id_group');

        $mt_status_pengajuan_penerima = new \App\Models\MtStatusPengajuanPenerima();

        $data_mt_status_pengajuan_penerima = $mt_status_pengajuan_penerima
            ->where('id_status', '=', $id_status)
            ->where('id_group', '=', $id_group)
            ->where('id_ruang_lingkup', '=', $id_ruang_lingkup)
            ->first();

        if ($data_mt_status_pengajuan_penerima)
            return true;
        else
            false;
    }

    /**
    jangan gunakan ini didalam controllert karena hanya untuk di akses api
     */
    public function is_access($action, $url_menu, $group = null)
    {
        // return true;
        if (in_array($url_menu, $this->menu_escape))
            return $this->respond(true);

        return $this->respond($this->access($action, $url_menu, $group));
    }

    public function access($action, $url_menu, $group = null)
    {
        if (!$group)
            $group = session('id_group');

        if (!$group)
            return false;

        $sys_action = new \App\Models\SysAction();

        $access = $sys_action->access($action, $url_menu, $group);

        if ($access)
            return true;
        else
            return false;
    }

    public function view_all()
    {
        $sys_action = new \App\Models\SysAction();
        $id_group = session('id_group');

        $view_all = $sys_action
            ->where("nama", "=", "view_all")
            ->whereIn("id_action", function ($query) use ($id_group) {
                $query
                    ->select("id_action")
                    ->from("sys_group_action")
                    ->whereRaw("deleted_at is null")
                    ->whereIn("id_group_menu", function ($query) use ($id_group) {
                        $query
                            ->select("id_group_menu")
                            ->from("sys_group_menu")
                            ->where("id_group", "=", $id_group);
                    });
            })
            ->whereIn('id_menu', function ($query) {
                $query->select('id_menu')->from('sys_menu')->where('url', '=', 'dashboard')->whereNull('deleted_at');
            })
            ->count();

        if ($view_all)
            return true;

        return false;
    }

    public function access_all()
    {
        $sys_action = new \App\Models\SysAction();
        $id_group = session('id_group');

        $access_all = $sys_action
            ->where("nama", "=", "access_all")
            ->whereIn("id_action", function ($query) use ($id_group) {
                $query
                    ->select("id_action")
                    ->from("sys_group_action")
                    ->whereRaw("deleted_at is null")
                    ->whereIn("id_group_menu", function ($query) use ($id_group) {
                        $query
                            ->select("id_group_menu")
                            ->from("sys_group_menu")
                            ->where("id_group", "=", $id_group);
                    });
            })
            ->count();

        if ($access_all)
            return true;

        return false;
    }

    public function get_current_user($is_login = false)
    {
        $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();
        $sys_user = new \App\Models\SysUserModel();
        $sys_user_group = new \App\Models\SysUserGroup();

        $id_unser = null;
        $nid = null;
        $id_jabatan = null;
        $id_unit = null;
        $id_group = null;
        $nama = null;

        if ($is_login) {
            $sys_user_group = $sys_user_group->where('id_group', '=', '1');

            $sys_user = $sys_user
                ->joinSub($sys_user_group, 'sys_user_group', function ($join) {
                    $join->on('sys_user_group.id_user', '=', 'sys_user.id_user');
                })
                ->join('mt_sdm_jabatan', 'mt_sdm_jabatan.id_jabatan', '=', 'sys_user_group.id_jabatan')
                // ->whereIn('name', $this->user_admin)
                ->first();

            $id_unser = $sys_user->id_user;
            $nid = $sys_user->nid;
            $id_jabatan = $sys_user->id_jabatan;
            $id_unit = $sys_user->id_unit;
            $id_group = $sys_user->id_group;
            // $nama = $sys_user->name;
            $nama = "System";

            #
        } else {

            $id_unser = session('user')['id_user'];
            $nid = session('user')['nid'];
            $id_jabatan = session('id_jabatan');
            $id_unit = session('id_unit');
            $id_group = session('id_group');
            $nama = session('user')['name'];

            #
        }

        /*
        $jabatan_user = $mt_sdm_jabatan
            ->leftjoin("mt_sdm_pegawai", "mt_sdm_pegawai.position_id", "=", "mt_sdm_jabatan.position_id")
            ->where("mt_sdm_jabatan.id_jabatan", "=", $id_jabatan)
            ->select(
                "mt_sdm_jabatan.nama as nama_jabatan",
                "mt_sdm_pegawai.nid"
            )
            ->first();
        */
        $jabatan_user = $mt_sdm_jabatan->find($id_jabatan);
        // var_dump($jabatan_user->toArray());

        $data['id_user'] = $id_unser;
        $data['id_unit'] = $id_unit;

        $data['nid'] = $nid;
        $data['nama'] = $nama;
        $data['id_jabatan'] = $id_jabatan;
        $data['unit'] = $id_unit;
        $data['jabatan'] = "";
        if ($jabatan_user) {
            $data['jabatan'] = $jabatan_user->nama;
        }

        return $data;
    }

    protected function before_update_csa($id_rcm_csa): array
    {
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_csa_risiko = new \App\Models\RcmCsaRisiko();

        // $this->start_log();
        $single_rcm_csa = $rcm_csa->find($id_rcm_csa);
        /*
        if ($single_rcm_csa->is_update)
            return [$ret, $msg];
        */

        $id_rcm = $single_rcm_csa->id_rcm;
        $id_proses = $single_rcm_csa->id_proses;
        // $id_risiko = $single_rcm_csa->id_risiko;
        $id_kontrol = $single_rcm_csa->id_kontrol;

        $id_periode = $single_rcm_csa->id_periode;

        $edit = true;
        // $ret = true;
        $msg = "";
        $msg = "";
        $list_perubahan = [];


        $check_rcm = $rcm_csa
            ->where('id_periode', '=', $id_periode)
            ->where('id_rcm', '=', $id_rcm)
            ->where('status_data', '=', 'delete')
            ->value('id_rcm_csa');

        if ($check_rcm)
            return [false, 'Proses pengajuan penghapusan RCM, Lakukan pengecekan berkala untuk update terbaru'];


        $check_rcm = $rcm_csa
            ->whereNotIn('id_rcm_csa', [$id_rcm_csa])
            ->where('id_periode', '=', $id_periode)
            ->where('id_rcm', '=', $id_rcm)
            ->whereNotNull('is_update')
            ->whereNull('is_approve_update')
            ->value('id_rcm_csa');

        if ($check_rcm) {
            $list_perubahan['rcm'] = 'RCM';
            $edit = true;
            // return [true, 'Sedang dilakukan pemutakhiran RCM'];
        }


        $check_proses = $rcm_csa
            ->where('id_proses', '=', $id_proses)
            ->where('id_periode', '=', $id_periode)
            ->whereNotNull('is_update')
            ->whereNull('is_approve_update')
            ->get();

        foreach ($check_proses as $ps) {
            $update_colom = json_decode($ps->update_colom, true);
            if (!empty($update_colom['id_proses'])) {
                $list_perubahan['bpm'] = 'BPM';
                $edit = true;
                // return [true, 'Sedang dilakukan pemutakhiran BPM'];
            }
            // return [true, 'Sedang dilakukan pemutakhiran BPM (Proses Bisnis)'];
        }


        $check_kontrol = $rcm_csa
            ->where('id_kontrol', '=', $id_kontrol)
            ->where('id_periode', '=', $id_periode)
            ->whereNotNull('is_update')
            ->whereNull('is_approve_update')
            ->get();

        foreach ($check_kontrol as $ps) {
            $update_colom = json_decode($ps->update_colom, true);
            if (!empty($update_colom['id_kontrol'])) {
                $list_perubahan['rcm'] = 'RCM';
                $edit = true;
                // return [true, 'Sedang dilakukan pemutakhiran BPM'];
            }
            // return [true, 'Sedang dilakukan pemutakhiran BPM'];
            // return [true, 'Sedang dilakukan pemutakhiran BPM (Kontrol)'];
        }

        $id_risko_list = $rcm_csa_risiko
            ->where('id_rcm_csa', '=', $id_rcm_csa)
            ->whereNull('id_rcm_risiko')
            ->select('id_risiko');

        $check_risiko = $rcm_csa_risiko
            ->join('rcm_csa', 'rcm_csa.id_rcm_csa', '=', 'rcm_csa_risiko.id_rcm_csa')
            ->where('rcm_csa_risiko.id_risiko', $id_risko_list)
            ->whereNull('rcm_csa.deleted_at')
            ->get();
        foreach ($check_risiko as $ps) {
            $update_colom = json_decode($ps->update_colom, true);
            if (!empty($update_colom['id_risiko'])) {
                $list_perubahan['rcm'] = 'RCM';
                $edit = true;
                // return [true, 'Sedang dilakukan pemutakhiran BPM'];
            }
            // return [true, 'Sedang dilakukan pemutakhiran BPM'];
            // return [true, 'Sedang dilakukan pemutakhiran BPM (Risiko)'];
        }

        $check_rcm = $rcm_csa
            ->where('id_periode', '=', $id_periode)
            ->where('id_rcm', '=', $id_rcm)
            ->whereNotNull('is_update')
            ->whereNull('is_approve_update')
            ->value('id_rcm_csa');

        if ($check_rcm) {
            $list_perubahan['rcm'] = 'RCM';
            $edit = true;
            // return [true, 'Sedang dilakukan pemutakhiran BPM'];
        }
        // return [true, 'Sedang dilakukan pemutakhiran RCM'];
        if ($list_perubahan) {
            $msg = "Sedang dilakukan pemutakhiran " . implode(" & ", $list_perubahan);
        }

        return [$edit, $msg ?: ""];
    }

    public $format_bulan = [
        1 => ['mulai' => 01, "selesai" => 31],
        2 => ['mulai' => 01, "selesai" => 28],
        3 => ['mulai' => 01, "selesai" => 31],
        4 => ['mulai' => 01, "selesai" => 30],
        5 => ['mulai' => 01, "selesai" => 30],
        6 => ['mulai' => 01, "selesai" => 31],
        7 => ['mulai' => 01, "selesai" => 30],
        8 => ['mulai' => 01, "selesai" => 31],
        9 => ['mulai' => 01, "selesai" => 30],
        10 => ['mulai' => 01, "selesai" => 31],
        11 => ['mulai' => 01, "selesai" => 30],
        12 => ['mulai' => 01, "selesai" => 31]
    ];

    protected function jadwal_line3(int $tahun = null)
    {
        $sys_setting = new \App\Models\SysSetting();
        if (!$tahun)
            $tahun = (int)date('Y');

        $data_sys_setting = $sys_setting->datas();

        $line_3_next_year = $data_sys_setting['line_3_next_year'];
        $line_3_bulan_mulai = $data_sys_setting['line_3_bulan_mulai'];
        $line_3_bulan_selesai = $data_sys_setting['line_3_bulan_selesai'];

        $tgl_mulai = (string)$this->format_bulan[(int)$line_3_bulan_mulai]['mulai'];
        $tgl_selesai = (string)$this->format_bulan[(int)$line_3_bulan_selesai]['selesai'];

        return [
            'mulai' => $tahun . "-" . $line_3_bulan_mulai . "-" . $tgl_mulai,
            'selesai' => (($line_3_next_year == '1') ? ($tahun + 1) : $tahun) . "-" . $line_3_bulan_selesai . "-" . $tgl_selesai,
        ];
    }

    protected function before_update_tod_toe($id_periode)
    {
        $sys_setting = new \App\Models\SysSetting();
        $periode = new \App\Models\Periode();

        $data_periode = $periode->find($id_periode);
        $tahun = (int)$data_periode->tahun;

        $mulai = $sys_setting->where('nama', '=', 'line_3_bulan_mulai')->first();
        if ($mulai)
            $mulai = $mulai->isi;
        else
            $mulai = "04";

        $mulai_int = (int)$mulai;

        $date_mulai = (string)$tahun . "-" . $mulai . "-" . (string)$this->format_bulan[$mulai_int]['mulai'];


        $line_3_text_year = $sys_setting->where('nama', '=', 'line_3_next_year')->first();
        if ($line_3_text_year)
            $line_3_text_year = (int)$line_3_text_year->isi;
        else
            $line_3_text_year = 1;

        if ($line_3_text_year == 1)
            $tahun = $tahun + 1;

        $selesai = $sys_setting->where('nama', '=', 'line_3_bulan_selesai')->first();
        if ($selesai)
            $selesai = $selesai->isi;
        else
            $selesai = "03";

        $selesai_int = (int)$selesai;

        $date_selesai = (string)$tahun . "-" . $selesai . "-" . (string)$this->format_bulan[$selesai_int]['selesai'];


        $startDate = Carbon::parse($date_mulai);
        $endDate = Carbon::parse($date_selesai);

        // Get the current date and time
        $currentDate = Carbon::now();

        // Check if the current date is between the start and end dates
        if ($currentDate->between($startDate, $endDate)) {
            return [true, ''];
        } else {
            return [false, "Periode Pengisian mulai: " . $date_mulai . " dan selesai: " . $date_selesai];
        }
    }

    /*
    protected function before_update_csa($id_rcm_csa): array
    {
        $ret = true;
        $msg = "";
        // $this->start_log();
        $single_rcm_csa = $this->model->find($id_rcm_csa);
        if ($single_rcm_csa->is_update)
            return [$ret, $msg];

        $id_rcm = $single_rcm_csa->id_rcm;
        $id_proses = $single_rcm_csa->id_proses;
        $id_risiko = $single_rcm_csa->id_risiko;
        $id_kontrol = $single_rcm_csa->id_kontrol;

        $id_periode = $single_rcm_csa->id_periode;

        $rcm_update = $this->model
            ->where('id_periode', '=', $id_periode)
            ->where(function ($where) use ($id_rcm, $id_proses, $id_risiko, $id_kontrol) {
                $where
                    ->where('id_rcm', '=', $id_rcm)
                    ->orWhere('id_proses', '=', $id_proses)
                    ->orWhere('id_risiko', '=', $id_risiko)
                    ->orWhere('id_kontrol', '=', $id_kontrol)
                ;
            })
            ->whereNotNull('is_update')
            ->whereNull('is_approve_update')
            ->get();
        // $this->end_log();

        foreach ($rcm_update as $csa) {
            $update_colom = $csa->update_colom;
            $update_colom = json_decode($update_colom, true);

            if (!empty($update_colom['id_proses']) && $ret && $csa->id_proses == $id_proses) {
                $ret = false;
                $msg = "Sedang dilakukan pemutakhiran BPM (Proses bisnis)";
            }
            if (!empty($update_colom['id_risiko']) && $ret && $csa->id_risiko == $id_risiko) {
                $ret = false;
                $msg = "Sedang dilakukan pemutakhiran BPM (Risiko)";
            }
            if (!empty($update_colom['id_kontrol']) && $ret && $csa->id_kontrol == $id_kontrol) {
                $ret = false;
                $msg = "Sedang dilakukan pemutakhiran BPM (Kontrol)";
            }
            if (!empty($update_colom['id_rcm']) && $ret && $csa->id_rcm == $id_rcm) {
                $ret = false;
                $msg = "Sedang dilakukan pemutakhiran RCM";
            }
        }



        return [$ret, $msg];
    }
    */

    /*
    protected function before_update_csa($id_rcm_csa): array
    {
        $ret = true;
        $msg = "";
        $single_rcm_csa = $this->model->find($id_rcm_csa);
        if ($single_rcm_csa->is_update)
            return [$ret, $msg];

        $id_rcm = $single_rcm_csa->id_rcm;
        $id_periode = $single_rcm_csa->id_periode;

        $rcm_update = $this->model
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)
            ->whereNotNull('is_update')
            ->whereNull('is_approve_update')
            ->get();

        if ($rcm_update->count()) {
            $ret = false;
            $msg = "Sedang ada pemutakhiran";
        }


        return [$ret, $msg];
    }
    */

    public function create_remidiasi($id_rcm, array $data, $remediasi_crontab = false)
    {
        $rcm = new \App\Models\Rcm();
        $rcm_remidiasi = new \App\Models\RcmRemediasi();
        $rcm_remediasi_inisiator = new \App\Models\RcmRemediasiInisiator();
        $rcm_msg = new \App\Http\Controllers\API\RcmMsgAPIController;
        $periode = new \App\Models\Periode();

        if (empty($data['id_periode']) || !in_array($data['proses'], ['csa', 'too', 'tod', 'toe']))
            return false;

        $data['id_rcm'] = $id_rcm;
        $id_periode = $data['id_periode'];

        $id_ruang_lingkup = null;
        if (!empty($data['id_ruang_lingkup']))
            $id_ruang_lingkup = $data['id_ruang_lingkup'];


        // $data_rcm = $rcm->find($id_rcm);
        $data_rcm = DB::select("select * from rcm where id_rcm = ?", [$id_rcm]);
        if (!$data_rcm)
            return false;

        $rcm_csa = new \App\Models\RcmCsa();
        $data_rcm_csa = $rcm_csa->find($data['id_rcm_csa']);

        /*
        $data_periode = $periode->find($id_periode);
        */
        # update data yang rcm sama menjadi tidak efektif
        /*
        if ($data['proses'] == 'csa') {
            $ret = $this->rcm_tdk_efekti_csa($id_rcm, $id_periode);
        } else if ($data['proses'] == 'tod') {
            $ret = $this->rcm_tdk_efekti_tod($id_rcm, $id_periode);
        } else if ($data['proses'] == 'toe') {
            $ret = $this->rcm_tdk_efekti_toe($id_rcm, $id_periode);
        }

        if (!$ret)
            return false;
        */

        $remediasi_delete = $rcm_remediasi_inisiator
            ->select('rcm_remediasi_inisiator.id_remediasi')
            ->join('rcm_csa', 'rcm_csa.id_rcm_csa', 'rcm_remediasi_inisiator.id_rcm_csa')
            ->where('rcm_csa.status_data', '=', 'delete')
            ->whereNull('rcm_csa.deleted_at');

        # check remediasi sudah ada pada rcm periode tsb
        $data_rcm_remidiasi = $rcm_remidiasi
            ->where("id_rcm", "=", $id_rcm)
            ->where("id_periode", "=", $id_periode)
            ->where("proses", "=", $data['proses']);

        if ($data['proses'] == 'too')
            $data_rcm_remidiasi = $data_rcm_remidiasi->where('status_pengajuan', '!=', 'approve');

        if ($data_rcm_csa->status_data == 'delete')
            $data_rcm_remidiasi = $data_rcm_remidiasi->whereIn('id_remediasi', $remediasi_delete);
        else
            $data_rcm_remidiasi = $data_rcm_remidiasi->whereNotIn('id_remediasi', $remediasi_delete);

        $data_rcm_remidiasi = $data_rcm_remidiasi->first();

        # update / insert remediasi
        $id_remediasi = null;
        if ($data_rcm_remidiasi) {
            $id_remediasi = $data_rcm_remidiasi->id_remediasi;
            $ret = $rcm_remidiasi->update($data_rcm_remidiasi->id_remediasi, $data);
        } else {
            $data['status_pengajuan'] = 'draft';
            $ret = $id_remediasi = $rcm_remidiasi->insert($data);
        }

        if (!$id_remediasi)
            return false;

        if ($ret)
            $ret = $this->create_remediasi_inisiator($id_remediasi, $data, $remediasi_crontab);

        $id_lokasi = null;
        # hapus data rcm periode selanjutnya
        if ($ret)
            if ($data['proses'] == 'csa') {
                $this->delete_too_tdk_efektif($id_rcm, $id_periode);
                // $this->delete_tod_tdk_efektif($id_rcm, $id_periode);

                $id_lokasi = $data_rcm_csa->id_lokasi;

                #
            } else if ($data['proses'] == 'too') {
                $this->delete_tod_tdk_efektif($id_rcm, $id_periode);
            } else if ($data['proses'] == 'tod') {
                $this->delete_toe_tdk_efektif($id_rcm, $id_periode);
            } else if ($data['proses'] == 'toe') {
            }

        /*
        if ($ret && $data_periode->triwulan == 4)
            $this->create_dod($id_remediasi);
        */


        $ruang_lingkup = $this->mt_ruang_lingkup_arr[$id_ruang_lingkup];
        $url_remediasi = '/remediasi_' . $ruang_lingkup . "_rencana/" . $id_remediasi;
        $rcm_msg = $rcm_msg
            ->create_msg([
                // 'msg' => 'RCM tidak efektif dan masuk remediasi (Segmen ' . $data_rcm_csa->nama_segmen . ' Ref Kontrol ' . $data_rcm_csa->ref_kontrol . ')',
                'msg' => 'RCM tidak efektif dan masuk remediasi (Ref Kontrol ' . $data_rcm_csa->ref_kontrol . ')',
                'id_remediasi' => $id_remediasi,
                'url' => $url_remediasi,
                'proses' => 'add_remediasi',
            ])
            // ->create_penerima('add_remediasi', $id_lokasi)
            // ->get_user_by_jabatan([$data_rcm_csa->id_control_preparer])
            ->get_user_by_access('pengajuan', 'rcm_remediasi')
            ->send();


        DuplikatCSA::dispatchSync($id_remediasi);

        if ($rcm_msg->errors)
            $ret = false;

        $msg = $rcm_msg->error_msg;

        return $ret;
    }

    private function create_remediasi_inisiator($id_remediasi, $data, $remediasi_crontab = false)
    {
        $rcm_remediasi_inisiator = new \App\Models\RcmRemediasiInisiator();

        $search = [];
        $search['id_remediasi'] = $id_remediasi;

        if (!empty($data['id_rcm_toe']))
            $search['id_rcm_toe'] = $data['id_rcm_toe'];

        if (!empty($data['id_rcm_tod']))
            $search['id_rcm_tod'] = $data['id_rcm_tod'];

        if (!empty($data['id_rcm_csa']))
            $search['id_rcm_csa'] = $data['id_rcm_csa'];

        $id_remediasi_inisiator = $rcm_remediasi_inisiator->search($search)->value($rcm_remediasi_inisiator->primaryKey);

        $is_admin = false;
        if ($remediasi_crontab)
            $is_admin = true;

        $current_user = $this->get_current_user($is_admin);

        $data['id_remediasi'] = $id_remediasi;
        $data['nid'] = $current_user['nid'];
        $data['nama'] = $current_user['nama'];
        $data['jabatan'] = $current_user['jabatan'];

        if ($id_remediasi_inisiator) {
            $ret = $rcm_remediasi_inisiator->update($id_remediasi_inisiator, $data);
        } else {
            $ret = $rcm_remediasi_inisiator->insert($data);
        }

        return $ret;
    }


    /**
     * check apakah sudah ada dod dengan rcm tsb di periode remediasi tsb
     * -> ya: update id_dod remediasi
     * -> tidak: buat dod dengan ref_kontrol dan periode tsb
     */
    public function create_dod($id_remediasi): array
    {
        $rcm_dod = new \App\Models\RcmDod();
        $rcm_remediasi = new \App\Models\RcmRemediasi();
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_msg = new \App\Http\Controllers\API\RcmMsgAPIController;
        $rcm_msg->access_send_email = false;

        # get data rcm_csa periode tsb
        $data_rcm_csa_by_remediasi = $rcm_csa
            ->join('rcm_remediasi', 'rcm_remediasi.id_rcm_csa', '=', 'rcm_csa.id_rcm_csa')
            ->where('rcm_remediasi.id_remediasi', '=', $id_remediasi)
            ->select('rcm_csa.*', 'rcm_remediasi.id_remediasi', 'rcm_remediasi.id_periode as id_periode_remediasi')
            ->first();

        $ref_kontrol = $data_rcm_csa_by_remediasi->ref_kontrol;
        $id_periode = $data_rcm_csa_by_remediasi->id_periode_remediasi;
        $id_rcm = $data_rcm_csa_by_remediasi->id_rcm;

        # check apakah sudah ada dod dengan rcm tsb di periode remediasi tsb
        $id_dod = $rcm_dod->where('id_rcm', '=', $id_rcm)->where('id_periode', '=', $id_periode)->value('id_dod');

        #-> ya: update id_dod remediasi
        if ($id_dod) {
            return [
                $rcm_remediasi->update($id_remediasi, ['id_dod' => $id_dod]),
                ""
            ];
        }

        $record = [
            'id_remediasi' => $data_rcm_csa_by_remediasi->id_remediasi,
            // 'id_rcm' => $data_rcm_remediasi->id_rcm,
            'id_rcm' => $id_rcm,
            'id_periode' => $id_periode,
            'ref_kontrol' => $ref_kontrol,
            'id_ruang_lingkup' => $data_rcm_csa_by_remediasi->id_ruang_lingkup,
            'status_dod' => 'draft',
        ];

        #-> tidak: buat dod dengan ref_kontrol dan periode tsb
        $ret = $id_dod = $rcm_dod->insert($record);
        $rcm_remediasi->update($id_remediasi, ['id_dod' => $id_dod]);

        # inset notifikasi
        $ruang_lingkup = $this->mt_ruang_lingkup_arr[$data_rcm_csa_by_remediasi->id_ruang_lingkup];
        $url = "/dod_" . $ruang_lingkup . "_working_paper/" . $id_dod;
        $rcm_msg
            ->penerima_dod()
            ->create_msg([
                'msg' => 'DOD baru ditambahkan (Segmen ' . $data_rcm_csa_by_remediasi->nama_segmen . ' Ref Kontrol ' . $data_rcm_csa_by_remediasi->ref_kontrol . ')',
                'id_dod' => $id_dod,
                'url' => $url,
                'proses' => 'add_dod',
            ])
            ->send();
        if ($rcm_msg->errors) {
            $ret = false;

            return [$ret, $rcm_msg->error_msg];
        }

        return [$ret, ""];
    }

    public function rcm_tdk_efekti_csa($id_rcm, $id_periode)
    {
        // return true;

        $rcm_csa = new \App\Models\RcmCsa();
        // tidak efektif
        return $rcm_csa
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)

            ->update(['efektivitas_csa' => 'tidak efektif']);
    }
    public function rcm_tdk_efekti_tod($id_rcm, $id_periode)
    {
        // return true;

        $rcm_csa_tod = new \App\Models\RcmCsaTod();

        return $rcm_csa_tod
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)

            ->update(['hasil_kesimpulan' => 'tidak efektif']);
    }
    public function rcm_tdk_efekti_toe($id_rcm, $id_periode)
    {
        return true;
    }

    // private function delete_csa_tdk_efektif($id_rcm, $id_periode) {}
    public function delete_too_tdk_efektif($id_rcm, $id_periode)
    {
        $rcm_csa_too = new \App\Models\RcmCsaToo();
        $rcm_too = new \App\Models\RcmToo();


        $id_rcm_csa_list = $rcm_csa_too
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)
            ->pluck('id_rcm_csa');

        $ret = $rcm_csa_too
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)
            ->delete();

        if ($id_rcm_csa_list) {
            $ret = true;
            foreach ($id_rcm_csa_list as $id_rcm_csa) {
                if (!$ret)
                    break;

                $ret = $this->create_too($id_rcm_csa);
            }

            if (!$ret)
                throw new ErrorException("Gagal Membuat Remediasi!");
        }

        /*
        $ret = $rcm_too
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)
            ->delete();
        */

        return $ret;
    }

    public function delete_tod_tdk_efektif($id_rcm, $id_periode)
    {
        $rcm_csa_tod = new \App\Models\RcmCsaTod();

        return $rcm_csa_tod
            ->where('id_rcm', '=', $id_rcm)
            ->where('id_periode', '=', $id_periode)
            ->delete();
    }

    public function delete_toe_tdk_efektif($id_rcm, $id_periode)
    {
        $rcm_csa_toe = new \App\Models\RcmCsaToe();

        return $rcm_csa_toe
            ->whereIn('id_rcm_csa', function ($query) use ($id_rcm, $id_periode) {
                $query
                    ->select('id_rcm_csa')
                    ->from('rcm_csa')
                    ->where('id_rcm', '=', $id_rcm)
                    ->where('id_periode', '=', $id_periode);
            })->where('id_periode', '=', $id_periode)
            ->delete();
    }

    public function tidak_efektif($data)
    {
        # $rcm_efektivitas = new \App\Models\RcmEfektivitas();
        /*
        $id_unser = session('user')['id_user'];
        $id_jabatan = session('id_jabatan');
        $id_unit = session('id_unit');

        $jabatan_user = $mt_sdm_jabatan
            ->leftjoin("mt_sdm_pegawai", "mt_sdm_pegawai.position_id", "=", "mt_sdm_jabatan.position_id")
            ->where("mt_sdm_jabatan.id_jabatan", "=", $id_jabatan)
            ->select(
                "mt_sdm_jabatan.nama as nama_jabatan",
                "mt_sdm_pegawai.nid"
            )
            ->first();
        // var_dump($jabatan_user->toArray());

        $data['inisiator_nid'] = $jabatan_user->nid;
        $data['inisiator_nama'] = session('user')['name'];
        $data['inisiator_jabatan'] = $jabatan_user->nama_jabatan;
        $data['inisiator_unit'] = $id_unit;
        */
        # $data_user = $this->get_current_user();
        # 
        # $data['inisiator_nid'] = $data_user['nid'];
        # $data['inisiator_nama'] = $data_user['nama'];
        # $data['inisiator_jabatan'] = $data_user['jabatan'];
        # $data['inisiator_unit'] = $data_user['unit'];
        # 
        # return $rcm_efektivitas->insert($data);
    }

    // private function create_tod($id_csa, $id_rcm, $id_segmen, $id_periode, $id_ruang_lingkup)

    /**
     * cek apakah ada rcm masuk remediasi csa
     * 
     * tidak
     *  -> cek apakah ada too (id_periode)
     *      ya
     *       -> insert rcm_csa_too
     *      tidak
     *       -> create too
     *       -> insert rcm_csa_too
     * ya
     *  -> cek apakah ada too (id_periode_parent)
     *      tidak
     *       -> create too
     *       -> insert rcm_csa_too
     *      ya
     *       -> update too (id_periode null, id_periode_parent, id_remediasi)
     *       -> insert rcm_csa_too
     * 
     */

    public function create_too($id_csa): array
    {
        // return [false, 'sedang perbaikan'];
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_remediasi = new \App\Models\RcmRemediasi();
        $rcm_remediasi_inisiator = new \App\Models\RcmRemediasiInisiator();
        $rcm_too = $rcm_too_model = new \App\Models\RcmToo();
        $rcm_csa_too = new \App\Models\RcmCsaToo();
        $periode = new \App\Models\Periode();

        # data rcm_csa
        $data_rcm_csa = (clone $rcm_csa)->find($id_csa);
        // $no_sub_proses = $data_rcm_csa->no_sub_proses;

        $csa_delete = (clone $rcm_csa)
            ->where('status_data', 'delete')
            ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
            ->whereRaw('coalesce(id_periode_parent,id_periode) = ?', [$data_rcm_csa->id_periode ?? $data_rcm_csa->id_periode_parent])
            ->select('id_rcm_csa');

        $id_remediasi_delete = $rcm_remediasi_inisiator
            ->select('id_remediasi')
            ->whereIn('id_rcm_csa', $csa_delete);

        $id_remediasi = null;
        if ($data_rcm_csa->id_remediasi)
            $id_remediasi = $data_rcm_csa->id_remediasi;

        # check apakah rcm di periode tsb remidiasi
        if (!$id_remediasi) {
            $rcm_remediasi = $rcm_remediasi
                ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                ->where('id_periode', '=', $data_rcm_csa->id_periode ?? $data_rcm_csa->id_periode_parent)
                ->where('proses', '=', 'csa');

            if ($data_rcm_csa->status_data == 'delete')
                $rcm_remediasi = $rcm_remediasi->whereIn('id_remediasi', $id_remediasi_delete);
            else
                $rcm_remediasi = $rcm_remediasi->whereNotIn('id_remediasi', $id_remediasi_delete);

            $id_remediasi = $rcm_remediasi
                ->value('id_remediasi');
        }
        // ->count();


        /*
        $id_remediasi_too = $rcm_remediasi
            ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
            ->where('id_periode', '=', $data_rcm_csa->id_periode ?? $data_rcm_csa->id_periode_parent)
            ->where('proses', '=', 'too')
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereIn('status', ['tolak', 'terima']);
            })
            //->whereIn('status', ['tolak', 'terima'])

            ->value('id_remediasi');
        if ($id_remediasi_too)
            $id_remediasi = $id_remediasi_too;
        */
        /*
        if ($check_remediasi)
            return [true, null];
        */

        # check apakah diperiode ada jadwal line 2
        if ($data_rcm_csa->id_periode) {
            $data_periode = $periode->periode_next_exists($data_rcm_csa->id_periode, 'tod');

            if (!$data_periode)
                return [true, null];
        }


        if (in_array($data_rcm_csa->id_ruang_lingkup, [5, 7])) { # exe tlc itgc

            /*
            if (!$data_rcm_csa->id_segmen)
                return [false, 'Segmen tidak ditemukan'];
            */

            # cek apakah sudah ada unit tsb, segmen tsb, no sub proses, periode
            $rcm_too_model = $rcm_too_model
                ->whereRaw("trim(lower(no_sub_proses)) = ?", [trim(strtolower($data_rcm_csa->no_sub_proses))]) # no_sub_proses
                // ->where("id_segmen", "=", $data_rcm_csa->id_segmen) # segmen
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                /*
                ->where("id_periode_parent", "=", $data_rcm_csa->id_periode_parent) # periode remediasi
                ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                */
                ->where("id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup); # ruang lingkup
                // ->get();

            /**
             * 
             */
        } else if (in_array($data_rcm_csa->id_ruang_lingkup, [6])) { # exe elc 

            # cek apakah sudah ada rcm_csa_too dengan ruang lingkup tsb(elc,itgc) dan unit tsb
            $rcm_too_model = $rcm_too_model
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                # ->where("id_deskripsi_lokasi", "=", $data_rcm_csa->id_deskripsi_lokasi) # periode
                /*
                ->where("id_periode_parent", "=", $data_rcm_csa->id_periode_parent) # periode remediasi
                ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                */
                ->where("id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup); # ruang lingkup
                // ->get();

            if (!$id_remediasi)
                $rcm_too_model = $rcm_too_model
                    ->where("id_deskripsi_lokasi", "=", $data_rcm_csa->id_deskripsi_lokasi);
            /**
             * 
             */
        } else
            return [false, 'Ruang Lingkup tidak ditemukan'];

        if ($id_remediasi)
            $rcm_too_model = $rcm_too_model
                ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                ->where("id_remediasi", "=", $id_remediasi)
                ->where("id_periode_parent", "=", $data_rcm_csa->id_periode_parent ?? $data_rcm_csa->id_periode); # periode remediasi
        else
            $rcm_too_model = $rcm_too_model
                ->where("id_periode", "=", $data_rcm_csa->id_periode); # periode
        #

        /*
        if ($id_remediasi_too)
            $rcm_too_model = $rcm_too_model
                ->where("id_remediasi", "=", $id_remediasi_too); # periode
        */

        $check = $rcm_too_model->get();

        if ($check->count() < 1) { # tidak -> insert rcm_too dan rcm_csa_too
            $ret = $id_too = $rcm_too->insert([
                'id_deskripsi_lokasi' => $data_rcm_csa->id_deskripsi_lokasi,
                // 'id_segmen' => $data_rcm_csa->id_segmen,
                // 'id_unit' => ($data_rcm_csa->id_ruang_lingkup != 5) ? $this->id_unit_kantor_pusat : $data_rcm_csa->id_lokasi,
                /*
                'id_periode_parent' => $data_rcm_csa->id_periode_parent, # periode remediasi
                'id_periode' => $data_rcm_csa->id_periode,
                */
                'id_periode_parent' => $id_remediasi ? ($data_rcm_csa->id_periode_parent ?? $data_rcm_csa->id_periode) : null, # periode remediasi
                'id_periode' => $id_remediasi ? null : $data_rcm_csa->id_periode,
                'id_ruang_lingkup' => $data_rcm_csa->id_ruang_lingkup,
                'id_status' => $data_rcm_csa->id_status,
                'no_sub_proses' => $data_rcm_csa->no_sub_proses,
                'id_remediasi' => $id_remediasi,
                'id_rcm' => $data_rcm_csa->id_rcm,
            ]);
        } else {
            $ret = $id_too = $check->toArray()[0]['id_rcm_too'];

            if ($ret)
                $ret = $rcm_too->update($id_too, [
                    'id_deskripsi_lokasi' => $data_rcm_csa->id_deskripsi_lokasi,
                    // 'id_segmen' => $data_rcm_csa->id_segmen,
                    // 'id_unit' => ($data_rcm_csa->id_ruang_lingkup != 5) ? $this->id_unit_kantor_pusat : $data_rcm_csa->id_lokasi,
                    'id_periode_parent' => $id_remediasi ? ($data_rcm_csa->id_periode_parent ?? $data_rcm_csa->id_periode) : null, # periode remediasi
                    'id_periode' => $id_remediasi ? null : $data_rcm_csa->id_periode,
                    'id_ruang_lingkup' => $data_rcm_csa->id_ruang_lingkup,
                    // 'id_status' => $data_rcm_csa->id_status,
                    'no_sub_proses' => $data_rcm_csa->no_sub_proses,
                    'id_remediasi' => $id_remediasi,
                    'id_rcm' => $data_rcm_csa->id_rcm,
                ]);
            else
                return [false, 'gagal update TOO'];
        }

        $data['id_rcm_too'] = $id_too;
        $data['id_rcm_csa'] = $data_rcm_csa->id_rcm_csa;
        $data['id_rcm'] = $data_rcm_csa->id_rcm;
        $data['id_ruang_lingkup'] = $data_rcm_csa->id_ruang_lingkup;
        $data['id_periode'] = $data_rcm_csa->id_periode;
        $data['id_periode_parent'] = $data_rcm_csa->id_periode_parent; # periode remediasi


        if ($id_too && $ret) # add rcm_csa_too
        {
            $id_csa_too = $rcm_csa_too->where($data)->value('id_csa_too');
            if (!$id_csa_too) {
                /*
                $is_pilih = $rcm_csa_too
                    ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                    ->where('id_periode', '=', $data_rcm_csa->id_periode_parent ?? $data_rcm_csa->id_periode)
                    ->whereNotNull('is_pilih')
                    ->value('id_csa_too');

                if (!$is_pilih)
                    $data['is_pilih'] = 1;
                */
                $is_pilih = $rcm_csa_too
                    ->whereNotNull('is_pilih')
                    ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                    ->where('id_rcm_too', '=', $id_too)
                    ->value('id_csa_too');

                if (!$is_pilih)
                    $data['is_pilih'] = 1;

                // $rcm_csa_too
                //     ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                //     ->where('id_rcm_too', '=', $id_too)
                //     ->update(['is_pilih' => null]);

                // $data['is_pilih'] = 1;

                $ret = $rcm_csa_too->insert($data);
            }
        }
        if (!$ret)
            return [false, "Gagal mengajukan"];
        else
            return [true, ''];
    }
    /**
     * get data rcm_csa
     * check apakah tidak efektif
     * 
     * -> jika efektif insert/update rcm_too
     * -> jika efektif insert/update rcm_csa_too
     * 
     * -> jika tidak efektif masuk remediasi (sudah dilakukan di controoler rcmcsa)
     * 
     */
    protected function create_too_bak($id_rcm_csa)
    {
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_csa_too = new \App\Models\RcmCsaToo();
        $rcm_too = new \App\Models\RcmToo();

        /* get data rcm_csa */
        $data_rcm_csa = $rcm_csa->find($id_rcm_csa)->toArray();
        $id_rcm = $data_rcm_csa['id_rcm'];
        $id_periode = $data_rcm_csa['id_periode'];
        $msg = "";

        /* check apakah tidak efektif*/
        if ($data_rcm_csa['efektivitas_csa'] == 'efektif') {

            /* -> jika efektif insert/update rcm_too*/
            $id_rcm_too = $rcm_too->where('id_rcm', '=', $id_rcm)->where('id_periode', '=', $id_periode)->value('id_rcm_too');
            $too_belum_ada = true;
            if ($id_rcm_too) {
                $too_belum_ada = false;
                $ret = $rcm_too->update($id_rcm_too, [
                    'id_rcm' => $id_rcm,
                    'id_periode' => $id_periode,
                    'id_ruang_lingkup' => $data_rcm_csa['id_ruang_lingkup'],
                ]);
            } else
                $ret = $id_rcm_too = $rcm_too->insert([
                    'id_status' => 20,
                    'id_rcm' => $id_rcm,
                    'id_periode' => $id_periode,
                    'id_ruang_lingkup' => $data_rcm_csa['id_ruang_lingkup'],
                ]);

            if (!$ret) {
                $msg = "gagal simpan csa";
                return [false, $msg];
            }

            /* -> jika efektif insert/update rcm_csa_too*/
            if ($too_belum_ada)
                $data_rcm_csa['is_pilih'] = 1;
            $data_rcm_csa['id_rcm_too'] = $id_rcm_too;
            $id_rcm_csa_too = $rcm_csa_too->where('id_rcm_csa', '=', $data_rcm_csa['id_rcm_csa'])->value('id_rcm_csa_too');
            if ($id_rcm_csa_too)
                $ret = $rcm_csa_too->update($id_rcm_csa_too, $data_rcm_csa);
            else {
                $ret = $rcm_csa_too->insert($data_rcm_csa);
            }

            if (!$ret) {
                $msg = "gagal simpan csa!";
                return [false, $msg];
            }
        }

        return [$ret, $msg];
    }

    /*
    protected function create_tod($id_rcm_too)
    {
        $rcm_too = new \App\Models\RcmToo();
        $rcm_csa_too = new \App\Models\RcmCsaToo();
        $rcm_tod = new \App\Models\RcmTod();
        $rcm_csa_tod = new \App\Models\RcmCsaTod();

        $data_rcm_too = $rcm_too->find($id_rcm_too)->toArray();
        $data_rcm_csa_too = $rcm_csa_too->where('id_rcm_too', '=', $id_rcm_too)->get()->toArray();

        $id_rcm = $data_rcm_too['id_rcm'];
        $id_periode = $data_rcm_too['id_periode'];

        $id_tod = $rcm_tod->where('id_rcm', '=', $id_rcm)->where('id_periode', '=', $id_periode)->value('id_tod');

        if ($id_tod)
            $ret = $rcm_tod->update($id_tod, $data_rcm_too);
        else
            $ret = $id_tod = $rcm_tod->insert($data_rcm_too);

        if (!$ret)
            return [$ret, 'gagal create tod'];

        foreach ($data_rcm_csa_too as $csa_too) {
            if (!$ret)
                break;

            $record = [
                'id_tod' => $id_tod,
                'id_csa' => $csa_too['id_rcm_csa'],
                'id_rcm' => $csa_too['id_rcm'],
                'id_ruang_lingkup' => $csa_too['id_ruang_lingkup'],
                'id_periode' => $csa_too['id_periode'],
            ];

            $id_csa_tod = $rcm_csa_tod->where($record)->value('id_csa_tod');

            if (!$id_csa_tod)
                $ret = $rcm_csa_tod->insert($record);
        }
        if (!$ret)
            return [$ret, 'gagal create tod!'];

        return [$ret, ''];
    }
    */
    /*
    tod per unit, per segmen pada periode tsb
        -> pengerjaan per no sub proses

    check apakah rcm di periode tsb remidiasi

    check apakah diperiode ada jadwal line 2
    
    exe tlc
        cek apakah sudah ada unit tsb, segmen tsb, no sub proses, periode
            ya -> insert rcm_csa_tod
            tidak -> insert rcm_tod dan rcm_csa_tod
    exe elc itgc
        cek apakah sudah ada rcm_csa_tod dengan ruang lingkup tsb(elc,itgc) dan unit tsb
            ya -> insert rcm_csa_tod
            tidak -> insert rcm_tod dan rcm_csa_tod

    */

    public function create_tod_bak($id_csa, $id_status = 7): array
    {
        // return [false, 'sedang perbaikan'];
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_remediasi = new \App\Models\RcmRemediasi();
        $rcm_tod_model = new \App\Models\RcmTod();
        $rcm_csa_tod = new \App\Models\RcmCsaTod();
        $periode = new \App\Models\Periode();

        # data rcm_csa
        $data_rcm_csa = $rcm_csa->find($id_csa);
        // $no_sub_proses = $data_rcm_csa->no_sub_proses;
        $id_periode = $data_rcm_csa->id_periode ?? $data_rcm_csa->id_periode_parent;

        $data_periode = $periode->find($id_periode);
        $tahun = $data_periode->tahun;

        # check apakah rcm di periode tsb remidiasi
        /*
        $check = $rcm_remediasi
            ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
            ->where('id_periode', '=', $data_rcm_csa->id_periode)
            ->whereIn('proses', ['csa', 'too'])
            // ->where('proses', '=', 'csa')
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereIn('status', ['tolak', 'terima']);
            })
            //->whereIn('status', ['tolak', 'terima'])

            ->count();
        if ($check)
            return [true, null];
        */

        # check apakah diperiode ada jadwal line 3
        /*
        $data_periode = $periode->periode_next_exists($data_rcm_csa->id_periode, 'toe');

        if (!$data_periode)
            return [true, null];
        */


        if (in_array($data_rcm_csa->id_ruang_lingkup, [5, 7])) { # exe tlc

            /*
            if (!$data_rcm_csa->id_segmen)
                return [false, 'Segmen tidak ditemukan'];
            */

            # cek apakah sudah ada unit tsb, segmen tsb, no sub proses, periode
            $check = $rcm_tod_model
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_tod.id_periode')
                ->whereRaw("trim(lower(no_sub_proses)) = ?", [trim(strtolower($data_rcm_csa->no_sub_proses))]) # no_sub_proses
                // ->where("id_segmen", "=", $data_rcm_csa->id_segmen) # segmen
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                // ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                ->where('periode.tahun', '=', $tahun)
                ->where("rcm_tod.id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup) # ruang lingkup
                ->get();

            #
        } else if (in_array($data_rcm_csa->id_ruang_lingkup, [6])) { # exe elc itgc

            # cek apakah sudah ada rcm_csa_tod dengan ruang lingkup tsb(elc,itgc) dan unit tsb
            $check = $rcm_tod_model
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_tod.id_periode')
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                // ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                ->where('periode.tahun', '=', $tahun)
                ->where("id_deskripsi_lokasi", "=", $data_rcm_csa->id_deskripsi_lokasi) # periode
                ->where("rcm_tod.id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup) # ruang lingkup
                ->get();

            #
        } else
            return [false, 'Ruang Lingkup tidak ditemukan'];

        if ($check->count() < 1) { # tidak -> insert rcm_tod dan rcm_csa_tod
            $ret = $id_tod = $rcm_tod_model->insert([
                'id_deskripsi_lokasi' => $data_rcm_csa->id_deskripsi_lokasi,
                // 'id_segmen' => $data_rcm_csa->id_segmen,
                // 'id_unit' => ($data_rcm_csa->id_ruang_lingkup != 5) ? $this->id_unit_kantor_pusat : $data_rcm_csa->id_lokasi,
                // 'id_status' => $data_rcm_csa->id_status,
                'id_periode' => $id_periode,
                'id_ruang_lingkup' => $data_rcm_csa->id_ruang_lingkup,
                'id_status' => 6,
                'no_sub_proses' => $data_rcm_csa->no_sub_proses,
            ]);
        } else { # ya -> insert rcm_csa_tod
            $ret = $id_tod = $check->toArray()[0]['id_tod'];
        }

        $data['id_tod'] = $id_tod;
        $data['id_csa'] = $data_rcm_csa->id_rcm_csa;
        $data['id_rcm'] = $data_rcm_csa->id_rcm;
        $data['id_ruang_lingkup'] = $data_rcm_csa->id_ruang_lingkup;
        $data['id_periode'] = $id_periode;


        if ($id_tod && $ret) # add rcm_csa_tod
        {
            $id_csa_tod = $rcm_csa_tod->where($data)->value('id_csa_tod');
            if (!$id_csa_tod) {

                $is_pilih = $rcm_csa_tod
                    ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                    ->where('id_periode', '=', $id_periode)
                    ->whereNotNull('is_pilih')
                    ->value('id_csa_tod');

                if (!$is_pilih)
                    $data['is_pilih'] = 1;

                $ret = $rcm_csa_tod->insert($data);
            }
        }

        if (!$ret)
            return [false, "Gagal mengajukan"];
        else
            return [true, ''];
    }

    public function create_tod($id_csa, $id_status = 7): array
    {
        // return [false, 'sedang perbaikan'];
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_remediasi = new \App\Models\RcmRemediasi();
        $rcm_tod_model = new \App\Models\RcmTod();
        $rcm_csa_tod = new \App\Models\RcmCsaTod();
        $periode = new \App\Models\Periode();

        # data rcm_csa
        $data_rcm_csa = $rcm_csa->find($id_csa);
        // $no_sub_proses = $data_rcm_csa->no_sub_proses;
        $id_periode = $data_rcm_csa->id_periode ?? $data_rcm_csa->id_periode_parent;

        $data_periode = $periode->find($id_periode);
        $tahun = $data_periode->tahun;

        # check apakah rcm di periode tsb remidiasi
        /*
        $check = $rcm_remediasi
            ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
            ->where('id_periode', '=', $data_rcm_csa->id_periode)
            ->whereIn('proses', ['csa', 'too'])
            // ->where('proses', '=', 'csa')
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereIn('status', ['tolak', 'terima']);
            })
            //->whereIn('status', ['tolak', 'terima'])

            ->count();
        if ($check)
            return [true, null];
        */

        # check apakah diperiode ada jadwal line 3
        /*
        $data_periode = $periode->periode_next_exists($data_rcm_csa->id_periode, 'toe');

        if (!$data_periode)
            return [true, null];
        */


        if (in_array($data_rcm_csa->id_ruang_lingkup, [5, 7])) { # exe tlc

            /*
            if (!$data_rcm_csa->id_segmen)
                return [false, 'Segmen tidak ditemukan'];
            */

            # cek apakah sudah ada unit tsb, segmen tsb, no sub proses, periode
            $check = $rcm_tod_model
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_tod.id_periode')
                ->where('rcm_tod.id_rcm', '=', $data_rcm_csa->id_rcm)
                /*
                ->whereRaw("trim(lower(no_sub_proses)) = ?", [trim(strtolower($data_rcm_csa->no_sub_proses))]) # no_sub_proses
                */
                // ->where("id_segmen", "=", $data_rcm_csa->id_segmen) # segmen
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                // ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                ->where('periode.tahun', '=', $tahun)
                ->where("rcm_tod.id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup) # ruang lingkup
                ->get();

            #
        } else if (in_array($data_rcm_csa->id_ruang_lingkup, [6])) { # exe elc itgc

            # cek apakah sudah ada rcm_csa_tod dengan ruang lingkup tsb(elc,itgc) dan unit tsb
            $check = $rcm_tod_model
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_tod.id_periode')
                ->where('rcm_tod.id_rcm', '=', $data_rcm_csa->id_rcm)
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                // ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                ->where('periode.tahun', '=', $tahun)
                /*
                ->where("id_deskripsi_lokasi", "=", $data_rcm_csa->id_deskripsi_lokasi) # periode
                */
                ->where("rcm_tod.id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup) # ruang lingkup
                ->get();

            #
        } else
            return [false, 'Ruang Lingkup tidak ditemukan'];

        if ($check->count() < 1) { # tidak -> insert rcm_tod dan rcm_csa_tod
            $ret = $id_tod = $rcm_tod_model->insert([
                'id_deskripsi_lokasi' => $data_rcm_csa->id_deskripsi_lokasi,
                // 'id_segmen' => $data_rcm_csa->id_segmen,
                // 'id_unit' => ($data_rcm_csa->id_ruang_lingkup != 5) ? $this->id_unit_kantor_pusat : $data_rcm_csa->id_lokasi,
                // 'id_status' => $data_rcm_csa->id_status,
                'id_rcm' => $data_rcm_csa->id_rcm,
                'id_periode' => $id_periode,
                'id_ruang_lingkup' => $data_rcm_csa->id_ruang_lingkup,
                'id_status' => 6,
                'no_sub_proses' => $data_rcm_csa->no_sub_proses,
            ]);
        } else { # ya -> insert rcm_csa_tod
            $ret = $id_tod = $check->toArray()[0]['id_tod'];
        }

        $data['id_tod'] = $id_tod;
        $data['id_csa'] = $data_rcm_csa->id_rcm_csa;
        $data['id_rcm'] = $data_rcm_csa->id_rcm;
        $data['id_ruang_lingkup'] = $data_rcm_csa->id_ruang_lingkup;
        $data['id_periode'] = $id_periode;


        if ($id_tod && $ret) # add rcm_csa_tod
        {
            $id_csa_tod = $rcm_csa_tod->where($data)->value('id_csa_tod');
            if (!$id_csa_tod) {

                $is_pilih = $rcm_csa_tod
                    ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                    ->where('id_periode', '=', $id_periode)
                    ->whereNotNull('is_pilih')
                    ->value('id_csa_tod');

                if (!$is_pilih)
                    $data['is_pilih'] = 1;

                $ret = $rcm_csa_tod->insert($data);
            }
        }

        if (!$ret)
            return [false, "Gagal mengajukan"];
        else
            return [true, ''];
    }
    /*
    public function create_tod($id_csa, $id_status = 7): array
    {
        // return [false, 'sedang perbaikan'];
        $rcm_csa = new \App\Models\RcmCsa();
        $rcm_remediasi = new \App\Models\RcmRemediasi();
        $rcm_tod_model = new \App\Models\RcmTod();
        $rcm_csa_tod = new \App\Models\RcmCsaTod();
        $periode = new \App\Models\Periode();

        # data rcm_csa
        $data_rcm_csa = $rcm_csa->find($id_csa);
        // $no_sub_proses = $data_rcm_csa->no_sub_proses;
        $id_periode = $data_rcm_csa->id_periode ?? $data_rcm_csa->id_periode_parent;

        $data_periode = $periode->find($id_periode);
        $tahun = $data_periode->tahun;

        


        if (in_array($data_rcm_csa->id_ruang_lingkup, [5, 7])) { # exe tlc

           

            # cek apakah sudah ada unit tsb, segmen tsb, no sub proses, periode
            $check = $rcm_tod_model
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_tod.id_periode')
                ->whereRaw("trim(lower(no_sub_proses)) = ?", [trim(strtolower($data_rcm_csa->no_sub_proses))]) # no_sub_proses
                // ->where("id_segmen", "=", $data_rcm_csa->id_segmen) # segmen
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                // ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                ->where('periode.tahun', '=', $tahun)
                ->where("rcm_tod.id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup) # ruang lingkup
                ->get();

            #
        } else if (in_array($data_rcm_csa->id_ruang_lingkup, [6])) { # exe elc itgc

            # cek apakah sudah ada rcm_csa_tod dengan ruang lingkup tsb(elc,itgc) dan unit tsb
            $check = $rcm_tod_model
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_tod.id_periode')
                // ->where("id_unit", "=", $data_rcm_csa->id_lokasi) # unit
                // ->where("id_periode", "=", $data_rcm_csa->id_periode) # periode
                ->where('periode.tahun', '=', $tahun)
                ->where("id_deskripsi_lokasi", "=", $data_rcm_csa->id_deskripsi_lokasi) # periode
                ->where("rcm_tod.id_ruang_lingkup", "=", $data_rcm_csa->id_ruang_lingkup) # ruang lingkup
                ->get();

            #
        } else
            return [false, 'Ruang Lingkup tidak ditemukan'];

        if ($check->count() < 1) { # tidak -> insert rcm_tod dan rcm_csa_tod
            $ret = $id_tod = $rcm_tod_model->insert([
                'id_deskripsi_lokasi' => $data_rcm_csa->id_deskripsi_lokasi,
                // 'id_segmen' => $data_rcm_csa->id_segmen,
                // 'id_unit' => ($data_rcm_csa->id_ruang_lingkup != 5) ? $this->id_unit_kantor_pusat : $data_rcm_csa->id_lokasi,
                // 'id_status' => $data_rcm_csa->id_status,
                'id_periode' => $id_periode,
                'id_ruang_lingkup' => $data_rcm_csa->id_ruang_lingkup,
                'id_status' => 6,
                'no_sub_proses' => $data_rcm_csa->no_sub_proses,
            ]);
        } else { # ya -> insert rcm_csa_tod
            $ret = $id_tod = $check->toArray()[0]['id_tod'];
        }

        $data['id_tod'] = $id_tod;
        $data['id_csa'] = $data_rcm_csa->id_rcm_csa;
        $data['id_rcm'] = $data_rcm_csa->id_rcm;
        $data['id_ruang_lingkup'] = $data_rcm_csa->id_ruang_lingkup;
        $data['id_periode'] = $id_periode;


        if ($id_tod && $ret) # add rcm_csa_tod
        {
            $id_csa_tod = $rcm_csa_tod->where($data)->value('id_csa_tod');
            if (!$id_csa_tod) {

                $is_pilih = $rcm_csa_tod
                    ->where('id_rcm', '=', $data_rcm_csa->id_rcm)
                    ->where('id_periode', '=', $id_periode)
                    ->whereNotNull('is_pilih')
                    ->value('id_csa_tod');

                if (!$is_pilih)
                    $data['is_pilih'] = 1;

                $ret = $rcm_csa_tod->insert($data);
            }
        }

        if (!$ret)
            return [false, "Gagal mengajukan"];
        else
            return [true, ''];
    }
    */


    /**
     * 1. mengambil semua data csa dari tod tsb
     * x 2. check apakah sudah ada tod dengan no_sub_proses dan ref_kontrol dari tiap data csa
     * 2. check apakah sudah ada tod dengan rcm dari tiap data csa
     *      ya    -> get id_toe dari rcm_toe
     *      tidak -> insert_data ke rcm_toe
     * 3. insert data ke rcm_csa_toe
     */

    public function create_toe($id_tod, $id_periode)
    {
        $rcm_tod = new \App\Models\RcmTod();
        $rcm_csa_tod = new \App\Models\RcmCsaTod();
        $rcm_csa = new \App\Models\RcmCsa();
        $periode = new \App\Models\Periode();

        $rcm_csa_toe = new \App\Models\RcmCsaToe();
        $rcm_toe = new \App\Models\RcmToe();

        $data_periode = $periode->find($id_periode);
        $tahun = $data_periode->tahun;

        # check apakah diperiode ada jadwal line 3
        /*
        $data_periode = $periode->periode_next_exists($id_periode, 'toe');

        if (!$data_periode)
            return [true, null];
        */

        # 1. mengambil semua data csa dari tod tsb
        /*
        $data_rcm_csa = $rcm_csa->whereIn("id_rcm_csa", function ($query) use ($id_tod, $id_periode) {
            $query
                ->select("id_csa")
                ->from("rcm_csa_tod")
                ->where("id_tod", "=", $id_tod)
                ->whereIn("hasil_kesimpulan", ["efektif", "tat"])
                ->where("id_periode", "=", $id_periode);
        })
            ->get()->toArray();
        */

        $data_rcm_csa = $rcm_csa_tod->select_rcm_csa_tod_efektif($id_tod, $id_periode)->select("rcm_csa.*")->get()->toArray();

        $ret = true;
        foreach ($data_rcm_csa as $csa) {
            if (!$ret)
                break;

            # 2. check apakah sudah ada tod dengan rcm dari tiap data csa
            $id_toe = null;
            $id_rcm = $csa['id_rcm'];
            $data_rcm_toe = $rcm_toe
                ->leftJoin('periode', 'periode.id_periode', '=', 'rcm_toe.id_periode')
                ->where("periode.tahun", "=", $tahun)
                ->where('id_rcm', '=', $id_rcm);
            // ->where("no_sub_proses", "=", $csa["no_sub_proses"])
            // ->where("ref_kontrol", "=", $csa["ref_kontrol"]);

            # ya    -> get id_toe dari rcm_toe
            if ($data_rcm_toe->count())
                $id_toe = $data_rcm_toe->value("id_toe");

            $csa["id_periode"] = $csa["id_periode"] ?? $csa["id_periode_parent"];
            # tidak -> insert_data ke rcm_toe
            if (!$id_toe) {
                $record = [];
                $record["no_sub_proses"] = $csa["no_sub_proses"];
                $record["ref_kontrol"] = $csa["ref_kontrol"];
                $record["id_ruang_lingkup"] = $csa["id_ruang_lingkup"];
                $record["id_periode"] = $csa["id_periode"];
                $record["id_status"] = 10;
                $record["id_rcm"] = $id_rcm;

                $ret = $id_toe = $rcm_toe->insert($record);
            }

            # 3. insert data ke rcm_csa_toe
            if ($ret && $id_toe) {

                $record_csa = [];
                $record_csa["id_toe"] = $id_toe;
                $record_csa["id_rcm"] = $csa["id_rcm"];
                $record_csa["id_rcm_csa"] = $csa["id_rcm_csa"];
                $record_csa["id_periode"] = $csa["id_periode"];

                $check = $rcm_csa_toe->search($record_csa)->count();

                if (!$check)
                    $ret = $rcm_csa_toe->insert($record_csa);

                /**
                 * 
                 */
            } else $ret = false;
        }

        return $ret;
    }


    public function erro_master_notfond($message = "Data Tidak ditemukan", $status = 404, $file = 'sql_log', $clear = true)
    {
        $file = env('SQL_LOG', $file);
        $filePath = storage_path('logs/' . $file . '.txt');
        // if ($clear)
        if (true)
            File::put($filePath, $message);
        else
            File::append($filePath, '\n' . $message);
        // return response()->json([
        //     'messages' => ['errors' => $message],
        //     'error' => $status,
        //     'status' => $status,
        // ], $status);

        return response()->json([
            'errors' => [$message],
            'messages' => ['errors' => $message],
            'error' => $message,
            'status' => $status,
            'code' => $status,
        ], $status);
    }

    public function format_file($id, $file_name, $jenis)
    {
        return [
            $this->model->primaryKey => $id,
            "file_name" => $file_name,
            "client_name" => $file_name,
            "jenis" => $jenis,
        ];
    }

    public function createQrcode_pengajuan($id, $jenis, $isi, $nama)
    {
        $filearr = $this->modelfile->where($this->model->primaryKey, "=", $id)->where("jenis", "=", $jenis)->first();

        if ($filearr) {
            $filearr = $filearr->toArray();
            # data update / insert db
            if (file_exists($filearr['file_name'])) {
                $this->delete_file_dir($filearr['file_name']); # hapus file yang sudah ada
            }
        } else
            $filearr = $this->format_file($id, $nama, $jenis);

        # buat QRcode
        $ret =  $this->createQr($isi, $nama);


        # insert / update
        if ($ret)
            if (!empty($filearr[$this->modelfile->primaryKey])) {

                $id_file = $filearr[$this->modelfile->primaryKey];
                unset($filearr[$this->modelfile->primaryKey]);
                $filearr["file_name"] = $nama;
                $filearr["client_name"] = $nama;

                $ret = $this->modelfile->update($id_file, $filearr);
            } else {
                $ret = $this->modelfile->insert($filearr);
            }

        return $ret;
    }

    protected function rcm_risiko($id_rcm, $id_csa)
    {
        $rcm_risiko = new \App\Models\RcmRisiko();
        $rcm_csa_risiko = new \App\Models\RcmCsaRisiko();
        $rcm_csa = new \App\Models\RcmCsa();

        $data_rcm_risiko = $rcm_risiko
            ->join('mt_risiko', 'mt_risiko.id_risiko', '=', 'rcm_risiko.id_risiko')
            ->where('rcm_risiko.id_rcm', '=', $id_rcm)
            ->get();

        if ($data_rcm_risiko->count() < 1)
            return true;

        $data_rcm_risiko = $data_rcm_risiko->toArray();

        $rcm_csa_risiko->where('id_rcm_csa', $id_csa)->delete();

        // $this->start_log();
        $ret = true;
        $i = 1;
        $risiko_merge = [];
        foreach ($data_rcm_risiko as $data_risiko) {

            if (!$ret)
                break;

            $rcm_csa_risiko_model = DB::table("rcm_csa_risiko");

            $id_rcm_csa_risiko = $rcm_csa_risiko_model
                ->where('id_rcm_csa', '=', $id_csa)
                ->where('id_risiko', '=', $data_risiko['id_risiko'])
                ->where('id_rcm_risiko', '=', $data_risiko['id_rcm_risiko'])
                ->value('id_rcm_csa_risiko');

            foreach ($data_risiko as $colom => $value) {
                if (!in_array($colom, $rcm_csa_risiko->fillable)) {
                    unset($data_risiko[$colom]);
                    continue;
                }

                $risiko_merge[$colom][$i] = $value;
            }

            $data_risiko['id_rcm_csa'] = $id_csa;
            $data_risiko['deleted_at'] = null;

            if ($id_rcm_csa_risiko)
                $ret = $rcm_csa_risiko_model->where('id_rcm_csa_risiko', '=', $id_rcm_csa_risiko)->update($data_risiko);
            else
                $ret = $rcm_csa_risiko_model->insert($data_risiko);

            $i++;
        }

        if ($ret) {
            $data_risiko_csa = [];
            $jumlah = $i;
            foreach ($risiko_merge as $colom => $value_arr) {
                if (in_array($colom, [
                    'id_rcm',
                    'id_rcm_csa',
                    'id_risiko',
                    'created_by',
                    'updated_by',
                    'deleted_by',
                    'created_by_desc',
                    'updated_by_desc',
                    'deleted_by_desc'
                ]))
                    continue;

                $value = "";
                foreach ($value_arr as $no => $val) {
                    if ($val)
                        if (count($value_arr) > 1)
                            $value .= ((string) $no) . ". " . ((string)$val) . "\n";
                        else
                            $value = $val;
                }
                $data_risiko_csa[$colom] = $value;
            }

            $ret = $rcm_csa->update($id_csa, $data_risiko_csa);
        }


        // $this->end_log();
        return $ret;
    }

    public function distribut_dok($id_rcm, $id_csa)
    {
        $rcm_dok_pendukung = new \App\Models\RcmDokPendukung;
        $rcm_csa_dok_pendukung = new \App\Models\RcmCsaDokPendukung();

        $data = $rcm_dok_pendukung->where('id_rcm', '=', $id_rcm)->whereNull("deleted_at")->get()->toArray();
        $ret = true;

        $id_dok_all = [];
        foreach ($data as $dokumen) {
            if (!$ret)
                break;
            $rec = [];
            $rec['id_rcm_csa'] = $id_csa;
            $rec['id_dok_pendukung'] = $dokumen['id_dok_pendukung'];
            $rec['isi'] = $dokumen['isi'];

            $id_csa_dok_pendukung = $rcm_csa_dok_pendukung
                ->where("id_dok_pendukung", "=", $rec['id_dok_pendukung'])
                ->where("id_rcm_csa", "=", $rec['id_rcm_csa'])->value("id_csa_dok_pendukung");

            if ($id_csa_dok_pendukung)
                $ret = $rcm_csa_dok_pendukung->update($id_csa_dok_pendukung, $rec);
            else
                $ret = $id_csa_dok_pendukung = $rcm_csa_dok_pendukung->insert($rec);

            $id_dok_all[] = $id_csa_dok_pendukung;
        }

        if ($ret && !empty($id_dok_all)) {
            $data_yang_tidak_dirubah = $delete_data = $rcm_csa_dok_pendukung->whereNotIn('id_csa_dok_pendukung', $id_dok_all)->where('id_rcm_csa', '=', $id_csa);

            if ($data_yang_tidak_dirubah->get()->count()) {
                $ret = $delete_data->delete();
            }
        }

        return $ret;
    }
    // $this->rcm_csa_atribut_kontrol

    public function atribut_kontrol($id_rcm, $id_csa)
    {
        $rcm_atribut_kontrol = new \App\Models\RcmAtributKontrol;
        $rcm_csa_atribut_kontrol = new \App\Models\RcmCsaAtributKontrol();

        $data = $rcm_atribut_kontrol->where('id_rcm', '=', $id_rcm)->whereNull("deleted_at")->get()->toArray();
        $ret = true;

        $id_atribut_csa_all = [];
        foreach ($data as $atribut) {
            if (!$ret)
                break;
            $rec = [];
            $rec['id_rcm_csa'] = $id_csa;
            $rec['id_atribut_kontrol'] = $atribut['id_atribut_kontrol'];
            $rec['isi'] = $atribut['isi'];

            // $id_csa_atribut_kontrol = null;
            $id_csa_atribut_kontrol = $rcm_csa_atribut_kontrol
                ->where("id_rcm_csa", "=", $rec['id_rcm_csa'])
                ->where("id_atribut_kontrol", "=", $rec['id_atribut_kontrol'])->value("id_csa_atribut_kontrol");

            if ($id_csa_atribut_kontrol)
                $ret = $rcm_csa_atribut_kontrol->update($id_csa_atribut_kontrol, $rec);
            else
                $ret = $id_csa_atribut_kontrol = $rcm_csa_atribut_kontrol->insert($rec);

            $id_atribut_csa_all[] = $id_csa_atribut_kontrol;
        }
        if ($ret && !empty($id_atribut_csa_all)) {
            $data_yang_tidak_dirubah = $delete_data = $rcm_csa_atribut_kontrol->whereNotIn('id_csa_atribut_kontrol', $id_atribut_csa_all)->where('id_rcm_csa', '=', $id_csa);

            if ($data_yang_tidak_dirubah->get()->count()) {
                $ret = $delete_data->delete();
            }
        }
        return $ret;
    }

    public function select_data_master_rcm(array $data)
    {

        if (!empty($data['updated_by'])) {
            $sys_user = new \App\Models\SysUserModel();
            $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();

            $data_sys_user = $sys_user->find($data['updated_by']);

            if ($data_sys_user) {
                $nid = $data_sys_user->nid;
                $data['rcm_modified_by_nid'] = $data_sys_user->nid;
                $data['rcm_modified_by_nama'] = $data_sys_user->name;
                $data['rcm_modified_by_jabatan'] = $mt_sdm_jabatan->where('position_id', '=', function ($query) use ($nid) {
                    $query->select('position_id')->from('mt_sdm_pegawai')->where('nid', '=', $nid);
                })->value('nama');
            }
        }

        if ($data['id_proses']) {
            $id_proses = $data['id_proses'];
            $data = $this->get_proses($data, $id_proses);
        }
        if ($data['id_risiko']) {
            $id_risiko = $data['id_risiko'];
            $data = $this->get_risiko($data, $id_risiko);
        }
        if ($data['id_kontrol']) {
            $id_kontrol = $data['id_kontrol'];
            $data = $this->get_kontrol($data, $id_kontrol);
        }
        if ($data['id_segmen']) {
            $id_segmen = $data['id_segmen'];
            $data = $this->get_segment($data, $id_segmen);
        }
        if ($data['id_lokasi']) {
            $id_lokasi = $data['id_lokasi'];
            $data = $this->get_lokasi($data, $id_lokasi);
        }
        if ($data['id_deskripsi_lokasi']) {
            $id_deskripsi_lokasi = $data['id_deskripsi_lokasi'];
            $data = $this->get_deskripsi_lokasi($data, $id_deskripsi_lokasi);
        }
        if (!empty($data['id_frekuensi'])) {
            $id_frekuensi = $data['id_frekuensi'];
            $data = $this->get_frekuensi($data, $id_frekuensi);
        }
        if ($data['id_control_preparer']) {
            $id_control_preparer = $data['id_control_preparer'];
            $data = $this->get_control_preparer($data, $id_control_preparer);
        }
        /*
        if ($data['id_control_reviewer']) {
            $id_control_reviewer = $data['id_control_reviewer'];
            $data = $this->get_control_reviewer($data, $id_control_reviewer);
        }
        */
        if ($data['id_control_approver']) {
            $data = $this->get_control_approver($data, $data['id_control_approver']);
        }

        return $data;
    }

    /**
     * only for insert / update
     */
    private function get_proses($data, $id_proses)
    {
        $mt_proses = new \App\Models\MtProses;
        // $data_proses = $mt_proses->where("id_proses", $id_proses)->get()->toArray()[0];
        $data_proses = $mt_proses->find($id_proses)->toArray();

        if (!empty($data_proses['ref_proses'])) $data['ref_proses'] = $data_proses['ref_proses'];
        if (!empty($data_proses['deskripsi_proses'])) $data['deskripsi_proses'] = $data_proses['deskripsi_proses'];

        if (!empty($data_proses['no_sub_proses']))
            $data['no_sub_proses'] = $data_proses['no_sub_proses'];
        if (!empty($data_proses['deskripsi_sub_proses']))
            $data['deskripsi_sub_proses'] = $data_proses['deskripsi_sub_proses'];
        if (!empty($data_proses['ref_proses_lvl4']))
            $data['ref_proses_lvl4'] = $data_proses['ref_proses_lvl4'];
        if (!empty($data_proses['deskripsi_proses_lvl4']))
            $data['deskripsi_proses_lvl4'] = $data_proses['deskripsi_proses_lvl4'];
        if (!empty($data_proses['ref_proses_lvl5']))
            $data['ref_proses_lvl5'] = $data_proses['ref_proses_lvl5'];
        if (!empty($data_proses['deskripsi_proses_lvl5']))
            $data['deskripsi_proses_lvl5'] = $data_proses['deskripsi_proses_lvl5'];

        if (!empty($data_proses['updated_by'])) {
            $sys_user = new \App\Models\SysUserModel();
            $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();

            $data_sys_user = $sys_user->find($data_proses['updated_by']);

            if ($data_sys_user) {
                $nid = $data_sys_user->nid;
                $data['proses_modified_by_nid'] = $data_sys_user->nid;
                $data['proses_modified_by_nama'] = $data_sys_user->name;
                $data['proses_modified_by_jabatan'] = $mt_sdm_jabatan->where('position_id', '=', function ($query) use ($nid) {
                    $query->select('position_id')->from('mt_sdm_pegawai')->where('nid', '=', $nid);
                })->value('nama');
            }
        }
        return $data;
    }

    /**
     * only for insert / update
     */
    private function get_risiko($data, $id_risiko)
    {
        $mt_risiko = new \App\Models\MtRisiko;
        // $data_risiko = $mt_risiko->where("id_risiko", $id_risiko)->get()->toArray()[0];
        $data_risiko = $mt_risiko->find($id_risiko)->toArray();

        if (!empty($data_risiko['deskripsi_akun']))
            $data['deskripsi_akun'] = $data_risiko['deskripsi_akun'];
        if (!empty($data_risiko['asersi']))
            $data['asersi'] = $data_risiko['asersi'];
        if (!empty($data_risiko['ref_risiko']))
            $data['ref_risiko'] = $data_risiko['ref_risiko'];
        if (!empty($data_risiko['deskripsi_risiko']))
            $data['deskripsi_risiko'] = $data_risiko['deskripsi_risiko'];
        if (!empty($data_risiko['area_kontrol']))
            $data['area_kontrol'] = $data_risiko['area_kontrol'];
        if (!empty($data_risiko['sub_area_kontrol']))
            $data['sub_area_kontrol'] = $data_risiko['sub_area_kontrol'];
        if (!empty($data_risiko['komponen_coso']))
            $data['komponen_coso'] = $data_risiko['komponen_coso'];
        if (!empty($data_risiko['tujuan_coso']))
            $data['tujuan_coso'] = $data_risiko['tujuan_coso'];
        if (!empty($data_risiko['elemen_coso']))
            $data['elemen_coso'] = $data_risiko['elemen_coso'];
        if (!empty($data_risiko['risiko_kecurangan']))
            $data['risiko_kecurangan'] = $data_risiko['risiko_kecurangan'];
        if (!empty($data_risiko['dampak']))
            $data['dampak'] = $data_risiko['dampak'];
        if (!empty($data_risiko['kemungkinan_terjadi']))
            $data['kemungkinan_terjadi'] = $data_risiko['kemungkinan_terjadi'];
        if (!empty($data_risiko['tingkat_risiko']))
            $data['tingkat_risiko'] = $data_risiko['tingkat_risiko'];

        if (!empty($data_risiko['id_diskripsi_akun_list'])) $data['id_diskripsi_akun_list'] = $data_risiko['id_diskripsi_akun_list'];
        if (!empty($data_risiko['information_completeness'])) $data['information_completeness'] = $data_risiko['information_completeness'];
        if (!empty($data_risiko['information_accuracy'])) $data['information_accuracy'] = $data_risiko['information_accuracy'];
        if (!empty($data_risiko['information_validity'])) $data['information_validity'] = $data_risiko['information_validity'];
        if (!empty($data_risiko['information_restricted_access'])) $data['information_restricted_access'] = $data_risiko['information_restricted_access'];
        if (!empty($data_risiko['no_prinsip_coso'])) $data['no_prinsip_coso'] = $data_risiko['no_prinsip_coso'];
        if (!empty($data_risiko['prinsip_coso'])) $data['prinsip_coso'] = $data_risiko['prinsip_coso'];
        if (!empty($data_risiko['point_of_focus_coso'])) $data['point_of_focus_coso'] = $data_risiko['point_of_focus_coso'];
        if (!empty($data_risiko['asersi_existence_occurrence'])) $data['asersi_existence_occurrence'] = $data_risiko['asersi_existence_occurrence'];
        if (!empty($data_risiko['asersi_completeness'])) $data['asersi_completeness'] = $data_risiko['asersi_completeness'];
        if (!empty($data_risiko['asersi_accuracy'])) $data['asersi_accuracy'] = $data_risiko['asersi_accuracy'];
        if (!empty($data_risiko['asersi_cut_off'])) $data['asersi_cut_off'] = $data_risiko['asersi_cut_off'];
        if (!empty($data_risiko['asersi_valuation_allocation'])) $data['asersi_valuation_allocation'] = $data_risiko['asersi_valuation_allocation'];
        if (!empty($data_risiko['asersi_rights_obligation'])) $data['asersi_rights_obligation'] = $data_risiko['asersi_rights_obligation'];
        if (!empty($data_risiko['asersi_presentation_disclosure'])) $data['asersi_presentation_disclosure'] = $data_risiko['asersi_presentation_disclosure'];
        if (!empty($data_risiko['kode_asersi'])) $data['kode_asersi'] = $data_risiko['kode_asersi'];
        if (!empty($data_risiko['information'])) $data['information'] = $data_risiko['information'];
        if (!empty($data_risiko['kode_information'])) $data['kode_information'] = $data_risiko['kode_information'];

        if (!empty($data_risiko['updated_by'])) {
            $sys_user = new \App\Models\SysUserModel();
            $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();

            $data_sys_user = $sys_user->find($data_risiko['updated_by']);

            if ($data_sys_user) {
                $nid = $data_sys_user->nid;
                $data['risiko_modified_by_nid'] = $data_sys_user->nid;
                $data['risiko_modified_by_nama'] = $data_sys_user->name;
                $data['risiko_modified_by_jabatan'] = $mt_sdm_jabatan->where('position_id', '=', function ($query) use ($nid) {
                    $query->select('position_id')->from('mt_sdm_pegawai')->where('nid', '=', $nid);
                })->value('nama');
            }
        }

        return $data;
    }

    /**
     * only for insert / update
     */
    private function get_kontrol($data, $id_kontrol)
    {
        $mt_kontrol = new \App\Models\MtKontrol;
        $mt_jenis_kontrol = new \App\Models\MtJenisKontrol;
        $data_kontrol = $mt_kontrol->find($id_kontrol)->toArray();

        foreach ($data_kontrol as $colom => $value) {

            if (in_array($colom, ["created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by", "created_by_desc", "updated_by_desc", "deleted_by_desc",]))
                continue;

            $data[$colom] = $value;
        }

        /*
        if (!empty($data_kontrol['ref_kontrol']))
            $data['ref_kontrol'] = $data_kontrol['ref_kontrol'];
        if (!empty($data_kontrol['tujuan_kontrol']))
            $data['tujuan_kontrol'] = $data_kontrol['tujuan_kontrol'];
        if (!empty($data_kontrol['deskripsi_kontrol']))
            $data['deskripsi_kontrol'] = $data_kontrol['deskripsi_kontrol'];
        if (!empty($data_kontrol['kontrol_utama']))
            $data['kontrol_utama'] = $data_kontrol['kontrol_utama'];
        if (!empty($data_kontrol['anti_kecurangan']))
            $data['anti_kecurangan'] = $data_kontrol['anti_kecurangan'];
        if (!empty($data_kontrol['aplikasi_pendukung']))
            $data['aplikasi_pendukung'] = $data_kontrol['aplikasi_pendukung'];
        if (!empty($data_kontrol['area_kontrol']))
            $data['area_kontrol'] = $data_kontrol['area_kontrol'];
        if (!empty($data_kontrol['sub_area_kontrol']))
            $data['sub_area_kontrol'] = $data_kontrol['sub_area_kontrol'];
        */

        if (!empty($data_risiko['sifat_pengendalian'])) $data['sifat_pengendalian'] = $data_risiko['sifat_pengendalian'];
        if (!empty($data_risiko['jenis_pengendalian_otomatis'])) $data['jenis_pengendalian_otomatis'] = $data_risiko['jenis_pengendalian_otomatis'];

        if ($data_kontrol['id_jenis_kontrol']) {
            $data_jenis_kontrol = $mt_jenis_kontrol->where("id_jenis_kontrol", $data_kontrol['id_jenis_kontrol'])->get()->toArray()[0];
            $data['jenis_kontrol'] = $data_jenis_kontrol['nama'];
        }


        if (!empty($data_kontrol['updated_by'])) {
            $sys_user = new \App\Models\SysUserModel();
            $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();

            $data_sys_user = $sys_user->find($data_kontrol['updated_by']);

            if ($data_sys_user) {
                $nid = $data_sys_user->nid;
                $data['kontrol_modified_by_nid'] = $data_sys_user->nid;
                $data['kontrol_modified_by_nama'] = $data_sys_user->name;
                $data['kontrol_modified_by_jabatan'] = $mt_sdm_jabatan->where('position_id', '=', function ($query) use ($nid) {
                    $query->select('position_id')->from('mt_sdm_pegawai')->where('nid', '=', $nid);
                })->value('nama');
            }
        }

        return $data;
    }
    /*
    private function get_kontrol($data, $id_kontrol)
    {
        $mt_kontrol = new \App\Models\MtKontrol;
        $mt_jenis_kontrol = new \App\Models\MtJenisKontrol;
        $data_kontrol = $mt_kontrol->where("id_kontrol", $id_kontrol)->get()->toArray()[0];

        if (!empty($data_kontrol['ref_kontrol']))
            $data['ref_kontrol'] = $data_kontrol['ref_kontrol'];
        if (!empty($data_kontrol['tujuan_kontrol']))
            $data['tujuan_kontrol'] = $data_kontrol['tujuan_kontrol'];
        if (!empty($data_kontrol['deskripsi_kontrol']))
            $data['deskripsi_kontrol'] = $data_kontrol['deskripsi_kontrol'];
        if (!empty($data_kontrol['kontrol_utama']))
            $data['kontrol_utama'] = $data_kontrol['kontrol_utama'];
        if (!empty($data_kontrol['anti_kecurangan']))
            $data['anti_kecurangan'] = $data_kontrol['anti_kecurangan'];
        if (!empty($data_kontrol['aplikasi_pendukung']))
            $data['aplikasi_pendukung'] = $data_kontrol['aplikasi_pendukung'];
        if (!empty($data_kontrol['area_kontrol']))
            $data['area_kontrol'] = $data_kontrol['area_kontrol'];
        if (!empty($data_kontrol['sub_area_kontrol']))
            $data['sub_area_kontrol'] = $data_kontrol['sub_area_kontrol'];

        if (!empty($data_risiko['sifat_pengendalian'])) $data['sifat_pengendalian'] = $data_risiko['sifat_pengendalian'];
        if (!empty($data_risiko['jenis_pengendalian_otomatis'])) $data['jenis_pengendalian_otomatis'] = $data_risiko['jenis_pengendalian_otomatis'];

        if ($data_kontrol['id_jenis_kontrol']) {
            $data_jenis_kontrol = $mt_jenis_kontrol->where("id_jenis_kontrol", $data_kontrol['id_jenis_kontrol'])->get()->toArray()[0];
            $data['jenis_kontrol'] = $data_jenis_kontrol['nama'];
        }


        if (!empty($data_kontrol['updated_by'])) {
            $sys_user = new \App\Models\SysUserModel();
            $mt_sdm_jabatan = new \App\Models\MtSdmJabatan();

            $data_sys_user = $sys_user->find($data_kontrol['updated_by']);

            if ($data_sys_user) {
                $nid = $data_sys_user->nid;
                $data['kontrol_modified_by_nid'] = $data_sys_user->nid;
                $data['kontrol_modified_by_nama'] = $data_sys_user->name;
                $data['kontrol_modified_by_jabatan'] = $mt_sdm_jabatan->where('position_id', '=', function ($query) use ($nid) {
                    $query->select('position_id')->from('mt_sdm_pegawai')->where('nid', '=', $nid);
                })->value('nama');
            }
        }

        return $data;
    }
    */

    /**
     * only for insert / update
     */
    private function get_segment($data, $id_segmen)
    {
        $mt_segmen = new \App\Models\MtSegmen;
        // $data_segmenr = $mt_segmen->where("id_segmen", $id_segmen)->get()->toArray()[0];
        $data_segmenr = $mt_segmen->find($id_segmen)->toArray();

        if (!empty($id_segmen))
            $data['id_segmen'] = $id_segmen;
        if (!empty($data_segmenr['nama']))
            $data['nama_segmen'] = $data_segmenr['nama'];
        if (!empty($data_segmenr['kontrol_kompensasi']))
            $data['kontrol_kompensasi'] = $data_segmenr['kontrol_kompensasi'];

        return $data;
    }

    /**
     * only for insert / update
     */
    private function get_lokasi($data, $id_lokasi)
    {
        $mt_sdm_unit = new \App\Models\MtSdmUnit;
        // $data_lokasi = $mt_sdm_unit->where("id_unit", $id_lokasi)->get()->toArray()[0];
        $data_lokasi = $mt_sdm_unit->where("id_unit", $id_lokasi)->first();


        if (!empty($data_lokasi->id_unit)) $data['id_lokasi'] = $data_lokasi->id_unit;
        if (!empty($data_lokasi->nama)) $data['lokasi'] = $data_lokasi->nama;

        return $data;
    }

    /**
     * only for insert / update
     */
    private function get_deskripsi_lokasi($data, $id_deskripsi_lokasi)
    {
        $mt_sdm_dit_bid = new \App\Models\MtSdmDitBid;
        $data_deskripsi_lokasi = $mt_sdm_dit_bid->where("code", $id_deskripsi_lokasi)->first();
        if ($data_deskripsi_lokasi) {
            if (!empty($data_deskripsi_lokasi->nama)) $data['deskripsi_lokasi'] = $data_deskripsi_lokasi->nama;
        }

        return $data;
    }
    private function get_frekuensi($data, $id_frekuensi)
    {
        $mt_frekuansi = new \App\Models\MtFrekuensi;
        $data_frekuensi = $mt_frekuansi->where("id_frekuensi", $id_frekuensi)->get()->toArray()[0];
        if (!empty($data_frekuensi['nama'])) $data['frekuensi'] = $data_frekuensi['nama'];

        return $data;
    }

    /**
     * only for insert / update
     */
    private function get_control_preparer($data, $id_jabatan)
    {
        $mt_sdm_jabatan = new \App\Models\MtSdmJabatan;
        $data_jabatan = $mt_sdm_jabatan->where("id_jabatan", $id_jabatan)->first();
        if ($data_jabatan)
            if ($data_jabatan->nama)
                $data['control_preparer'] = $data_jabatan->nama;

        return $data;
    }
    /**
     * only for insert / update
     */
    private function get_control_reviewer($data, $id_jabatan)
    {
        $mt_sdm_jabatan = new \App\Models\MtSdmJabatan;
        $data_jabatan = $mt_sdm_jabatan->where("id_jabatan", $id_jabatan)->get()->toArray()[0];
        if (!empty($data_jabatan['nama'])) $data['control_reviewer'] = $data_jabatan['nama'];

        return $data;
    }
    private function get_control_approver($data, $id_jabatan)
    {
        $mt_sdm_jabatan = new \App\Models\MtSdmJabatan;
        // $data_jabatan = $mt_sdm_jabatan->where("id_jabatan", $id_jabatan)->get()->toArray()[0];
        $data_jabatan = $mt_sdm_jabatan->where("id_jabatan", $id_jabatan)->first();
        if ($data_jabatan)
            if ($data_jabatan->nama)
                $data['control_approver'] = $data_jabatan->nama;

        return $data;
    }

    public function createQr(string $isi, string $file_name, int $size_img = 200, string $path = 'app/')
    {
        $full_path = storage_path($path . "/" . $file_name);

        if (!file_exists(dirname($full_path))) {
            mkdir(dirname($full_path), 0755, true);
        }

        QrCode::size($size_img)->generate($isi, $full_path);

        return file_exists(dirname($full_path));


        // $qrCodePath = 'iniqrcasasode.png';
        // $fullPath = storage_path('app/' . $qrCodePath);
        // var_dump($fullPath);
        // if (!file_exists(dirname($fullPath))) {
        //     mkdir(dirname($fullPath), 0755, true);
        // }
        // QrCode::format('png')->size(200)->generate("-amiuwndplad", $fullPath);
    }

    public function delete_file_dir(string $file_name, string $path = 'app/')
    {
        $full_path = storage_path($path . "/" . $file_name);
        if (file_exists(dirname($full_path))) return unlink($full_path);
        else return true;
    }
}
