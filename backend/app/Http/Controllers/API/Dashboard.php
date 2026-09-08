<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use stdClass;

use App\Models\RcmCsa;
use App\Models\RcmToo;
use App\Models\RcmRemediasi;
use App\Models\RcmTod;
use App\Models\RcmToe;
use App\Models\RcmDod;

/**
 * Class Dashboard
 */
class Dashboard extends BaseResourceController
{
    private $datas;
    private $filters = [];

    public function __construct()
    {
        $this->datas = new stdClass;
    }

    /**
     * ===============================
     *              progres
     * ===============================
     */

    private function filter(array $filter)
    {
        $sys_user_group = new \App\Models\SysUserGroup();
        $jabatantree = new JabatanTree();

        $filter['view_all'] = $view_all = $this->view_all();

        if (!$view_all)
            $filter['id_lokasi'] = session('id_unit');

        $id_jabatan = session('id_jabatan');
        $id_user = session('user')['id_user'];
        $id_group = session('id_group');

        $id_jabatan_list = [$id_jabatan];
        if ($id_group == 18) {
            $id_jabatan_list = $sys_user_group->where('id_user', '=', $id_user)->select('id_jabatan');
        } else {
            $jabatantree->get_child([$id_jabatan]);
            $id_jabatan_list = $jabatantree->id_jabatan_list;
        }

        $filter['id_user'] = $id_user;
        $filter['id_jabatan'] = $id_jabatan;
        $filter['id_jabatan_list'] = $id_jabatan_list;

        foreach ($filter as $k => $v) {
            if (!str_contains($k, '.'))
                continue;
            $keyarr = explode(".", $k);
            // array_key_last($keyarr);
            if (in_array($keyarr[array_key_last($keyarr)], ['page', 'limit']))
                continue;

            $n = count($keyarr);
            if ($n == 2)
                $filter[$keyarr[0]][$keyarr[1]] = $v;
            if ($n == 3)
                $filter[$keyarr[0]][$keyarr[1]][$keyarr[2]] = $v;
            if ($n == 4)
                $filter[$keyarr[0]][$keyarr[1]][$keyarr[2]][$keyarr[3]] = $v;
        }

        // dd($filter);
        $this->filters = $filter;
    }

    public function get(Request $request)
    {
        $this->filter($request->get('q'));
        // dd($this->filters);
        $this->line_1();
        $this->line_2();
        $this->line_3();

        return $this->respond($this->datas);
    }

    private function filter_line_1(RcmCsa &$rcm_csa)
    {
        if (!empty($this->filters['id_periode']))
            $rcm_csa = $rcm_csa->where('rcm_csa.id_periode', '=', $this->filters['id_periode']);
        if (!empty($this->filters['id_ruang_lingkup']))
            $rcm_csa = $rcm_csa->where('rcm_csa.id_ruang_lingkup', '=', $this->filters['id_ruang_lingkup']);
        if (!empty($this->filters['id_lokasi']))
            $rcm_csa = $rcm_csa->where('rcm_csa.id_lokasi', '=', $this->filters['id_lokasi']);
        if (!empty($this->filters['id_deskripsi_lokasi']))
            $rcm_csa = $rcm_csa->where('rcm_csa.id_deskripsi_lokasi', '=', $this->filters['id_deskripsi_lokasi']);
        if (!$this->filters['view_all']) {
            $rcm_csa = $rcm_csa->whereIn('rcm_csa.id_control_preparer', $this->filters['id_jabatan_list']);
        }

        // return $rcm_csa;
    }

