<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;

class AuditTrailImmutableAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\AuditTrailImmutable;
    }
}
