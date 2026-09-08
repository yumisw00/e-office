<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;

class MtSdmJabatanAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MtSdmJabatan;
    }
}
