<?php

namespace App\Models;

class SuratDisposisi extends BaseModel
{
    public $table = 'surat_disposisi';
    public $primaryKey = 'id_surat_disposisi';

    public const STATUSES = [
        'baru',
        'diproses',
        'selesai',
        'dibatalkan',
    ];

    public $fillable = [
        'id_surat_masuk', 'id_surat_distribusi', 'id_pemberi', 'id_penerima',
        'instruksi', 'catatan_penyelesaian', 'file_bukti_path', 'status',
        'tanggal_jatuh_tempo', 'tanggal_disposisi', 'tanggal_selesai',
        'jenis_pengiriman',
        'created_by', 'updated_by', 'deleted_by',
        'created_by_desc', 'updated_by_desc', 'deleted_by_desc',
    ];

    public array $rules = [
        'id_surat_masuk' => 'nullable|integer',
        'id_surat_distribusi' => 'nullable',
        'id_pemberi' => 'nullable',
        'id_penerima' => 'nullable',
        'instruksi' => 'nullable|string',
        'catatan_penyelesaian' => 'nullable|string',
        'file_bukti_path' => 'nullable|string|max:255',
        'status' => 'nullable|in:baru,diproses,selesai,dibatalkan',
        'tanggal_jatuh_tempo' => 'nullable|date',
        'tanggal_disposisi' => 'nullable|date',
        'tanggal_selesai' => 'nullable',
        'jenis_pengiriman' => 'nullable|in:internal,eksternal',
    ];

    protected $casts = [
        'tanggal_jatuh_tempo' => 'date:Y-m-d',
        'tanggal_disposisi' => 'datetime:Y-m-d H:i:s',
        'tanggal_selesai' => 'datetime:Y-m-d H:i:s',
    ];

    public function suratMasuk(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SuratMasuk::class, 'id_surat_masuk', 'id');
    }

    public function distribusi(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SuratDistribusi::class, 'id_surat_distribusi', 'id_surat_distribusi');
    }

    public function pemberi(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysUser::class, 'id_pemberi', 'id_user');
    }

    public function penerima(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysUser::class, 'id_penerima', 'id_user');
    }
}
