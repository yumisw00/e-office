<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MtSdmJabatan extends BaseModel
{
    public $table = 'mt_sdm_jabatan';

    public $primaryKey = 'id_jabatan';

    public $fillable = [
        'nama',
        'kode_jabatan',
        'level_jabatan',
        'status',
        'id_unit',
        'position_id',
        'created_date',
        'modified_date',
        'tgl_mulai_efektif',
        'tgl_akhir_efektif',
        'id_jabatan_parent',
        'superior_id',
        'urutan',
        'created_by',
        'updated_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by',
        'deleted_by_desc',
        'is_direktorat',
        'id_dit_bid'
    ];

    protected $casts = [
        'nama' => 'string',
        'kode_jabatan' => 'string',
        'level_jabatan' => 'string',
        'status' => 'string',
        'id_unit' => 'string',
        'position_id' => 'string',
        'created_date' => 'datetime',
        'modified_date' => 'datetime',
        'tgl_mulai_efektif' => 'date',
        'tgl_akhir_efektif' => 'date',
        'superior_id' => 'string',
        'urutan' => 'float',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string',
        'id_dit_bid' => 'string'
    ];

    public array $rules = [
        'nama' => 'required|string|max:200',
        'kode_jabatan' => 'nullable|string|max:50',
        'level_jabatan' => 'nullable|string|max:20',
        'status' => 'nullable|string|max:20',
        'id_unit' => 'nullable|string|max:18',
        'position_id' => 'nullable|string|max:20',
        'created_date' => 'nullable',
        'modified_date' => 'nullable',
        'tgl_mulai_efektif' => 'nullable',
        'tgl_akhir_efektif' => 'nullable',
        'id_jabatan_parent' => 'nullable',
        'superior_id' => 'nullable|string|max:20',
        'urutan' => 'nullable|numeric',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'updated_by_desc' => 'nullable|string|max:200',
        'deleted_at' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_by_desc' => 'nullable|string|max:200',
        'is_direktorat' => 'nullable',
        'id_dit_bid' => 'nullable|string|max:10'
    ];

    public function idUnit(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtSdmUnit::class, 'id_unit');
    }

    public function rcmUnits(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\RcmUnit::class, 'id_control_approver');
    }
}
