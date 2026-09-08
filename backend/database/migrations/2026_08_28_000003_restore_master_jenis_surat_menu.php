<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sys_menu') || !Schema::hasTable('sys_group') || !Schema::hasTable('sys_group_menu')) {
            return;
        }

        $now = now();
        $menu = DB::table('sys_menu')->where('url', 'master_jenis_surat')->first();
        if ($menu) {
            $menuId = (int) $menu->id_menu;
            DB::table('sys_menu')->where('id_menu', $menuId)->update([
                'nama' => 'Master Jenis Surat', 'sort' => 145, 'icon' => 'description',
                'is_show' => 1, 'deleted_at' => null, 'updated_at' => $now,
            ]);
        } else {
            $menuId = (int) DB::table('sys_menu')->insertGetId([
                'id_parent_menu' => null, 'nama' => 'Master Jenis Surat',
                'url' => 'master_jenis_surat', 'sort' => 145, 'icon' => 'description',
                'is_show' => 1, 'created_at' => $now, 'updated_at' => $now,
            ], 'id_menu');
        }

        foreach (DB::table('sys_group')->whereNull('deleted_at')->whereIn('nama', ['Admin Sistem', 'Admin Konten'])->pluck('id_group') as $groupId) {
            $groupMenu = DB::table('sys_group_menu')->where('id_group', $groupId)->where('id_menu', $menuId)->first();
            if ($groupMenu) {
                $groupMenuId = (int) $groupMenu->id_group_menu;
                DB::table('sys_group_menu')->where('id_group_menu', $groupMenuId)->update(['deleted_at' => null, 'updated_at' => $now]);
            } else {
                $groupMenuId = (int) DB::table('sys_group_menu')->insertGetId([
                    'id_group' => $groupId, 'id_menu' => $menuId, 'created_at' => $now, 'updated_at' => $now,
                ], 'id_group_menu');
            }

            if (!Schema::hasTable('sys_action') || !Schema::hasTable('sys_group_action')) {
                continue;
            }

            foreach (['index', 'add', 'edit', 'delete'] as $name) {
                $action = DB::table('sys_action')->where('id_menu', $menuId)->where('nama', $name)->first();
                if ($action) {
                    $actionId = (int) $action->id_action;
                    DB::table('sys_action')->where('id_action', $actionId)->update(['deleted_at' => null, 'updated_at' => $now]);
                } else {
                    $actionId = (int) DB::table('sys_action')->insertGetId([
                        'id_menu' => $menuId, 'nama' => $name, 'created_at' => $now, 'updated_at' => $now,
                    ], 'id_action');
                }

                $groupAction = DB::table('sys_group_action')->where('id_group_menu', $groupMenuId)->where('id_action', $actionId)->first();
                if ($groupAction) {
                    DB::table('sys_group_action')->where('id_group_action', $groupAction->id_group_action)->update(['deleted_at' => null, 'updated_at' => $now]);
                } else {
                    DB::table('sys_group_action')->insert([
                        'id_group_menu' => $groupMenuId, 'id_action' => $actionId, 'created_at' => $now, 'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // Do not revoke permissions configured by an administrator.
    }
};
