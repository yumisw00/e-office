<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SysAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FileController extends Controller
{
    public function show(string $path): BinaryFileResponse|JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $path = trim(str_replace('\\', '/', $path), '/');

        if ($path === '' || str_contains($path, '..')) {
            return response()->json([
                'success' => false,
                'message' => 'Path file tidak valid.',
            ], 422);
        }

        if (!$this->canAccessFile($path)) {
            // Do not disclose whether a protected file exists.
            return response()->json(['message' => 'Not found.'], 404);
        }

        foreach ($this->candidatePaths($path) as $candidate) {
            $resolved = realpath($candidate);

            if ($resolved && is_file($resolved) && $this->isAllowedPath($resolved)) {
                return response()->file($resolved, [
                    'Content-Type' => mime_content_type($resolved) ?: 'application/octet-stream',
                    'Content-Disposition' => 'inline; filename="' . basename($resolved) . '"',
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'File tidak ditemukan.',
            'path' => $path,
        ], 404);
    }

    private function candidatePaths(string $path): array
    {
        return [
            storage_path('app/' . $path),
            storage_path('app/public/' . $path),
            public_path('storage/' . $path),
        ];
    }

    private function isAllowedPath(string $path): bool
    {
        foreach ($this->allowedRoots() as $root) {
            if ($root && str_starts_with($path, $root . DIRECTORY_SEPARATOR)) {
                return true;
            }
        }

        return false;
    }

    private function allowedRoots(): array
    {
        return array_filter([
            realpath(storage_path('app')),
            realpath(storage_path('app/public')),
            realpath(public_path('storage')),
        ]);
    }

    private function canAccessFile(string $path): bool
    {
        $userId = auth()->user()?->id_user;
        if (!$userId) {
            return false;
        }

        $incoming = DB::table('surat_masuk')
            ->where('file_surat', $path)->whereNull('deleted_at')->first();
        if ($incoming) {
            return $this->hasGlobalAccess('surat_masuk', 'edit')
                || (int) $incoming->created_by === (int) $userId
                || DB::table('surat_distribusi')->where('id_surat_masuk', $incoming->id)->where('id_user_tujuan', $userId)->whereNull('deleted_at')->exists()
                || DB::table('surat_disposisi')->where('id_surat_masuk', $incoming->id)->where(function ($query) use ($userId) {
                    $query->where('id_penerima', $userId)->orWhere('id_pemberi', $userId);
                })->whereNull('deleted_at')->exists();
        }

        $outgoing = DB::table('surat_keluar')->whereNull('deleted_at')
            ->where(function ($query) use ($path) {
                $query->where('file_draft_path', $path)->orWhere('file_pdf_path', $path);
            })->first();
        if ($outgoing) {
            return $this->hasGlobalAccess('surat_keluar', 'edit')
                || (int) $outgoing->created_by === (int) $userId
                || DB::table('surat_approval')->where('id_surat_keluar', $outgoing->id_surat_keluar)->where('id_approver', $userId)->whereNull('deleted_at')->exists();
        }

        $disposition = DB::table('surat_disposisi')->where('file_bukti_path', $path)->whereNull('deleted_at')->first();
        if ($disposition) {
            return $this->hasGlobalAccess('disposisi', 'edit')
                || (int) $disposition->id_penerima === (int) $userId
                || (int) $disposition->id_pemberi === (int) $userId;
        }

        $archive = DB::table('surat_arsip')->where('file_path', $path)->whereNull('deleted_at')->first();
        if ($archive) {
            return $this->hasGlobalAccess('surat_arsip', 'edit') || (int) $archive->created_by === (int) $userId;
        }

        return DB::table('surat_template')->where('file_path', $path)->whereNull('deleted_at')->exists()
            && $this->hasGlobalAccess('surat_template', 'index');
    }

    private function hasGlobalAccess(string $menu, string $action): bool
    {
        $groupId = session('id_group');

        return $groupId && (new SysAction())->access($action, $menu, $groupId) > 0;
    }
}
