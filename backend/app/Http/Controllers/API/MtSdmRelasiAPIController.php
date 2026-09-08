<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Http\Request;

class MtSdmRelasiAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MtSdmRelasi;
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->all();

        // Generate id_relasi if not provided
        if (empty($data['id_relasi'])) {
            $last = \App\Models\MtSdmRelasi::withTrashed()
                ->orderBy('id_relasi', 'desc')
                ->first();
            if ($last && preg_match('/REL(\d+)/', $last->id_relasi, $m)) {
                $data['id_relasi'] = 'REL' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $data['id_relasi'] = 'REL0001';
            }
        }

        $data['created_by'] = auth()->check() ? auth()->user()->id_user : null;
        $data['created_by_desc'] = auth()->check() ? auth()->user()->name : null;

        $record = $this->model->create($data);

        return response()->json([
            'success' => true,
            'data' => $record,
            'message' => 'Data berhasil disimpan.',
        ], 201);
    }

    public function update($id, Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->all();

        $data['updated_by'] = auth()->check() ? auth()->user()->id_user : null;
        $data['updated_by_desc'] = auth()->check() ? auth()->user()->name : null;

        $record = $this->model->findOrFail($id);
        $record->update($data);

        return response()->json([
            'success' => true,
            'data' => $record,
            'message' => 'Data berhasil diperbarui.',
        ]);
    }
}
