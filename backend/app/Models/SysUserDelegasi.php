<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SysUserDelegasi extends BaseModel
{
    public $table = 'sys_user_delegasi';

    public $primaryKey = 'id_user_delegasi';

    public $fillable = [
        'id_user',
        'id_user_parent',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_by_desc',
        'updated_by_desc',
        'deleted_by_desc'
    ];

    protected $casts = [
        'created_by_desc' => 'string',
        'updated_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'id_user' => 'required',
        'id_user_parent' => 'required',
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

    public function idUser(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysUser::class, 'id_user');
    }

    public function idUserParent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysUser::class, 'id_user_parent');
    }
}
