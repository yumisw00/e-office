<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Models\SysUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;

class MobileLoginController extends AppBaseController
{
    /**
     * Mobile Login - Returns Sanctum API Token
     *
     * No CSRF, no cookies - pure token-based auth for mobile apps
     */
    public function login(Request $request): JsonResponse
    {
        // Rate limiting: max 5 attempts per email per minute
        $throttleKey = 'mobile_login:' . $request->ip() . ':' . $request->input('email');
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' . $seconds . ' detik.',
                'retry_after' => $seconds,
            ], 429);
        }

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'required|string',
            'fcm_token' => 'nullable|string|max:4096',
        ]);

        RateLimiter::hit($throttleKey, 60);

        $user = SysUser::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan.',
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password salah.',
            ], 401);
        }

        // Get user groups for authorization
        $groups = $this->getUserGroups($user->id_user);

        if (!count($groups)) {
            return response()->json([
                'success' => false,
                'message' => 'User belum memiliki grup/role. Hubungi admin untuk diberikan akses.',
            ], 403);
        }

        // Revoke old tokens (optional - for security)
        // $user->tokens()->delete();

        // Create new token with abilities
        $token = $user->createToken(
            $request->device_name,
            ['*'] // abilities - adjust as needed
        )->plainTextToken;

        // Update last login
        $this->updateLogin($user);
        if ($request->filled('fcm_token')) {
            $user->fcm_token = $request->input('fcm_token');
            $user->device_name = $request->input('device_name');
            $user->device_last_active = now();
            $user->save();
        }

        // Get first group for initial access
        $group = $groups[0];

        // Try to get access menu, return empty if no menu assigned
        try {
            [$access, $menu, $accessmethod] = $this->_getAccessMenu($group->id_group);
        } catch (\Exception $e) {
            $access = [];
            $menu = [];
            $accessmethod = [];
        }

        // Clear rate limit on successful login
        RateLimiter::clear($throttleKey);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'token' => $token, // Plain text token: "1|abc123..."
            'token_type' => 'Bearer',
            'user' => [
                'id_user' => $user->id_user,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'group' => [
                'id_group' => $group->id_group,
                'nama' => $group->nama ?? 'Pegawai',
                'id_unit' => $group->id_unit ?? null,
                'id_jabatan' => $group->id_jabatan ?? null,
                'nama_jabatan' => $group->nama_jabatan ?? null,
            ],
            'menu' => $menu,
            'access' => $access,
            'accessmethod' => $accessmethod,
        ]);
    }

    /**
     * Logout - Revoke current token
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Get current user info
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => [
                'id_user' => $user->id_user,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Switch group (for users with multiple groups)
     */
    public function switchGroup(Request $request): JsonResponse
    {
        $request->validate([
            'id_group' => 'required|integer',
        ]);

        $user = $request->user();
        $id_group = $request->id_group;

        // Verify user has this group
        $group = $this->findUserGroup($user->id_user, $id_group);
        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Grup tidak ditemukan atau tidak memiliki akses.',
            ], 403);
        }

        [$access, $menu, $accessmethod] = $this->_getAccessMenu($id_group);

        return response()->json([
            'success' => true,
            'group' => [
                'id_group' => $group->id_group,
                'nama' => $group->nama,
                'id_unit' => $group->id_unit,
                'id_jabatan' => $group->id_jabatan,
                'nama_jabatan' => $group->nama_jabatan,
            ],
            'menu' => $menu,
            'access' => $access,
            'accessmethod' => $accessmethod,
        ]);
    }

    /**
     * Get all groups for current user
     */
    public function groups(Request $request): JsonResponse
    {
        $groups = $this->getUserGroups($request->user()->id_user);

        return response()->json([
            'success' => true,
            'groups' => $groups,
        ]);
    }

    // ===== Helper Methods =====

    private function getUserGroups($idUser)
    {
        return $this->userGroupsQuery($idUser)->get();
    }

    private function findUserGroup($idUser, $idGroup)
    {
        return $this->userGroupsQuery($idUser)
            ->where('sys_user_group.id_group', '=', $idGroup)
            ->first();
    }

    private function userGroupsQuery($idUser)
    {
        $sys_user_group = new \App\Models\SysUserGroup();

        return $sys_user_group
            ->select(
                'sys_group.id_group',
                'sys_group.nama',
                DB::raw('NULL as deskripsi'),
                'sys_user_group.id_jabatan',
                'sys_user_group.id_user',
                'mt_sdm_jabatan.id_unit',
                'mt_sdm_jabatan.nama as nama_jabatan',
                'mt_sdm_jabatan.id_dit_bid as id_dit_bid',
            )
            ->join('sys_group', function ($join) {
                $join->on('sys_user_group.id_group', '=', 'sys_group.id_group')
                     ->whereNull('sys_group.deleted_at');
            })
            ->leftJoin('mt_sdm_jabatan', function ($join) {
                $join->on(DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)'), '=', DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'))
                     ->whereNull('mt_sdm_jabatan.deleted_at');
            })
            ->whereNull('sys_user_group.deleted_at')
            ->where('sys_user_group.id_user', '=', $idUser);
    }

    private function updateLogin($user)
    {
        $user->last_ip = request()->ip();
        $user->last_login = now();
        $user->locked_until = null;
        $user->failed_login_attempts = 0;
        $user->save();
    }

    private function _getAccessMenu($id_group)
    {
        $sys_menu = new \App\Models\SysMenu();
        $sys_action = new \App\Models\SysAction();

        $rows = $sys_menu
            ->whereExists(function ($query) use ($id_group) {
                $query->select(DB::raw('1'))
                    ->from('sys_group_menu')
                    ->where('id_group', '=', $id_group)
                    ->where(function ($deletedAt) {
                        $deletedAt
                            ->whereNull('sys_menu.deleted_at')
                            ->orWhere('sys_menu.deleted_at', '>=', now());
                    })
                    ->whereColumn('sys_menu.id_menu', '=', 'sys_group_menu.id_menu');
            })
            ->orderBy('sort')
            ->orderBy('id_menu')
            ->get();

        $menuarr = array();
        $menuarr1 = array();
        $access = array();
        $accessmethod = array();
        foreach ($rows as $r) {
            if ($r->nama)
                $menuarr[$r->id_menu] = $r;

            $menuarr1[$r->id_menu] = $r;
            $access[] = ["page" => $r->url];
            $accessmethod[$r->url]["index"] = true;
            $accessmethod[$r->url]["add"] = false;
            $accessmethod[$r->url]["edit"] = false;
            $accessmethod[$r->url]["delete"] = false;
        }

        $access[] = ["page" => "sub"];

        $menutarr = $menuarr;
        $menu = $this->_getChild($menutarr, null);

        $rows = $sys_action
            ->whereExists(function ($query) use ($id_group) {
                $query->select(DB::raw('1'))
                    ->from('sys_group_action')
                    ->whereColumn('sys_action.id_action', '=', 'sys_group_action.id_action')
                    ->whereNull('deleted_at')
                    ->whereExists(function ($subQuery) use ($id_group) {
                        $subQuery->select(DB::raw('1'))
                            ->from('sys_group_menu')
                            ->whereColumn('sys_group_action.id_group_menu', '=', 'sys_group_menu.id_group_menu')
                            ->where('id_group', '=', $id_group);
                    });
            })
            ->get();

        foreach ($rows as $r) {
            if (!empty($menuarr[$r->id_menu]) && !empty($r->nama)) {
                $access[] = ["page" => $menuarr[$r->id_menu]->url . '_' . $r->nama];
                $accessmethod[$menuarr1[$r->id_menu]->url][$r->nama] = true;
            }
        }

        return array($access, $menu, $accessmethod);
    }

    private function _getChild(&$menuarr, $idparent = null)
    {
        $menu = array();
        foreach ($menuarr as $idmenu => $r) {
            if (!$r->is_show)
                continue;

            if ($r->id_parent_menu == $idparent) {
                unset($menuarr[$idmenu]);
                $submenu = $this->_getChild($menuarr, $idmenu);
                $menu[] = [
                    "id_menu" => $idmenu,
                    "id_prent_menu" => $r->id_parent_menu,
                    "page" => $r->url,
                    "label" => $r->nama,
                    "sort" => $r->sort,
                    "icon" => $r->icon,
                    'submenu' => $submenu
                ];
            }
        }

        if (!$idparent) {
            foreach ($menuarr as $idmenu => $r) {
                if (!$r->is_show)
                    continue;

                $menu[] = [
                    "id_menu" => $idmenu,
                    "id_prent_menu" => $r->id_parent_menu,
                    "page" => $r->url,
                    "label" => $r->nama,
                    "sort" => $r->sort,
                    "icon" => $r->icon,
                    'submenu' => $submenu
                ];
            }
        }

        return $menu;
    }
}
