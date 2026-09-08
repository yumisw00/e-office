<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add id_surat_keluar column to surat_masuk to link internal letters
     * created from surat_keluar. This enables:
     * - Tracking the source of internal incoming letters
     * - Syncing status between surat_keluar and its corresponding surat_masuk
     * - Proper routing of internal letters to the recipient's surat masuk
     */
    public function up(): void
    {
        Schema::table('surat_masuk', function (Blueprint $table) {
            $table->unsignedBigInteger('id_surat_keluar')->nullable()->after('id');
            // One outgoing internal letter produces one derived incoming letter.
            $table->unique('id_surat_keluar');
        });

        // Add foreign key constraint if not SQLite
        if (DB::connection()->getDriverName() !== 'sqlite') {
            Schema::table('surat_masuk', function (Blueprint $table) {
                $table->foreign('id_surat_keluar')
                    ->references('id_surat_keluar')
                    ->on('surat_keluar')
                    ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_masuk', function (Blueprint $table) {
            $table->dropForeign(['id_surat_keluar']);
            $table->dropUnique(['id_surat_keluar']);
            $table->dropColumn('id_surat_keluar');
        });
    }
};
