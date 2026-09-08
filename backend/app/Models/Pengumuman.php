<?php

namespace App\Models;

class Pengumuman extends BaseModel
{
    public $table = 'pengumuman';
    public $primaryKey = 'id_pengumuman';
    public $orderDefault = 'published_at desc, id_pengumuman desc';

    public $fillable = [
        'judul', 'konten', 'kategori', 'target_role', 'target_divisi',
        'lampiran', 'status', 'published_at', 'expired_at', 'target_divisi_ids',
        'created_by', 'updated_by', 'deleted_by',
        'created_by_desc', 'updated_by_desc', 'deleted_by_desc',
    ];

    public array $rules = [
        'judul' => 'required|string|max:200',
        'konten' => 'required|string',
        'kategori' => 'nullable|in:informasi,penting,acara,pengumuman_layanan,edukasi',
        'target_role' => 'nullable|string|max:100',
        'target_divisi' => 'nullable|string|max:200',
        'lampiran' => 'nullable|string|max:2048',
        'status' => 'nullable|in:draft,publish',
        'published_at' => 'nullable|date',
        'expired_at' => 'nullable|date|after_or_equal:published_at',
        'deleted_by' => 'nullable',
        'deleted_by_desc' => 'nullable|string|max:200',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'expired_at' => 'datetime',
    ];
}
