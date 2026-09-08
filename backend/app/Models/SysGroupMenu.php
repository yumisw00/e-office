<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SysGroupMenu extends BaseModel
{
    public $table = 'sys_group_menu';

    public $primaryKey = 'id_group_menu';

    public $fillable = [
        'id_group',
        'id_menu'
    ];

    public $casts = [];

    public array $rules = [
        'id_group' => 'nullable',
        'id_menu' => 'nullable'
    ];

    public function idGroup(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysGroup::class, 'id_group');
    }

    public function idMenu(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysMenu::class, 'id_menu');
    }

    public function sysActions(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Models\SysAction::class, 'sys_group_action');
    }
}
