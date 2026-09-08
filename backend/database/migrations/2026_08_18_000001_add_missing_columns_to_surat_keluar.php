<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add missing columns to surat_keluar that are referenced by the code
     * but not present in the database (qr_code_path was added by a partial migration,
     * verification_url was never added).
     */
    public function up(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            if (!Schema::hasColumn('surat_keluar', 'qr_code_path')) {
                $table->string('qr_code_path', 255)->nullable()->after('lampiran_path');
            }
            if (!Schema::hasColumn('surat_keluar', 'verification_url')) {
                $table->string('verification_url', 500)->nullable()->after('qr_code_path');
            }
            if (!Schema::hasColumn('surat_keluar', 'lampiran_path')) {
                $table->string('lampiran_path', 255)->nullable()->after('file_pdf_path');
            }
            if (!Schema::hasColumn('surat_keluar', 'tujuan_id')) {
                $table->unsignedBigInteger('tujuan_id')->nullable()->after('perihal');
            }
            if (!Schema::hasColumn('surat_keluar', 'tujuan_alamat')) {
                $table->string('tujuan_alamat', 500)->nullable()->after('tujuan_nama');
            }
            if (!Schema::hasColumn('surat_keluar', 'tujuan_kontak')) {
                $table->string('tujuan_kontak', 100)->nullable()->after('tujuan_email');
            }
            if (!Schema::hasColumn('surat_keluar', 'tujuan_jabatan')) {
                $table->string('tujuan_jabatan', 200)->nullable()->after('tujuan_kontak');
            }
            if (!Schema::hasColumn('surat_keluar', 'klasifikasi')) {
                $table->string('klasifikasi', 50)->nullable()->after('isi_surat');
            }
            if (!Schema::hasColumn('surat_keluar', 'sifat')) {
                $table->string('sifat', 100)->nullable()->after('klasifikasi');
            }
            if (!Schema::hasColumn('surat_keluar', 'id_pemeriksa')) {
                $table->unsignedBigInteger('id_pemeriksa')->nullable()->after('sifat');
            }
            if (!Schema::hasColumn('surat_keluar', 'nama_pemeriksa')) {
                $table->string('nama_pemeriksa', 255)->nullable()->after('id_pemeriksa');
            }
            if (!Schema::hasColumn('surat_keluar', 'jabatan_pemeriksa')) {
                $table->string('jabatan_pemeriksa', 255)->nullable()->after('nama_pemeriksa');
            }
            if (!Schema::hasColumn('surat_keluar', 'tembusan')) {
                $table->text('tembusan')->nullable()->after('jabatan_pemeriksa');
            }
            if (!Schema::hasColumn('surat_keluar', 'tembusan_email')) {
                $table->string('tembusan_email', 500)->nullable()->after('tembusan');
            }
            if (!Schema::hasColumn('surat_keluar', 'generate_qr_code')) {
                $table->boolean('generate_qr_code')->default(false)->after('tembusan_email');
            }
            if (!Schema::hasColumn('surat_keluar', 'kirim_email_otomatis')) {
                $table->boolean('kirim_email_otomatis')->default(false)->after('generate_qr_code');
            }
            if (!Schema::hasColumn('surat_keluar', 'id_penandatangan')) {
                $table->unsignedBigInteger('id_penandatangan')->nullable()->after('kirim_email_otomatis');
            }
            if (!Schema::hasColumn('surat_keluar', 'nama_penandatangan')) {
                $table->string('nama_penandatangan', 200)->nullable()->after('id_penandatangan');
            }
            if (!Schema::hasColumn('surat_keluar', 'jabatan_penandatangan')) {
                $table->string('jabatan_penandatangan', 200)->nullable()->after('nama_penandatangan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $columns = [
                'lampiran_path', 'qr_code_path', 'verification_url',
                'tujuan_id', 'tujuan_alamat', 'tujuan_kontak', 'tujuan_jabatan',
                'klasifikasi', 'sifat',
                'id_pemeriksa', 'nama_pemeriksa', 'jabatan_pemeriksa',
                'tembusan', 'tembusan_email',
                'generate_qr_code', 'kirim_email_otomatis',
                'id_penandatangan', 'nama_penandatangan', 'jabatan_penandatangan',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('surat_keluar', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
