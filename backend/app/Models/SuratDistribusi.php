<?php

namespace App\Models;

class SuratDistribusi extends BaseModel
{
    public $table = 'surat_distribusi';
    public $primaryKey = 'id_surat_distribusi';

    public $fillable = [
        'id_surat_masuk', 'id_unit_tujuan', 'id_user_tujuan', 'status',
        'catatan', 'tanggal_distribusi', 'tanggal_dibaca', 'created_by',
    ];

    public array $rules = [
        'id_surat_masuk' => 'nullable',
        'id_unit_tujuan' => 'nullable|string|max:50',
        'id_user_tujuan' => 'nullable',
        'status' => 'nullable|string|max:50',
        'catatan' => 'nullable|string',
        'tanggal_distribusi' => 'nullable',
        'tanggal_dibaca' => 'nullable',
    ];

    public function suratMasuk(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SuratMasuk::class, 'id_surat_masuk', 'id');
    }
}
