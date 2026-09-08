<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MtSdmDivisiAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MtSdmDivisi;
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->all();

        // Map frontend field names to DB column names
        if (isset($data['nama_unit'])) {
            $data['nama'] = $data['nama_unit'];
            unset($data['nama_unit']);
        }

        // Generate id_divisi if not provided
        if (empty($data['id_divisi'])) {
            $last = \App\Models\MtSdmDivisi::withTrashed()
                ->orderBy('id_divisi', 'desc')
                ->first();
            if ($last && preg_match('/DIV(\d+)/', $last->id_divisi, $m)) {
                $data['id_divisi'] = 'DIV' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $data['id_divisi'] = 'DIV0001';
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
            $deletedBy = auth()->check() ? auth()->user()->id_user : null;
            $deletedByDesc = auth()->check() ? auth()->user()->name : null;

            // Cascade soft-delete departemen yang referensikan divisi ini
            DB::table('mt_sdm_departemen')
                ->where('id_divisi', $id)
                ->whereNull('deleted_at')
                ->update([
                    'deleted_at'      => $now,
                    'deleted_by'      => $deletedBy,
                    'deleted_by_desc' => $deletedByDesc,
                    'updated_at'      => $now,
                ]);

            // Lepaskan referensi id_unit di jabatan yang menunjuk ke divisi ini.
            // mt_sdm_jabatan tidak punya kolom deleted_at, jadi null-kan id_unit
            // agar FK constraint tidak memblokir penghapusan divisi.
            DB::table('mt_sdm_jabatan')
                ->where('id_unit', $id)
                ->update([
                    'id_unit'    => null,
                    'updated_at' => $now,
                ]);

            // Pegawai lama juga dapat menyimpan kode divisi langsung pada
            // id_unit. Lepaskan relasi tersebut agar data pengguna/role
            // pimpinan tidak menahan penghapusan master divisi.
            DB::table('mt_sdm_pegawai')
                ->where('id_unit', $id)
                ->whereNull('deleted_at')
                ->update([
                    'id_unit'    => null,
                    'nama_unit'  => null,
                    'updated_at' => $now,
                ]);

            // Hard-delete pengumuman_divisi yang referensikan divisi ini
            // (tabel ini tidak punya soft delete)
            DB::table('pengumuman_divisi')
                ->where('id_divisi', $id)
                ->delete();

            // Hapus divisi
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
