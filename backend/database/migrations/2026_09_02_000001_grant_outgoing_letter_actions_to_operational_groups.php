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

        $menuId = DB::table('sys_menu')
            ->where('url', 'surat_keluar')
            ->whereNull('deleted_at')
            ->value('id_menu');

        if (!$menuId) {
            return;
        }

        $groupIds = DB::table('sys_group')
            ->whereIn('nama', ['Pegawai', 'Pimpinan'])
            ->whereNull('deleted_at')
            ->pluck('id_group');

        foreach ($groupIds as $groupId) {
            $groupMenuId = $this->ensureGroupMenu((int) $groupId, (int) $menuId);

            foreach (['index', 'add', 'edit'] as $action) {
                $actionId = $this->ensureAction((int) $menuId, $action);
                $this->ensureGroupAction($groupMenuId, $actionId);
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('sys_group_action')) {
            return;
        }

        DB::table('sys_group_action')
            ->whereIn('id_group_menu', function ($query) {
                $query->select('sys_group_menu.id_group_menu')
                    ->from('sys_group_menu')
                    ->join('sys_group', 'sys_group.id_group', '=', 'sys_group_menu.id_group')
                    ->join('sys_menu', 'sys_menu.id_menu', '=', 'sys_group_menu.id_menu')
                    ->whereIn('sys_group.nama', ['Pegawai', 'Pimpinan'])
                    ->where('sys_menu.url', 'surat_keluar');
            })
            ->whereIn('id_action', function ($query) {
                $query->select('sys_action.id_action')
                    ->from('sys_action')
                    ->join('sys_menu', 'sys_menu.id_menu', '=', 'sys_action.id_menu')
                    ->where('sys_menu.url', 'surat_keluar')
                    ->whereIn('sys_action.nama', ['add', 'edit']);
            })
            ->delete();
    }

    private function ensureGroupMenu(int $groupId, int $menuId): int
    {
        $groupMenu = DB::table('sys_group_menu')
            ->where('id_group', $groupId)
            ->where('id_menu', $menuId)
            ->first();

        if ($groupMenu) {
            DB::table('sys_group_menu')
                ->where('id_group_menu', $groupMenu->id_group_menu)
                ->update(['deleted_at' => null, 'updated_at' => now()]);

            return (int) $groupMenu->id_group_menu;
        }

        return (int) DB::table('sys_group_menu')->insertGetId([
            'id_group' => $groupId,
            'id_menu' => $menuId,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_group_menu');
    }

    private function ensureAction(int $menuId, string $name): int
    {
        $action = DB::table('sys_action')
            ->where('id_menu', $menuId)
            ->where('nama', $name)
            ->first();

        if ($action) {
            DB::table('sys_action')
                ->where('id_action', $action->id_action)
                ->update(['deleted_at' => null, 'updated_at' => now()]);

            return (int) $action->id_action;
        }

        return (int) DB::table('sys_action')->insertGetId([
            'id_menu' => $menuId,
            'nama' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_action');
    }

    private function ensureGroupAction(int $groupMenuId, int $actionId): void
    {
        $groupAction = DB::table('sys_group_action')
            ->where('id_group_menu', $groupMenuId)
            ->where('id_action', $actionId)
            ->first();

        if ($groupAction) {
            DB::table('sys_group_action')
                ->where('id_group_menu', $groupMenuId)
                ->where('id_action', $actionId)
                ->update(['deleted_at' => null, 'updated_at' => now()]);

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
