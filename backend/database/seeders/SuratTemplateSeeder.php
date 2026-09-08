<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SuratTemplateSeeder extends Seeder
{
    /**
     * Seed default surat templates.
     */
    public function run(): void
    {
        $now = now();

        $templates = [
            // --- Surat Undangan ---
            [
                'kode' => 'TPL-UNDANGAN-001',
                'nama' => 'Surat Undangan',
                'jenis_surat' => 'Surat Undangan',
                'deskripsi' => 'Template surat undangan umum untuk mengundang rekan kerja atau tamu.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => true,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],
            [
                'kode' => 'TPL-UNDANGAN-RAPAT-001',
                'nama' => 'Surat Undangan Rapat',
                'jenis_surat' => 'Surat Undangan',
                'deskripsi' => 'Template surat undangan rapat untuk pertemuan resmi.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Tugas ---
            [
                'kode' => 'TPL-TUGAS-001',
                'nama' => 'Surat Tugas',
                'jenis_surat' => 'Surat Tugas',
                'deskripsi' => 'Template surat tugas untuk penugasan pegawai.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Keputusan ---
            [
                'kode' => 'TPL-SK-001',
                'nama' => 'Surat Keputusan',
                'jenis_surat' => 'Surat Keputusan',
                'deskripsi' => 'Template surat keputusan untuk penetapan kebijakan atau struktur organisasi.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Edaran ---
            [
                'kode' => 'TPL-EDARAN-001',
                'nama' => 'Surat Edaran',
                'jenis_surat' => 'Surat Edaran',
                'deskripsi' => 'Template surat edaran untuk informasi resmi kepada seluruh pegawai.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Pemberitahuan ---
            [
                'kode' => 'TPL-PEMBERITAHUAN-001',
                'nama' => 'Surat Pemberitahuan',
                'jenis_surat' => 'Surat Pemberitahuan',
                'deskripsi' => 'Template surat pemberitahuan untuk menginformasikan kegiatan atau perubahan.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Permohonan ---
            [
                'kode' => 'TPL-PERMOHONAN-001',
                'nama' => 'Surat Permohonan',
                'jenis_surat' => 'Surat Permohonan',
                'deskripsi' => 'Template surat permohonan umum.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Nota Dinas ---
            [
                'kode' => 'TPL-NOTADINAS-001',
                'nama' => 'Nota Dinas',
                'jenis_surat' => 'Nota Dinas',
                'deskripsi' => 'Template nota dinas untuk komunikasi internal antar unit.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Memo Internal ---
            [
                'kode' => 'TPL-MEMO-001',
                'nama' => 'Memo Internal',
                'jenis_surat' => 'Memo Internal',
                'deskripsi' => 'Template memo internal untuk komunikasi singkat antar pegawai.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Pengantar ---
            [
                'kode' => 'TPL-PENGANTAR-001',
                'nama' => 'Surat Pengantar',
                'jenis_surat' => 'Surat Pengantar',
                'deskripsi' => 'Template surat pengantar untuk mengirimkan dokumen atau barang.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],

            // --- Surat Keterangan ---
            [
                'kode' => 'TPL-KETERANGAN-001',
                'nama' => 'Surat Keterangan',
                'jenis_surat' => 'Surat Keterangan',
                'deskripsi' => 'Template surat keterangan untuk berbagai keperluan administrasi.',
                'file_template' => null,
                'file_path' => null,
                'file_name' => null,
                'office365_document_url' => null,
                'drive_document_url' => null,
                'pdf_path' => null,
                'is_default' => false,
                'is_active' => true,
                'status' => 'active',
                'metadata' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => null,
                'created_by_desc' => 'System',
                'updated_by_desc' => 'System',
                'deleted_by_desc' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ],
        ];

        // Check if table exists
        if (!\Illuminate\Support\Facades\Schema::hasTable('surat_template')) {
            $this->command->warn('Table surat_template does not exist. Skipping SuratTemplateSeeder.');
            return;
        }

        // Only insert if table is empty
        $existingCount = DB::table('surat_template')->whereNull('deleted_at')->count();
        if ($existingCount > 0) {
            $this->command->info("surat_template table already has {$existingCount} records. Skipping SuratTemplateSeeder.");
            return;
        }

        foreach ($templates as $template) {
            $templateId = DB::table('surat_template')->insertGetId($template);
            $this->command->info("Inserted template: {$template['nama']} (ID: {$templateId})");
        }
    }
}
