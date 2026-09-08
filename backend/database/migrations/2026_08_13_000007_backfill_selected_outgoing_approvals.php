<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Queue existing drafts for the examiner and signer chosen on the letter.
     * Earlier logic incorrectly used the recipient as the approver.
     */
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar') || !Schema::hasTable('surat_approval')
            || !Schema::hasColumn('surat_keluar', 'id_penandatangan')) {
            return;
        }

        DB::table('surat_keluar as sk')
            ->whereNull('sk.deleted_at')
            ->where('sk.status', 'draft')
            ->whereNotNull('sk.id_penandatangan')
            ->whereNotExists(function ($query): void {
                $query->selectRaw('1')
                    ->from('surat_approval as sa')
                    ->whereColumn('sa.id_surat_keluar', 'sk.id_surat_keluar')
                    ->whereNull('sa.deleted_at');
            })
            ->select('sk.id_surat_keluar', 'sk.id_pemeriksa', 'sk.id_penandatangan', 'sk.created_by')
            ->orderBy('sk.id_surat_keluar')
            ->get()
            ->each(function ($letter): void {
                $approvers = collect([$letter->id_pemeriksa, $letter->id_penandatangan])
                    ->filter()
                    ->map(fn ($userId) => (int) $userId)
                    ->reject(fn ($userId) => $userId === (int) $letter->created_by)
                    ->unique()
                    ->values();

                if ($approvers->isEmpty()) {
                    return;
                }

                $now = now();
                DB::transaction(function () use ($letter, $approvers, $now): void {
                    DB::table('surat_approval')->insert($approvers->map(fn ($approverId, $index) => [
                        'id_surat_keluar' => $letter->id_surat_keluar,
                        'id_approver' => $approverId,
                        'urutan' => $index + 1,
                        'status' => $index === 0 ? 'waiting' : 'pending',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->all());

                    DB::table('surat_keluar')->where('id_surat_keluar', $letter->id_surat_keluar)->update([
                        'status' => 'submitted',
                        'updated_at' => $now,
                    ]);
                });
            });
    }

    public function down(): void
    {
        // Approval history is retained for auditability.
    }
};
