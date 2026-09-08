<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommonPassword extends BaseModel
{
    protected $table = 'common_passwords';

    protected $fillable = [
        'password',
    ];

    protected $casts = [
        'password' => 'string',
    ];

    public array $rules = [
        'password' => 'required|string|max:255',
    ];

    /**
     * Cek apakah password adalah password umum
     */
    public static function isCommonPassword(string $password): bool
    {
        return self::where('password', $password)->exists();
    }

    /**
     * Ambil semua common passwords
     */
    public static function getAllPasswords(): array
    {
        return self::pluck('password')->toArray();
    }
}