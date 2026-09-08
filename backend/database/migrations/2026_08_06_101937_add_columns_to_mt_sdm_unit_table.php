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
        Schema::table('mt_sdm_unit', function (Blueprint $table) {
            $table->string('kode_unit', 50)->nullable()->after('nama');
            $table->string('id_parent', 50)->nullable()->after('kode_unit');
            $table->string('status', 20)->default('aktif')->after('id_parent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mt_sdm_unit', function (Blueprint $table) {
            $table->dropColumn(['kode_unit', 'id_parent', 'status']);
        });
    }
};
