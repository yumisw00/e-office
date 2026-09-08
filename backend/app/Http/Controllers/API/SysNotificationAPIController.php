<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;

class SysNotificationAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysNotification;
    }
}
