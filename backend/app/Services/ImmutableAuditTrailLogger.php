<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImmutableAuditTrailLogger
{
    public function log(string $tableName, string|int|null $recordId, string $action, mixed $oldValues = null, mixed $newValues = null): void
    {
        if ($tableName === 'audit_trail_immutable') {
            return;
        }

        if (!Schema::hasTable('audit_trail_immutable')) {
            return;
        }

        $previousHash = DB::table('audit_trail_immutable')
            ->whereNull('deleted_at')
            ->orderByDesc('id_audit_trail')
            ->value('current_hash');

        $payload = [
            'id_user' => auth()->user()?->id_user,
            'table_name' => $tableName,
            'record_id' => $recordId !== null ? (string) $recordId : null,
            'action' => $action,
            'old_values' => $this->normalize($oldValues),
            'new_values' => $this->normalize($newValues),
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'previous_hash' => $previousHash,
            'created_at' => now()->format('Y-m-d H:i:s'),
        ];

        $currentHash = hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        DB::table('audit_trail_immutable')->insert([
            'id_user' => $payload['id_user'],
            'table_name' => $payload['table_name'],
            'record_id' => $payload['record_id'],
            'action' => $payload['action'],
            'old_values' => json_encode($payload['old_values'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'new_values' => json_encode($payload['new_values'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'ip_address' => $payload['ip_address'],
            'user_agent' => $payload['user_agent'],
            'previous_hash' => $payload['previous_hash'],
            'current_hash' => $currentHash,
            'created_at' => $payload['created_at'],
            'updated_at' => $payload['created_at'],
        ]);
    }

    private function normalize(mixed $values): mixed
    {
        if ($values instanceof \Illuminate\Database\Eloquent\Model) {
            return $values->toArray();
        }

        if ($values instanceof \Illuminate\Support\Collection) {
            return $values->toArray();
        }

        if (is_object($values)) {
            return (array) $values;
        }

        return $values;
    }
}
