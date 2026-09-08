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

        DB::table('sys_menu')
            ->where('url', 'surat_template')
            ->update([
                'is_show' => 1,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('sys_menu')) {
            return;
        }

        DB::table('sys_menu')
            ->where('url', 'surat_template')
            ->update([
                'is_show' => 0,
                'updated_at' => now(),
            ]);
    }
};
