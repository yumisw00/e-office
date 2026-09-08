<?php

namespace App\Models;

class MtSdmPegawai extends BaseModel
{
    public $table = 'mt_sdm_pegawai';
    public $primaryKey = 'id_pegawai';
    public $incrementing = false;
    protected $keyType = 'string';

    public $fillable = [
        'id_pegawai',
        'nip',
        'nama',
        'nama_unit',
        'id_unit',
        'nama_jabatan',
        'id_jabatan',
        'email',
        'telepon',
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
        'nip' => 'nullable|string|max:50',
        'id_unit' => 'nullable',
        'id_jabatan' => 'nullable',
        'email' => 'nullable|string|max:200',
        'telepon' => 'nullable|string|max:50',
        'status' => 'nullable|string|max:20',
    ];
}
