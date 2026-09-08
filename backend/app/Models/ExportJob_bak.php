<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExportJob extends Model
{
    protected $table = 'export_jobs';
    
    protected $primaryKey = 'idExportJob';
    
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    
    protected $fillable = [
        'job_id',
        'status',
        'progress',
        'total_records',
        'processed_records',
        'file_path',
        'file_name',
        'error_message',
        'completed_at',
    ];

    protected $casts = [
        'progress' => 'float',
        'total_records' => 'integer',
        'processed_records' => 'integer',
        'completed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
}