<?php

namespace App\Models;

class SuratTemplate extends BaseModel
{
    public $table = 'surat_template';
    public $primaryKey = 'id_surat_template';

    public $fillable = [
        'kode', 'nama', 'jenis_surat', 'deskripsi', 'file_template', 'file_path',
        'file_name', 'office365_document_url', 'drive_document_url', 'pdf_path',
        'is_default', 'is_active', 'status', 'metadata',
        'created_by', 'updated_by', 'deleted_by',
        'created_by_desc', 'updated_by_desc', 'deleted_by_desc',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public array $rules = [
        'kode' => 'nullable|string|max:50',
        'nama' => 'nullable|string|max:200',
        'jenis_surat' => 'nullable|string|max:100',
        'deskripsi' => 'nullable|string',
        'file_template' => 'nullable|string|max:255',
        'file_path' => 'nullable|string|max:255',
        'file_name' => 'nullable|string|max:255',
        'office365_document_url' => 'nullable|string|max:255',
        'drive_document_url' => 'nullable|string|max:255',
        'pdf_path' => 'nullable|string|max:255',
        'is_default' => 'nullable|boolean',
        'is_active' => 'nullable|boolean',
        'status' => 'nullable|string|max:50',
        'metadata' => 'nullable',
    ];
}
