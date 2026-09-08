<?php

namespace App\Models;

class MtSdmRelasi extends BaseModel
{
    public $table = 'mt_sdm_relasi';
    public $primaryKey = 'id_relasi';
    public $incrementing = false;
    protected $keyType = 'string';

    public $fillable = [
        'id_relasi',
        'id_pegawai',
        'id_atasan',
        'relasi',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
    ];

    public array $rules = [
        'id_pegawai' => 'required',
        'id_atasan' => 'nullable',
        'relasi' => 'nullable|string|max:20',
        'status' => 'nullable|string|max:20',
    ];
}
