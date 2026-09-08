<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_masuk', function (Blueprint $table) {
            if (!Schema::hasColumn('surat_masuk', 'nomor_agenda')) {
                $table->string('nomor_agenda', 100)->nullable()->after('id');
            }

            if (!Schema::hasColumn('surat_masuk', 'jenis')) {
                $table->string('jenis', 100)->nullable()->after('nomor_surat');
            }

            if (!Schema::hasColumn('surat_masuk', 'tenggat_waktu')) {
                $table->date('tenggat_waktu')->nullable()->after('tanggal_surat');
            }

            if (!Schema::hasColumn('surat_masuk', 'kepada_tujuan')) {
                $table->string('kepada_tujuan', 255)->nullable()->after('asal_surat');
            }

            if (!Schema::hasColumn('surat_masuk', 'unit_kerja')) {
                $table->string('unit_kerja', 255)->nullable()->after('kepada_tujuan');
            }

            if (!Schema::hasColumn('surat_masuk', 'sifat')) {
                $table->string('sifat', 100)->nullable()->after('unit_kerja');
            }

            if (!Schema::hasColumn('surat_masuk', 'topik')) {
                $table->string('topik', 100)->nullable()->after('sifat');
            }

            if (!Schema::hasColumn('surat_masuk', 'tanggal_terima')) {
                $table->date('tanggal_terima')->nullable()->after('tanggal_surat');
            }

            if (!Schema::hasColumn('surat_masuk', 'isi_ringkasan')) {
                $table->text('isi_ringkasan')->nullable()->after('perihal');
            }

            if (!Schema::hasColumn('surat_masuk', 'tembusan')) {
                $table->text('tembusan')->nullable()->after('isi_ringkasan');
            }

            if (!Schema::hasColumn('surat_masuk', 'catatan')) {
                $table->text('catatan')->nullable()->after('tembusan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('surat_masuk', function (Blueprint $table) {
            foreach ([
                'nomor_agenda',
                'jenis',
                'tenggat_waktu',
                'kepada_tujuan',
                'unit_kerja',
                'sifat',
                'topik',
                'tanggal_terima',
                'isi_ringkasan',
                'tembusan',
                'catatan',
            ] as $column) {
                if (Schema::hasColumn('surat_masuk', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
