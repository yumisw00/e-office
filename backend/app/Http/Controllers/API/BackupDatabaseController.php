<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Process\Process;
use Throwable;

class BackupDatabaseController extends Controller
{
    private const BACKUP_DIRECTORY = 'backups';

    public function index(): JsonResponse
    {
        $this->ensureBackupDirectory();

        $files = collect(File::files($this->backupDirectoryPath()))
            ->filter(fn ($file) => $file->isFile() && strtolower($file->getExtension()) === 'sql')
            ->map(fn ($file) => $this->backupFilePayload($file->getFilename()))
            ->sortByDesc('created_at')
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $files,
            'result' => $files,
            'total_records' => count($files),
            'total' => count($files),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->ensureBackupDirectory();

            $filename = 'backup_' . now()->format('Y_m_d_His_u') . '.sql';
            $path = $this->backupDirectoryPath($filename);

            $this->runPgDump($path);

            return response()->json([
                'success' => true,
                'message' => 'Backup database berhasil dibuat.',
                'data' => $this->backupFilePayload($filename),
            ]);
        } catch (Throwable $exception) {
            Log::error('Backup database gagal dibuat.', [
                'exception' => $exception,
            ]);

            \Log::error('Backup database gagal: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Backup database gagal dibuat.',
            ], 500);
        }
    }

    public function download(string $filename): BinaryFileResponse|JsonResponse
    {
        $filename = basename($filename);

        if (!$this->isValidBackupFilename($filename)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama file backup tidak valid.',
            ], 422);
        }

        $path = $this->backupDirectoryPath($filename);
        if (!is_file($path)) {
            return response()->json([
                'success' => false,
                'message' => 'File backup tidak ditemukan.',
            ], 404);
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'application/sql',
        ]);
    }

    public function update(Request $request, string $filename): JsonResponse
    {
        $filename = basename($filename);
        $newFilename = basename((string) $request->input('filename'));

        if (!$this->isValidBackupFilename($filename) || !$this->isValidBackupFilename($newFilename)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama file backup harus berupa file .sql yang valid.',
            ], 422);
        }

        $sourcePath = $this->backupDirectoryPath($filename);
        $targetPath = $this->backupDirectoryPath($newFilename);

        if (!is_file($sourcePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File backup tidak ditemukan.',
            ], 404);
        }

        if ($filename !== $newFilename && is_file($targetPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama file backup sudah digunakan.',
            ], 422);
        }

        if ($filename !== $newFilename && !File::move($sourcePath, $targetPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama file backup gagal diubah.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Nama file backup berhasil diubah.',
            'data' => $this->backupFilePayload($newFilename),
        ]);
    }

    public function destroy(string $filename): JsonResponse
    {
        $filename = basename($filename);

        if (!$this->isValidBackupFilename($filename)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama file backup tidak valid.',
            ], 422);
        }

        $path = $this->backupDirectoryPath($filename);
        if (!is_file($path)) {
            return response()->json([
                'success' => false,
                'message' => 'File backup tidak ditemukan.',
            ], 404);
        }

        if (!File::delete($path)) {
            return response()->json([
                'success' => false,
                'message' => 'File backup gagal dihapus.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'File backup berhasil dihapus.',
        ]);
    }

    private function runPgDump(string $outputPath): void
    {
        $connectionName = config('database.default');
        $connection = config("database.connections.{$connectionName}");

        if (($connection['driver'] ?? null) !== 'pgsql') {
            throw new \RuntimeException('Backup database saat ini hanya mendukung koneksi PostgreSQL.');
        }

        $database = $connection['database'] ?? null;
        if (!$database) {
            throw new \RuntimeException('Nama database PostgreSQL belum dikonfigurasi.');
        }

        $pgDumpPath = $this->pgDumpBinary();
        $host = $connection['host'] ?? '127.0.0.1';
        $port = $connection['port'] ?? '5432';
        $username = $connection['username'] ?? 'postgres';
        $password = $connection['password'] ?? '';

        // PostgreSQL 18 needs HOME set to a writable user directory.
        // When run via Apache service, HOME is often empty or points to a
        // system directory causing "could not generate restrict key" error.
        // We use the Laravel storage temp dir which Apache can write to.
        $workDir = storage_path('app/.pgdump_tmp');
        if (!is_dir($workDir)) {
            File::makeDirectory($workDir, 0755, true);
        }

        // Create pgpass.conf: hostname:port:database:username:password
        $pgpassContent = "{$host}:{$port}:{$database}:{$username}:{$password}\n";
        $pgpassFile = $workDir . DIRECTORY_SEPARATOR . 'pgpass.conf';
        File::put($pgpassFile, $pgpassContent);

        // Set environment variables for the pg_dump process
        $env = array_merge(getenv(), [
            'HOME' => $workDir,
            'USERPROFILE' => $workDir,
            'TMP' => $workDir,
            'TEMP' => $workDir,
            'PGPASSFILE' => $pgpassFile,
            'PGPASSWORD' => $password,
        ]);

        // Build the pg_dump command
        $command = [
            $pgDumpPath,
            '--host=' . $host,
            '--port=' . $port,
            '--username=' . $username,
            '--format=plain',
            '--no-owner',
            '--no-privileges',
            '--file=' . $outputPath,
            $database,
        ];

        $process = new Process($command, base_path(), $env, null, (float) env('BACKUP_DATABASE_TIMEOUT', 300));
        $process->run();

        // Clean up pgpass.conf after use (contains password)
        @File::delete($pgpassFile);

        if (!$process->isSuccessful()) {
            if (is_file($outputPath)) {
                File::delete($outputPath);
            }

            $error = trim($process->getErrorOutput() ?: $process->getOutput());
            throw new \RuntimeException($error ?: 'Perintah pg_dump gagal dijalankan.');
        }
    }

    private function pgDumpBinary(): string
    {
        $configured = env('BACKUP_PG_DUMP_PATH') ?: env('PG_DUMP_PATH');
        if ($configured && is_file($configured)) {
            return $configured;
        }

        foreach ($this->pgDumpCandidates() as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return 'pg_dump';
    }

    private function pgDumpCandidates(): array
    {
        $candidates = [];
        foreach (['C:\\Program Files\\PostgreSQL\\*\\bin\\pg_dump.exe', 'C:\\Program Files (x86)\\PostgreSQL\\*\\bin\\pg_dump.exe'] as $pattern) {
            $matches = glob($pattern) ?: [];
            rsort($matches);
            $candidates = array_merge($candidates, $matches);
        }

        return $candidates;
    }

    private function backupFilePayload(string $filename): array
    {
        $path = $this->backupDirectoryPath($filename);

        return [
            'filename' => $filename,
            'path' => 'storage/backups/' . $filename,
            'size' => is_file($path) ? filesize($path) : 0,
            'created_at' => is_file($path) ? date('Y-m-d H:i:s', filemtime($path)) : now()->format('Y-m-d H:i:s'),
        ];
    }

    private function backupDirectoryPath(?string $filename = null): string
    {
        $path = storage_path('app/' . self::BACKUP_DIRECTORY);

        return $filename ? $path . DIRECTORY_SEPARATOR . $filename : $path;
    }

    private function isValidBackupFilename(string $filename): bool
    {
        return preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*\.sql$/', $filename) === 1;
    }

    private function ensureBackupDirectory(): void
    {
        if (!is_dir($this->backupDirectoryPath())) {
            File::makeDirectory($this->backupDirectoryPath(), 0755, true);
        }
    }
}
