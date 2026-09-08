<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('surat_template', 'drive_document_url')) {
            Schema::table('surat_template', function (Blueprint $table) {
                $table->string('drive_document_url', 500)->nullable()->after('office365_document_url');
            });
        }
        if (!Schema::hasColumn('surat_template', 'file_template')) {
            Schema::table('surat_template', function (Blueprint $table) {
                $table->string('file_template', 255)->nullable()->after('deskripsi');
            });
        }
    }

    public function down(): void
    {
        Schema::table('surat_template', function (Blueprint $table) {
            if (Schema::hasColumn('surat_template', 'drive_document_url')) {
                $table->dropColumn('drive_document_url');
            }
            if (Schema::hasColumn('surat_template', 'file_template')) {
                $table->dropColumn('file_template');
            }
        });
    }
};
