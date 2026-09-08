@php
    echo "<?php".PHP_EOL;
@endphp

namespace {{ $config->namespaces->apiController }};
use {{ $config->namespaces->app }}\Http\Controllers\BaseResourceController;

{!! $docController !!}
class {{ $config->modelNames->name }}APIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\{{ $config->modelNames->name }};
    }
}
