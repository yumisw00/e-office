<?php

namespace App\Models;

class WorkflowSurat extends BaseModel
{
    public $table = 'workflow_surat';
    public $primaryKey = 'id_workflow_surat';

    public $fillable = [
        'nama_workflow',
        'jenis_surat',
        'deskripsi',
        'steps',
        'is_active',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc',
    ];

    protected $casts = [
        'steps' => 'array',
        'is_active' => 'boolean',
    ];

    public array $rules = [
        'nama_workflow' => 'nullable|string|max:200',
        'jenis_surat' => 'nullable|string|max:100',
        'deskripsi' => 'nullable|string',
        'steps' => 'nullable|array',
        'is_active' => 'nullable|boolean',
        'status' => 'nullable|string|max:50',
    ];
}
