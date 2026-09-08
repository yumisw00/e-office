<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SysPersonalAccessToken extends SanctumPersonalAccessToken
{
    use HasFactory;


    protected $table = "sys_personal_access_token";
}
