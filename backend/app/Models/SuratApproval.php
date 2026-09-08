<?php

namespace App\Models;

class SuratApproval extends BaseModel
{
    public $table = 'surat_approval';
    public $primaryKey = 'id_surat_approval';

    public $fillable = [
        'id_surat_keluar', 'id_approver', 'urutan', 'status',
        'catatan_revisi', 'tanggal_aksi',
    ];

    public array $rules = [
        'id_surat_keluar' => 'nullable',
        'id_approver' => 'nullable',
        'urutan' => 'nullable|integer',
        'status' => 'nullable|string|max:50',
        'catatan_revisi' => 'nullable|string',
        'tanggal_aksi' => 'nullable',
    ];
}
