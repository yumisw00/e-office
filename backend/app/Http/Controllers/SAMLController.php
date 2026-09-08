<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Controller;
use App\Models\SysUser;
use Illuminate\Http\Request;
use OneLogin\Saml2\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;


class SAMLController extends Controller
{
    public function login(Request $request)
    {
        $auth = new Auth(config('php-saml'));
        $redirectUrl = $auth->login(null, [], false, false, true);
        //$redirectUrl = app(AuthenticatedSessionController::class)->store($user);
        $request->session()->put('requestId', $auth->getLastRequestID());
        return redirect($redirectUrl);
    }

    public function acs(Request $request)
    {
        /*
		$auth = new Auth(config('php-saml'));
		$auth->processResponse($request->get('requestId'));
		dd($auth);

		if (count($auth->getErrors()) > 0 || !$auth->isAuthenticated()) {
		  return 'An error occurred processing SAML response';
		}

		//$user = User::query()->where('email', $auth->getNameId())->first();
        $user = SysUser::query()->where('email', $auth->getNameId())->first();
		if (!$user) {
		  return 'User not found.';
		}

        app(AuthenticatedSessionController::class)->store($user);
		//auth()->login($user);

		return redirect('/');
		*/

        $auth = new Auth(config('php-saml'));
        $auth->processResponse($request->get('requestId'));
        //Log::info('SAML ACS Request Data:', $request->all());
        //echo $auth->_settings;
        //dd($auth);
        //dd($auth->getNameId());

        if (count($auth->getErrors()) > 0 || !$auth->isAuthenticated()) {
            if (count($auth->getErrors())) {
                $err = $auth->getErrors();
                echo "The Error is:";
                foreach ($err as $value) {
                    echo $value, "\n";
                }
                //echo $auth->getErrors();
                //return $auth->getErrors();
                //} elseif (!$auth->isAuthenticated()) {
                //    echo $auth->isAuthenticated();
                //    return $auth->isAuthenticated();
            }
        }

        $user = SysUser::query()->where('email', $auth->getNameId())->first();
        if (!$user) {
            return 'User not found.';
        }

        //dd($user);
        auth()->login($user);
        //print_r($user);
        //dd($user->attributes[0]);
        //dd($user['attributes']);
        //dd($user);

        $response = [
            "user" => $user
        ];

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
            ->where('sys_user_group.id_user', '=', $user->id_user)
            ->get();


        if (!count($groups))
            return $this->failValidationError("Username atau password salah !");

        $request->session()->put('user', $user);

        if (count($groups) > 1) {
            $response['groups'] = $groups;
        } else {
            $id_dit_bid = $groups[0]->id_dit_bid;
            $id_unit = $groups[0]->id_unit;
            $id_group = $groups[0]->id_group;
            $id_jabatan = $groups[0]->id_jabatan;
            $nama_group = $groups[0]->nama;
            list($access, $menu, $accessmethod) = $this->_getAccessMenu($id_group);
            $response['access'] = $access;
            $response['menu'] = $menu;
            $response['id_unit'] = $id_unit;
            $response['id_group'] = $id_group;
            $response['nama_group'] = $nama_group;
            $response['accessmethod'] = $accessmethod;
            $request->session()->put("id_dit_bid", $id_dit_bid);
            $request->session()->put("id_unit", $id_unit);
            $request->session()->put("id_group", $id_group);
            $request->session()->put("id_jabatan", $id_jabatan);
            $request->session()->put("access", $accessmethod);
            $request->session()->put("access1", $access);
            $request->session()->put('menu', $menu);
            $request->session()->put('nama_group', $groups[0]->nama);
        }

        $request->session()->regenerate();

        //return $this->respond($response, 200, 'success');

        //app(AuthenticatedSessionController::class)->store($user);
        //auth()->login($user);

        //return $request;
        // return redirect('/dashboard')->with($response);
        return redirect('/dashboard');
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
                    "icon" => $r->icon,
                    'submenu' => $submenu
                ];
            }
        }

        return $menu;
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
                    ->whereRaw('coalesce(sys_menu.deleted_at, now()) >= now()')
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
            ) and sys_action.id_action = sys_group_action.id_action
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
}
