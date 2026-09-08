<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_keluar') && !Schema::hasColumn('surat_keluar', 'sifat')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->string('sifat', 100)->nullable()->after('klasifikasi');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_keluar') && Schema::hasColumn('surat_keluar', 'sifat')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->dropColumn('sifat');
            });
        }
    }
};
