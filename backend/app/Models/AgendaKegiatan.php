<?php

namespace App\Models;

class AgendaKegiatan extends BaseModel
{
    public $table = 'agenda_kegiatan';
    public $primaryKey = 'id_agenda_kegiatan';

    public $fillable = [
        'judul', 'deskripsi', 'tanggal_mulai', 'tanggal_selesai', 'lokasi',
        'created_by', 'updated_by', 'deleted_by',
        'created_by_desc', 'updated_by_desc', 'deleted_by_desc',
    ];

    public array $rules = [
        'judul' => 'nullable|string|max:200',
        'deskripsi' => 'nullable|string',
        'tanggal_mulai' => 'nullable',
        'tanggal_selesai' => 'nullable',
        'lokasi' => 'nullable|string|max:200',
    ];
}
