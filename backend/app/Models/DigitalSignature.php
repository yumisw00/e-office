<?php

namespace App\Models;

class DigitalSignature extends BaseModel
{
    public $table = 'digital_signature';
    public $primaryKey = 'id_digital_signature';

    public $fillable = [
        'source_type', 'source_id', 'id_penandatangan', 'certificate_serial',
        'qr_code_path', 'signed_file_path', 'verification_url', 'hash_file', 'signed_at',
    ];

    public array $rules = [
        'source_type' => 'nullable|string|max:50',
        'source_id' => 'nullable',
        'id_penandatangan' => 'nullable',
        'certificate_serial' => 'nullable|string|max:200',
        'qr_code_path' => 'nullable|string|max:255',
        'signed_file_path' => 'nullable|string|max:255',
        'verification_url' => 'nullable|string|max:255',
        'hash_file' => 'nullable|string|max:128',
        'signed_at' => 'nullable',
    ];
}
