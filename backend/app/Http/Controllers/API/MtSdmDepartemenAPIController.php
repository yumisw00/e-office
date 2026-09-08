<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Http\Request;

class MtSdmDepartemenAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MtSdmDepartemen;
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->all();

        // Map frontend field names to DB column names
        if (isset($data['nama_unit'])) {
            $data['nama'] = $data['nama_unit'];
            unset($data['nama_unit']);
        }

        // Generate id_departemen if not provided
        if (empty($data['id_departemen'])) {
            $last = \App\Models\MtSdmDepartemen::withTrashed()
                ->orderBy('id_departemen', 'desc')
                ->first();
            if ($last && preg_match('/DEPT(\d+)/', $last->id_departemen, $m)) {
                $data['id_departemen'] = 'DEPT' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $data['id_departemen'] = 'DEPT0001';
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

        if (isset($data['nama_unit'])) {
            $data['nama'] = $data['nama_unit'];
            unset($data['nama_unit']);
        }

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