    private function line_1()
    {
        $rcm_csa = new RcmCsa();

        // $rcm_csa = $this->filter_line_1($rcm_csa);
        $this->filter_line_1($rcm_csa);

        // $this->start_log();

        # group by status
        $status = (clone $rcm_csa)
            ->select(
                'id_status',
                DB::raw('count(*) as jumlah')
            )
            ->groupBy('id_status');

        # group by efektivitas
        $efektivitas = (clone $rcm_csa)
            ->select(
                'efektivitas_csa',
                DB::raw('count(id_rcm) as jumlah')
            )
            ->groupBy('efektivitas_csa');

        # count segmen
        $segmen = (clone $rcm_csa)
            ->select('id_segmen')
            ->distinct()
            ->whereNotNull('id_segmen');

        # count sub proses
        $proses = (clone $rcm_csa)
            ->select('id_proses')
            ->distinct()
            ->whereNotNull('id_proses');

        # count rcm
        $kontrol = (clone $rcm_csa)
            ->select('id_rcm')
            ->distinct()
            ->whereNotNull('id_rcm');

        # count unit / lokasi
        $lokasi = (clone $rcm_csa)
            ->select('id_lokasi')
            ->distinct()
            ->whereNotNull('id_lokasi');

        $csa_efektivitas = DB::table((clone $rcm_csa)
            ->select(
                'rcm_csa.*',
                'rcm_csa_too.hasil_kesimpulan as efektivitas_too',
                'rcm_csa_tod.hasil_kesimpulan as efektivitas_tod',
                'rcm_toe.hasil_uji_keseluruhan as efektivitas_toe',
            )
            ->leftJoin('rcm_csa_too', 'rcm_csa_too.id_rcm_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_too', 'rcm_too.id_rcm_too', '=', 'rcm_csa_too.id_rcm_too')
            ->leftJoin('rcm_csa_tod', 'rcm_csa_tod.id_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_tod', 'rcm_tod.id_tod', '=', 'rcm_csa_tod.id_tod')
            ->leftJoin('rcm_csa_toe', 'rcm_csa_toe.id_rcm_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_toe', 'rcm_toe.id_toe', '=', 'rcm_csa_toe.id_toe')
            ->whereNull('rcm_csa_too.deleted_at')
            ->whereNull('rcm_too.deleted_at')
            ->whereNull('rcm_csa_tod.deleted_at')
            ->whereNull('rcm_tod.deleted_at')
            ->whereNull('rcm_csa_toe.deleted_at')
            ->whereNull('rcm_toe.deleted_at'), 'rcm_csa');



        if (!empty($this->filters['line_1'])) {
            if (!empty($this->filters['line_1']['csa'])) {
                if (!empty($this->filters['line_1']['csa']['status']))
                    $status = $status->where($this->filters['line_1']['csa']['status']);
                if (!empty($this->filters['line_1']['csa']['efektivitas']))
                    $efektivitas = $efektivitas->where($this->filters['line_1']['csa']['status']);
            }
            if (!empty($this->filters['line_1']['segmen']))
                $segmen = $segmen->where($this->filters['line_1']['segmen']);
            if (!empty($this->filters['line_1']['proses']))
                $proses = $proses->where($this->filters['line_1']['proses']);
            if (!empty($this->filters['line_1']['kontrol']))
                $kontrol = $kontrol->where($this->filters['line_1']['kontrol']);
            if (!empty($this->filters['line_1']['lokasi']))
                $lokasi = $lokasi->where($this->filters['line_1']['lokasi']);
            if (!empty($this->filters['line_1']['csa_efektivitas']))
                $csa_efektivitas = $csa_efektivitas->where($this->filters['line_1']['csa_efektivitas']);
        }


        // /*
        $this->datas->line_1['csa'] = [
            'status' => $status->get(),
            'efektivitas' => $efektivitas->get()
        ];
        $this->datas->line_1['segmen'] = $segmen->get()->count();
        $this->datas->line_1['proses'] = $proses->get()->count();
        $this->datas->line_1['kontrol'] = $kontrol->get()->count();
        $this->datas->line_1['lokasi'] = $lokasi->get()->count();
        // $this->start_log();

        $limit = $this->filters['line_1.csa_efektivitas.limit'] ?? 10;
        $page = $this->filters['line_1.csa_efektivitas.page'] ?? 1;
        $csa_efektivitas = $csa_efektivitas
            ->paginate($limit, ['*'], 'page', $page);

        $this->datas->line_1['csa_efektivitas']['page'] = $csa_efektivitas->currentPage();
        $this->datas->line_1['csa_efektivitas']['page_size'] = $csa_efektivitas->perPage();
        $this->datas->line_1['csa_efektivitas']['data'] = $csa_efektivitas->items();
        $this->datas->line_1['csa_efektivitas']['total_page'] = ceil($csa_efektivitas->total() / $limit);
        $this->datas->line_1['csa_efektivitas']['total_records'] = $csa_efektivitas->total();
        // */
        // $this->end_log(1);
    }

