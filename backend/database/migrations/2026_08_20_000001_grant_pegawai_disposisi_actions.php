<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $groupId = DB::table('sys_group')
            ->where('nama', 'Pegawai')
            ->whereNull('deleted_at')
            ->value('id_group');

        $menuId = DB::table('sys_menu')
            ->where('url', 'disposisi')
            ->whereNull('deleted_at')
            ->value('id_menu');

        if (!$groupId || !$menuId) {
            return;
        }

        $groupMenuId = DB::table('sys_group_menu')
            ->where('id_group', $groupId)
            ->where('id_menu', $menuId)
            ->whereNull('deleted_at')
            ->value('id_group_menu');

        if (!$groupMenuId) {
            return;
        }

        $actionIds = DB::table('sys_action')
            ->where('id_menu', $menuId)
            ->whereIn('nama', ['add', 'edit'])
            ->whereNull('deleted_at')
            ->pluck('id_action');

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

    public function down(): void
    {
        // Access changes are retained to avoid revoking permissions configured later.
    }
};
