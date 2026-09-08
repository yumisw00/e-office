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

        $agendaMenuId = $this->ensureMenu('agenda', 'Agenda', 180, 'event');
        $announcementMenuId = $this->ensureMenu('pengumuman', 'Pengumuman', 190, 'campaign');

        $this->grantActions('Admin Konten', $agendaMenuId, ['index', 'add', 'edit', 'delete']);
        $this->grantActions('Admin Konten', $announcementMenuId, ['index', 'add', 'edit', 'delete']);

        foreach (['Pegawai', 'Pimpinan'] as $groupName) {
            $this->grantActions($groupName, $agendaMenuId, ['index']);
            $this->grantActions($groupName, $announcementMenuId, ['index']);
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('sys_menu')) {
            return;
        }

        DB::table('sys_menu')
            ->where('url', 'agenda')
            ->where('nama', 'Agenda')
            ->update(['deleted_at' => now(), 'updated_at' => now()]);
    }

    private function ensureMenu(string $url, string $name, int $sort, string $icon): int
    {
        $menu = DB::table('sys_menu')->where('url', $url)->first();

        if ($menu) {
            DB::table('sys_menu')->where('id_menu', $menu->id_menu)->update([
                'nama' => $name,
                'sort' => $sort,
                'icon' => $icon,
                'is_show' => 1,
                'deleted_at' => null,
                'updated_at' => now(),
            ]);

            return (int) $menu->id_menu;
        }

        return (int) DB::table('sys_menu')->insertGetId([
            'id_parent_menu' => null,
            'nama' => $name,
            'url' => $url,
            'sort' => $sort,
            'icon' => $icon,
            'is_show' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_menu');
    }

    private function grantActions(string $groupName, int $menuId, array $actions): void
    {
        $groupId = DB::table('sys_group')->where('nama', $groupName)->whereNull('deleted_at')->value('id_group');
        if (!$groupId) {
            return;
        }

        $groupMenu = DB::table('sys_group_menu')->where('id_group', $groupId)->where('id_menu', $menuId)->first();
        if ($groupMenu) {
            DB::table('sys_group_menu')->where('id_group_menu', $groupMenu->id_group_menu)->update(['deleted_at' => null, 'updated_at' => now()]);
            $groupMenuId = (int) $groupMenu->id_group_menu;
        } else {
            $groupMenuId = (int) DB::table('sys_group_menu')->insertGetId([
                'id_group' => $groupId,
                'id_menu' => $menuId,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_group_menu');
        }

        foreach ($actions as $actionName) {
            $action = DB::table('sys_action')->where('id_menu', $menuId)->where('nama', $actionName)->first();
            if ($action) {
                DB::table('sys_action')->where('id_action', $action->id_action)->update(['deleted_at' => null, 'updated_at' => now()]);
                $actionId = (int) $action->id_action;
            } else {
                $actionId = (int) DB::table('sys_action')->insertGetId([
                    'id_menu' => $menuId,
                    'nama' => $actionName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_action');
            }

            $groupAction = DB::table('sys_group_action')->where('id_group_menu', $groupMenuId)->where('id_action', $actionId)->first();
            if ($groupAction) {
                DB::table('sys_group_action')->where('id_group_menu', $groupMenuId)->where('id_action', $actionId)->update(['deleted_at' => null, 'updated_at' => now()]);
            } else {
                DB::table('sys_group_action')->insert([
                    'id_group_menu' => $groupMenuId,
                    'id_action' => $actionId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};
