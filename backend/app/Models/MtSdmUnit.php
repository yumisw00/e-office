<?php

namespace App\Models;

class MtSdmUnit extends BaseModel
{
    public $table = 'mt_sdm_unit';
    public $primaryKey = 'id_unit';
    public $incrementing = false;
    protected $keyType = 'string';

    public $fillable = [
        'id_unit',
        'kode_unit',
        'nama',
        'id_parent',
        'status',
        'id_kelompok_bisnis',
        'is_bandel',
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
        'id_parent' => 'nullable',
        'status' => 'nullable|string|max:20',
        'id_kelompok_bisnis' => 'nullable',
        'is_bandel' => 'nullable',
    ];
}
