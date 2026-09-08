<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Draft lama yang ditujukan langsung ke Pimpinan dibuat sebelum alur
     * submit otomatis tersedia, sehingga belum memiliki baris approval.
     */
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar') || !Schema::hasTable('surat_approval')) {
            return;
        }

        $drafts = DB::table('surat_keluar')
            ->join('sys_user_group', 'surat_keluar.tujuan_id', '=', 'sys_user_group.id_user')
            ->join('mt_sdm_jabatan', function ($join) {
                $join->on(
                    DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'),
                    '=',
                    DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)')
                );
            })
            ->whereNull('surat_keluar.deleted_at')
            ->where('surat_keluar.status', 'draft')
            ->where(function ($query) {
                $query->whereRaw("LOWER(COALESCE(mt_sdm_jabatan.nama, '')) LIKE ?", ['%pimpinan%'])
                    ->orWhereRaw("LOWER(COALESCE(mt_sdm_jabatan.nama, '')) LIKE ?", ['%direksi%']);
            })
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('surat_approval')
                    ->whereColumn('surat_approval.id_surat_keluar', 'surat_keluar.id_surat_keluar')
                    ->whereNull('surat_approval.deleted_at');
            })
            ->select('surat_keluar.id_surat_keluar', 'surat_keluar.tujuan_id')
            ->distinct()
            ->get();

        foreach ($drafts as $draft) {
            DB::table('surat_approval')->insert([
                'id_surat_keluar' => $draft->id_surat_keluar,
                'id_approver' => $draft->tujuan_id,
                'urutan' => 1,
                'status' => 'waiting',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('surat_keluar')
                ->where('id_surat_keluar', $draft->id_surat_keluar)
                ->update([
                    'status' => 'submitted',
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        // The backfilled rows are business workflow records; do not remove
        // them automatically after they may have been acted upon.
    }
};
