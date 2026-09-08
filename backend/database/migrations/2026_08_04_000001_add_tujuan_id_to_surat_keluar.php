<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            if (!Schema::hasColumn('surat_keluar', 'tujuan_id')) {
                Schema::table('surat_keluar', function (Blueprint $table) {
                    $table->unsignedBigInteger('tujuan_id')->nullable()->after('perihal');
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            if (Schema::hasColumn('surat_keluar', 'tujuan_id')) {
                Schema::table('surat_keluar', function (Blueprint $table) {
                    $table->dropColumn('tujuan_id');
                });
            }
        }
    }
};
