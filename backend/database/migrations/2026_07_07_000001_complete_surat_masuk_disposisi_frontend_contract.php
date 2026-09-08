<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_masuk')) {
            Schema::table('surat_masuk', function (Blueprint $table) {
                if (!Schema::hasColumn('surat_masuk', 'source_type')) {
                    $table->string('source_type', 20)->default('Manual');
                }

                if (!Schema::hasColumn('surat_masuk', 'ai_status')) {
                    $table->string('ai_status', 30)->default('belum_diproses');
                }
            });

            Schema::table('surat_masuk', function (Blueprint $table) {
                foreach ($this->suratMasukIndexes() as $index) {
                    [$columns, $name] = $index;
                    if ($this->hasColumns('surat_masuk', $columns)) {
                        $table->index($columns, $name);
                    }
                }
            });
        }

        if (Schema::hasTable('surat_disposisi')) {
            Schema::table('surat_disposisi', function (Blueprint $table) {
                if (!Schema::hasColumn('surat_disposisi', 'tanggal_disposisi')) {
                    $table->timestamp('tanggal_disposisi')->nullable();
                }

                if (!Schema::hasColumn('surat_disposisi', 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable();
                }

                if (!Schema::hasColumn('surat_disposisi', 'updated_by')) {
                    $table->unsignedBigInteger('updated_by')->nullable();
                }

                if (!Schema::hasColumn('surat_disposisi', 'deleted_by')) {
                    $table->unsignedBigInteger('deleted_by')->nullable();
                }

                if (!Schema::hasColumn('surat_disposisi', 'created_by_desc')) {
                    $table->string('created_by_desc', 200)->nullable();
                }

                if (!Schema::hasColumn('surat_disposisi', 'updated_by_desc')) {
                    $table->string('updated_by_desc', 200)->nullable();
                }

                if (!Schema::hasColumn('surat_disposisi', 'deleted_by_desc')) {
                    $table->string('deleted_by_desc', 200)->nullable();
                }
            });

            Schema::table('surat_disposisi', function (Blueprint $table) {
                foreach ($this->suratDisposisiIndexes() as $index) {
                    [$columns, $name] = $index;
                    if ($this->hasColumns('surat_disposisi', $columns)) {
                        $table->index($columns, $name);
                    }
                }
            });
        }

        foreach (['agenda_kegiatan', 'surat_arsip'] as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'updated_by')) {
                    $table->unsignedBigInteger('updated_by')->nullable();
                }

                if (!Schema::hasColumn($tableName, 'deleted_by')) {
                    $table->unsignedBigInteger('deleted_by')->nullable();
                }

                if (!Schema::hasColumn($tableName, 'created_by_desc')) {
                    $table->string('created_by_desc', 200)->nullable();
                }

                if (!Schema::hasColumn($tableName, 'updated_by_desc')) {
                    $table->string('updated_by_desc', 200)->nullable();
                }

                if (!Schema::hasColumn($tableName, 'deleted_by_desc')) {
                    $table->string('deleted_by_desc', 200)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_disposisi')) {
            Schema::table('surat_disposisi', function (Blueprint $table) {
                foreach ($this->suratDisposisiIndexes() as [, $name]) {
                    $this->dropIndexIfExists($table, $name);
                }
            });

            Schema::table('surat_disposisi', function (Blueprint $table) {
                foreach ([
                    'tanggal_disposisi',
                    'created_by',
                    'updated_by',
                    'deleted_by',
                    'created_by_desc',
                    'updated_by_desc',
                    'deleted_by_desc',
                ] as $column) {
                    if (Schema::hasColumn('surat_disposisi', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('surat_masuk')) {
            Schema::table('surat_masuk', function (Blueprint $table) {
                foreach ($this->suratMasukIndexes() as [, $name]) {
                    $this->dropIndexIfExists($table, $name);
                }
            });

            Schema::table('surat_masuk', function (Blueprint $table) {
                foreach (['source_type', 'ai_status'] as $column) {
                    if (Schema::hasColumn('surat_masuk', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        foreach (['surat_arsip', 'agenda_kegiatan'] as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                foreach (['updated_by', 'deleted_by', 'created_by_desc', 'updated_by_desc', 'deleted_by_desc'] as $column) {
                    if (Schema::hasColumn($tableName, $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }

    private function suratMasukIndexes(): array
    {
        return [
            [['status'], 'idx_sm_frontend_status_20260707'],
            [['tanggal_surat'], 'idx_sm_frontend_tanggal_surat_20260707'],
            [['tenggat_waktu'], 'idx_sm_frontend_tenggat_waktu_20260707'],
            [['topik'], 'idx_sm_frontend_topik_20260707'],
            [['kepada_tujuan'], 'idx_sm_frontend_penerima_20260707'],
            [['source_type'], 'idx_sm_frontend_source_type_20260707'],
            [['file_surat'], 'idx_sm_frontend_file_surat_20260707'],
        ];
    }

    private function suratDisposisiIndexes(): array
    {
        return [
            [['id_surat_masuk', 'status'], 'idx_sd_frontend_surat_status_20260707'],
            [['id_penerima'], 'idx_sd_frontend_penerima_20260707'],
            [['tanggal_jatuh_tempo'], 'idx_sd_frontend_tenggat_20260707'],
            [['tanggal_disposisi'], 'idx_sd_frontend_tanggal_disposisi_20260707'],
        ];
    }

    private function hasColumns(string $table, array $columns): bool
    {
        foreach ($columns as $column) {
            if (!Schema::hasColumn($table, $column)) {
                return false;
            }
        }

        return true;
    }

    private function dropIndexIfExists(Blueprint $table, string $name): void
    {
        try {
            $table->dropIndex($name);
        } catch (Throwable) {
            //
        }
    }
};
