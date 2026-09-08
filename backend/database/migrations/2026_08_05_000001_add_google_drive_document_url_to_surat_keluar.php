<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_keluar') && !Schema::hasColumn('surat_keluar', 'google_drive_document_url')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->string('google_drive_document_url')->nullable()->after('office365_document_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_keluar') && Schema::hasColumn('surat_keluar', 'google_drive_document_url')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $table->dropColumn('google_drive_document_url');
            });
        }
    }
};
