<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar') || !Schema::hasTable('surat_approval')) {
            return;
        }

        // Some legacy user-group rows use numeric position IDs while the
        // current master uses codes. Match the designated Pimpinan account by
        // its existing user label as a compatibility fallback.
        $drafts = DB::table('surat_keluar')
            ->join('sys_user as tujuan', 'surat_keluar.tujuan_id', '=', 'tujuan.id_user')
            ->whereNull('surat_keluar.deleted_at')
            ->where('surat_keluar.status', 'draft')
            ->whereRaw("LOWER(COALESCE(tujuan.name, '')) LIKE ?", ['%pimpinan%'])
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('surat_approval')
                    ->whereColumn('surat_approval.id_surat_keluar', 'surat_keluar.id_surat_keluar')
                    ->whereNull('surat_approval.deleted_at');
            })
            ->select('surat_keluar.id_surat_keluar', 'surat_keluar.tujuan_id')
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

            DB::table('surat_keluar')->where('id_surat_keluar', $draft->id_surat_keluar)->update([
                'status' => 'submitted',
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Workflow rows may already have been processed; leave them intact.
    }
};
