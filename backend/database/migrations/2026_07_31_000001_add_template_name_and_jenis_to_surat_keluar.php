<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('surat_keluar')) {
            return;
        }

        Schema::table('surat_keluar', function (Blueprint $table) {
            if (!Schema::hasColumn('surat_keluar', 'template_nama')) {
                $table->string('template_nama')->nullable()->after('id_surat_template');
            }

            if (!Schema::hasColumn('surat_keluar', 'jenis')) {
                $table->string('jenis', 100)->nullable()->after('template_nama');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('surat_keluar')) {
            return;
        }

        Schema::table('surat_keluar', function (Blueprint $table) {
            foreach (['jenis', 'template_nama'] as $column) {
                if (Schema::hasColumn('surat_keluar', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
