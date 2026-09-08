<?php

namespace App\Models;

class AiDocumentJob extends BaseModel
{
    public $table = 'ai_document_job';
    public $primaryKey = 'id_ai_document_job';

    public $fillable = [
        'job_type', 'source_type', 'source_id', 'file_path', 'extracted_text',
        'summary', 'result_payload', 'status', 'error_message', 'created_by',
    ];

    protected $casts = [
        'result_payload' => 'array',
    ];

    public array $rules = [
        'job_type' => 'nullable|string|max:50',
        'source_type' => 'nullable|string|max:50',
        'source_id' => 'nullable',
        'file_path' => 'nullable|string|max:255',
        'extracted_text' => 'nullable|string',
        'summary' => 'nullable|string',
        'result_payload' => 'nullable',
        'status' => 'nullable|string|max:50',
        'error_message' => 'nullable|string',
    ];
}
