<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/** Stores in-app notifications consumed by the E-Office notification menu. */
class EOfficeNotificationService
{
    public function send(int $userId, string $title, ?string $message = null, ?string $url = null, array $payload = []): void
    {
        if ($userId <= 0) {
            return;
        }

        try {
            DB::table('sys_notification')->insert([
                'id_user' => $userId,
                'channel' => 'eoffice',
                'title' => $title,
                'message' => $message,
                'url' => $url,
                'payload' => json_encode($payload),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            app(FirebasePushService::class)->sendToUser($userId, $title, $message, $payload + ['url' => $url]);
            app(FirebasePushService::class)->sendToUser($userId, $title, $message, $payload + ['url' => $url]);
        } catch (\Throwable $exception) {
            // A notification must never undo a completed workflow action.
            Log::warning('Gagal membuat notifikasi E-Office.', [
                'id_user' => $userId,
                'title' => $title,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
