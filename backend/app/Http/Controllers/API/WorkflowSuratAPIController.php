<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Http\Request;

class WorkflowSuratAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\WorkflowSurat;
    }

    protected function prepareFrontendPayload(Request $request, string $mode): array
    {
        $payload = $request->all();

        if (isset($payload['steps']) && is_string($payload['steps'])) {
            $decoded = json_decode($payload['steps'], true);
            $payload['steps'] = is_array($decoded) ? $decoded : [];
        }

        if (!array_key_exists('status', $payload)) {
            $payload['status'] = !empty($payload['is_active']) ? 'active' : 'draft';
        }

        if (!array_key_exists('is_active', $payload)) {
            $payload['is_active'] = in_array(strtolower((string) $payload['status']), ['active', 'aktif', '1', 'true'], true);
        }

        return $payload;
    }
}
