<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('master_jenis_surat')) {
            return;
        }

        $now = now();
        $jenisSurat = [
            ['kode' => 'JS-UND', 'nama' => 'Surat Undangan', 'deskripsi' => 'Surat undangan kegiatan atau rapat.'],
            ['kode' => 'JS-TGS', 'nama' => 'Surat Tugas', 'deskripsi' => 'Surat penugasan pegawai.'],
            ['kode' => 'JS-SK', 'nama' => 'Surat Keputusan', 'deskripsi' => 'Surat keputusan atau penetapan.'],
            ['kode' => 'JS-EDR', 'nama' => 'Surat Edaran', 'deskripsi' => 'Surat edaran informasi resmi.'],
            ['kode' => 'JS-PBT', 'nama' => 'Surat Pemberitahuan', 'deskripsi' => 'Surat pemberitahuan resmi.'],
            ['kode' => 'JS-PMH', 'nama' => 'Surat Permohonan', 'deskripsi' => 'Surat permohonan.'],
            ['kode' => 'JS-PNG', 'nama' => 'Surat Pengantar', 'deskripsi' => 'Surat pengantar dokumen atau barang.'],
            ['kode' => 'JS-KTR', 'nama' => 'Surat Keterangan', 'deskripsi' => 'Surat keterangan administrasi.'],
        ];

        foreach ($jenisSurat as $jenis) {
            DB::table('master_jenis_surat')->updateOrInsert(
                ['kode' => $jenis['kode']],
                [...$jenis, 'is_active' => true, 'updated_at' => $now, 'created_at' => $now]
            );
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('master_jenis_surat')) {
            return;
        }

        DB::table('master_jenis_surat')
            ->whereIn('kode', ['JS-UND', 'JS-TGS', 'JS-SK', 'JS-EDR', 'JS-PBT', 'JS-PMH', 'JS-PNG', 'JS-KTR'])
            ->delete();
    }
};
