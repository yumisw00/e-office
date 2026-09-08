<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('surat_arsip')) {
            return;
        }

        if (!Schema::hasColumn('surat_arsip', 'jenis_pengiriman')) {
            Schema::table('surat_arsip', function (Blueprint $table) {
                $table->string('jenis_pengiriman', 20)->nullable()->index()->after('jenis_surat');
            });
        }

        DB::statement(<<<'SQL'
            UPDATE surat_arsip arsip
            SET jenis_pengiriman = COALESCE(
                masuk.jenis_pengiriman,
                CASE WHEN masuk.id_surat_keluar IS NOT NULL THEN 'internal' ELSE 'eksternal' END
            )
            FROM surat_masuk masuk
            WHERE arsip.jenis_surat = 'surat_masuk'
              AND arsip.id_surat_masuk = masuk.id
              AND arsip.jenis_pengiriman IS NULL
        SQL);

        DB::statement(<<<'SQL'
            UPDATE surat_arsip arsip
            SET jenis_pengiriman = COALESCE(keluar.jenis_pengiriman, 'eksternal')
            FROM surat_keluar keluar
            WHERE arsip.jenis_surat = 'surat_keluar'
              AND arsip.id_surat_keluar = keluar.id_surat_keluar
              AND arsip.jenis_pengiriman IS NULL
        SQL);

        DB::table('surat_arsip')->whereNull('jenis_pengiriman')->update(['jenis_pengiriman' => 'eksternal']);
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_arsip') && Schema::hasColumn('surat_arsip', 'jenis_pengiriman')) {
            Schema::table('surat_arsip', fn (Blueprint $table) => $table->dropColumn('jenis_pengiriman'));
        }
    }
};