    private function filter_line_2(RcmToo &$rcm_too, RcmRemediasi &$rcm_remediasi = null)
    {
        if (!empty($this->filters['id_periode'])) {
            $rcm_too = $rcm_too->where('rcm_too.id_periode', '=', $this->filters['id_periode']);
            if ($rcm_remediasi)
                $rcm_remediasi = $rcm_remediasi->where('rcm_remediasi.id_periode', '=', $this->filters['id_periode']);
        }
        if (!empty($this->filters['id_ruang_lingkup'])) {
            $rcm_too = $rcm_too->where('rcm_too.id_ruang_lingkup', '=', $this->filters['id_ruang_lingkup']);
            if ($rcm_remediasi)
                $rcm_remediasi = $rcm_remediasi->where('rcm_remediasi.id_ruang_lingkup', '=', $this->filters['id_ruang_lingkup']);
        }
        // return $rcm_too;
    }

    private function line_2()
    {
        $rcm_too = new RcmToo();
        $rcm_csa = new RcmCsa();
        $rcm_csa_too = new \App\Models\RcmCsaToo();
        $rcm_remediasi = new \App\Models\RcmRemediasi();
        $rcm_remediasi_inisiator = new \App\Models\RcmRemediasiInisiator();

        $this->filter_line_1($rcm_csa);
        $this->filter_line_2($rcm_too, $rcm_remediasi);

        $rcm_csa_too = $rcm_csa_too
            ->joinSub($rcm_csa, 'rcm_csa', function ($join) {
                $join->on('rcm_csa.id_rcm_csa', '=', 'rcm_csa_too.id_rcm_csa');
            })
            // ->whereIn('id_rcm_csa', (clone $rcm_csa)->select('id_rcm_csa'))
            ->whereIn('id_rcm_too', (clone $rcm_too)->select('id_rcm_too'));


        $rcm_remediasi_inisiator = $rcm_remediasi_inisiator
            // ->joinSub($rcm_csa, 'rcm_csa', function ($join) {
            //     $join->on('rcm_csa.id_rcm_csa', '=', 'rcm_remediasi_inisiator.id_rcm_csa');
            // })
            // ->whereIn('id_rcm_csa', (clone $rcm_csa)->select('id_rcm_csa'))
            ->whereIn('rcm_remediasi_inisiator.id_remediasi', (clone $rcm_remediasi)->select('id_remediasi'));

        $rcm_too = $rcm_too->whereIn('id_rcm_too', (clone $rcm_csa_too)->select('id_rcm_too'));
        $rcm_remediasi = $rcm_remediasi->whereIn('id_remediasi', (clone $rcm_remediasi_inisiator)->select('rcm_remediasi_inisiator.id_remediasi'));

        # group by status
        $status = (clone $rcm_too)
            ->select('id_status', DB::raw('count(*) as jumlah'))
            ->whereIn('id_status', $this->status_proses['too'])
            ->groupBy('id_status');

        # group by efektivitas
        $efektivitas = (clone $rcm_csa_too)
            ->select('hasil_kesimpulan', DB::raw('count(*) as jumlah'))
            ->groupBy('hasil_kesimpulan');

        # count segmen
        $segmen = (clone $rcm_csa_too)
            ->select('id_segmen')
            ->distinct()
            ->whereNotNull('id_segmen');

        # count sub proses
        $proses = (clone $rcm_csa_too)
            ->select('id_proses')
            ->distinct()
            ->whereNotNull('id_proses');

        # count rcm
        $kontrol = (clone $rcm_csa_too)
            ->select('rcm_csa_too.id_rcm')
            ->distinct()
            ->whereNotNull('rcm_csa_too.id_rcm');

        # count unit / lokasi
        $lokasi = (clone $rcm_csa_too)
            ->select('id_lokasi')
            ->distinct()
            ->whereNotNull('id_lokasi');

        // $line_2['too']['status'] = $status;
        // $line_2['too']['efektivitas'] = $efektivitas;
        $remediasi_status = (clone $rcm_remediasi)
            ->select(
                'status_pengajuan',
                DB::raw('count(*) as jumlah')
            )
            ->groupBy('status_pengajuan');

        $too_efektivitas = DB::table((clone $rcm_csa_too)
            ->select(
                'rcm_csa.*',
                'rcm_csa_too.hasil_kesimpulan as efektivitas_too',
                'rcm_csa_tod.hasil_kesimpulan as efektivitas_tod',
                'rcm_toe.hasil_uji_keseluruhan as efektivitas_toe',
            )
            ->leftJoin('rcm_csa_tod', 'rcm_csa_tod.id_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_tod', 'rcm_tod.id_tod', '=', 'rcm_csa_tod.id_tod')
            ->leftJoin('rcm_csa_toe', 'rcm_csa_toe.id_rcm_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_toe', 'rcm_toe.id_toe', '=', 'rcm_csa_toe.id_toe')
            ->whereNull('rcm_csa_tod.deleted_at')
            ->whereNull('rcm_tod.deleted_at')
            ->whereNull('rcm_csa_toe.deleted_at')
            ->whereNull('rcm_toe.deleted_at'), 'rcm_csa_too');
        // dd($this->filters);


        if (!empty($this->filters['line_2'])) {
            if (!empty($this->filters['line_2']['too'])) {
                if (!empty($this->filters['line_2']['too']['status']))
                    $status = $status->where($this->filters['line_2']['too']['status']);
                if (!empty($this->filters['line_2']['too']['efektivitas']))
                    $efektivitas = $efektivitas->where($this->filters['line_2']['too']['status']);
            }
            if (!empty($this->filters['line_2']['segmen']))
                $segmen = $segmen->where($this->filters['line_2']['segmen']);
            if (!empty($this->filters['line_2']['proses']))
                $proses = $proses->where($this->filters['line_2']['proses']);
            if (!empty($this->filters['line_2']['kontrol']))
                $kontrol = $kontrol->where($this->filters['line_2']['kontrol']);
            if (!empty($this->filters['line_2']['lokasi']))
                $lokasi = $lokasi->where($this->filters['line_2']['lokasi']);
            if (!empty($this->filters['line_2']['too_efektivitas']))
                $too_efektivitas = $too_efektivitas->where($this->filters['line_2']['too_efektivitas']);
        }

        $this->datas->line_2['remediasi']['status'] = $remediasi_status->get();
        $this->datas->line_2['too']['status'] = $status->get();
        $this->datas->line_2['too']['efektivitas'] = $efektivitas->get();
        $this->datas->line_2['segmen'] = $segmen->get()->count();
        $this->datas->line_2['proses'] = $proses->get()->count();
        $this->datas->line_2['kontrol'] = $kontrol->get()->count();
        $this->datas->line_2['lokasi'] = $lokasi->get()->count();
        // $this->start_log();
        // $this->datas->line_2['too_efektivitas'] = $too_efektivitas->get()->toArray();

        $limit = $this->filters['line_2.too_efektivitas.limit'] ?? 10;
        $page = $this->filters['line_2.too_efektivitas.page'] ?? 1;
        $too_efektivitas = $too_efektivitas
            ->paginate($limit, ['*'], 'page', $page);

        $this->datas->line_2['too_efektivitas']['page'] = $too_efektivitas->currentPage();
        $this->datas->line_2['too_efektivitas']['page_size'] = $too_efektivitas->perPage();
        $this->datas->line_2['too_efektivitas']['data'] = $too_efektivitas->items();
        $this->datas->line_2['too_efektivitas']['total_page'] = ceil($too_efektivitas->total() / $limit);
        $this->datas->line_2['too_efektivitas']['total_records'] = $too_efektivitas->total();
        // $this->end_log();
        // dd($this->datas->line_2);
    }

