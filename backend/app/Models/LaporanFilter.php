<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanFilter extends BaseModel
{
    public $table = 'laporan_filter';

    public $primaryKey = 'id_laporan_filter';

    public $fillable = [
        'jenis_laporan',
        'id_ruang_lingkup',
        'id_periode',
        'line',
        'id_unit',
        'id_subbid',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
        'tahun',
    ];

    protected $casts = [
        'jenis_laporan' => 'string',
        'line' => 'string',
        'id_unit' => 'string',
        'id_subbid' => 'string',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'jenis_laporan' => 'nullable|string|max:100',
        'id_ruang_lingkup' => 'nullable',
        'id_periode' => 'nullable',
        'line' => 'nullable|string|max:100',
        'id_unit' => 'nullable|string|max:20',
        'id_subbid' => 'nullable|string|max:20',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'deleted_at' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'deleted_by' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'updated_by_desc' => 'nullable|string|max:200',
        'deleted_by_desc' => 'nullable|string|max:200'
    ];

    public function laporanFilterFiles(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\LaporanFilterFiles::class, 'id_laporan_filter');
    }
}
