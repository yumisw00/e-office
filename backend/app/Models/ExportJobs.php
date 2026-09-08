<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExportJobs extends BaseModel
{
    public $table = 'export_jobs';

    public $primaryKey = 'id_export_jobs';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    public $fillable = [
        'job_id',
        'status',
        'progress',
        'total_records',
        'processed_records',
        'file_path',
        'file_name',
        'error_message',
        'completed_at',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc'
    ];

    protected $casts = [
        'job_id' => 'string',
        'status' => 'string',
        'progress' => 'float',
        'file_path' => 'string',
        'file_name' => 'string',
        'error_message' => 'string',
        'completed_at' => 'datetime',
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'job_id' => 'required|string|max:100',
        'status' => 'required|string|max:20',
        'progress' => 'nullable|numeric',
        'total_records' => 'nullable',
        'processed_records' => 'nullable',
        'file_path' => 'nullable|string|max:255',
        'file_name' => 'nullable|string|max:255',
        'error_message' => 'nullable|string',
        'completed_at' => 'nullable',
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
}
