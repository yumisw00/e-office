<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('surat_keluar', 'jenis_pengiriman')) {
            return;
        }

        DB::table('surat_keluar')
            ->whereNull('jenis_pengiriman')
            ->update([
                'jenis_pengiriman' => DB::raw("CASE WHEN tujuan_id IS NOT NULL THEN 'internal' ELSE 'eksternal' END"),
                'updated_at' => DB::raw('COALESCE(updated_at, NOW())'),
            ]);
    }

    public function down(): void
    {
        // Kategori lama tidak dapat dibedakan dari kategori yang dipilih user.
    }
};
