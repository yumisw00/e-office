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
        Schema::create('mt_sdm_pegawai', function (Blueprint $table) {
            $table->string('id_pegawai', 50)->primary();
            $table->string('nip', 50)->nullable();
            $table->string('nama', 200);
            $table->string('nama_unit', 200)->nullable();
            $table->string('id_unit', 50)->nullable();
            $table->string('nama_jabatan', 200)->nullable();
            $table->string('id_jabatan', 50)->nullable();
            $table->string('email', 200)->nullable();
            $table->string('telepon', 50)->nullable();
            $table->string('status', 20)->default('aktif');
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->string('created_by_desc', 200)->nullable();
            $table->string('updated_by_desc', 200)->nullable();
            $table->string('deleted_by_desc', 200)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mt_sdm_pegawai');
    }
};
