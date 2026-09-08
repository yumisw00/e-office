<?php

namespace App\Console\Commands;

use App\Http\Controllers\API\BackupDatabaseController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'backup:database';

    protected $description = 'Membuat backup database PostgreSQL E-Office.';

    public function handle(): int
    {
        $response = app(BackupDatabaseController::class)->store(Request::create('/api/backup_database', 'POST'));
        $payload = json_decode($response->getContent(), true);

        if ($response->getStatusCode() >= 400 || empty($payload['success'])) {
            $this->error($payload['message'] ?? 'Backup database gagal dibuat.');
            if (!empty($payload['error'])) {
                $this->error($payload['error']);
            }

            return self::FAILURE;
        }

        $this->info($payload['message'] ?? 'Backup database berhasil dibuat.');
        $this->line($payload['data']['filename'] ?? '');

        return self::SUCCESS;
    }
}
