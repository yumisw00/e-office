<?php

namespace App\Observers;

use App\Models\SuratKeluar;
use Illuminate\Support\Facades\DB;

/**
 * Keeps the related surat_masuk status in sync when a surat_keluar changes status.
 * Internal letters (jenis_pengiriman = 'internal') create a corresponding surat_masuk
 * entry. When the outgoing letter advances through its workflow (approved, signed, sent),
 * the incoming letter status should reflect that progress.
 */
class SuratKeluarObserver
{
    /**
     * Map surat_keluar status values to their corresponding surat_masuk status.
     */
    private function getSuratMasukStatus(string $suratKeluarStatus): ?string
    {
        $map = [
            'signed' => 'dikirim',
            'sent' => 'dikirim',
            'dikirim' => 'dikirim',
            'selesai' => 'selesai',
            'archived' => 'diarsipkan',
        ];

        return $map[$suratKeluarStatus] ?? null;
    }

    /**
     * Handle the SuratKeluar "updating" event.
     * Called before the update is committed so we can compare old vs new status.
     */
    public function updating(SuratKeluar $suratKeluar): void
    {
        $originalStatus = $suratKeluar->getOriginal('status');
        $newStatus = $suratKeluar->status;

        // Only sync if the status actually changed
        if ($originalStatus === $newStatus) {
            return;
        }

        $suratMasukStatus = $this->getSuratMasukStatus($newStatus);
        if ($suratMasukStatus === null) {
            return;
        }

        // Find the related surat_masuk by id_surat_keluar and update its status
        try {
            DB::table('surat_masuk')
                ->where('id_surat_keluar', $suratKeluar->id_surat_keluar)
                ->whereNull('deleted_at')
                ->update([
                    'status' => $suratMasukStatus,
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
            \Log::warning('Observer: gagal sync status surat_masuk: ' . $e->getMessage());
        }
    }
}