    private function filter_line_3(RcmTod &$rcm_tod, RcmToe &$rcm_toe, RcmDod &$rcm_dod)
    {
        if (!empty($this->filters['tahun'])) {
            $periode = new \App\Models\Periode();
            $id_periode = $periode->where('tahun', '=', $this->filters['tahun'])->select('id_periode');
            $rcm_tod = $rcm_tod->whereIn('rcm_tod.id_periode', $id_periode);
            $rcm_toe = $rcm_toe->whereIn('rcm_toe.id_periode', $id_periode);
            $rcm_dod = $rcm_dod->whereIn('rcm_dod.id_periode', $id_periode);
        }
        if (!empty($this->filters['id_periode'])) {
            $rcm_tod = $rcm_tod->where('rcm_tod.id_periode', '=', $this->filters['id_periode']);
            $rcm_toe = $rcm_toe->where('rcm_toe.id_periode', '=', $this->filters['id_periode']);
            $rcm_dod = $rcm_dod->where('rcm_dod.id_periode', '=', $this->filters['id_periode']);
        }
        if (!empty($this->filters['id_ruang_lingkup'])) {
            $rcm_tod = $rcm_tod->where('rcm_tod.id_ruang_lingkup', '=', $this->filters['id_ruang_lingkup']);
            $rcm_toe = $rcm_toe->where('rcm_toe.id_ruang_lingkup', '=', $this->filters['id_ruang_lingkup']);
            $rcm_dod = $rcm_dod->where('rcm_dod.id_ruang_lingkup', '=', $this->filters['id_ruang_lingkup']);
        }
    }


