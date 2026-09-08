<?php

namespace App\Http\Middleware;

use App\Traits\SqlLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AksesMenu
{
    use SqlLog;
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip auth check for public read-only APIs and CRUD operations
        // NOTE: surat_keluar, surat_approval routes are protected by route-level
        // auth:sanctum middleware in routes/api.php. Do NOT bypass them here.
        if ($request->is('api/sys_user/signers') ||
            $request->is('api/sys_user/reviewers') ||
            $request->is('api/surat_template/jenis-options') ||
            $request->is('api/surat-template/list') ||
            $request->is('api/digital-signature/verify/*')) {
            return $next($request);
        }

        if (!auth()->check()) {
            return response()->json([
                'code' => 403,
                'status' => 403,
                'message' => ['errors' => 'tidak memiliki akses.'],
            ], 403);
        }

        return $next($request);
    }
}
