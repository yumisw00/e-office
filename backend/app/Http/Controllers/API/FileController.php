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
        $request = request();
        $user = $request->user('sanctum') ?? $request->user() ?? auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $userId = (int) ($user->id_user ?? $user->id ?? 0);

        $path = trim(str_replace('\\', '/', $path), '/');

        if ($path === '' || str_contains($path, '..')) {
            return response()->json([
                'success' => false,
                'message' => 'Path file tidak valid.',
            ], 422);
        }

        if (!$this->canAccessFile($path, $userId)) {
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

    private function canAccessFile(string $path, int $userId): bool
    {
        if (!$userId) {
            return false;
        }

        $incoming = DB::table('surat_masuk')
            ->where('file_surat', $path)->whereNull('deleted_at')->first();
        if ($incoming) {
            return $this->hasGlobalAccess('surat_masuk', 'edit', $userId)
                || (int) $incoming->created_by === (int) $userId
                || DB::table('surat_distribusi')->where('id_surat_masuk', $incoming->id)->where('id_user_tujuan', $userId)->whereNull('deleted_at')->exists()
                || DB::table('surat_disposisi')->where('id_surat_masuk', $incoming->id)->where(function ($query) use ($userId) {
                    $query->where('id_penerima', $userId)->orWhere('id_pemberi', $userId);
                })->whereNull('deleted_at')->exists();
        }

        $outgoing = DB::table('surat_keluar')->whereNull('deleted_at')
            ->where(function ($query) use ($path) {
                $query->where('file_draft_path', $path)
                    ->orWhere('file_pdf_path', $path)
                    ->orWhere('lampiran_path', $path);
            })->first();
        if ($outgoing) {
            return $this->hasGlobalAccess('surat_keluar', 'edit', $userId)
                || (int) $outgoing->created_by === (int) $userId
                || DB::table('surat_approval')->where('id_surat_keluar', $outgoing->id_surat_keluar)->where('id_approver', $userId)->whereNull('deleted_at')->exists();
        }

        $signature = DB::table('digital_signature')->where('signature_path', $path)->whereNull('deleted_at')->first();
        if ($signature && in_array($signature->source_type, ['surat_keluar', 'surat_keluar_approval'], true)) {
            $surat = DB::table('surat_keluar')->where('id_surat_keluar', $signature->source_id)->whereNull('deleted_at')->first();
            if ($surat) {
                return $this->hasGlobalAccess('surat_keluar', 'edit', $userId)
                    || (int) $surat->created_by === (int) $userId
                    || DB::table('surat_approval')->where('id_surat_keluar', $surat->id_surat_keluar)->where('id_approver', $userId)->whereNull('deleted_at')->exists();
            }
        }

        $disposition = DB::table('surat_disposisi')->where('file_bukti_path', $path)->whereNull('deleted_at')->first();
        if ($disposition) {
            return $this->hasGlobalAccess('disposisi', 'edit', $userId)
                || (int) $disposition->id_penerima === (int) $userId
                || (int) $disposition->id_pemberi === (int) $userId;
        }

        $archive = DB::table('surat_arsip')
            ->where('file_path', $path)
            ->whereNull('deleted_at')
            ->first();

        if ($archive) {
            if ($this->hasGlobalAccess('surat_arsip', 'index', $userId)) {
                return true;
            }

            if (!empty($archive->id_surat_masuk)) {
                $incoming = DB::table('surat_masuk')
                    ->where('id', $archive->id_surat_masuk)
                    ->whereNull('deleted_at')
                    ->first();
                if ($incoming) {
                    return (int) $incoming->created_by === $userId
                        || DB::table('surat_distribusi')->where('id_surat_masuk', $incoming->id)->where('id_user_tujuan', $userId)->whereNull('deleted_at')->exists()
                        || DB::table('surat_disposisi')->where('id_surat_masuk', $incoming->id)->where(function ($query) use ($userId) {
                            $query->where('id_penerima', $userId)->orWhere('id_pemberi', $userId);
                        })->whereNull('deleted_at')->exists();
                }
            }

            if (!empty($archive->id_surat_keluar)) {
                $outgoing = DB::table('surat_keluar')
                    ->where('id_surat_keluar', $archive->id_surat_keluar)
                    ->whereNull('deleted_at')
                    ->first();
                if ($outgoing) {
                    return (int) $outgoing->created_by === $userId
                        || DB::table('surat_keluar_penerima')->where('id_surat_keluar', $outgoing->id_surat_keluar)->where('id_user', $userId)->exists()
                        || DB::table('surat_approval')->where('id_surat_keluar', $outgoing->id_surat_keluar)->where('id_approver', $userId)->whereNull('deleted_at')->exists();
                }
            }

            return false;
        }

        return DB::table('surat_template')->where('file_path', $path)->whereNull('deleted_at')->exists()
            && $this->hasGlobalAccess('surat_template', 'index', $userId);
    }

    private function hasGlobalAccess(string $menu, string $action, int $userId): bool
    {
        $request = request();
        $activeGroupId = $request->hasSession() ? $request->session()->get('id_group') : null;
        $groupIds = $activeGroupId
            ? collect([$activeGroupId])
            : DB::table('sys_user_group')
                ->where('id_user', $userId)
                ->whereNull('deleted_at')
                ->pluck('id_group');

        return $groupIds->contains(fn ($groupId) => (new SysAction())->access($action, $menu, $groupId) > 0);
    }
}
