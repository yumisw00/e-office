<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sys_menu') || !Schema::hasTable('sys_group_menu')
            || !Schema::hasTable('sys_action') || !Schema::hasTable('sys_group_action')) {
            return;
        }

        $menuId = DB::table('sys_menu')
            ->where('url', 'surat_approval')
            ->whereNull('deleted_at')
            ->value('id_menu');

        if (!$menuId) {
            return;
        }

        $actions = [];
        foreach (['approve', 'reject'] as $name) {
            $action = DB::table('sys_action')
                ->where('id_menu', $menuId)
                ->where('nama', $name)
                ->first();

            if ($action) {
                DB::table('sys_action')->where('id_action', $action->id_action)
                    ->update(['deleted_at' => null, 'updated_at' => now()]);
                $actions[] = (int) $action->id_action;
            } else {
                $actions[] = (int) DB::table('sys_action')->insertGetId([
                    'id_menu' => $menuId,
                    'nama' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_action');
            }
        }

        $groupMenus = DB::table('sys_group_menu')
            ->where('id_menu', $menuId)
            ->whereNull('deleted_at')
            ->get(['id_group_menu']);

        foreach ($groupMenus as $groupMenu) {
            foreach ($actions as $actionId) {
                $exists = DB::table('sys_group_action')
                    ->where('id_group_menu', $groupMenu->id_group_menu)
                    ->where('id_action', $actionId)
                    ->first();

                if ($exists) {
                    DB::table('sys_group_action')->where('id_group_menu', $groupMenu->id_group_menu)
                        ->where('id_action', $actionId)
                        ->update(['deleted_at' => null, 'updated_at' => now()]);
                } else {
                    DB::table('sys_group_action')->insert([
                        'id_group_menu' => $groupMenu->id_group_menu,
                        'id_action' => $actionId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // Keep permissions intact on rollback; removing shared actions could
        // break manually configured groups.
    }
};
