<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PimpinanMobileController
{
    public function dashboard(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id_user;
        if (!$this->isPimpinan($userId)) return $this->forbidden();
        $pendingDisposisi = DB::table('surat_disposisi')->where('id_penerima', $userId)->whereIn('status', ['baru', 'diproses', 'proses'])->whereNull('deleted_at')->count();
        $pendingApproval = DB::table('surat_approval')->where('id_approver', $userId)->whereIn('status', ['waiting', 'pending', 'review'])->whereNull('deleted_at')->count();
        $totalMasukBulan = DB::table('surat_masuk as m')
            ->join('surat_distribusi as d', 'd.id_surat_masuk', '=', 'm.id')
            ->where('d.id_user_tujuan', $userId)->whereNull('d.deleted_at')
            ->whereMonth('m.tanggal_terima', now()->month)->whereYear('m.tanggal_terima', now()->year)
            ->whereNull('m.deleted_at')->distinct('m.id')->count('m.id');

        return response()->json(['success' => true, 'data' => [
            'pending_disposisi' => $pendingDisposisi,
            'pending_approval' => $pendingApproval,
            'total_surat_masuk_bulan_ini' => $totalMasukBulan,
        ]]);
    }

    public function myActions(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id_user;
        if (!$this->isPimpinan($userId)) return $this->forbidden();
        $rows = collect(DB::table('surat_disposisi as d')->join('surat_masuk as m', 'm.id', '=', 'd.id_surat_masuk')->where('d.id_penerima', $userId)->whereIn('d.status', ['baru', 'diproses', 'proses'])->whereNull('d.deleted_at')->select('m.id', 'm.nomor_surat', 'm.perihal', 'd.status', DB::raw("'disposisi' as action_type"))->get())
            ->merge(DB::table('surat_approval as a')->join('surat_keluar as k', 'k.id_surat_keluar', '=', 'a.id_surat_keluar')->where('a.id_approver', $userId)->whereIn('a.status', ['waiting', 'pending', 'review'])->whereNull('a.deleted_at')->select('k.id_surat_keluar as id', 'k.nomor_surat', 'k.perihal', 'a.status', DB::raw("'approval' as action_type"))->get());

        $pageSize = max(1, min((int) $request->input('pagesize', 10), 50));
        $page = max(1, (int) $request->input('page', 1));
        $total = $rows->count();

        return response()->json([
            'success' => true,
            'data' => $rows->sortByDesc('id')->forPage($page, $pageSize)->values(),
            'page' => $page,
            'page_size' => $pageSize,
            'total_page' => (int) ceil($total / $pageSize),
            'total_records' => $total,
        ]);
    }

    public function tracking(Request $request, int|string $idSurat): JsonResponse
    {
        $userId = (int) $request->user()->id_user;
        if (!$this->isPimpinan($userId)) return $this->forbidden();
        $incoming = DB::table('surat_masuk')->where('id', $idSurat)->whereNull('deleted_at')->first();
        if (!$incoming) {
            $incoming = DB::table('surat_masuk')->where('id_surat_keluar', $idSurat)->whereNull('deleted_at')->first();
        }
        $outgoing = DB::table('surat_keluar')->where('id_surat_keluar', $incoming->id_surat_keluar ?? $idSurat)->whereNull('deleted_at')->first();

        if (!$incoming && !$outgoing) {
            return response()->json(['success' => false, 'message' => 'Surat tidak ditemukan.'], 404);
        }

        $canTrack = ($incoming && DB::table('surat_distribusi')->where('id_surat_masuk', $incoming->id)->where('id_user_tujuan', $userId)->whereNull('deleted_at')->exists())
            || ($outgoing && ((int) $outgoing->created_by === $userId || DB::table('surat_approval')->where('id_surat_keluar', $outgoing->id_surat_keluar)->where('id_approver', $userId)->whereNull('deleted_at')->exists()));
        if (!$canTrack) return $this->forbidden();

        $events = collect();
        if ($outgoing) {
            $events->push(['type' => 'created', 'title' => 'Surat keluar dibuat', 'status' => 'diproses', 'created_at' => $outgoing->created_at]);
            DB::table('surat_approval')->where('id_surat_keluar', $outgoing->id_surat_keluar)->whereNull('deleted_at')->orderBy('urutan')->get()->each(function ($approval) use ($events) {
                $events->push(['type' => 'approval', 'title' => 'Proses persetujuan', 'status' => $approval->status, 'created_at' => $approval->tanggal_aksi ?? $approval->updated_at]);
            });
        }
        if ($incoming) {
            $events->push(['type' => 'incoming', 'title' => 'Surat diterima', 'status' => $incoming->status, 'created_at' => $incoming->tanggal_terima ?? $incoming->created_at]);
            DB::table('surat_distribusi')->where('id_surat_masuk', $incoming->id)->whereNull('deleted_at')->get()->each(function ($distribution) use ($events) {
                $events->push(['type' => 'distribution', 'title' => 'Surat didistribusikan', 'status' => $distribution->status, 'created_at' => $distribution->tanggal_distribusi ?? $distribution->created_at]);
                if ($distribution->tanggal_dibaca) $events->push(['type' => 'read', 'title' => 'Surat dibaca', 'status' => 'selesai', 'created_at' => $distribution->tanggal_dibaca]);
            });
            DB::table('surat_disposisi')->where('id_surat_masuk', $incoming->id)->whereNull('deleted_at')->get()->each(function ($disposition) use ($events) {
                $events->push(['type' => 'disposition', 'title' => 'Surat didisposisikan', 'status' => $disposition->status, 'created_at' => $disposition->tanggal_disposisi ?? $disposition->created_at]);
            });
        }

        return response()->json(['success' => true, 'data' => $events->filter(fn ($event) => $event['created_at'])->sortBy('created_at')->values()]);
    }

    private function isPimpinan(int $userId): bool
    {
        return DB::table('sys_user_group')
            ->join('sys_group', 'sys_group.id_group', '=', 'sys_user_group.id_group')
            ->where('sys_user_group.id_user', $userId)
            ->whereNull('sys_user_group.deleted_at')->whereNull('sys_group.deleted_at')
            ->whereRaw("LOWER(REPLACE(sys_group.nama, '_', ' ')) = 'pimpinan'")
            ->exists();
    }

    private function forbidden(): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Akses khusus Pimpinan.'], 403);
    }
}
