<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class SysAction extends BaseModel
{
    public $table = 'sys_action';

    public $primaryKey = "id_action";

    public $fillable = [
        'nama',
        'id_menu'
    ];

    public $casts = [
        'nama' => 'string'
    ];

    public array $rules = [
        'nama' => 'nullable|string|max:200',
        'id_menu' => 'nullable'
    ];

    public function idMenu(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\SysMenu::class, 'id_menu');
    }

    public function sysGroupMenus(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Models\SysGroupMenu::class, 'sys_group_action');
    }

    public function select_access($action, $url_menu, $group)
    {
        return
            $this->join('sys_menu', 'sys_action.id_menu', '=', 'sys_menu.id_menu')
            ->whereExists(function ($query) use ($group) {
                $query->select(DB::raw('1'))
                    ->from('sys_group_action')
                    ->whereExists(function ($subQuery) use ($group) {
                        $subQuery->select(DB::raw('1'))
                            ->from('sys_group_menu')
                            ->whereColumn('sys_group_action.id_group_menu', 'sys_group_menu.id_group_menu')
                            ->where('sys_group_menu.id_group', $group);
                    })
                    ->whereColumn('sys_action.id_action', 'sys_group_action.id_action');
            })
            ->where('sys_action.nama', $action)
            ->where('sys_menu.url', $url_menu);
    }

    public function access($action, $url_menu, $group)
    {
        return
            $this->select_access($action, $url_menu, $group)
            ->count();
    }

    public function select_user_have_access(array $action, $url_menu)
    {
        $sys_user = new SysUser();

        $data_sys_user = $sys_user
            ->join('sys_user_group', 'sys_user_group.id_user', '=', 'sys_user.id_user')
            ->whereRaw('sys_user_group.deleted_at is null')
            ->whereIn('sys_user_group.id_group', function ($query) use ($action, $url_menu) {
                $query
                    ->select('sys_group_menu.id_group')
                    ->from('sys_action')
                    ->join('sys_menu', 'sys_menu.id_menu', '=', 'sys_action.id_menu')
                    ->join('sys_group_menu', 'sys_group_menu.id_menu', '=', 'sys_menu.id_menu')
                    ->join('sys_group_action', function ($join) {
                        $join->on('sys_group_action.id_group_menu', '=', 'sys_group_menu.id_group_menu')
                            ->on('sys_action.id_action', '=', 'sys_group_action.id_action');
                    })
                    ->whereRaw('sys_action.deleted_at is null')
                    ->whereRaw('sys_menu.deleted_at is null')
                    ->whereRaw('sys_group_menu.deleted_at is null')
                    ->whereRaw('sys_group_action.deleted_at is null')
                    // ->where('sys_action.nama', '=', $action)
                    ->whereIn('sys_action.nama', $action)
                    ->where('sys_menu.url', '=', $url_menu);
            });

        return $data_sys_user;
    }

    public function select_user_have_access_menu(array $url_menu)
    {
        $sys_user = new SysUser();

        $data_sys_user = $sys_user
            ->join('sys_user_group', 'sys_user_group.id_user', '=', 'sys_user.id_user')
            ->whereRaw('sys_user_group.deleted_at is null')
            ->whereIn('sys_user_group.id_group', function ($query) use ($url_menu) {
                $query
                    ->select('sys_group_menu.id_group')
                    ->from('sys_action')
                    ->join('sys_menu', 'sys_menu.id_menu', '=', 'sys_action.id_menu')
                    ->join('sys_group_menu', 'sys_group_menu.id_menu', '=', 'sys_menu.id_menu')
                    ->join('sys_group_action', function ($join) {
                        $join->on('sys_group_action.id_group_menu', '=', 'sys_group_menu.id_group_menu')
                            ->on('sys_action.id_action', '=', 'sys_group_action.id_action');
                    })
                    ->whereRaw('sys_action.deleted_at is null')
                    ->whereRaw('sys_menu.deleted_at is null')
                    ->whereRaw('sys_group_menu.deleted_at is null')
                    ->whereRaw('sys_group_action.deleted_at is null')
                    ->whereIn('sys_menu.url', $url_menu);
            });

        return $data_sys_user;
    }
}
