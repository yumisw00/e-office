<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('master_jenis_surat')) {
            Schema::create('master_jenis_surat', function (Blueprint $table) {
                $table->bigIncrements('id_jenis_surat');
                $table->string('kode', 50)->unique();
                $table->string('nama', 150);
                $table->text('deskripsi')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('deleted_by')->nullable();
                $table->string('created_by_desc', 200)->nullable();
                $table->string('updated_by_desc', 200)->nullable();
                $table->string('deleted_by_desc', 200)->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasColumn('surat_masuk', 'id_penerima')) {
            Schema::table('surat_masuk', function (Blueprint $table) {
                $table->unsignedBigInteger('id_penerima')->nullable()->index();
            });
        }

        if (!Schema::hasColumn('surat_masuk', 'jenis_pengiriman')) {
            Schema::table('surat_masuk', function (Blueprint $table) {
                $table->string('jenis_pengiriman', 20)->nullable()->index();
            });
        }

        if (!Schema::hasColumn('surat_disposisi', 'jenis_pengiriman')) {
            Schema::table('surat_disposisi', function (Blueprint $table) {
                $table->string('jenis_pengiriman', 20)->default('internal')->index();
            });
        }

        if (!Schema::hasColumn('pengumuman', 'expired_at')) {
            Schema::table('pengumuman', function (Blueprint $table) {
                $table->timestamp('expired_at')->nullable()->index();
            });
        }

        if (!Schema::hasTable('surat_keluar_penerima')) {
            Schema::create('surat_keluar_penerima', function (Blueprint $table) {
                $table->bigIncrements('id_surat_keluar_penerima');
                $table->unsignedBigInteger('id_surat_keluar');
                $table->unsignedBigInteger('id_user');
                $table->timestamps();
                $table->unique(['id_surat_keluar', 'id_user'], 'sk_penerima_unique');
                $table->index('id_user');
            });
        }

        if (!Schema::hasTable('surat_keluar_tembusan')) {
            Schema::create('surat_keluar_tembusan', function (Blueprint $table) {
                $table->bigIncrements('id_surat_keluar_tembusan');
                $table->unsignedBigInteger('id_surat_keluar');
                $table->unsignedBigInteger('id_user');
                $table->timestamps();
                $table->unique(['id_surat_keluar', 'id_user'], 'sk_tembusan_unique');
                $table->index('id_user');
            });
        }

        if (!Schema::hasTable('pengumuman_divisi')) {
            Schema::create('pengumuman_divisi', function (Blueprint $table) {
                $table->bigIncrements('id_pengumuman_divisi');
                $table->unsignedBigInteger('id_pengumuman');
                $table->string('id_divisi', 100);
                $table->timestamps();
                $table->unique(['id_pengumuman', 'id_divisi'], 'pengumuman_divisi_unique');
                $table->index('id_divisi');
            });
        }

        DB::table('surat_masuk')->whereNull('jenis_pengiriman')->update([
            'jenis_pengiriman' => DB::raw("CASE WHEN id_surat_keluar IS NOT NULL OR LOWER(COALESCE(jenis, '')) = 'internal' THEN 'internal' ELSE 'eksternal' END"),
        ]);

        DB::statement(<<<'SQL'
            UPDATE surat_masuk sm
            SET id_penerima = sd.id_user_tujuan
            FROM (
                SELECT DISTINCT ON (id_surat_masuk) id_surat_masuk, id_user_tujuan
                FROM surat_distribusi
                WHERE deleted_at IS NULL AND id_user_tujuan IS NOT NULL
                ORDER BY id_surat_masuk, created_at DESC NULLS LAST
            ) sd
            WHERE sm.id = sd.id_surat_masuk AND sm.id_penerima IS NULL
        SQL);

        DB::statement(<<<'SQL'
            INSERT INTO surat_keluar_penerima (id_surat_keluar, id_user, created_at, updated_at)
            SELECT id_surat_keluar, tujuan_id, NOW(), NOW()
            FROM surat_keluar
            WHERE deleted_at IS NULL AND jenis_pengiriman = 'internal' AND tujuan_id IS NOT NULL
            ON CONFLICT (id_surat_keluar, id_user) DO NOTHING
        SQL);

        DB::statement(<<<'SQL'
            UPDATE surat_arsip duplicate
            SET deleted_at = NOW(), updated_at = NOW()
            FROM surat_arsip keeper
            WHERE duplicate.jenis_surat = 'surat_masuk'
              AND keeper.jenis_surat = duplicate.jenis_surat
              AND keeper.id_surat_masuk = duplicate.id_surat_masuk
              AND keeper.deleted_at IS NULL
              AND duplicate.deleted_at IS NULL
              AND keeper.id_surat_arsip < duplicate.id_surat_arsip
        SQL);

        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS surat_arsip_masuk_active_unique ON surat_arsip (id_surat_masuk) WHERE jenis_surat = 'surat_masuk' AND deleted_at IS NULL AND id_surat_masuk IS NOT NULL");
        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS surat_arsip_keluar_active_unique ON surat_arsip (id_surat_keluar) WHERE jenis_surat = 'surat_keluar' AND deleted_at IS NULL AND id_surat_keluar IS NOT NULL");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS surat_arsip_masuk_active_unique');
        DB::statement('DROP INDEX IF EXISTS surat_arsip_keluar_active_unique');

        Schema::dropIfExists('pengumuman_divisi');
        Schema::dropIfExists('surat_keluar_tembusan');
        Schema::dropIfExists('surat_keluar_penerima');
        Schema::dropIfExists('master_jenis_surat');

        if (Schema::hasColumn('pengumuman', 'expired_at')) {
            Schema::table('pengumuman', fn (Blueprint $table) => $table->dropColumn('expired_at'));
        }
        if (Schema::hasColumn('surat_disposisi', 'jenis_pengiriman')) {
            Schema::table('surat_disposisi', fn (Blueprint $table) => $table->dropColumn('jenis_pengiriman'));
        }
        if (Schema::hasColumn('surat_masuk', 'jenis_pengiriman')) {
            Schema::table('surat_masuk', fn (Blueprint $table) => $table->dropColumn('jenis_pengiriman'));
        }
        if (Schema::hasColumn('surat_masuk', 'id_penerima')) {
            Schema::table('surat_masuk', fn (Blueprint $table) => $table->dropColumn('id_penerima'));
        }
    }
};
