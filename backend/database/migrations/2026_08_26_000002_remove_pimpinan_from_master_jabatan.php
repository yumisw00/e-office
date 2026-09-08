<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('mt_sdm_jabatan')) {
            return;
        }

        $jabatanIds = DB::table('mt_sdm_jabatan')
            ->where('position_id', 'PIMPINAN')
            ->orWhereRaw("LOWER(COALESCE(nama, '')) IN (?, ?)", ['direksi / pimpinan', 'direksi/pimpinan'])
            ->pluck('id_jabatan');

        if ($jabatanIds->isEmpty()) {
            return;
        }

        if (Schema::hasTable('sys_user_group')) {
            DB::table('sys_user_group')
                // Database lama memakai tipe id_jabatan yang berbeda antara
                // tabel jabatan dan relasi pengguna (integer/varchar).
                // Bandingkan sebagai teks agar nilai legacy seperti PIMPINAN
                // tidak dipaksa menjadi integer oleh PostgreSQL.
                ->whereIn(DB::raw('CAST(id_jabatan AS TEXT)'), $jabatanIds->map(fn ($id) => (string) $id)->all())
                ->update(['id_jabatan' => null, 'updated_at' => now()]);
        }

        DB::table('mt_sdm_jabatan')
            ->whereIn('id_jabatan', $jabatanIds)
            ->delete();
    }

    public function down(): void
    {
        // Penghapusan master jabatan tidak dikembalikan otomatis karena role
        // Pimpinan kini dikelola melalui sys_group, bukan master jabatan.
    }
};
