<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mt_sdm_jabatan', function (Blueprint $table) {
            $table->string('kode_jabatan', 50)->nullable()->after('nama');
            $table->string('level_jabatan', 20)->nullable()->after('kode_jabatan');
            $table->string('status', 20)->default('aktif')->after('level_jabatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mt_sdm_jabatan', function (Blueprint $table) {
            $table->dropColumn(['kode_jabatan', 'level_jabatan', 'status']);
        });
    }
};
