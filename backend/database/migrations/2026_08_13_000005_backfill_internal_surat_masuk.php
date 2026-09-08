<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair internal letters created before the inbox-routing insert was
     * corrected. Each outgoing internal letter gets one linked inbox record
     * and one distribution to its selected recipient.
     */
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar') || !Schema::hasTable('surat_masuk') || !Schema::hasTable('surat_distribusi')) {
            return;
        }

        DB::table('surat_keluar as sk')
            ->leftJoin('surat_masuk as sm', 'sm.id_surat_keluar', '=', 'sk.id_surat_keluar')
            ->where('sk.jenis_pengiriman', 'internal')
            ->whereNotNull('sk.tujuan_id')
            ->whereNull('sk.deleted_at')
            ->whereNull('sm.id')
            ->select('sk.*')
            ->orderBy('sk.id_surat_keluar')
            ->chunkById(100, function ($letters): void {
                foreach ($letters as $letter) {
                    $now = now();
                    $senderName = DB::table('sys_user')->where('id_user', $letter->created_by)->value('name') ?: 'Internal';
                    $incomingId = DB::table('surat_masuk')->insertGetId([
                        'id_surat_keluar' => $letter->id_surat_keluar,
                        'nomor_surat' => $letter->nomor_surat,
                        'jenis' => 'internal',
                        'tanggal_surat' => $letter->tanggal_surat ?: $now->toDateString(),
                        'tanggal_terima' => $now->toDateString(),
                        'asal_surat' => $senderName,
                        'kepada_tujuan' => $letter->tujuan_nama,
                        'perihal' => $letter->perihal,
                        'isi_ringkasan' => $letter->ringkasan ?: $letter->isi_surat,
                        'file_surat' => $letter->file_draft_path ?: $letter->file_pdf_path,
                        'status' => 'manual_input',
                        'source_type' => 'Manual',
                        'ai_status' => 'belum_diproses',
                        'created_by' => $letter->created_by,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ], 'id');

                    DB::table('surat_distribusi')->insert([
                        'id_surat_masuk' => $incomingId,
                        'id_user_tujuan' => $letter->tujuan_id,
                        'status' => 'distributed',
                        'tanggal_distribusi' => $now,
                        'created_by' => $letter->created_by,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }, 'sk.id_surat_keluar', 'id_surat_keluar');
    }

    public function down(): void
    {
        // Derived inbox records are retained for auditability.
    }
};
