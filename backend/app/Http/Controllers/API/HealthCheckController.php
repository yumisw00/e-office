<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class HealthCheckController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $requiredTables = [
            'sys_user',
            'sys_group',
            'sys_menu',
            'sys_setting',
            'sys_session',
            'surat_masuk',
            'surat_keluar',
            'surat_template',
            'workflow_surat',
            'surat_distribusi',
            'surat_disposisi',
            'surat_approval',
            'surat_arsip',
            'sys_notification',
            'agenda_kegiatan',
            'pengumuman',
            'ai_document_job',
            'digital_signature',
            'audit_trail_immutable',
        ];

        try {
            $database = DB::selectOne('select current_database() as name');

            return response()->json([
                'success' => true,
                'status' => 'ok',
                'database' => [
                    'connected' => true,
                    'connection' => config('database.default'),
                    'name' => $database?->name,
                ],
                'tables' => collect($requiredTables)
                    ->mapWithKeys(fn ($table) => [$table => Schema::hasTable($table)])
                    ->all(),
            ]);
        } catch (Throwable $exception) {
            \Log::error('Health check failed: ' . $exception->getMessage(), [
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'status' => 'error',
                'database' => [
                    'connected' => false,
                    'connection' => config('database.default'),
                ],
                'message' => 'Database connection failed.',
            ], 500);
        }
    }
}
