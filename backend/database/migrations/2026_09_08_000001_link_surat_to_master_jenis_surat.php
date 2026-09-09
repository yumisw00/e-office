<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('master_jenis_surat')) {
            return;
        }

        foreach (['surat_masuk', 'surat_keluar'] as $tableName) {
            if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'id_jenis_surat')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->unsignedBigInteger('id_jenis_surat')->nullable()->index();
                $table->foreign('id_jenis_surat', $tableName . '_id_jenis_surat_foreign')
                    ->references('id_jenis_surat')
                    ->on('master_jenis_surat')
                    ->nullOnDelete();
            });
        }

        // Preserve legacy values by registering values that are not yet in the
        // master, then link every existing incoming/outgoing letter to it.
        // No historical letter type is silently replaced or discarded.
        $now = now();
        foreach (['surat_masuk', 'surat_keluar'] as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'jenis') || !Schema::hasColumn($tableName, 'id_jenis_surat')) {
                continue;
            }

            DB::table($tableName)
                ->whereNotNull('jenis')
                ->select('jenis')
                ->distinct()
                ->orderBy('jenis')
                ->pluck('jenis')
                ->each(function ($rawJenis) use ($tableName, $now) {
                    $nama = trim((string) $rawJenis);
                    if ($nama === '') {
                        return;
                    }

                    $jenis = DB::table('master_jenis_surat')
                        ->whereRaw('LOWER(nama) = ?', [mb_strtolower($nama)])
                        ->first();

                    if (!$jenis) {
                        $id = DB::table('master_jenis_surat')->insertGetId([
                            'kode' => 'JS-LEG-' . strtoupper(substr(hash('sha256', mb_strtolower($nama)), 0, 12)),
                            'nama' => $nama,
                            'deskripsi' => 'Jenis surat hasil sinkronisasi data lama.',
                            'is_active' => true,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ], 'id_jenis_surat');
                        $jenis = (object) ['id_jenis_surat' => $id];
                    }

                    DB::table($tableName)
                        ->whereRaw('LOWER(TRIM(jenis)) = ?', [mb_strtolower($nama)])
                        ->update(['id_jenis_surat' => $jenis->id_jenis_surat, 'updated_at' => $now]);
                });
        }
    }

    public function down(): void
    {
        foreach (['surat_masuk', 'surat_keluar'] as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'id_jenis_surat')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->dropForeign($tableName . '_id_jenis_surat_foreign');
                $table->dropColumn('id_jenis_surat');
            });
        }
    }
};
