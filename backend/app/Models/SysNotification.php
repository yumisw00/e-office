<?php

namespace App\Models;

class SysNotification extends BaseModel
{
    public $table = 'sys_notification';
    public $primaryKey = 'id_notification';

    public $fillable = [
        'id_user', 'channel', 'title', 'message', 'url', 'payload', 'read_at',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public array $rules = [
        'id_user' => 'nullable',
        'channel' => 'nullable|string|max:50',
        'title' => 'nullable|string|max:200',
        'message' => 'nullable|string',
        'url' => 'nullable|string|max:255',
        'payload' => 'nullable',
        'read_at' => 'nullable',
    ];
}
