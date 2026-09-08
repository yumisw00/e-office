<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanFilterFiles extends BaseModel
{
    public $table = 'laporan_filter_files';

    public $primaryKey = 'id_laporan_filter_files';

    public $fillable = [
        'client_name',
        'file_name',
        'file_type',
        'file_size',
        'jenis',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
        'id_laporan_filter'
    ];

    protected $casts = [
        'client_name' => 'string',
        'file_name' => 'string',
        'file_type' => 'string',
        'file_size' => 'float',
        'jenis' => 'string',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'client_name' => 'nullable|string|max:100',
        'file_name' => 'nullable|string|max:1000',
        'file_type' => 'nullable|string|max:100',
        'file_size' => 'nullable|numeric',
        'jenis' => 'nullable|string|max:20',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'deleted_at' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'deleted_by' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'updated_by_desc' => 'nullable|string|max:200',
        'deleted_by_desc' => 'nullable|string|max:200',
        'id_laporan_filter' => 'nullable'
    ];

    public function idLaporanFilter(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\LaporanFilter::class, 'id_laporan_filter');
    }
}
