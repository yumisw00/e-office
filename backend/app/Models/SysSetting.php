<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SysSetting extends BaseModel
{
    public $table = 'sys_setting';

    protected $primaryKey = 'id_setting';

    public $fillable = [
        'nama',
        'isi',
        'deleted_by',
        'deleted_by_desc'
    ];

    public $casts = [
        'nama' => 'string',
        'isi' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'nama' => 'nullable|string|max:100',
        'isi' => 'nullable|string|max:500',
        'deleted_by' => 'nullable',
        'deleted_by_desc' => 'nullable|string|max:200'
    ];

    public function datas()
    {
        $sys_setting = $this->get();

        $data = [];
        foreach ($sys_setting as $cl) {
            $data[$cl->nama] = $cl->isi;
        }

        return $data;
    }

    public function int_ye(string $date)
    {
        $datas = $this->datas();
        $periode_interim = explode("&&", $datas['periode_interim']);
        $periode_year_end = explode("&&", $datas['periode_year_end']);

        /**-------- */
        $date = strtotime($date);

        $periode_interim_mulai = strtotime($periode_interim[0]);
        $periode_interim_selesai = strtotime($periode_interim[1]);

        $periode_year_end_mulai = strtotime($periode_year_end[0]);
        $periode_year_end_selesai = strtotime($periode_year_end[1]);

        /**-------- */
        if ($date >= $periode_interim_mulai && $date <= $periode_interim_selesai) {
            return 'periode_interim';
        } else if ($date >= $periode_year_end_mulai && $date <= $periode_year_end_selesai) {
            return 'periode_year_end';
        }
    }
}
