<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SysTwoFactorChallenge extends Model
{
    use SoftDeletes;

    protected $table = 'sys_two_factor_challenge';

    protected $fillable = [
        'id_user',
        'id_group',
        'challenge_type',
        'delivery_channel',
        'destination',
        'otp_hash',
        'otp_expires_at',
        'attempt_count',
        'max_attempt',
        'resend_count',
        'last_sent_at',
        'verified_at',
        'context_payload',
        'created_from_ip',
        'created_from_agent',
    ];

    protected $casts = [
        'otp_expires_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'verified_at' => 'datetime',
        'context_payload' => 'array',
    ];
}
