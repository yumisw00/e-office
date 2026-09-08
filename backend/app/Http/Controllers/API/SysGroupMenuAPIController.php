<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\API\CreateSysGroupMenuAPIRequest;
use App\Http\Requests\API\UpdateSysGroupMenuAPIRequest;
use App\Models\SysGroupMenu;
use App\Repositories\SysGroupMenuRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\BaseResourceController;

/**
 * Class SysGroupMenuAPIController
 */
class SysGroupMenuAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysGroupMenu;
        $this->middleware('EnsureHasGroup:sys_group_menu', ['only' => ['create', 'store', 'edit', 'delete']]);
    }
}
