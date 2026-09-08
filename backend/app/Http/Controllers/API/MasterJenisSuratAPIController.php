<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\RespondsWithFrontendFormat;
use App\Http\Controllers\BaseResourceController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MasterJenisSuratAPIController extends BaseResourceController
{
    use RespondsWithFrontendFormat;

    public function __construct()
    {
        $this->model = new \App\Models\MasterJenisSurat;
    }

    public function options(): JsonResponse
    {
        $items = $this->model->newQuery()
            ->where('is_active', true)
            ->orderBy('nama')
            ->get()
            ->map(fn ($item) => [
                'value' => $item->nama,
                'label' => $item->nama,
                'id_jenis_surat' => $item->id_jenis_surat,
                'kode' => $item->kode,
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $request->validate($this->rulesFor());

        return parent::store($request);
    }

    public function update($id = null, Request $request): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $request->validate($this->rulesFor($id));

        return parent::update($id, $request);
    }

    public function destroy($id = null): JsonResponse
    {
        $this->authorizeAdministrator(request());

        $used = DB::table('surat_masuk')->where('jenis', $this->model->find($id)?->nama)->exists()
            || DB::table('surat_keluar')->where('jenis', $this->model->find($id)?->nama)->exists()
            || DB::table('surat_template')->where('jenis_surat', $this->model->find($id)?->nama)->exists();

        if ($used) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis surat sudah digunakan. Nonaktifkan data ini sebagai pengganti menghapus.',
            ], 409);
        }

        return parent::destroy($id);
    }

    private function rulesFor(int|string|null $id = null): array
    {
        return [
            'kode' => ['required', 'string', 'max:50', Rule::unique('master_jenis_surat', 'kode')->ignore($id, 'id_jenis_surat')],
            'nama' => ['required', 'string', 'max:150', Rule::unique('master_jenis_surat', 'nama')->ignore($id, 'id_jenis_surat')],
            'deskripsi' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ];
    }

    private function authorizeAdministrator(Request $request): void
    {
        $groupId = $request->session()->get('id_group');
        $isAdmin = $groupId && DB::table('sys_group')
            ->where('id_group', $groupId)
            ->whereNull('deleted_at')
            ->where(function ($query) {
                $query->whereRaw("LOWER(REPLACE(nama, '_', ' ')) = 'admin sistem'")
                    ->orWhereRaw("LOWER(REPLACE(nama, '_', ' ')) = 'admin konten'");
            })
            ->exists();

        abort_unless($isAdmin, 403, 'Anda tidak memiliki akses untuk mengelola master jenis surat.');
    }
}
