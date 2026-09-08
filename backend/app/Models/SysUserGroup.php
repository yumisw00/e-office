<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SysUserGroup extends BaseModel
{
    public $table = 'sys_user_group';

    public $primaryKey = 'id_user';

    public $fillable = [
        'id_user',
        'id_group',
        'deleted_by',
        'deleted_by_desc',
        'id_jabatan',
        'nid',
    ];

    protected $casts = [
        'deleted_by_desc' => 'string',
        'nid' => 'string'
    ];

    public array $rules = [
        'id_user' => 'nullable',
        'id_group' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_by_desc' => 'nullable|string|max:200',
        'id_jabatan' => 'nullable',
        'updated_at' => 'nullable',
        'created_at' => 'nullable',
        'deleted_at' => 'nullable'
    ];

    public function idUser(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysUser::class, 'id_user');
    }

    public function idGroup(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysGroup::class, 'id_group');
    }
}
