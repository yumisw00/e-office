<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Older outgoing letters were saved before created_by was included in the
     * frontend payload. The immutable audit log retains the original creator,
     * so restore that ownership rather than exposing those letters to all users.
     */
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar') || !Schema::hasTable('sys_log')) {
            return;
        }

        DB::table('sys_log')
            ->where('table_name', 'surat_keluar')
            ->where('action', 'insert')
            ->orderBy('id_log')
            ->chunkById(200, function ($logs): void {
                foreach ($logs as $log) {
                    $data = json_decode((string) $log->data, true);
                    $suratId = $data['id_surat_keluar'] ?? null;
                    $creatorId = $data['created_by'] ?? null;

                    if (!$suratId || !$creatorId) {
                        continue;
                    }

                    DB::table('surat_keluar')
                        ->where('id_surat_keluar', $suratId)
                        ->whereNull('created_by')
                        ->update([
                            'created_by' => $creatorId,
                            'created_by_desc' => $data['created_by_desc'] ?? $log->user_desc,
                            'updated_at' => now(),
                        ]);
                }
            }, 'id_log');
    }

    public function down(): void
    {
        // Ownership reconstructed from the immutable audit log is retained.
    }
};
