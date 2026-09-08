<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\API\CreateSysGroupAPIRequest;
use App\Http\Requests\API\UpdateSysGroupAPIRequest;
use App\Models\SysGroup;
use App\Models\SysGroupAction;
use App\Repositories\SysGroupRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\BaseResourceController;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Query\Builder;

/**
 * Class SysGroupAPIController
 */
class SysGroupAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysGroup;
        $this->middleware('EnsureHasGroup:sys_group', ['only' => ['create', 'store', 'edit', 'delete']]);
    }

    #function pindahan ci4
    public function setmenu($id_group = null, Request $request)
    {
        $groupmenuModel = new \App\Models\SysGroupMenu();
        $groupactionModel = new \App\Models\SysGroupAction();

        $ret = true;
        // $groupactionModel->db->transStart();
        DB::beginTransaction();
        $rows = DB::select("select * from sys_group_menu where id_group = " . DB::escape($id_group));

        foreach ($rows as $r) {
            if ($ret === false)
                break;

            $ret = DB::delete('delete from sys_group_action where id_group_menu = ' . $r->id_group_menu);
            // $ret = $groupactionModel->where('id_group_menu', $r->id_group_menu)->delete();
        }
        if ($ret !== false)
            $ret = DB::delete("delete from sys_group_menu where id_group = " . DB::escape($id_group));
        // $ret = $groupmenuModel->where("id_group", $id_group)->delete();

        // dd(DB::getQueryLog());
        // return $this->fail(DB::getQueryLog());

        $data = $request->all();
        if ($ret !== false) {
            $ret = $this->_setmenu($groupmenuModel, $groupactionModel, $data, $id_group);
        }
        if ($ret !== false) {
            // $groupactionModel->db->transCommit();
            DB::commit();
            return $this->respond(['success' => true]);
        } else {
            // $groupactionModel->db->transRollback();
            DB::rollBack();
            return $this->fail(['errorr' => false]);
        }
    }

    private function _setmenu($groupmenuModel, $groupactionModel, $data, $id_group)
    {
        $ret = true;
        foreach ($data as $d) {

            if (!$ret)
                break;

            if ($d['action'])
                foreach ($d['action'] as $da) {
                    if ($da['selected']) {
                        $d['selected'] = 1;
                    }
                }

            if ($d['selected']) {
                $ret = $id_group_menu = $groupmenuModel->insert([
                    "id_group" => $id_group,
                    "id_menu" => $d['id_menu']
                ]);

                if ($d['action'])
                    foreach ($d['action'] as $da) {
                        if (!$ret)
                            break;

                        if ($da['selected']) {
                            $ret = $groupactionModel->insert([
                                "id_group_menu" => $id_group_menu,
                                "id_action" => $da['id_action']
                            ]);
                        }
                    }
            }
            if ($d['submenu'] && $ret) {
                $ret = $this->_setmenu($groupmenuModel, $groupactionModel, $d['submenu'], $id_group);
            }
        }
        return $ret;
    }
    public function getmenu($id_group = null)
    {

        $menuModel = new \App\Models\SysMenu();
        $actionModel = new \App\Models\SysAction();

        $rows = $menuModel->orderBy("sort", "asc")->orderBy("id_menu")->get()->toarray();
        $menuarr = array();
        $menuarr1 = array();
        foreach ($rows as $r) {
            if ($r['nama'])
                $menuarr[$r['id_menu']] = $r;

            $menuarr1[$r['id_menu']] = $r;
        }


        $menutarr = $menuarr;
        $menu = $this->_getChild($menutarr, $id_group, null);

        // return array($menu);
        return $this->respond($menu);
    }

    private function _getChild(&$menuarr, $id_group, $idparent = null)
    {
        $actionModel = new \App\Models\SysAction();
        $groupmenuModel = new \App\Models\SysGroupMenu();
        $menu = array();
        // $rows = $actionModel->where("exists (select 1 
        // from sys_group_action where exists (
        //     select 1 from sys_group_menu where sys_group_action.id_group_menu = sys_group_menu.id_group_menu
        //     and id_group = " . $menuModel->db->escape($id_group) . "
        // ))")->findAll();

        foreach ($menuarr as $idmenu => $r) {
            $action = array();
            $groupmenu = $groupmenuModel->where("id_menu", $idmenu)->where("id_group", $id_group)->first();

            // $action = $actionModel->select("sys_action.*, 
            // case when sys_group_action.id_action is not null then 1 
            // else 0 end as selected ", FALSE)->join("sys_group_action", "sys_group_action.id_action = sys_action.id_action and 
            // sys_group_action.id_group_menu = coalesce(" . DB::escape($groupmenu->id_group_menu) . ", 0)", "left")->where("id_menu", $idmenu)->findAll();
            if (!$groupmenu)
                $groupmenu['id_group_menu'] = 0;

            $action = DB::select("select sys_action.*, 
            case when sys_group_action.id_action is not null then 1 
            else 0 end as selected 
            from sys_action 
            left join sys_group_action on sys_group_action.deleted_at is null and 
            sys_group_action.id_action = sys_action.id_action and 
            sys_group_action.id_group_menu = coalesce(" . DB::escape($groupmenu['id_group_menu']) . ", 0)
            where sys_action.deleted_at is null and id_menu = " . DB::escape($idmenu));


            if ($r['id_parent_menu'] == $idparent) {
                unset($menuarr[$idmenu]);
                $submenu = $this->_getChild($menuarr, $id_group, $idmenu);
                $menu[] = [
                    "page" => $r['url'],
                    "id_menu" => $idmenu,
                    "label" => $r['nama'],
                    "icon" => $r['icon'],
                    'submenu' => $submenu,
                    "action" => $action,
                    "selected" => (!empty($groupmenu['id_group_menu']) ? 1 : 0)
                ];
            }
        }

        if (!$idparent) {
            foreach ($menuarr as $idmenu => $r) {
                $groupmenu = $groupmenuModel->where("id_menu", $idmenu)->where("id_group", $id_group)->first();

                // $action = array();

                //     $action = $actionModel->select("sys_action.*, 
                // case when sys_group_action.id_action is not null then 1 
                // else 0 end as selected ", FALSE)->join("sys_group_action", "sys_group_action.id_action = sys_action.id_action and 
                // sys_group_action.id_group_menu = coalesce(" . DB::escape($groupmenu->id_group_menu) . ", 0)", "left")->where("id_menu", $idmenu)->findAll();
                if (!$groupmenu)
                    $groupmenu['id_group_menu'] = 0;

                $action = DB::select("select sys_action.*, 
            case when sys_group_action.id_action is not null then 1 
            else 0 end as selected 
            from sys_action 
            left join sys_group_action 
            on sys_group_action.deleted_at is null and sys_group_action.id_action = sys_action.id_action and 
            sys_group_action.id_group_menu = coalesce(" . DB::escape($groupmenu['id_group_menu']) . ", 0)
            where sys_action.deleted_at is null and id_menu = " . DB::escape($idmenu));

                $menu[] = [
                    "page" => $r['url'],
                    "id_menu" => $idmenu,
                    "label" => $r['nama'],
                    "icon" => $r['icon'],
                    'submenu' => $submenu,
                    "action" => $action,
                    "selected" => ($groupmenu['id_group_menu'] ? 1 : 0)
                ];
            }
        }

        return $menu;
    }
}
