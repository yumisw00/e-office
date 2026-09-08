<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;
use App\Models\SuratDistribusi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuratDistribusiAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new SuratDistribusi;
    }

    public function index(Request $request): JsonResponse
    {
        $search = $this->_search($request->get('q'));
        $recipientScope = $search['recipient_scope'] ?? null;
        unset($search['recipient_scope']);

        $query = $this->model->search($search)->with('suratMasuk');

        if ($recipientScope === 'me') {
            $user = auth()->user();
            $userId = $user?->id_user ?? $user?->id ?? data_get(session('user'), 'id_user');
            $unitId = session('id_unit')
                ?? $user?->id_unit
                ?? $user?->id_unit_kerja
                ?? $user?->id_sdm_unit
                ?? null;

            $query->where(function ($recipientQuery) use ($userId, $unitId) {
                if ($userId) {
                    $recipientQuery->orWhere('id_user_tujuan', $userId);
                }

                if ($unitId) {
                    $recipientQuery->orWhere('id_unit_tujuan', $unitId);
                }

                if (!$userId && !$unitId) {
                    $recipientQuery->whereRaw('1 = 0');
                }
            });
        }

        // Ringkasan harus menggunakan query yang sama dengan tabel, termasuk
        // filter dan scope penerima, agar total setiap user selalu konsisten.
        $summary = $this->buildSummary($query);

        $orderBy = $request->get('order');
        if ($orderBy) {
            foreach (explode(',', $orderBy) as $order) {
                $parts = preg_split('/\s+/', trim($order));
                $column = $parts[0] ?? null;
                $direction = strtolower($parts[1] ?? 'asc') === 'desc' ? 'desc' : 'asc';

                if ($column) {
                    $query->orderBy($column, $direction);
                }
            }
        } else {
            $query->orderByDesc('tanggal_distribusi')->orderByDesc($this->model->primaryKey);
        }

        $pageSize = max(1, min((int) ($request->get('pagesize') ?? $this->limit), 100));
        $data = $query->paginate($pageSize);

        return $this->respond([
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'data' => $data->items(),
            'total_page' => (int) ceil($data->total() / $pageSize),
            'total_records' => $data->total(),
            'summary' => $summary,
        ]);
    }

    private function buildSummary($query): array
    {
        return (clone $query)->pluck('status')->reduce(function (array $summary, $status) {
            $normalized = strtolower(trim((string) $status));
            $summary['total']++;

            if (in_array($normalized, ['dikirim', 'distributed', 'baru', 'pending'], true)) {
                $summary['baru']++;
            } elseif (in_array($normalized, ['selesai', 'done', 'arsip', 'archived'], true)) {
                $summary['selesai']++;
            } else {
                $summary['distribusi']++;
            }

            return $summary;
        }, [
            'total' => 0,
            'baru' => 0,
            'distribusi' => 0,
            'selesai' => 0,
        ]);
    }
}
