<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('surat_distribusi') || !Schema::hasColumn('surat_distribusi', 'id_unit_tujuan')) {
            return;
        }

        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE surat_distribusi ALTER COLUMN id_unit_tujuan TYPE varchar(50) USING id_unit_tujuan::varchar'),
            'mysql' => DB::statement('ALTER TABLE surat_distribusi MODIFY id_unit_tujuan varchar(50) NULL'),
            'sqlite' => null,
            default => null,
        };
    }

    public function down(): void
    {
        if (!Schema::hasTable('surat_distribusi') || !Schema::hasColumn('surat_distribusi', 'id_unit_tujuan')) {
            return;
        }

        match (DB::getDriverName()) {
            'pgsql' => DB::statement("ALTER TABLE surat_distribusi ALTER COLUMN id_unit_tujuan TYPE bigint USING NULLIF(id_unit_tujuan, '')::bigint"),
            'mysql' => DB::statement('ALTER TABLE surat_distribusi MODIFY id_unit_tujuan bigint unsigned NULL'),
            'sqlite' => null,
            default => null,
        };
    }
};
