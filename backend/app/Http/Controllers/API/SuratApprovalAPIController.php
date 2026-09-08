<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuratApprovalAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SuratApproval;
    }

    /**
     * Return approval rows together with their outgoing-letter details so the
     * Pimpinan queue can show the document that is awaiting a decision.
     */
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->get('page', 1));
        $pageSize = max(1, (int) $request->get('pagesize', 100));

        $query = DB::table('surat_approval')
            ->join('surat_keluar', 'surat_approval.id_surat_keluar', '=', 'surat_keluar.id_surat_keluar')
            ->leftJoin('sys_user as pembuat', 'surat_keluar.created_by', '=', 'pembuat.id_user')
            ->whereNull('surat_approval.deleted_at')
            ->whereNull('surat_keluar.deleted_at')
            ->select([
                'surat_approval.*',
                'surat_keluar.nomor_surat',
                'surat_keluar.kode_draft',
                'surat_keluar.perihal',
                'surat_keluar.tujuan_nama',
                'surat_keluar.created_at as tanggal_diajukan',
                'pembuat.name as created_by_name',
            ])
            ->orderByDesc('surat_approval.created_at');

        // The active authenticated session is authoritative. Do not rely on a
        // client-side user ID stored in localStorage to scope approval data.
        $approverId = auth()->user()?->id_user ?? auth()->id();
        $activeGroupId = $request->session()->get('id_group');
        $isSystemAdmin = $activeGroupId && DB::table('sys_group')
            ->where('id_group', $activeGroupId)
            ->whereNull('deleted_at')
            ->whereRaw("LOWER(REPLACE(nama, '_', ' ')) = 'admin sistem'")
            ->exists();

        if (!$isSystemAdmin && $approverId) {
            $query->where('surat_approval.id_approver', $approverId);
        } elseif (!$isSystemAdmin) {
            $query->whereRaw('1 = 0');
        }

        $data = $query->paginate($pageSize, ['*'], 'page', $page);
        $items = $data->items();

        return response()->json([
            'success' => true,
            'data' => $items,
            'result' => $items,
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'total_page' => (int) ceil($data->total() / $data->perPage()),
            'total_records' => $data->total(),
        ]);
    }
}
