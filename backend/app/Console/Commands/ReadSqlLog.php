<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ReadSqlLog extends Command
{
    protected $signature = 'log:sql';
    protected $description = 'Membaca seluruh file sql_log.txt dari awal, lalu mengikuti perubahan (seperti tail -f plus semua isi awal)';


    public function handle()
    {
        $file = env('SQL_LOG', 'sql_log');
        $filePath = storage_path('logs/' . $file . '.txt');

        File::put($filePath, '');
        $this->info("Menunggu perubahan...\nTekan Ctrl+C untuk keluar.\n");

        $lastModified = filemtime($filePath);
        $lastContent = '';

        while (true) {
            clearstatcache(true, $filePath);

            if (!file_exists($filePath)) {
                usleep(50000);
                continue;
            }

            $currentModified = filemtime($filePath);

            if ($currentModified !== $lastModified) {
                $currentContent = File::get($filePath);

                $newContent = str_replace('"', "", $currentContent);

                $lines = array_filter(explode("\n", $newContent), fn($line) => trim($line) !== '');
                foreach ($lines as $line) {
                    $this->line(rtrim($line));
                }

                $lastContent = $currentContent;
                $lastModified = $currentModified;
            }

            usleep(50000); // 50ms
        }

        return 0;
    }
    /*
    public function handle()
    {
        $filePath = storage_path('logs/sql_log.txt');
        File::put($filePath, '');

        if (!File::exists($filePath)) {
            $this->error('File sql_log.txt tidak ditemukan.');
            return 1;
        }

        $this->info("Tekan Ctrl+C untuk keluar.\n");

        $position = 0;

        while (true) {
            clearstatcache(true, $filePath);

            $size = filesize($filePath);

            if ($size < $position) {
                // File di-reset (dibersihkan)
                $position = 0;
            }

            $file = fopen($filePath, 'r');

            if ($file === false) {
                $this->error("Gagal membuka file.");
                return 1;
            }

            fseek($file, $position);

            while (!feof($file)) {
                $line = fgets($file);
                if ($line !== false) {
                    $this->line(rtrim($line)); // rtrim untuk buang newline ganda
                }
            }

            $position = ftell($file);
            fclose($file);

            usleep(500000); // 0.5 detik
        }

        return 0;
    }
    */
}
