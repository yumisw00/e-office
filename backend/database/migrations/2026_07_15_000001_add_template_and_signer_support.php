<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_template')) {
            Schema::table('surat_template', function (Blueprint $table) {
                if (!Schema::hasColumn('surat_template', 'office365_document_url')) {
                    $table->string('office365_document_url')->nullable()->after('file_path');
                }

                if (!Schema::hasColumn('surat_template', 'drive_document_url')) {
                    $table->string('drive_document_url')->nullable()->after('office365_document_url');
                }

                if (!Schema::hasColumn('surat_template', 'pdf_path')) {
                    $table->string('pdf_path')->nullable()->after('drive_document_url');
                }
            });
        }

        if (Schema::hasTable('surat_keluar')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                if (!Schema::hasColumn('surat_keluar', 'id_penandatangan')) {
                    $table->unsignedBigInteger('id_penandatangan')->nullable()->after('tujuan_email');
                }

                if (!Schema::hasColumn('surat_keluar', 'nama_penandatangan')) {
                    $table->string('nama_penandatangan', 200)->nullable()->after('id_penandatangan');
                }

                if (!Schema::hasColumn('surat_keluar', 'jabatan_penandatangan')) {
                    $table->string('jabatan_penandatangan', 200)->nullable()->after('nama_penandatangan');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                foreach (['jabatan_penandatangan', 'nama_penandatangan', 'id_penandatangan'] as $column) {
                    if (Schema::hasColumn('surat_keluar', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('surat_template')) {
            Schema::table('surat_template', function (Blueprint $table) {
                foreach (['pdf_path', 'drive_document_url', 'office365_document_url'] as $column) {
                    if (Schema::hasColumn('surat_template', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
