<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Class SysLogAPIController
 */
class SysLogAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysLog;
        $this->middleware('EnsureHasGroup:sys_log', ['only' => ['create', 'store', 'edit', 'delete']]);
    }

    public function store(Request $request): JsonResponse
    {
        // dd($request);
        $request->validate($this->model->rules);

        $data = $request->all();
        $data['ip'] = $_SERVER["REMOTE_ADDR"];
        $data['activity_time'] = date("Y-m-d H:i:s");
        $user_desc = (auth()->user() ? auth()->user()->name : null);
        $data['user_desc'] = $user_desc;

        $id = $this->model->insert($data);
        // if (!$id) {
        //     return $this->fail($this->model->errors());
        // }
        $data[$this->model->primaryKey] = $id;

        return $this->respondCreated($data, 'data created');
    }

    protected function _search(array $search = null)
    {
        if (!$search)
            return $search;

        if (!empty($search['nama']))
            $search['nama'] = "%" . $search['nama'] . "%";
        if (!empty($search['kode']))
            $search['kode'] = "%" . $search['kode'] . "%";
        if (!empty($search['activity'])) {
            $search['activity'] = strtolower($search['activity']);
        }

        return $search;
    }

    public function index(Request $request): JsonResponse
    {
        $search = $request->get('q');
        $tanggal = null;
        $waktu = null;
        if (!empty($search['tanggal'])) {
            $tanggal = $search['tanggal'];
            unset($search['tanggal']);
        }
        if (!empty($search['waktu'])) {
            $waktu = $search['waktu'];
            unset($search['waktu']);
        }
        // if ($search) {
        //     if (!empty($search['nama']))
        //         $search['nama'] = "%" . $search['nama'] . "%";
        //     if (!empty($search['kode']))
        //         $search['kode'] = "%" . $search['kode'] . "%";
        //     if (!empty($search['activity'])) {
        //         $search['activity'] = strtolower($search['activity']);
        //     }
        // }
        $search = $this->_search($search);
        // $filter = $request->get('q');
        $page = $request->get('page') ?? 1;
        $limit = $request->get('pagesize') ?? $this->limit;
        $db = $this->model->search($search);

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

        if ($tanggal) {
            $db = $db->whereRaw("to_char(activity_time,'DD-MM-YYYY') like ? ", "%" . $tanggal . "%");
        }

        if ($waktu) {
            $db = $db->whereRaw("to_char(activity_time,'HH:MI:SS') like ? ", "%" . $waktu . "%");
        }
        // 	$db = $db->where($filter);
        $db = $db->selectRaw("*, to_char(activity_time,'DD-MM-YYYY') as tanggal, to_char(activity_time,'HH:MI:SS') as waktu");
        $data = $db->paginate($limit);

        // foreach ($data->items() as $i) {
        //     $i->data = json_decode($i['data']);
        // }
        return $this->respond([
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'data' => $data->items(),
            'total_page' => ceil($data->total() / $limit),
            'total_records' => $data->total()
        ]);
    }
}
