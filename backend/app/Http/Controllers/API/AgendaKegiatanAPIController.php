<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Http\Controllers\BaseResourceController;

class AgendaKegiatanAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\AgendaKegiatan;
    }
}
