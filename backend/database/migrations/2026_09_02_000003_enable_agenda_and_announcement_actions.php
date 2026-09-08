<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sys_group')
            || !Schema::hasTable('sys_menu')
            || !Schema::hasTable('sys_group_menu')
            || !Schema::hasTable('sys_action')
            || !Schema::hasTable('sys_group_action')) {
            return;
        }

        foreach (['agenda', 'pengumuman'] as $menuUrl) {
            $menuId = DB::table('sys_menu')->where('url', $menuUrl)->whereNull('deleted_at')->value('id_menu');
            if (!$menuId) {
                continue;
            }

            foreach (['Pegawai', 'Pimpinan'] as $groupName) {
                $groupId = DB::table('sys_group')->where('nama', $groupName)->whereNull('deleted_at')->value('id_group');
                if (!$groupId) {
                    continue;
                }

                $groupMenuId = $this->ensureGroupMenu((int) $groupId, (int) $menuId);
                foreach (['add', 'edit', 'delete'] as $actionName) {
                    $actionId = $this->ensureAction((int) $menuId, $actionName);
                    $this->ensureGroupAction($groupMenuId, $actionId);
                }
            }
        }
    }

    public function down(): void
    {
    }

    private function ensureGroupMenu(int $groupId, int $menuId): int
    {
        $groupMenu = DB::table('sys_group_menu')->where('id_group', $groupId)->where('id_menu', $menuId)->first();
        if ($groupMenu) {
            DB::table('sys_group_menu')->where('id_group_menu', $groupMenu->id_group_menu)->update(['deleted_at' => null, 'updated_at' => now()]);
            return (int) $groupMenu->id_group_menu;
        }

        return (int) DB::table('sys_group_menu')->insertGetId([
            'id_group' => $groupId,
            'id_menu' => $menuId,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_group_menu');
    }

    private function ensureAction(int $menuId, string $actionName): int
    {
        $action = DB::table('sys_action')->where('id_menu', $menuId)->where('nama', $actionName)->first();
        if ($action) {
            DB::table('sys_action')->where('id_action', $action->id_action)->update(['deleted_at' => null, 'updated_at' => now()]);
            return (int) $action->id_action;
        }

        return (int) DB::table('sys_action')->insertGetId([
            'id_menu' => $menuId,
            'nama' => $actionName,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_action');
    }

    private function ensureGroupAction(int $groupMenuId, int $actionId): void
    {
        $groupAction = DB::table('sys_group_action')->where('id_group_menu', $groupMenuId)->where('id_action', $actionId)->first();
        if ($groupAction) {
            DB::table('sys_group_action')->where('id_group_menu', $groupMenuId)->where('id_action', $actionId)->update(['deleted_at' => null, 'updated_at' => now()]);
            return;
        }

        DB::table('sys_group_action')->insert([
            'id_group_menu' => $groupMenuId,
            'id_action' => $actionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
