<?php

namespace App\Models;

use Illuminate\Support\Facades\Hash;

class SysUserPasswordHistory extends BaseModel
{
    public $table = 'sys_user_password_history';

    protected $primaryKey = 'id_password_history';

    protected $fillable = [
        'id_user',
        'password_hash',
    ];

    protected $casts = [
        'id_user' => 'integer',
        'password_hash' => 'string',
    ];

    public array $rules = [
        'id_user' => 'required|integer',
        'password_hash' => 'required|string|max:255',
    ];

    /**
     * Relasi ke user
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SysUserModel::class, 'id_user', 'id_user');
    }

    /**
     * Cek apakah password cocok dengan hash di history
     */
    public function isMatch(string $password): bool
    {
        return Hash::check($password, $this->password_hash);
    }
}