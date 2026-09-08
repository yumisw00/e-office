<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('mt_sdm_unit') || !Schema::hasTable('mt_sdm_divisi')) {
            return;
        }

        DB::table('mt_sdm_unit')
            ->whereNull('deleted_at')
            ->orderBy('id_unit')
            ->get(['id_unit', 'kode_unit', 'nama'])
            ->each(function ($unit) {
                $exists = DB::table('mt_sdm_divisi')
                    ->where('id_divisi', $unit->id_unit)
                    ->exists();

                if (!$exists) {
                    DB::table('mt_sdm_divisi')->insert([
                        'id_divisi' => $unit->id_unit,
                        'kode_unit' => $unit->kode_unit,
                        'nama' => $unit->nama,
                        'id_unit' => $unit->id_unit,
                        'status' => 'aktif',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            });
    }

    public function down(): void
    {
        // Keep imported master data on rollback.
    }
};
