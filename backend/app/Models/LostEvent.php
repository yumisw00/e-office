<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class LostEvent extends BaseModel
{
    public $table = 'lost_event';

    public $primaryKey = 'id_lost_event';

    public $fillable = [
        'id_register',
        'nama_kejadian',
        'identifikasi_kejadian',
        'id_lost_event_kategori',
        'id_lost_event_sumber_penyebab_kejadian',
        'penanganan_saat_kejadian',
        'deskripsi_kejadian',
        'id_jenis_risiko',
        'id_taksonomi',
        'penjelasan_kerugian',
        'nilai_kerugian',
        'is_kejadian_berulang',
        'id_lost_event_frakuensi_kejadian',
        'mitigasi_yang_direncanakan',
        'realisasi_mitigasi',
        'perbaikan_mendatang',
        'pihak_terkait',
        'id_lost_event_status_asuransi',
        'nilai_premi',
        'nilai_klaim',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
        'penyebab_kejadian',
        'status',
        'tgl_loss_event',
        'id_unit'
    ];

    public $casts = [
        'nama_kejadian' => 'string',
        'identifikasi_kejadian' => 'string',
        'penanganan_saat_kejadian' => 'string',
        'deskripsi_kejadian' => 'string',
        'penjelasan_kerugian' => 'string',
        'nilai_kerugian' => 'decimal:2',
        'mitigasi_yang_direncanakan' => 'string',
        'realisasi_mitigasi' => 'string',
        'perbaikan_mendatang' => 'string',
        'pihak_terkait' => 'string',
        'nilai_premi' => 'decimal:2',
        'nilai_klaim' => 'decimal:2',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string',
        'penyebab_kejadian' => 'string',
        'status' => 'string',
        'tgl_loss_event' => 'date',
        'id_unit' => 'string'
    ];

    public array $rules = [
        'nama_kejadian' => 'required|string|max:1000',
        'identifikasi_kejadian' => 'required|string|max:1000',
        'id_lost_event_kategori' => 'required',
        'id_lost_event_sumber_penyebab_kejadian' => 'nullable',
        'penanganan_saat_kejadian' => 'required|string|max:1000',
        'deskripsi_kejadian' => 'required|string|max:1000',
        'id_jenis_risiko' => 'required',
        'id_taksonomi' => 'required',
        'penjelasan_kerugian' => 'required|string|max:1000',
        'nilai_kerugian' => 'required|numeric',
        'is_kejadian_berulang' => 'nullable',
        'id_lost_event_frakuensi_kejadian' => 'nullable',
        'mitigasi_yang_direncanakan' => 'required|string|max:1000',
        'realisasi_mitigasi' => 'required|string|max:1000',
        'perbaikan_mendatang' => 'required|string|max:1000',
        'pihak_terkait' => 'required|string|max:1000',
        'id_lost_event_status_asuransi' => 'nullable',
        'nilai_premi' => 'required|numeric',
        'nilai_klaim' => 'required|numeric',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_at' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'updated_by_desc' => 'nullable|string|max:200',
        'deleted_by_desc' => 'nullable|string|max:200',
        'penyebab_kejadian' => 'required|string|max:1000',
        'status' => 'nullable|string|max:20',
        'tgl_loss_event' => 'required',
        'id_unit' => 'nullable|string|max:18'
    ];

    public function idLostEventKategori(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtLostEventKategori::class, 'id_lost_event_kategori');
    }

    public function idLostEventSumberPenyebabKejadian(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtLostEventSumberPenyebabKejadian::class, 'id_lost_event_sumber_penyebab_kejadian');
    }

    public function idJenisRisiko(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtRiskJenisRisiko::class, 'id_jenis_risiko');
    }

    public function idTaksonomi(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtRiskTaksonomi::class, 'id_taksonomi');
    }

    public function idLostEventFrakuensiKejadian(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtLostEventFrakuensiKejadian::class, 'id_lost_event_frakuensi_kejadian');
    }

    public function idLostEventStatusAsuransi(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtLostEventStatusAsuransi::class, 'id_lost_event_status_asuransi');
    }

    public function idUnit(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtSdmUnit::class, 'id_unit');
    }


    public function search($search)
    {
        $ret = $this;
        if (!empty($search)) {
            foreach ($search as $k => $v) {
                $hasLikeExpression = $this->getLikeExpression($v);
                if (!is_null($hasLikeExpression)) {
                    if ($k == 'nilai_kerugian') {
                        $ret = $ret->whereRaw("nilai_kerugian::varchar(255) like ?", [strtolower($v)]);
                    } else {
                        $ret = $ret->whereRaw("lower(" . $this->escape($k) . ") like ?", [strtolower($v)]);
                    }
                } else {
                    $ret = $ret->where($k, $v);
                }
            }
        }

        return $ret;
    }

    private function getLikeExpression(String $value)
    {
        $position = 0;
        $firstCharacter = substr($value, 0, 1) == '%' ? 1 : 0;
        $endCharacter = substr($value, -1, 1) == '%' ? 2 : 0;
        $position = $position + $firstCharacter + $endCharacter;
        switch ($position) {
            case 1:
                return 'before';
                break;
            case 2:
                return 'after';
                break;
            case 3:
                return 'both';
                break;
            default:
                return null;
        }
    }

    // query get laporan loss event
    public static function laporan($params = [])
    {
        $paramarr = [];
        $where = "";
        if (isset($params['id_assessment_type']) && $params["id_assessment_type"] != 'null') {
            $where .= " and rr.id_assessment_type = ?";
            $paramarr[] = $params['id_assessment_type'];
        }
        if (isset($params['id_kelompok_bisnis']) && $params["id_kelompok_bisnis"] != 'null') {
            $where .= " and rr.id_kelompok_bisnis = ?";
            $paramarr[] = $params['id_kelompok_bisnis'];
        }
        if (isset($params['id_unit']) && $params["id_unit"] != 'null') {
            $where .= " and rr.id_unit = ?";
            $paramarr[] = $params['id_unit'];
        }
        if ($params["id_register"] && $params["id_register"] != 'null') {
            $where .= " and rs.id_register = ?";
            $paramarr[] = $params['id_register'];
        }
        if (isset($params["tahun"])) {
            if (isset($params["bulan"])) {
                $where .= " and to_char(tgl_loss_event,'YYYYMM') = ?";
                $paramarr[] = $params['tahun'] . str_pad($params['bulan'], 2, '0', STR_PAD_LEFT);
            } else {
                $where .= " and to_char(tgl_loss_event,'YYYY') = ?";
                $paramarr[] = $params['tahun'];
            }
        }

        if (empty(session('access')["dashboard"]["view_all"])) {
            $where .= " and rr.id_unit = ?";
            $paramarr[] = session('id_unit');
            $where .= " and rr.id_kelompok_bisnis = ?";
            $paramarr[] = session('id_kelompok_bisnis');
        }

        // DB::enableQueryLog();
        // namalost_event_sumber_penyebab_kejadian
        $sql = "select rs.*, 
        mlek.nama as namalost_event_kategori,
        mlespk.nama as namalost_event_sumber_penyebab_kejadian,
        mrjr.nama as namajenis_risiko,
        mrt.nama as nama_taksonomi,
        case when rs.is_kejadian_berulang is not null then 'Ya' else 'Tidak' end as namakejadian_berulang, 
        mlefk.nama as namalost_event_frakuensi_kejadian,
        mlesa.nama as namalost_event_status_asuransi
        from lost_event rs 
        left join risk_register rr on rs.id_register = rr.id_register
        left join mt_lost_event_kategori mlek on rs.id_lost_event_kategori = mlek.id_lost_event_kategori
        left join mt_lost_event_sumber_penyebab_kejadian mlespk on rs.id_lost_event_sumber_penyebab_kejadian = mlespk.id_lost_event_sumber_penyebab_kejadian
        left join mt_risk_jenis_risiko mrjr on rs.id_jenis_risiko = mrjr.id_jenis_risiko
        left join mt_risk_taksonomi mrt on rs.id_taksonomi = mrt.id_taksonomi
        left join mt_lost_event_frakuensi_kejadian mlefk on rs.id_lost_event_frakuensi_kejadian = mlefk.id_lost_event_frakuensi_kejadian
        left join mt_lost_event_status_asuransi mlesa on rs.id_lost_event_status_asuransi = mlesa.id_lost_event_status_asuransi
        where rs.deleted_at is null 
        $where order by rs.created_at";

        // echo $this->getSqlWithBindings($sql, $paramarr);
        $rows = DB::select($sql, $paramarr);
        // echo '<pre>';
        // var_dump($rows);

        return $rows;
    }
}
