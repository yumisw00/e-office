<?php

namespace App\Models;

class MasterJenisSurat extends BaseModel
{
    public $table = 'master_jenis_surat';
    public $primaryKey = 'id_jenis_surat';
    public $orderDefault = 'nama asc';

    public $fillable = [
        'kode', 'nama', 'deskripsi', 'is_active',
        'created_by', 'updated_by', 'deleted_by',
        'created_by_desc', 'updated_by_desc', 'deleted_by_desc',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public array $rules = [
        'kode' => 'required|string|max:50',
        'nama' => 'required|string|max:150',
        'deskripsi' => 'nullable|string',
        'is_active' => 'nullable|boolean',
    ];
}
