<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class InternalControlTesting extends BaseModel
{
    public $table = 'internal_control_testing';

    protected $primaryKey = 'id_internal_control_testing';

    public $fillable = [
        'sasaran_bumn',
        'business_process',
        'key_control',
        'metode_pengujian',
        'kelemahan_kontrol',
        'rencana_tindak_lanjut',
        'due_date',
        'id_pic',
        'status_tindak_lanjut',
        'id_register',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc'
    ];

    public $casts = [
        'sasaran_bumn' => 'string',
        'business_process' => 'string',
        'key_control' => 'string',
        'metode_pengujian' => 'string',
        'kelemahan_kontrol' => 'string',
        'rencana_tindak_lanjut' => 'string',
        'due_date' => 'date',
        'status_tindak_lanjut' => 'string',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'sasaran_bumn' => 'required|string|max:2000',
        'business_process' => 'required|string|max:2000',
        'key_control' => 'required|string|max:2000',
        'metode_pengujian' => 'required|string|max:2000',
        'kelemahan_kontrol' => 'required|string|max:2000',
        'rencana_tindak_lanjut' => 'required|string|max:2000',
        'due_date' => 'required',
        'id_pic' => 'required',
        'status_tindak_lanjut' => 'required|string|max:2000',
        'id_register' => 'nullable',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_at' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'updated_by_desc' => 'nullable|string|max:200',
        'deleted_by_desc' => 'nullable|string|max:200'
    ];

    public function search($search)
    {
        $ret = $this;
        if (!empty($search)) {
            foreach ($search as $k => $v) {
                $hasLikeExpression = $this->getLikeExpression($v);
                if (!is_null($hasLikeExpression)) {
                    if ($k == 'due_date') {
                        $ret = $ret->whereRaw("to_char(due_date, 'YYYY-MM-DD') like ?", [strtolower($v)]);
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

    // Get data internal control testing
    public static function laporan($params = [])
    {
        $paramarr = [];
        $where = '';

        if (isset($params['id_kelompok_bisnis']) && $params['id_kelompok_bisnis'] != 'null') {
            $where .= ' and rr.id_kelompok_bisnis = ? ';
            $paramarr[] = $params['id_kelompok_bisnis'];
        }
        if (isset($params['id_assessment_type']) && $params['id_assessment_type'] != 'null') {
            $where .= ' and rr.id_assessment_type = ? ';
            $paramarr[] = $params['id_assessment_type'];
        }

        if (isset($params['id_unit']) && $params['id_unit'] != 'null') {
            $where .= ' and rr.id_unit = ? ';
            $paramarr[] = $params['id_unit'];
        }
        if (isset($params['id_register']) && $params['id_register'] != 'null') {
            $where .= ' and ict.id_register = ? ';
            $paramarr[] = $params['id_register'];
        }

        $sql = '
        SELECT ICT.*, msj.nama as nama_pic
        FROM INTERNAL_CONTROL_TESTING ICT
        left join mt_sdm_jabatan msj on ict.id_pic = msj.id_jabatan
        LEFT JOIN RISK_REGISTER RR ON ICT.ID_REGISTER = RR.ID_REGISTER 
        where ict.deleted_at is null 
        ' . $where;

        // $response = DB::select($sql,$paramarr);
        $response = DB::select($sql, $paramarr);
        return $response;
    }
    public function idPic(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtSdmJabatan::class, 'id_pic');
    }

    public function idRegister(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\RiskRegister::class, 'id_register');
    }
}
