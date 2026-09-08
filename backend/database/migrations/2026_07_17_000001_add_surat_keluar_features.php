<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                // Klasifikasi surat
                if (!Schema::hasColumn('surat_keluar', 'klasifikasi')) {
                    $table->string('klasifikasi', 50)->nullable()->after('status');
                }

                // Pemeriksa (Reviewer)
                if (!Schema::hasColumn('surat_keluar', 'id_pemeriksa')) {
                    $table->unsignedBigInteger('id_pemeriksa')->nullable()->after('id_penandatangan');
                }
                if (!Schema::hasColumn('surat_keluar', 'nama_pemeriksa')) {
                    $table->string('nama_pemeriksa', 255)->nullable()->after('jabatan_penandatangan');
                }
                if (!Schema::hasColumn('surat_keluar', 'jabatan_pemeriksa')) {
                    $table->string('jabatan_pemeriksa', 255)->nullable()->after('nama_pemeriksa');
                }

                // Tembusan (CC)
                if (!Schema::hasColumn('surat_keluar', 'tembusan')) {
                    $table->text('tembusan')->nullable()->after('tujuan_email');
                }
                if (!Schema::hasColumn('surat_keluar', 'tembusan_email')) {
                    $table->string('tembusan_email', 500)->nullable()->after('tembusan');
                }

                // Tanda tangan digital & email otomatis
                if (!Schema::hasColumn('surat_keluar', 'generate_qr_code')) {
                    $table->tinyInteger('generate_qr_code')->default(0)->after('lampiran_path');
                }
                if (!Schema::hasColumn('surat_keluar', 'kirim_email_otomatis')) {
                    $table->tinyInteger('kirim_email_otomatis')->default(0)->after('generate_qr_code');
                }

                // Lampiran
                if (!Schema::hasColumn('surat_keluar', 'lampiran_path')) {
                    $table->string('lampiran_path', 500)->nullable()->after('file_draft_path');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('surat_keluar')) {
            Schema::table('surat_keluar', function (Blueprint $table) {
                $columnsToDrop = [
                    'klasifikasi',
                    'id_pemeriksa',
                    'nama_pemeriksa',
                    'jabatan_pemeriksa',
                    'tembusan',
                    'tembusan_email',
                    'generate_qr_code',
                    'kirim_email_otomatis',
                    'lampiran_path',
                ];

                foreach ($columnsToDrop as $column) {
                    if (Schema::hasColumn('surat_keluar', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
