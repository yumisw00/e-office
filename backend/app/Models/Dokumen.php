<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dokumen extends BaseModel
{
    public $table = 'dokumen';

    protected $primaryKey = 'id_dokumen';

    public $fillable = [
        'nomor_dokumen',
        'tahun',
        'nama',
        'id_kategori_dokumen',
        'keterangan',
        'client_name',
        'file_name',
        'file_type',
        'file_size',
        'file_url',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc'
    ];

    public $casts = [
        'nomor_dokumen' => 'string|required',
        'nama' => 'required',
        'tahun' => 'required',
        'keterangan' => 'string',
        'client_name' => 'string',
        'file_name' => 'string|required',
        'file_type' => 'string',
        'file_size' => 'float',
        'file_url' => 'string',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'nomor_dokumen' => 'nullable|string|max:45',
        'nama' => 'nullable|string|max:500',
        'id_kategori_dokumen' => 'nullable',
        'keterangan' => 'nullable|string',
        'client_name' => 'nullable|string|max:1000',
        'file_name' => 'nullable|string|max:1000',
        'file_type' => 'nullable|string|max:100',
        'file_size' => 'nullable|numeric',
        'file_url' => 'nullable|string|max:500',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_at' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'updated_by_desc' => 'nullable|string|max:200',
        'deleted_by_desc' => 'nullable|string|max:200'
    ];

    public function idKategoriDokumen(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtKategoriDokuman::class, 'id_kategori_dokumen');
    }
}
