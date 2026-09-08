<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SysAction;
use App\Models\SysGroupMenu;
use Illuminate\Support\Facades\DB;

class EnsureHasGroup
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $url, ?string $action = null): Response
    {
        if (!auth()->check()) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $groupId = session('id_group');
        if (!$groupId) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        // Approval actions are additionally authorized by the assigned
        // approval row. This keeps valid approvers working even when their
        // group's menu-action cache is stale or incomplete.
        if ($action === 'approve' || $action === 'reject') {
            $routeId = $request->route('id');
            $userId = auth()->user()?->id_user ?? auth()->id();
            if ($routeId && $userId && DB::table('surat_approval')
                ->where('id_surat_keluar', $routeId)
                ->where('id_approver', $userId)
                ->whereIn('status', ['waiting', 'pending', 'review'])
                ->whereNull('deleted_at')
                ->exists()) {
                return $next($request);
            }

            // Approval is an operational duty for these groups. The
            // controller still verifies that the user is assigned to the
            // requested approval row.
            $approvalGroup = DB::table('sys_group')
                ->where('id_group', $groupId)
                ->whereNull('deleted_at')
                ->whereRaw("LOWER(REPLACE(nama, '_', ' ')) IN ('admin sistem', 'admin konten', 'pimpinan')")
                ->exists();
            if ($approvalGroup) {
                return $next($request);
            }
        }

        // Admin Sistem is the application super administrator. Keep this
        // decision centralized so every protected API receives the same rule.
        $isSystemAdmin = DB::table('sys_group')
            ->where('id_group', $groupId)
            ->whereNull('deleted_at')
            ->whereRaw("LOWER(REPLACE(nama, '_', ' ')) = 'admin sistem'")
            ->exists();
        if ($isSystemAdmin) {
            return $next($request);
        }

        // Pimpinan is a read-only dashboard role. Its menu assignments may be
        // absent during deployments, but dashboard/list endpoints must remain
        // available; write actions still require explicit menu permissions.
        $isPimpinan = DB::table('sys_group')
            ->where('id_group', $groupId)
            ->whereNull('deleted_at')
            ->whereRaw("LOWER(REPLACE(nama, '_', ' ')) = 'pimpinan'")
            ->exists();
        $readOnlyPimpinanUrls = [
            'surat_masuk', 'surat_masuk_pegawai', 'surat_keluar',
            'surat_distribusi', 'surat_disposisi', 'surat_approval',
            'surat_arsip', 'agenda', 'pengumuman',
        ];
        $matchesReadOnlyUrl = array_intersect(explode('|', $url), $readOnlyPimpinanUrls);
        if ($isPimpinan && $request->isMethod('GET') && in_array($action, [null, 'index'], true) && !empty($matchesReadOnlyUrl)) {
            return $next($request);
        }

        // Parse flags embedded in $action (e.g. "index,noMenu" → action="index", noMenu=true)
        // Laravel passes comma-separated values as a single string to the last parameter.
        $noMenu = false;
        if ($action !== null && str_contains($action, ',')) {
            $parts = explode(',', $action);
            $action = trim($parts[0]);
            $noMenu = in_array('noMenu', array_map('trim', array_slice($parts, 1)));
        }

        // If $action is null, derive it from the HTTP method
        $action ??= match ($request->method()) {
            'POST' => 'add',
            'PUT', 'PATCH' => 'edit',
            'DELETE' => 'delete',
            default => 'index',
        };

        // A route can be shared by more than one menu, for example the
        // incoming-letter detail endpoint used by both admin and recipients.
        $menuUrls = array_filter(explode('|', $url));

        // For index (list) action, if noMenu flag is set, skip menu access check.
        // The user just needs to be authenticated and have a group.
        $availableMenus = collect([]);
        if (!$noMenu || $action !== 'index') {
            $availableMenus = SysGroupMenu::query()
                ->join('sys_menu', 'sys_group_menu.id_menu', '=', 'sys_menu.id_menu')
                ->where('sys_group_menu.id_group', $groupId)
                ->whereIn('sys_menu.url', $menuUrls)
                ->whereNull('sys_group_menu.deleted_at')
                ->whereNull('sys_menu.deleted_at')
                ->pluck('sys_menu.url');

            if ($availableMenus->isEmpty()) {
                return response()->json([
                    'message' => 'Forbidden.',
                ], 403);
            }
        }

        // Viewing a menu is granted by sys_group_menu. Mutating/custom actions
        // must additionally exist in sys_group_action for the active group.
        // For noMenu + index, action is granted (just auth check needed).
        $hasAction = $noMenu
            ? ($action === 'index')
            : ($action === 'index' || $availableMenus
                ->contains(fn ($menuUrl) => (new SysAction())->access($action, $menuUrl, $groupId)));

        if (!$hasAction) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        return $next($request);
    }
}
