<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Class DashboardAPIController
 */
class DashboardAPIController extends BaseResourceController
{
    private $datas;
    public function __construct()
    {
        $this->datas = new stdClass;
    }
}
