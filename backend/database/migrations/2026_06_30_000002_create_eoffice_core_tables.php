<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('surat_template')) {
            Schema::create('surat_template', function (Blueprint $table) {
                $table->bigIncrements('id_surat_template');
                $table->string('kode', 50)->unique();
                $table->string('nama', 200);
                $table->string('jenis_surat', 100)->nullable();
                $table->string('file_path')->nullable();
                $table->string('file_name')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('deleted_by')->nullable();
                $table->string('created_by_desc', 200)->nullable();
                $table->string('updated_by_desc', 200)->nullable();
                $table->string('deleted_by_desc', 200)->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('surat_keluar')) {
            Schema::create('surat_keluar', function (Blueprint $table) {
                $table->bigIncrements('id_surat_keluar');
                $table->string('nomor_surat', 100)->nullable()->unique();
                $table->string('kode_draft', 100)->nullable()->unique();
                $table->unsignedBigInteger('id_surat_template')->nullable();
                $table->string('perihal', 255);
                $table->string('tujuan_nama', 200)->nullable();
                $table->string('tujuan_email', 200)->nullable();
                $table->date('tanggal_surat')->nullable();
                $table->text('ringkasan')->nullable();
                $table->longText('isi_surat')->nullable();
                $table->string('status', 50)->default('draft');
                $table->string('office365_document_url')->nullable();
                $table->string('file_draft_path')->nullable();
                $table->string('file_pdf_path')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('deleted_by')->nullable();
                $table->string('created_by_desc', 200)->nullable();
                $table->string('updated_by_desc', 200)->nullable();
                $table->string('deleted_by_desc', 200)->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'tanggal_surat']);
                $table->index('created_by');
            });
        }

        if (!Schema::hasTable('surat_distribusi')) {
            Schema::create('surat_distribusi', function (Blueprint $table) {
                $table->bigIncrements('id_surat_distribusi');
                $table->unsignedBigInteger('id_surat_masuk')->nullable();
                $table->string('id_unit_tujuan', 50)->nullable();
                $table->unsignedBigInteger('id_user_tujuan')->nullable();
                $table->string('status', 50)->default('dikirim');
                $table->text('catatan')->nullable();
                $table->timestamp('tanggal_distribusi')->nullable();
                $table->timestamp('tanggal_dibaca')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['id_surat_masuk', 'status']);
                $table->index('id_user_tujuan');
            });
        }

        if (!Schema::hasTable('surat_disposisi')) {
            Schema::create('surat_disposisi', function (Blueprint $table) {
                $table->bigIncrements('id_surat_disposisi');
                $table->unsignedBigInteger('id_surat_masuk')->nullable();
                $table->unsignedBigInteger('id_surat_distribusi')->nullable();
                $table->unsignedBigInteger('id_pemberi')->nullable();
                $table->unsignedBigInteger('id_penerima')->nullable();
                $table->text('instruksi');
                $table->text('catatan_penyelesaian')->nullable();
                $table->string('file_bukti_path')->nullable();
                $table->string('status', 50)->default('open');
                $table->date('tanggal_jatuh_tempo')->nullable();
                $table->timestamp('tanggal_selesai')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['id_surat_masuk', 'status']);
                $table->index('id_penerima');
            });
        }

        if (!Schema::hasTable('surat_approval')) {
            Schema::create('surat_approval', function (Blueprint $table) {
                $table->bigIncrements('id_surat_approval');
                $table->unsignedBigInteger('id_surat_keluar');
                $table->unsignedBigInteger('id_approver')->nullable();
                $table->unsignedInteger('urutan')->default(1);
                $table->string('status', 50)->default('waiting');
                $table->text('catatan_revisi')->nullable();
                $table->timestamp('tanggal_aksi')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['id_surat_keluar', 'urutan']);
                $table->index(['id_approver', 'status']);
            });
        }

        if (!Schema::hasTable('surat_arsip')) {
            Schema::create('surat_arsip', function (Blueprint $table) {
                $table->bigIncrements('id_surat_arsip');
                $table->string('jenis_surat', 50);
                $table->unsignedBigInteger('id_surat_masuk')->nullable();
                $table->unsignedBigInteger('id_surat_keluar')->nullable();
                $table->string('nomor_surat', 100)->nullable();
                $table->string('perihal', 255);
                $table->string('file_path')->nullable();
                $table->string('hash_file', 128)->nullable();
                $table->timestamp('tanggal_arsip')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['jenis_surat', 'nomor_surat']);
                $table->index('tanggal_arsip');
            });
        }

        if (!Schema::hasTable('sys_notification')) {
            Schema::create('sys_notification', function (Blueprint $table) {
                $table->bigIncrements('id_notification');
                $table->unsignedBigInteger('id_user')->nullable();
                $table->string('channel', 50)->default('app');
                $table->string('title', 200);
                $table->text('message')->nullable();
                $table->string('url')->nullable();
                $table->json('payload')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['id_user', 'read_at']);
            });
        }

        if (!Schema::hasTable('agenda_kegiatan')) {
            Schema::create('agenda_kegiatan', function (Blueprint $table) {
                $table->bigIncrements('id_agenda_kegiatan');
                $table->string('judul', 200);
                $table->text('deskripsi')->nullable();
                $table->timestamp('tanggal_mulai');
                $table->timestamp('tanggal_selesai')->nullable();
                $table->string('lokasi', 200)->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('pengumuman')) {
            Schema::create('pengumuman', function (Blueprint $table) {
                $table->bigIncrements('id_pengumuman');
                $table->string('judul', 200);
                $table->longText('konten');
                $table->string('status', 50)->default('draft');
                $table->timestamp('published_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'published_at']);
            });
        }

        if (!Schema::hasTable('ai_document_job')) {
            Schema::create('ai_document_job', function (Blueprint $table) {
                $table->bigIncrements('id_ai_document_job');
                $table->string('job_type', 50);
                $table->string('source_type', 50)->nullable();
                $table->unsignedBigInteger('source_id')->nullable();
                $table->string('file_path')->nullable();
                $table->longText('extracted_text')->nullable();
                $table->longText('summary')->nullable();
                $table->json('result_payload')->nullable();
                $table->string('status', 50)->default('pending');
                $table->text('error_message')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['job_type', 'status']);
                $table->index(['source_type', 'source_id']);
            });
        }

        if (!Schema::hasTable('digital_signature')) {
            Schema::create('digital_signature', function (Blueprint $table) {
                $table->bigIncrements('id_digital_signature');
                $table->string('source_type', 50);
                $table->unsignedBigInteger('source_id');
                $table->unsignedBigInteger('id_penandatangan')->nullable();
                $table->string('certificate_serial', 200)->nullable();
                $table->string('qr_code_path')->nullable();
                $table->string('signed_file_path')->nullable();
                $table->string('verification_url')->nullable();
                $table->string('hash_file', 128)->nullable();
                $table->timestamp('signed_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['source_type', 'source_id']);
                $table->index('id_penandatangan');
            });
        }

        if (!Schema::hasTable('audit_trail_immutable')) {
            Schema::create('audit_trail_immutable', function (Blueprint $table) {
                $table->bigIncrements('id_audit_trail');
                $table->unsignedBigInteger('id_user')->nullable();
                $table->string('table_name', 100);
                $table->string('record_id', 100)->nullable();
                $table->string('action', 50);
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->string('ip_address', 100)->nullable();
                $table->string('user_agent')->nullable();
                $table->string('previous_hash', 128)->nullable();
                $table->string('current_hash', 128)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['table_name', 'record_id']);
                $table->index('id_user');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_trail_immutable');
        Schema::dropIfExists('digital_signature');
        Schema::dropIfExists('ai_document_job');
        Schema::dropIfExists('pengumuman');
        Schema::dropIfExists('agenda_kegiatan');
        Schema::dropIfExists('sys_notification');
        Schema::dropIfExists('surat_arsip');
        Schema::dropIfExists('surat_approval');
        Schema::dropIfExists('surat_disposisi');
        Schema::dropIfExists('surat_distribusi');
        Schema::dropIfExists('surat_keluar');
        Schema::dropIfExists('surat_template');
    }
};
