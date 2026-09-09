<?php

namespace App\Models;

class SuratMasuk extends BaseModel
{
    public $table = 'surat_masuk';
    public $primaryKey = 'id';
    protected $appends = ['id_surat_masuk'];

    public const STATUSES = [
        'draft',
        'dikirim',
        'disposisi',
        'selesai',
        'diarsipkan',
        'ai_gagal',
        'manual_input',
    ];

    public const SOURCE_TYPES = ['AI', 'Manual'];
    public const AI_STATUSES = ['berhasil', 'gagal', 'belum_diproses'];

    public $fillable = [
        'id_surat_keluar',
        'id_penerima',
        'jenis_pengiriman',
        'id_jenis_surat',
        'nomor_agenda',
        'nomor_surat',
        'jenis',
        'tanggal_surat',
        'tenggat_waktu',
        'asal_surat',
        'kepada_tujuan',
        'unit_kerja',
        'sifat',
        'topik',
        'perihal',
        'tanggal_terima',
        'isi_ringkasan',
        'tembusan',
        'file_surat',
        'status',
        'source_type',
        'ai_status',
        'catatan',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
    ];

    public array $rules = [
        'id_surat_keluar' => 'nullable|integer',
        'id_penerima' => 'nullable|integer|exists:sys_user,id_user',
        'jenis_pengiriman' => 'nullable|in:internal,eksternal',
        'id_jenis_surat' => 'required|integer|exists:master_jenis_surat,id_jenis_surat',
        'nomor_agenda' => 'nullable|string|max:100',
        'nomor_surat' => 'nullable|string|max:100',
        'jenis' => 'required|string|max:150',
        'tanggal_surat' => 'nullable|date',
        'tenggat_waktu' => 'nullable|date',
        'asal_surat' => 'nullable|string|max:255',
        'perihal' => 'nullable|string|max:255',
        'kepada_tujuan' => 'nullable|string|max:255',
        'unit_kerja' => 'nullable|string|max:255',
        'sifat' => 'nullable|string|max:100',
        'topik' => 'nullable|string|max:100',
        'tanggal_terima' => 'nullable|date',
        'isi_ringkasan' => 'nullable|string',
        'tembusan' => 'nullable|string',
        'file_surat' => 'nullable|string|max:255',
        'status' => 'nullable|in:draft,dikirim,disposisi,selesai,diarsipkan,ai_gagal,manual_input',
        'source_type' => 'nullable|in:AI,Manual',
        'ai_status' => 'nullable|in:berhasil,gagal,belum_diproses',
        'catatan' => 'nullable|string',
    ];

    protected $casts = [
        'tanggal_surat' => 'date:Y-m-d',
        'tanggal_terima' => 'date:Y-m-d',
        'tenggat_waktu' => 'date:Y-m-d',
    ];

    public function getIdSuratMasukAttribute()
    {
        return $this->attributes[$this->primaryKey] ?? null;
    }

    public function disposisi(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\SuratDisposisi::class, 'id_surat_masuk', 'id');
    }

    public function distribusi(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\SuratDistribusi::class, 'id_surat_masuk', 'id');
    }

    public function suratKeluar(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SuratKeluar::class, 'id_surat_keluar', 'id_surat_keluar');
    }

    public function jenisSurat(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MasterJenisSurat::class, 'id_jenis_surat', 'id_jenis_surat');
    }

    public function penerima(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysUser::class, 'id_penerima', 'id_user');
    }
}
