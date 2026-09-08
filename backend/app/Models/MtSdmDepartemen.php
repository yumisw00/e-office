<?php

namespace App\Models;

class MtSdmDepartemen extends BaseModel
{
    public $table = 'mt_sdm_departemen';
    public $primaryKey = 'id_departemen';
    public $incrementing = false;
    protected $keyType = 'string';

    public $fillable = [
        'id_departemen',
        'kode_unit',
        'nama',
        'id_divisi',
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
        'id_divisi' => 'nullable',
        'id_unit' => 'nullable',
        'id_parent' => 'nullable',
        'status' => 'nullable|string|max:20',
    ];
}
