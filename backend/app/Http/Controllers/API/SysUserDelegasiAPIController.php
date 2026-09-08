<?php

namespace App\Http\Controllers\API;
use App\Http\Controllers\BaseResourceController;

/**
 * Class SysUserDelegasiAPIController
 */
class SysUserDelegasiAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysUserDelegasi;
    }
}
