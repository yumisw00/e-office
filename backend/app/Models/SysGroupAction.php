<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class SysGroupAction extends BaseModel
{
    public $table = 'sys_group_action';

    public $primaryKey = 'id_group_menu';

    public $fillable = [
        'id_group_menu',
        'id_action'
    ];

    public $casts = [
        'id_group_menu' => 'integer',
        'id_action' => 'integer',
    ];

    public array $rules = [
        'id_group_menu' => 'required|integer',
        'id_action' => 'required|integer',
    ];


    public function sysActions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\SysAction::class, 'id_group_menu,id_action');
    }

    public function sysGroups(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Models\SysGroup::class, 'sys_group_action');
    }
}
