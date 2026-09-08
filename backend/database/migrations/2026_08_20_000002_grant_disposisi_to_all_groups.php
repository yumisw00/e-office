<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $menuId = DB::table('sys_menu')
            ->where('url', 'disposisi')
            ->whereNull('deleted_at')
            ->value('id_menu');

        if (!$menuId) {
            return;
        }

        $actionIds = DB::table('sys_action')
            ->where('id_menu', $menuId)
            ->whereIn('nama', ['index', 'add', 'edit'])
            ->whereNull('deleted_at')
            ->pluck('id_action');

        $groupIds = DB::table('sys_group')
            ->whereNull('deleted_at')
            ->pluck('id_group');

        foreach ($groupIds as $groupId) {
            $groupMenu = DB::table('sys_group_menu')
                ->where('id_group', $groupId)
                ->where('id_menu', $menuId)
                ->first();

            if ($groupMenu) {
                DB::table('sys_group_menu')
                    ->where('id_group_menu', $groupMenu->id_group_menu)
                    ->update(['deleted_at' => null, 'updated_at' => now()]);

                $groupMenuId = $groupMenu->id_group_menu;
            } else {
                $groupMenuId = DB::table('sys_group_menu')->insertGetId([
                    'id_group' => $groupId,
                    'id_menu' => $menuId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_group_menu');
            }

            foreach ($actionIds as $actionId) {
                DB::table('sys_group_action')->updateOrInsert(
                    [
                        'id_group_menu' => $groupMenuId,
                        'id_action' => $actionId,
                    ],
                    [
                        'deleted_at' => null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        // Keep access that may have been adjusted through role management.
    }
};
