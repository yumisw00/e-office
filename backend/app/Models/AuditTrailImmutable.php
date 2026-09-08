<?php

namespace App\Models;

class AuditTrailImmutable extends BaseModel
{
    public $table = 'audit_trail_immutable';
    public $primaryKey = 'id_audit_trail';

    public $fillable = [
        'id_user', 'table_name', 'record_id', 'action', 'old_values',
        'new_values', 'ip_address', 'user_agent', 'previous_hash', 'current_hash',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public array $rules = [
        'id_user' => 'nullable',
        'table_name' => 'nullable|string|max:100',
        'record_id' => 'nullable|string|max:100',
        'action' => 'nullable|string|max:50',
        'old_values' => 'nullable',
        'new_values' => 'nullable',
        'ip_address' => 'nullable|string|max:100',
        'user_agent' => 'nullable|string|max:255',
        'previous_hash' => 'nullable|string|max:128',
        'current_hash' => 'nullable|string|max:128',
    ];
}
