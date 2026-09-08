<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\SysUserModel;
use App\Services\Auth\AdminTwoFactorService;
use App\Services\Auth\LoginCaptchaService;
use App\Traits\SqlLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthenticatedSessionController extends AppBaseController
{
    use SqlLog;
    /**
     * Handle an incoming authentication request.
     */
    public function captcha(LoginCaptchaService $captchaService)
    {
        try {
            $captcha = $captchaService->create();

            if (empty($captcha['captcha_token'])) {
                \Log::warning('Captcha token kosong setelah create()', [
                    'captcha_result' => $captcha,
                    'ip' => request()->ip(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Captcha gagal dibuat. Cache tidak tersedia.',
                    'data' => null,
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Captcha login berhasil dibuat.',
                'data' => $captcha,
                'captcha_token' => $captcha['captcha_token'],
                'expires_in' => $captcha['expires_in'],
            ]);
        } catch (\Throwable $e) {
            \Log::error('Captcha endpoint error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Captcha gagal dimuat. Silakan klik ulang.',
                'data' => null,
            ], 500);
        }
    }

    public function store(LoginRequest $request)
    {
        $user = $request->authenticate();

        /*
        $sys_user = new \App\Models\SysUserModel();
        $user = $sys_user->find($user->id_user);
        */

        $groups = $this->getUserGroups($user->id_user);

        if (!count($groups)) {
            return $this->failValidationError("Username atau password salah !");
        }

        if ($this->requiresTwoFactorForGroups($groups)) {
            return $this->respond(
                $this->issueTwoFactorChallenge(
                    $request,
                    $user,
                    count($groups) === 1 ? $groups[0] : null,
                    count($groups) > 1 ? ['requires_group_selection' => true] : []
                ),
                200,
                'success'
            );
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        $request->session()->put('user', $user);
        $this->updateLogin((new \App\Models\SysUserModel())->find($user->id_user));

        if (count($groups) > 1) {
            return $this->respond([
                'user' => $user,
                'groups' => $groups,
            ], 200, 'success');
        }

        $group = $groups[0];
        $response = $this->buildAuthenticatedGroupResponse($user, $group);
        $this->applyAuthenticatedGroupSession($request, $user, $group, $response);

        return $this->respond($response, 200, 'success');
    }

    public function authenticate(Request $request)
    {
        $sys_user = new \App\Models\SysUserModel();

        $token = $request->query('token');
        if (!$token) {
            return $this->failValidationError("JWT token missing");
        }

        $jwtSecret = file_get_contents(config('jwt.public_key_path', storage_path('app/private/keys/public.pem')));
        if (!$jwtSecret) {
            return $this->failValidationError("JWT secret key not configured");
        }

        try {
            $payload = JWT::decode($token, new Key($jwtSecret, 'RS256'));
        } catch (\Exception $e) {
            return $this->failValidationError("Invalid JWT token");
        }

        if ($payload->exp < time()) {
            return $this->failValidationError("JWT token expired");
        }

        $email = $payload->email ?? null;
        if (!$email) {
            return $this->failValidationError("Email not found in JWT payload");
        }

        $user = $sys_user->where('email', $email)->first();

        if (!$user)
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.',
                'redirect' => 'https://sso.hutamakarya.com/user-unregistered?identifier=767fcb8c-4338-458e-a0ee-67018b79e343',
            ], 404);
        //     return $this->failValidationError("User belum ditambahkan di aplikasi !");


        # update nama user
        $sys_user->update($user->id_user, ['name' => $payload->name], $user);
        $user->name = $payload->name;

        $response = [
            "user" => $user
        ];
        $groups = $this->getUserGroups($user->id_user);

        if (!count($groups))
            return $this->failValidationError("User bemun diatur dengan benar !");

        if ($this->requiresTwoFactorForGroups($groups)) {
            return $this->respond(
                $this->issueTwoFactorChallenge(
                    $request,
                    $user,
                    count($groups) === 1 ? $groups[0] : null,
                    count($groups) > 1 ? ['requires_group_selection' => true] : []
                ),
                200,
                'success'
            );
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerate();
        Auth::loginUsingId($user->id_user);

        $request->session()->put('user', $user);
        if (count($groups) > 1) {
            $response['groups'] = $groups;
        } else {
            $group = $groups[0];
            $response = $this->buildAuthenticatedGroupResponse($user, $group);
            $this->applyAuthenticatedGroupSession($request, $user, $group, $response);
        }

        $request->session()->regenerate();

        return $this->respond($response, 200, 'success');
    }

    public function choseGroup(Request $request)
    {
        if (!$request->user()) {
            return $this->failUnauthorized("Anda belum login");
        }

        $id_jabatan = $request->get("id_jabatan");
        $id_group = $request->get("id_group");
        $id_user = $request->user()->id_user;

        $group = $this->findUserGroup($id_user, $id_group, $id_jabatan);
        if (!$group) {
            return $this->failValidationError("Username atau password salah !");
        }

        if ($this->twoFactorService()->requiresForGroup((int) $group->id_group)
            && !$request->session()->has('mfa_verified_at')) {
            return $this->respond(
                $this->issueTwoFactorChallenge($request, $request->user(), $group),
                200,
                'success'
            );
        }

        $response = $this->buildAuthenticatedGroupResponse($request->user(), $group);
        $this->applyAuthenticatedGroupSession($request, $request->user(), $group, $response);

        return $this->respond($response, 200, 'success');
    }

    public function verifyTwoFactor(Request $request)
    {
        $payload = $request->validate([
            'challenge_id' => ['required', 'integer'],
            'otp_code' => ['required', 'string'],
        ]);

        try {
            $result = $this->twoFactorService()->verifyChallengeById(
                (int) $payload['challenge_id'],
                trim((string) $payload['otp_code'])
            );
        } catch (\RuntimeException $exception) {
            return $this->twoFactorValidationError('otp_code', $exception->getMessage());
        }

        $user = $result['user'];
        $context = $result['context_payload'];

        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->put('mfa_verified_at', now()->format('Y-m-d H:i:s'));
        $request->session()->put('user', $user);

        if (!empty($context['requires_group_selection'])) {
            return $this->respond([
                'user' => $user,
                'groups' => $this->getUserGroups($user->id_user),
                'requires_group_selection' => true,
                'mfa_verified' => true,
            ], 200, 'success');
        }

        $group = $this->findUserGroup(
            $user->id_user,
            $context['id_group'] ?? null,
            $context['id_jabatan'] ?? null
        );

        if (!$group) {
            return $this->failValidationError("Group tidak lagi tersedia.");
        }

        $response = $this->buildAuthenticatedGroupResponse($user, $group);
        $this->applyAuthenticatedGroupSession($request, $user, $group, $response);
        $this->updateLogin((new \App\Models\SysUserModel())->find($user->id_user));

        return $this->respond($response, 200, 'success');
    }

    public function resendTwoFactor(Request $request)
    {
        $payload = $request->validate([
            'challenge_id' => ['required', 'integer'],
        ]);

        $challenge = $this->twoFactorService()->findChallengeById((int) $payload['challenge_id']);
        if (!$challenge) {
            return $this->twoFactorValidationError('challenge_id', 'Challenge 2FA tidak ditemukan.');
        }

        try {
            $user = $this->twoFactorService()->userForChallenge($challenge);
            $challenge = $this->twoFactorService()->resendChallenge($request, $challenge, $user);
        } catch (\RuntimeException $exception) {
            return $this->twoFactorValidationError('challenge_id', $exception->getMessage());
        }

        return $this->respond($this->twoFactorService()->buildChallengeResponse($user, $challenge), 200, 'success');
    }

    private function twoFactorService(): AdminTwoFactorService
    {
        return app(AdminTwoFactorService::class);
    }

    private function getUserGroups($idUser)
    {
        return $this->userGroupsQuery($idUser)->get();
    }

    private function findUserGroup($idUser, $idGroup, $idJabatan = null)
    {
        $query = $this->userGroupsQuery($idUser)
            ->where('sys_user_group.id_group', '=', $idGroup);

        if ($idJabatan) {
            $query->where('sys_user_group.id_jabatan', '=', $idJabatan);
        }

        return $query->first();
    }

    private function userGroupsQuery($idUser)
    {
        $sys_user_group = new \App\Models\SysUserGroup();

        return $sys_user_group
            ->select(
                'sys_group.*',
                'sys_user_group.*',
                'mt_sdm_jabatan.id_unit',
                'mt_sdm_jabatan.nama as nama_jabatan',
                'mt_sdm_jabatan.id_dit_bid as id_dit_bid',
            )
            ->join('sys_group', function ($join) {
                $join->on('sys_user_group.id_group', '=', 'sys_group.id_group');
            })
            ->leftJoin('mt_sdm_jabatan', function ($join) {
                $join->on(DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)'), '=', DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'));
            })
            ->whereNull('sys_user_group.deleted_at')
            ->where('sys_user_group.id_user', '=', $idUser);
    }

    private function requiresTwoFactorForGroups($groups): bool
    {
        foreach ($groups as $group) {
            if ($this->twoFactorService()->requiresForGroup((int) $group->id_group)) {
                return true;
            }
        }

        return false;
    }

    private function issueTwoFactorChallenge(Request $request, $user, $group = null, array $extraContext = []): array
    {
        $context = $extraContext;

        if ($group) {
            $context = array_merge($context, [
                'id_group' => $group->id_group,
                'id_jabatan' => $group->id_jabatan,
                'id_unit' => $group->id_unit,
                'id_dit_bid' => $group->id_dit_bid,
                'nama_group' => $group->nama,
                'nama_jabatan' => $group->nama_jabatan,
            ]);
        }

        $challenge = $this->twoFactorService()->createChallenge(
            $request,
            $user,
            $context
        );

        return $this->twoFactorService()->buildChallengeResponse($user, $challenge);
    }

    private function twoFactorValidationError(string $field, string $message)
    {
        return response()->json([
            'message' => $message,
            'errors' => [
                $field => [$message],
            ],
        ], 422);
    }

    private function updateLogin(SysUserModel $user)
    {
        $user->last_ip = (!empty($_SERVER["REMOTE_ADDR"])) ? $_SERVER["REMOTE_ADDR"] : '';
        $user->last_login = now();
        $user->locked_until = null;
        $user->failed_login_attempts = 0;

        $user->save();
    }

    private function buildAuthenticatedGroupResponse($user, $group): array
    {
        [$access, $menu, $accessmethod] = $this->_getAccessMenu($group->id_group);

        /*
        $rec['last_ip'] = (!empty($_SERVER["REMOTE_ADDR"])) ? $_SERVER["REMOTE_ADDR"] : '';
        $rec['last_login'] = now();
        // Reset failed login attempts after successful login
        $rec['locked_until'] = null;
        $rec['failed_login_attempts'] = 0;

        $sys_user = new \App\Models\SysUserModel();
        $sys_user->update($user->id_user, $rec);
        */
        /*
        $sys_user = new \App\Models\SysUserModel();
        $this->updateLogin($sys_user->find($user->id_user));
        */

        // // Refresh user data
        // $user->refresh();

        // Check if user needs password change
        // $needPasswordChange = $user->need_update_pass || $user->isSecurityIncident();
        $needPasswordChange = $user->need_update_pass || ($user->security_incident_flag ?? false);

        return [
            'user' => $user,
            'access' => $access,
            'menu' => $menu,
            'id_unit' => $group->id_unit,
            'id_group' => $group->id_group,
            'nama_group' => $group->nama,
            'id_jabatan' => $group->id_jabatan,
            'nama_jabatan' => $group->nama_jabatan,
            'accessmethod' => $accessmethod,
            'id_dit_bid' => $group->id_dit_bid,
            // Keamanan login
            'need_password_change' => $needPasswordChange,
            'reason_password_change' => $user->reason_reset_pass,
        ];
    }

    private function applyAuthenticatedGroupSession(Request $request, $user, $group, array $response): void
    {
        $request->session()->put('user', $user);
        $request->session()->put("id_dit_bid", $group->id_dit_bid);
        $request->session()->put("id_unit", $group->id_unit);
        $request->session()->put("id_group", $group->id_group);
        $request->session()->put("id_jabatan", $group->id_jabatan);
        $request->session()->put("access", $response['accessmethod']);
        $request->session()->put("access1", $response['access']);
        $request->session()->put('menu', $response['menu']);
        $request->session()->put('nama_group', $group->nama);
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

        /*
        $rows = DB::select("select * from sys_menu where exists (select 1 
        from sys_group_menu 
        where sys_menu.id_menu = sys_group_menu.id_menu 
        and id_group = " . DB::escape($id_group) . ") 
        and coalesce(sys_menu.deleted_at, now()) >= now()
        and id_application = " . DB::escape($id_application) . "
        order by sort, id_menu");
        */

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

        /*
        $rows = DB::select("select * from sys_action 
        where exists (select 1 
        from sys_group_action 
        where exists (
                select 1 from sys_group_menu 
                where sys_group_action.id_group_menu = sys_group_menu.id_group_menu
                and id_group = " . DB::escape($id_group) . "
                and id_application = " . DB::escape($id_application) . "
            ) and sys_action.id_action = sys_group_action.id_action
            and id_application = " . DB::escape($id_application) . "
        )");
        */

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

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function loginAs(Request $request)
    {
        $sys_user_group = new \App\Models\SysUserGroup();
        $sys_action = new \App\Models\SysAction();

        $id_group_session = $request->session()->get('id_group');

        $id_user_old_session = $request->session()->get('id_user_old');
        $id_group_old_session = $request->session()->get('id_group_old');

        $access = $sys_action->access('login_as', 'dashboard', $id_group_session);
        if (!$access && !$request->session()->get('id_user_old'))
            return $this->failValidationError("Anda tidak memiliki akses login as");

        $id_user_old = $request->user()->id_user;
        $user_sebelumnya = $request->session()->get('user');

        if (!$id_user_old)
            return $this->failValidationError("Anda belum login");


        $id_jabatan = $request->get("id_jabatan");
        $id_group = $request->get("id_group");
        $id_user = $request->get("id_user");
        if ($id_group && $id_user) {

            $sys_user = new \App\Models\SysUserModel();
            $user = $sys_user
                ->join('sys_user_group', 'sys_user_group.id_user', '=', 'sys_user.id_user')
                ->whereNull('sys_user_group.deleted_at')
                ->find($id_user);

            if (!$user)
                return $this->failValidationError("User delegasi tidak dapat digunakan");

            // check apakah atasan masih ada
            // $nid = $user->nid;
            // $data_sys_user_check = $sys_user_check->where('nid', '=', $nid)->get()->count();

            // if ($data_sys_user_check < 2)
            //     return $this->failValidationError("User delegasi tidak dapat digunakan");


            /*
            session()->flush();
            Auth::login($user);
            */
            $user = $user->toArray();
            // var_dump($user);

            Auth::logout(); // for end current session
            session()->invalidate(); // hapus semua session lama
            session()->regenerate(); // buat session baru
            Auth::loginUsingId($user['id_user']);
            $request->session()->put('user', $user);

            if ($id_user_old_session != $id_user)
                $sys_user->logging(
                    array(
                        "action" => "loginas",
                        "table_name" => $sys_user->table,
                        "activity" => "user " . $user_sebelumnya['name'] . " loginas sebagai " . $user['name'],
                        "data" => ["user_sebelumnya" => $user_sebelumnya, "user_sekarang" => $user],
                    )
                );
        } else {
            return $this->failValidationError("User delegasi tidak dapat digunakan");
        }

        // /*
        /*
        $groups = DB::select("select c.id_jabatan, c.id_unit, a.*, b.nama , c.nama as nama_jabatan, e.id_user
        from sys_user_group a 
        join sys_group b on a.id_group = b.id_group and b.deleted_at is null
        left join mt_sdm_jabatan c on a.id_jabatan = c.id_jabatan and c.deleted_at is null
        left join mt_sdm_unit d on d.table_code = c.id_unit and d.deleted_at is null
        left join sys_user e on e.id_user = a.id_user
        where a.id_user = ?
        and a.id_group = ?
        and a.deleted_at is null 
        and b.deleted_at is null", [$id_user, $id_group]);
        */


        // $this->start_log();
        $groups = $sys_user_group
            ->select(
                'sys_group.*',
                'sys_user_group.*',
                'mt_sdm_jabatan.id_unit',
                'mt_sdm_jabatan.nama as nama_jabatan',
                'mt_sdm_jabatan.id_dit_bid as id_dit_bid',
            )
            ->join('sys_group', function ($join) {
                $join->on('sys_user_group.id_group', '=', 'sys_group.id_group');
            })
            ->leftJoin('mt_sdm_jabatan', function ($join) {
                $join->on(DB::raw('CAST(mt_sdm_jabatan.id_jabatan AS TEXT)'), '=', DB::raw('CAST(sys_user_group.id_jabatan AS TEXT)'));
            })
            ->whereNull('sys_user_group.deleted_at')
            ->where('sys_user_group.id_user', '=', $id_user)
            ->where('sys_user_group.id_group', '=', $id_group);

        if ($id_jabatan)
            $groups = $groups->where('sys_user_group.id_jabatan', '=', $id_jabatan);

        $groups = $groups
            ->get();
        // $this->end_log();
        // */

        /*
        $groups = DB::select("select c.id_jabatan, c.id_unit, a.*, b.nama , c.nama as nama_jabatan, e.id_user_delegasi, e.id_user
        from sys_user_group a 
        join sys_group b on a.id_group = b.id_group and b.deleted_at is null
        left join mt_sdm_jabatan c on a.id_jabatan = c.id_jabatan and c.deleted_at is null
        left join mt_sdm_unit d on d.table_code = c.id_unit and d.deleted_at is null
        left join sys_user e on e.id_user = a.id_user
        where $filter_sql
        and a.deleted_at is null 
        and b.deleted_at is null", $filter_array);
        */
        // var_dump($groups->toArray());
        // return $this->failValidationError("Username atau password salah !");

        if (!count($groups))
            return $this->failValidationError("Username atau password salah !");

        list($access, $menu, $accessmethod) = $this->_getAccessMenu($id_group);

        $user = $request->user();

        $response = [];

        $response = [
            "user" => $user
        ];
        $id_user_new = $request->user()->id_user;
        $id_group_new = $groups[0]->id_group;

        $response['access'] = $access;
        $response['menu'] = $menu;
        $response['id_group'] = $groups[0]->id_group;
        $response['nama_group'] = $groups[0]->nama;
        $response['id_unit'] = $groups[0]->id_unit;
        $response['accessmethod'] = $accessmethod;
        if ($id_user_new != $id_user_old_session || $id_group_new != $id_group_old_session) {
            $response['id_user_old'] = $id_user_old;
            $response['id_group_old'] = $id_group_session;
            // $response['id_user_old_session'] = $id_user_old_session;
            // $response['id_group_old_session'] = $id_group_old_session;
            // $response['response_id_user'] = $request->user()->id_user;
            // $response['check_user'] = $request->user()->id_user != $id_user_old_session;
            // $response['check_group'] = $id_group_session != $id_group_old_session;
        }

        $id_group = $groups[0]->id_group;
        $id_jabatan = $groups[0]->id_jabatan;
        $id_unit = $groups[0]->id_unit;
        $id_dit_bid = $groups[0]->id_dit_bid;
        $nama_jabatan = $groups[0]->nama_jabatan;
        $response['id_jabatan'] = $id_jabatan;
        $response['nama_jabatan'] = $nama_jabatan;
        $response['id_dit_bid'] = $id_dit_bid;
        // $id_kelompok_bisnis = $groups[0]->id_kelompok_bisnis;

        $request->session()->put("id_group", $id_group);
        $request->session()->put("id_jabatan", $id_jabatan);
        $request->session()->put("id_unit", $id_unit);
        $request->session()->put("id_dit_bid", $id_dit_bid);
        // $request->session()->put("id_kelompok_bisnis", $id_kelompok_bisnis);
        $request->session()->put("access", $accessmethod);
        $request->session()->put("access1", $access);
        $request->session()->put('menu', $menu);
        $request->session()->put('nama_group', $groups[0]->nama);

        if ($id_user_new != $id_user_old_session || $id_group_new != $id_group_old_session) {
            $request->session()->put('id_user_old', $id_user_old);
            $request->session()->put('id_group_old', $id_group_session);
        }
        return $this->respond($response, 200, 'success');
    }

    public function get_session()
    {
        $response['user'] = session('user');
        $response['id_group'] = session('id_group');
        $response['access'] = session('access1');
        $response['menu'] = session('menu');
        $response['id_group'] = session('id_group');
        $response['nama_group'] = session('nama_group');
        $response['accessmethod'] = session('access');
        $response['id_dit_bid'] = session('id_dit_bid');

        return $this->respond($response, 200, 'success');
    }
}
