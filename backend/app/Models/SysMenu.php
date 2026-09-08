<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;

class SysMenu extends BaseModel
{
    public $table = 'sys_menu';

    public $primaryKey = "id_menu";
    public $orderDefault = "sort";

    public $fillable = [
        'id_parent_menu',
        'nama',
        'url',
        'sort',
        'icon',
        'is_show'
    ];

    public $casts = [
        'nama' => 'string',
        'url' => 'string',
        'icon' => 'string'
    ];

    public array $rules = [
        'id_parent_menu' => 'nullable|integer',
        'nama' => 'required|string|max:100',
        'url' => 'nullable|string|max:300',
        'deleted_at' => 'nullable',
        'sort' => 'nullable|integer|min:0',
        'icon' => 'nullable|string|max:100',
        'is_show' => 'nullable|integer|min:0|max:1',
    ];

    public function sysActions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\SysAction::class, 'id_menu');
    }

    public function sysGroups(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Models\SysGroup::class, 'sys_group_menu');
    }

    /**
     * Override before_delete to cascade delete related sys_action records
     * before the parent before_delete FK check runs.
     */
    public function before_delete(string $table, $pk): array
    {
        // Delete related sys_action records first
        $actions = SysAction::where('id_menu', $pk)->whereNull('deleted_at')->get();

        foreach ($actions as $action) {
            // Delete related sys_group_action records
            DB::table('sys_group_action')
                ->where('id_action', $action->id_action)
                ->delete();

            // Soft delete the action
            $action->deleted_at = now();
            $action->deleted_by = auth()->user() ? auth()->user()->id_user : null;
            $action->deleted_by_desc = auth()->user() ? auth()->user()->name : null;
            $action->save();
        }

        // Also delete related sys_group_menu records
        $groupMenus = DB::table('sys_group_menu')
            ->where('id_menu', $pk)
            ->whereNull('deleted_at')
            ->get();

        foreach ($groupMenus as $gm) {
            DB::table('sys_group_action')
                ->where('id_group_menu', $gm->id_group_menu)
                ->delete();

            DB::table('sys_group_menu')
                ->where('id_group_menu', $gm->id_group_menu)
                ->update([
                    'deleted_at' => now(),
                    'deleted_by' => auth()->user() ? auth()->user()->id_user : null,
                    'deleted_by_desc' => auth()->user() ? auth()->user()->name : null,
                ]);
        }

        // Call parent to handle any remaining FK checks
        return parent::before_delete($table, $pk);
    }
}
