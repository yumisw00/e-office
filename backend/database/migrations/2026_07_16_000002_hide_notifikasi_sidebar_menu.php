<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sys_menu')) {
            return;
        }

        $menuIds = DB::table('sys_menu')
            ->where(function ($query) {
                $query->where('url', 'notifikasi')
                    ->orWhere('url', '/notifikasi')
                    ->orWhereRaw('lower(nama) = ?', ['notifikasi']);
            })
            ->pluck('id_menu');

        if ($menuIds->isEmpty()) {
            return;
        }

        if (Schema::hasTable('sys_group_menu')) {
            DB::table('sys_group_menu')
                ->whereIn('id_menu', $menuIds)
                ->whereNull('deleted_at')
                ->update([
                    'deleted_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        DB::table('sys_menu')
            ->whereIn('id_menu', $menuIds)
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Not restored automatically to avoid re-adding a menu intentionally hidden from the sidebar.
    }
};
