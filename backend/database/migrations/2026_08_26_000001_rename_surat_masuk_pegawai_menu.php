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
            ->where('url', 'surat_masuk_pegawai')
            ->update(['nama' => 'Surat Masuk', 'updated_at' => now()]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('sys_menu')) {
            return;
        }

        DB::table('sys_menu')
            ->where('url', 'surat_masuk_pegawai')
            ->update(['nama' => 'Surat Masuk Pegawai', 'updated_at' => now()]);
    }
};
