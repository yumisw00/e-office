<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            $columns = [
                'tujuan_alamat' => 'string|max:500|nullable',
                'tujuan_kontak' => 'string|max:100|nullable',
                'tujuan_jabatan' => 'string|max:200|nullable',
            ];

            foreach ($columns as $colName => $definition) {
                if (!Schema::hasColumn('surat_keluar', $colName)) {
                    Schema::table('surat_keluar', function (Blueprint $table) use ($colName) {
                        $table->string($colName, 500)->nullable()->after('tujuan_email');
                    });
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            foreach (['tujuan_alamat', 'tujuan_kontak', 'tujuan_jabatan'] as $col) {
                if (Schema::hasColumn('surat_keluar', $col)) {
                    Schema::table('surat_keluar', function (Blueprint $table) use ($col) {
                        $table->dropColumn($col);
                    });
                }
            }
        }
    }
};
