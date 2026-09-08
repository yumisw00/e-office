<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Copy the available outgoing document reference to already-routed
     * internal inbox letters. This includes template-only Google Drive links.
     */
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar')
            || !Schema::hasTable('surat_masuk')
            || !Schema::hasColumn('surat_masuk', 'id_surat_keluar')) {
            return;
        }

        DB::table('surat_masuk as sm')
            ->join('surat_keluar as sk', 'sk.id_surat_keluar', '=', 'sm.id_surat_keluar')
            ->where('sm.jenis', 'internal')
            ->whereNull('sm.deleted_at')
            ->whereNull('sk.deleted_at')
            ->where(function ($query): void {
                $query->whereNull('sm.file_surat')->orWhere('sm.file_surat', '');
            })
            ->select('sm.id', 'sk.file_draft_path', 'sk.file_pdf_path', 'sk.lampiran_path', 'sk.google_drive_document_url', 'sk.office365_document_url')
            ->orderBy('sm.id')
            ->chunkById(100, function ($letters): void {
                foreach ($letters as $letter) {
                    $attachment = collect([
                        $letter->file_draft_path,
                        $letter->file_pdf_path,
                        $letter->lampiran_path,
                        $letter->google_drive_document_url,
                        $letter->office365_document_url,
                    ])->filter(fn ($value) => is_string($value) && trim($value) !== '')->first();

                    if ($attachment) {
                        DB::table('surat_masuk')->where('id', $letter->id)->update([
                            'file_surat' => trim($attachment),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }, 'sm.id', 'id');
    }

    public function down(): void
    {
        // Keep copied attachment references for auditability.
    }
};
