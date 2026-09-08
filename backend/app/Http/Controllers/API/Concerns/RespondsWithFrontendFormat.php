<?php

namespace App\Http\Controllers\API\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

trait RespondsWithFrontendFormat
{
    public function index(Request $request): JsonResponse
    {
        $search = $this->_search($request->get('q'));
        $pageSize = (int) ($request->get('pagesize') ?? $this->limit);
        $pageSize = $pageSize > 0 ? $pageSize : $this->limit;

        $query = $this->model->search($search);

        $this->applyOrdering($query, $request);

        $data = $query->paginate($pageSize);

        $items = collect($data->items())
            ->map(fn ($record) => $this->transformFrontendRecord($record))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'result' => $items,
            'page' => $data->currentPage(),
            'page_size' => $data->perPage(),
            'total_page' => (int) ceil($data->total() / $pageSize),
            'total_records' => $data->total(),
            'total' => $data->total(),
        ]);
    }

    public function show($id = null): JsonResponse
    {
        $record = $this->model->find($id);

        if (!$record) {
            return $this->frontendNotFound($id);
        }

        return response()->json([
            'success' => true,
            'data' => $this->transformFrontendRecord($record),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->filterFillablePayload(
            $this->prepareFrontendPayload($request, 'store')
        );

        Validator::make($payload, $this->frontendRules('store'))->validate();

        $id = $this->model->insert($payload);
        $record = $this->model->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dibuat.',
            'data' => $this->transformFrontendRecord($record ?: array_merge($payload, [
                $this->model->primaryKey => $id,
            ])),
        ], 201);
    }

    public function update($id = null, Request $request): JsonResponse
    {
        $record = $this->model->find($id);

        if (!$record) {
            return $this->frontendNotFound($id);
        }

        $payload = $this->filterFillablePayload(
            $this->prepareFrontendPayload($request, 'update')
        );

        Validator::make($payload, $this->frontendRules('update'))->validate();

        $this->model->update($id, $payload, $record);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui.',
            'data' => $this->transformFrontendRecord($this->model->find($id)),
        ]);
    }

    public function destroy($id = null): JsonResponse
    {
        $record = $this->model->find($id);

        if (!$record) {
            return $this->frontendNotFound($id);
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus.',
            'data' => [
                $this->model->primaryKey => $id,
                'id' => $id,
            ],
        ]);
    }

    protected function prepareFrontendPayload(Request $request, string $mode): array
    {
        return $request->all();
    }

    protected function frontendRules(string $mode): array
    {
        return $this->model->rules ?? [];
    }

    protected function transformFrontendRecord($record): array
    {
        if (!$record) {
            return [];
        }

        if (is_array($record)) {
            return $record;
        }

        if (method_exists($record, 'toArray')) {
            return $record->toArray();
        }

        return (array) $record;
    }

    protected function filterFillablePayload(array $payload): array
    {
        $fillable = $this->model->fillable ?? [];

        if (!$fillable) {
            return $payload;
        }

        return collect($payload)
            ->only($fillable)
            ->all();
    }

    private function applyOrdering($query, Request $request): void
    {
        $orderby = $request->get('order');

        if ($orderby) {
            foreach (explode(',', $orderby) as $order) {
                $exp = preg_split('/\s+/', trim($order));
                $column = $exp[0] ?? null;
                $direction = strtolower($exp[1] ?? 'asc') === 'desc' ? 'desc' : 'asc';

                if ($column) {
                    $query->orderBy($column, $direction);
                }
            }

            return;
        }

        if ($this->model->orderDefault) {
            foreach (explode(',', $this->model->orderDefault) as $order) {
                $query->orderByRaw(trim($order));
            }

            return;
        }

        if ($this->model->primaryKey) {
            $query->orderBy($this->model->primaryKey);
        }
    }

    private function frontendNotFound($id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => sprintf('Data dengan id %s tidak ditemukan.', $id),
        ], 404);
    }
}
