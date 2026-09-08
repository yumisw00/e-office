<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_arsip', function (Blueprint $table) {
            $table->string('lokasi_fisik', 255)->nullable()->after('file_path');
        });
    }

    public function down(): void
    {
        Schema::table('surat_arsip', function (Blueprint $table) {
            $table->dropColumn('lokasi_fisik');
        });
    }
};
