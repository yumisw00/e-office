<?php

namespace App\Models;

class SuratArsip extends BaseModel
{
    public $table = 'surat_arsip';
    public $primaryKey = 'id_surat_arsip';

    public $fillable = [
        'jenis_surat', 'jenis_pengiriman', 'id_surat_masuk', 'id_surat_keluar', 'nomor_surat',
        'perihal', 'file_path', 'lokasi_fisik', 'hash_file', 'tanggal_arsip',
        'created_by', 'updated_by', 'deleted_by',
        'created_by_desc', 'updated_by_desc', 'deleted_by_desc',
    ];

    public array $rules = [
        'jenis_surat' => 'nullable|string|max:50',
        'jenis_pengiriman' => 'nullable|in:internal,eksternal',
        'id_surat_masuk' => 'nullable',
        'id_surat_keluar' => 'nullable',
        'nomor_surat' => 'nullable|string|max:100',
        'perihal' => 'nullable|string|max:255',
        'file_path' => 'nullable|string|max:255',
        'lokasi_fisik' => 'nullable|string|max:255',
        'hash_file' => 'nullable|string|max:128',
        'tanggal_arsip' => 'nullable',
    ];
}
