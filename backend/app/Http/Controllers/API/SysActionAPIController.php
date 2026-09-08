<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\API\CreateSysActionAPIRequest;
use App\Http\Requests\API\UpdateSysActionAPIRequest;
use App\Models\SysAction;
use App\Repositories\SysActionRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\BaseResourceController;

/**
 * Class SysActionAPIController
 */
class SysActionAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysAction;
        $this->middleware('EnsureHasGroup:sys_action', ['only' => ['create', 'store', 'edit', 'delete']]);
    }
}
