<?php

namespace App\Models;

class MtSdmDivisi extends BaseModel
{
    public $table = 'mt_sdm_divisi';
    public $primaryKey = 'id_divisi';
    public $incrementing = false;
    protected $keyType = 'string';

    public $fillable = [
        'id_divisi',
        'kode_unit',
        'nama',
        'id_unit',
        'id_parent',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
    ];

    public array $rules = [
        'nama' => 'required|string|max:200',
        'kode_unit' => 'nullable|string|max:50',
        'id_unit' => 'nullable',
        'id_parent' => 'nullable',
        'status' => 'nullable|string|max:20',
    ];
}
