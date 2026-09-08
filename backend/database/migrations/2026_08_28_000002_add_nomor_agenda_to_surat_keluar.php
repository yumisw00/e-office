<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('surat_keluar', 'nomor_agenda')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->string('nomor_agenda', 100)->nullable()->unique()->after('id_surat_keluar');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('surat_keluar', 'nomor_agenda')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->dropUnique(['nomor_agenda']);
                $table->dropColumn('nomor_agenda');
            });
        }
    }
};