    private function line_3()
    {
        $rcm_tod = new RcmTod();
        $rcm_csa_tod = new \App\Models\RcmCsaTod();
        $rcm_toe = new RcmToe();
        $rcm_csa_toe = new \App\Models\RcmCsaToe();
        $rcm_dod = new RcmDod();


        $rcm_too = new RcmToo();
        $rcm_csa = new RcmCsa();
        $rcm_csa_too = new \App\Models\RcmCsaToo();

        $this->filter_line_1($rcm_csa);
        $this->filter_line_2($rcm_too);

        $this->filter_line_3($rcm_tod, $rcm_toe, $rcm_dod);

        $rcm_tod = $rcm_tod->whereIn('id_tod', (clone $rcm_csa_tod)->select('id_tod'));
        $rcm_toe = $rcm_toe->whereIn('id_toe', (clone $rcm_csa_toe)->select('id_toe'));

        $rcm_csa_tod = $rcm_csa_tod
            ->join('rcm_csa', 'rcm_csa.id_rcm_csa', '=', 'rcm_csa_tod.id_csa')
            ->whereIn('id_tod', (clone $rcm_tod)->select('id_tod'))
            ->where('is_pilih', '=', 1);

        $rcm_csa_toe = DB::table('rcm_csa_toe')
            ->join('rcm_csa', 'rcm_csa.id_rcm_csa', '=', 'rcm_csa_toe.id_rcm_csa')
            ->whereIn('id_csa_toe', $rcm_csa_toe->whereIn('id_toe', (clone $rcm_toe)->select('id_toe'))->select(DB::raw('max(id_csa_toe)'))->groupBy('id_rcm'));

        // dd($rcm_csa_toe->get()->toArray());

        # group by status
        $status_dod = (clone $rcm_dod)
            ->select('status_dod', DB::raw('count(*) as jumlah'))
            ->groupBy('status_dod');
        $status_tod = (clone $rcm_tod)
            ->select('id_status', DB::raw('count(*) as jumlah'))
            ->whereIn('id_status', $this->status_proses['tod'])
            ->groupBy('id_status');
        $status_toe = (clone $rcm_toe)
            ->select('id_status', DB::raw('count(*) as jumlah'))
            ->whereIn('id_status', $this->status_proses['toe'])
            ->groupBy('id_status');


        # group by efektivitas
        $efektivitas_tod = (clone $rcm_csa_tod)
            ->select('hasil_kesimpulan', DB::raw('count(*) as jumlah'))
            ->groupBy('hasil_kesimpulan');
        $efektivitas_toe = (clone $rcm_toe)
            ->select('hasil_uji_keseluruhan', DB::raw('count(*) as jumlah'))
            ->groupBy('hasil_uji_keseluruhan');


        # count segmen
        $segmen_tod = (clone $rcm_csa_tod)
            ->select('id_segmen')
            ->distinct()
            ->whereNotNull('id_segmen');
        $segmen_toe = (clone $rcm_csa_toe)
            ->select('id_segmen')
            ->distinct()
            ->whereNotNull('id_segmen');


        # count sub proses
        $proses_tod = (clone $rcm_csa_tod)
            ->select('id_proses')
            ->distinct()
            ->whereNotNull('id_proses');
        $proses_toe = (clone $rcm_csa_toe)
            ->select('id_proses')
            ->distinct()
            ->whereNotNull('id_proses');


        # count rcm
        $rcmtod = (clone $rcm_csa_tod)
            ->select('rcm_csa.id_rcm')
            ->distinct()
            ->whereNotNull('rcm_csa.id_rcm');
        $rcmtoe = (clone $rcm_csa_toe)
            ->select('rcm_csa.id_rcm')
            ->distinct()
            ->whereNotNull('rcm_csa.id_rcm');


        # count unit / lokasi
        $lokasi_tod = (clone $rcm_csa_tod)
            ->select('rcm_csa.id_lokasi')
            ->distinct()
            ->whereNotNull('rcm_csa.id_lokasi');
        $lokasi_toe = (clone $rcm_csa_toe)
            ->select('rcm_csa.id_lokasi')
            ->distinct()
            ->whereNotNull('rcm_csa.id_lokasi');


        // dd($this->filters);
        // dd($lokasi_toe->get()->toArray());

        $rcm_csa_too = $rcm_csa_too
            ->joinSub($rcm_csa, 'rcm_csa', function ($join) {
                $join->on('rcm_csa.id_rcm_csa', '=', 'rcm_csa_too.id_rcm_csa');
            })
            // ->whereIn('id_rcm_csa', (clone $rcm_csa)->select('id_rcm_csa'))
            ->whereIn('id_rcm_too', (clone $rcm_too)->select('id_rcm_too'));
        $tod_efektivitas = DB::table((clone $rcm_csa_too)
            ->select(
                'rcm_csa.*',
                'rcm_csa_too.hasil_kesimpulan as efektivitas_too',
                'rcm_csa_tod.hasil_kesimpulan as efektivitas_tod',
                'rcm_toe.hasil_uji_keseluruhan as efektivitas_toe',
            )
            ->leftJoin('rcm_csa_tod', 'rcm_csa_tod.id_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_tod', 'rcm_tod.id_tod', '=', 'rcm_csa_tod.id_tod')
            ->leftJoin('rcm_csa_toe', 'rcm_csa_toe.id_rcm_csa', '=', 'rcm_csa.id_rcm_csa')
            ->leftJoin('rcm_toe', 'rcm_toe.id_toe', '=', 'rcm_csa_toe.id_toe')
            ->whereNull('rcm_csa_tod.deleted_at')
            ->whereNull('rcm_tod.deleted_at')
            ->whereNull('rcm_csa_toe.deleted_at')
            ->whereNull('rcm_toe.deleted_at'), 'rcm_csa_too');

        if (!empty($this->filters['line_3'])) {
            /*
            if (!empty($this->filters['line_3']['tod']['status']))
                $status = $status->where($this->filters['line_3']['tod']['status']);
            if (!empty($this->filters['line_3']['toe']['status']))
                $status = $status->where($this->filters['line_3']['toe']['status']);

            if (!empty($this->filters['line_3']['tod']['efektivitas']))
                $efektivitas = $efektivitas->where($this->filters['line_3']['tod']['status']);

            if (!empty($this->filters['line_3']['segmen']))
                $segmen = $segmen->where($this->filters['line_3']['segmen']);

            if (!empty($this->filters['line_3']['proses']))
                $proses = $proses->where($this->filters['line_3']['proses']);

            if (!empty($this->filters['line_']['kontrol']))
                $kontrol = $kontrol->where($this->filters['line_3']['kontrol']);

            if (!empty($this->filters['line_3']['lokasi']))
                $lokasi = $lokasi->where($this->filters['line_3']['lokasi']);
            */

            if (!empty($this->filters['line_3']['tod_efektivitas']))
                $tod_efektivitas = $tod_efektivitas->where($this->filters['line_3']['tod_efektivitas']);
        }

        // $this->start_log();
        $this->datas->line_3['dod']['status'] = $status_dod->get();
        // $this->end_log();
        $this->datas->line_3['tod']['status'] = $status_tod->get();
        $this->datas->line_3['toe']['status'] = $status_toe->get();
        $this->datas->line_3['tod']['efektivitas'] = $efektivitas_tod->get();
        $this->datas->line_3['toe']['efektivitas'] = $efektivitas_toe->get();

        $this->datas->line_3['tod']['segmen'] = $segmen_tod->get()->count();
        $this->datas->line_3['toe']['segmen'] = $segmen_toe->get()->count();

        $this->datas->line_3['tod']['proses'] = $proses_tod->get()->count();
        $this->datas->line_3['toe']['proses'] = $proses_toe->get()->count();

        $this->datas->line_3['tod']['rcm'] = $rcmtod->get()->count();
        $this->datas->line_3['toe']['rcm'] = $rcmtoe->get()->count();

        $this->datas->line_3['tod']['lokasi'] = $lokasi_tod->get()->count();
        $this->datas->line_3['toe']['lokasi'] = $lokasi_toe->get()->count();



        $limit = $this->filters['line_3.tod_efektivitas.limit'] ?? 10;
        $page = $this->filters['line_3.tod_efektivitas.page'] ?? 1;
        $tod_efektivitas = $tod_efektivitas
            ->paginate($limit, ['*'], 'page', $page);

        $this->datas->line_3['tod_efektivitas']['page'] = $tod_efektivitas->currentPage();
        $this->datas->line_3['tod_efektivitas']['page_size'] = $tod_efektivitas->perPage();
        $this->datas->line_3['tod_efektivitas']['data'] = $tod_efektivitas->items();
        $this->datas->line_3['tod_efektivitas']['total_page'] = ceil($tod_efektivitas->total() / $limit);
        $this->datas->line_3['tod_efektivitas']['total_records'] = $tod_efektivitas->total();
    }
}
