<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create mt_sdm_unit table
        if (!Schema::hasTable('mt_sdm_unit')) {
            Schema::create('mt_sdm_unit', function (Blueprint $table) {
                $table->string('id_unit', 50)->primary();
                $table->string('nama', 200);
                $table->timestamps();
            });
        }

        // Create mt_sdm_jabatan table
        if (!Schema::hasTable('mt_sdm_jabatan')) {
            Schema::create('mt_sdm_jabatan', function (Blueprint $table) {
                $table->string('position_id', 50)->primary();
                $table->string('nama_jabatan', 200);
                $table->string('id_unit', 50)->nullable();
                $table->integer('urutan')->nullable();
                $table->string('id_jabatan_parent', 50)->nullable();
                $table->string('superior_id', 50)->nullable();
                $table->timestamps();
            });
        }

        // Add id_jabatan to sys_user if missing
        if (Schema::hasTable('sys_user') && !Schema::hasColumn('sys_user', 'id_jabatan')) {
            Schema::table('sys_user', function (Blueprint $table) {
                $table->string('id_jabatan', 50)->nullable()->after('email');
            });
        }

        // Seed default units if empty
        if (Schema::hasTable('mt_sdm_unit') && DB::table('mt_sdm_unit')->count() === 0) {
            $units = [
                ['id_unit' => 'DIV-SDM', 'nama' => 'SDM / HRD'],
                ['id_unit' => 'DIV-KEU', 'nama' => 'Keuangan & Akuntansi'],
                ['id_unit' => 'DIV-OPS', 'nama' => 'Operasional & Produksi'],
                ['id_unit' => 'DIV-MKT', 'nama' => 'Pemasaran & Penjualan'],
            ];
            foreach ($units as $u) {
                DB::table('mt_sdm_unit')->insert([
                    'id_unit' => $u['id_unit'],
                    'nama' => $u['nama'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Seed default jabatan if empty
        if (Schema::hasTable('mt_sdm_jabatan') && DB::table('mt_sdm_jabatan')->count() === 0) {
            $positions = [
                ['position_id' => 'DIREKTUR', 'nama_jabatan' => 'Directeur', 'id_unit' => null, 'urutan' => 1],
                ['position_id' => 'MANKEU', 'nama_jabatan' => 'Manajer Keuangan', 'id_unit' => 'DIV-KEU', 'urutan' => 2],
                ['position_id' => 'PIMPINAN', 'nama_jabatan' => 'Pimpinan', 'id_unit' => null, 'urutan' => 3],
                ['position_id' => 'PEGAWAI', 'nama_jabatan' => 'Pegawai', 'id_unit' => null, 'urutan' => 4],
                ['position_id' => 'PEGAWAI_SDM', 'nama_jabatan' => 'SDM / HRD', 'id_unit' => 'DIV-SDM', 'urutan' => 10],
                ['position_id' => 'PEGAWAI_KEU', 'nama_jabatan' => 'Keuangan & Akuntansi', 'id_unit' => 'DIV-KEU', 'urutan' => 20],
                ['position_id' => 'PEGAWAI_OPS', 'nama_jabatan' => 'Operasional & Produksi', 'id_unit' => 'DIV-OPS', 'urutan' => 30],
                ['position_id' => 'PEGAWAI_MKT', 'nama_jabatan' => 'Pemasaran & Penjualan', 'id_unit' => 'DIV-MKT', 'urutan' => 40],
            ];
            foreach ($positions as $p) {
                DB::table('mt_sdm_jabatan')->insert([
                    'position_id' => $p['position_id'],
                    'nama_jabatan' => $p['nama_jabatan'],
                    'id_unit' => $p['id_unit'],
                    'urutan' => $p['urutan'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sys_user')) {
            Schema::table('sys_user', function (Blueprint $table) {
                if (Schema::hasColumn('sys_user', 'id_jabatan')) {
                    $table->dropColumn('id_jabatan');
                }
            });
        }
        Schema::dropIfExists('mt_sdm_jabatan');
        Schema::dropIfExists('mt_sdm_unit');
    }
};
