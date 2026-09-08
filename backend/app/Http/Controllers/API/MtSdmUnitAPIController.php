<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MtSdmUnitAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MtSdmUnit;
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->all();

        // Map frontend field names to DB column names
        if (isset($data['nama_unit'])) {
            $data['nama'] = $data['nama_unit'];
            unset($data['nama_unit']);
        }
        if (isset($data['kode_unit'])) {
            // keep it
        }
        if (isset($data['id_parent'])) {
            // keep it
        }
        if (isset($data['status'])) {
            // keep it
        }

        // Generate an ID after the highest numeric UNIT suffix. Sorting the IDs as
        // strings is incorrect when old formats such as UNIT01 and UNIT0002 coexist.
        if (empty($data['id_unit'])) {
            $lastNumber = \App\Models\MtSdmUnit::withTrashed()
                ->pluck('id_unit')
                ->map(function ($idUnit) {
                    return preg_match('/^UNIT(\d+)$/', $idUnit, $matches)
                        ? (int) $matches[1]
                        : 0;
                })
                ->max();

            $data['id_unit'] = 'UNIT' . str_pad(((int) $lastNumber) + 1, 4, '0', STR_PAD_LEFT);
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

        // Map frontend field names to DB column names
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

    public function destroy($id = null): \Illuminate\Http\JsonResponse
    {
        $record = $this->model->find($id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan.',
            ], 404);
        }

        DB::beginTransaction();
        try {
            $now = now();

            // Jabatan tetap dipertahankan karena bisa dipakai sebagai role
            // pengguna (misalnya Direksi/Pimpinan). Hanya hubungan ke unit
            // yang dihapus agar master unit dapat dihapus dengan aman.
            DB::table('mt_sdm_jabatan')
                ->where('id_unit', $id)
                ->update([
                    'id_unit' => null,
                    'updated_at' => $now,
                ]);

            // Lepaskan seluruh referensi organisasi lain ke unit ini.
            DB::table('mt_sdm_divisi')->where('id_unit', $id)->update(['id_unit' => null, 'updated_at' => $now]);
            DB::table('mt_sdm_departemen')->where('id_unit', $id)->update(['id_unit' => null, 'updated_at' => $now]);
            DB::table('mt_sdm_pegawai')->where('id_unit', $id)->update(['id_unit' => null, 'nama_unit' => null, 'updated_at' => $now]);
            DB::table('mt_sdm_unit')->where('id_parent', $id)->update(['id_parent' => null, 'updated_at' => $now]);

            $record->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil dihapus.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data: ' . $e->getMessage(),
            ], 500);
        }
    }
}
