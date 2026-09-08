<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add jenis_pengiriman column to surat_keluar to track whether a letter
     * is 'internal' (sent to another employee within the system) or 'eksternal'
     * (sent outside the organization).
     *
     * This column is required for the internal letter routing logic:
     * when jenis_pengiriman = 'internal', a corresponding surat_masuk entry
     * is created for the recipient.
     */
    public function up(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->string('jenis_pengiriman', 20)->nullable()->after('id_surat_keluar');
            $table->index('jenis_pengiriman');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->dropIndex(['jenis_pengiriman']);
            $table->dropColumn('jenis_pengiriman');
        });
    }
};
