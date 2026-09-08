<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('surat_disposisi', 'jenis_pengiriman')) {
            return;
        }

        DB::statement(<<<'SQL'
            UPDATE surat_disposisi sd
            SET jenis_pengiriman = COALESCE(sm.jenis_pengiriman, 'internal'),
                updated_at = COALESCE(sd.updated_at, NOW())
            FROM surat_masuk sm
            WHERE sm.id = sd.id_surat_masuk
        SQL);
    }

    public function down(): void
    {
        // Data kategori lama tidak dapat dipulihkan secara akurat.
    }
};
