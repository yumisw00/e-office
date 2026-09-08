<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Http\Request;

class MtSdmPegawaiAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MtSdmPegawai;
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->all();

        // Map frontend field names to DB column names
        if (isset($data['nama_pegawai'])) {
            $data['nama'] = $data['nama_pegawai'];
            unset($data['nama_pegawai']);
        }

        // Get unit and jabatan names for denormalized fields
        if (!empty($data['id_unit'])) {
            $unit = \App\Models\MtSdmUnit::find($data['id_unit']);
            if ($unit) {
                $data['nama_unit'] = $unit->nama;
            }
        }
        if (!empty($data['id_jabatan'])) {
            $jabatan = \App\Models\MtSdmJabatan::find($data['id_jabatan']);
            if ($jabatan) {
                $data['nama_jabatan'] = $jabatan->nama;
            }
        }

        // Generate id_pegawai if not provided
        if (empty($data['id_pegawai'])) {
            $last = \App\Models\MtSdmPegawai::withTrashed()
                ->orderBy('id_pegawai', 'desc')
                ->first();
            if ($last && preg_match('/PEG(\d+)/', $last->id_pegawai, $m)) {
                $data['id_pegawai'] = 'PEG' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $data['id_pegawai'] = 'PEG0001';
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

        if (isset($data['nama_pegawai'])) {
            $data['nama'] = $data['nama_pegawai'];
            unset($data['nama_pegawai']);
        }

        // Get unit and jabatan names for denormalized fields
        if (isset($data['id_unit'])) {
            $unit = \App\Models\MtSdmUnit::find($data['id_unit']);
            if ($unit) {
                $data['nama_unit'] = $unit->nama;
            }
        }
        if (isset($data['id_jabatan'])) {
            $jabatan = \App\Models\MtSdmJabatan::find($data['id_jabatan']);
            if ($jabatan) {
                $data['nama_jabatan'] = $jabatan->nama;
            }
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
