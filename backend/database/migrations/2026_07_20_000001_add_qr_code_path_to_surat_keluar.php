<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('surat_keluar', 'qr_code_path')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->string('qr_code_path', 255)->nullable()->after('lampiran_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('surat_keluar', 'qr_code_path')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->dropColumn('qr_code_path');
            });
        }
    }
};
