<?php

namespace Tests\Feature;

use App\Models\SysUser;
use App\Services\EOffice\SuratMasukService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

class EOfficeApiIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->createSchema();

        $user = SysUser::create([
            'name' => 'Tester',
            'email' => 'tester@example.test',
            'password' => 'secret',
        ]);

        $this->actingAs($user);
    }

    public function test_upload_surat_dengan_ocr_berhasil(): void
    {
        $this->bindOcrService([
            'nomor_surat' => 'OCR/001',
            'tanggal_surat' => '2026-07-07',
            'asal_surat' => 'Unit OCR',
            'kepada_tujuan' => 'Admin Konten',
            'topik' => 'Umum',
            'perihal' => 'Undangan OCR',
            'isi_ringkasan' => 'Ringkasan dari OCR',
            'raw_text' => 'Isi hasil OCR',
        ]);

        $response = $this->post('/api/surat_masuk', [
            'run_ocr' => true,
            'file_surat' => $this->fakePdf(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nomor_surat', 'OCR/001')
            ->assertJsonPath('data.source_type', 'AI')
            ->assertJsonPath('data.ai_status', 'berhasil');

        $this->assertDatabaseHas('surat_masuk', [
            'nomor_surat' => 'OCR/001',
            'source_type' => 'AI',
            'ai_status' => 'berhasil',
        ]);
    }

    public function test_upload_surat_ocr_gagal_tetap_tersimpan(): void
    {
        $this->bindFailingOcrService('OCR simulasi gagal.');

        $response = $this->post('/api/surat_masuk', [
            'run_ocr' => true,
            'nomor_surat' => 'MANUAL/001',
            'pengirim' => 'Unit Manual',
            'file_surat' => $this->fakePdf(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ai_status', 'gagal')
            ->assertJsonPath('data.status', 'ai_gagal');

        $this->assertDatabaseHas('surat_masuk', [
            'nomor_surat' => 'MANUAL/001',
            'ai_status' => 'gagal',
            'status' => 'ai_gagal',
        ]);
    }

    public function test_input_manual_surat_masuk(): void
    {
        $response = $this->postJson('/api/surat_masuk', [
            'nomor_surat' => 'MANUAL/002',
            'tanggal_surat' => '2026-07-07',
            'pengirim' => 'Rektorat',
            'penerima' => 'Pegawai',
            'topik' => 'Akademik',
            'isi' => 'Ringkasan manual',
            'status' => 'manual_input',
            'source_type' => 'Manual',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pengirim', 'Rektorat')
            ->assertJsonPath('data.penerima', 'Pegawai')
            ->assertJsonPath('data.source_type', 'Manual');
    }

    public function test_filter_surat_masuk(): void
    {
        $this->seedSuratMasuk([
            'nomor_surat' => 'FILTER/001',
            'topik' => 'Umum',
            'kepada_tujuan' => 'Admin Konten',
            'perihal' => 'Rapat koordinasi',
            'source_type' => 'Manual',
            'status' => 'baru',
        ]);
        $this->seedSuratMasuk([
            'nomor_surat' => 'FILTER/002',
            'topik' => 'SDM',
            'kepada_tujuan' => 'Pegawai',
            'perihal' => 'Data pegawai',
            'source_type' => 'AI',
            'status' => 'diproses',
        ]);

        $response = $this->getJson('/api/surat_masuk?keyword=Rapat&source_type=Manual&topik=Umum');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('total_records', 1)
            ->assertJsonPath('data.0.nomor_surat', 'FILTER/001');
    }

    public function test_membuat_disposisi(): void
    {
        $suratId = $this->seedSuratMasuk(['nomor_surat' => 'DISP/001']);

        $response = $this->postJson('/api/surat_disposisi', [
            'surat_id' => $suratId,
            'pemberi_disposisi' => 1,
            'penerima_disposisi' => 2,
            'instruksi' => 'Mohon ditindaklanjuti.',
            'tenggat_waktu' => '2026-07-14',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.surat_id', $suratId)
            ->assertJsonPath('data.status', 'baru');

        $this->assertDatabaseHas('surat_disposisi', [
            'id_surat_masuk' => $suratId,
            'id_penerima' => 2,
            'instruksi' => 'Mohon ditindaklanjuti.',
        ]);
    }

    public function test_mengubah_status_disposisi(): void
    {
        $suratId = $this->seedSuratMasuk(['nomor_surat' => 'DISP/002']);
        $disposisiId = DB::table('surat_disposisi')->insertGetId([
            'id_surat_masuk' => $suratId,
            'id_pemberi' => 1,
            'id_penerima' => 2,
            'instruksi' => 'Proses dokumen.',
            'status' => 'diproses',
            'tanggal_disposisi' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->putJson('/api/surat_disposisi/' . $disposisiId, [
            'status' => 'selesai',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'selesai');

        $this->assertDatabaseHas('surat_disposisi', [
            'id_surat_disposisi' => $disposisiId,
            'status' => 'selesai',
        ]);
    }

    public function test_notifikasi_target_role_admin_konten_diubah_menjadi_daftar_user(): void
    {
        $adminGroupId = DB::table('sys_group')->insertGetId([
            'nama' => 'Admin Konten',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $pegawaiGroupId = DB::table('sys_group')->insertGetId([
            'nama' => 'Pegawai',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $adminUserId = DB::table('sys_user')->insertGetId([
            'name' => 'Admin Konten Target',
            'email' => 'admin-konten@example.test',
            'password' => 'secret',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $pegawaiUserId = DB::table('sys_user')->insertGetId([
            'name' => 'Pegawai Non Target',
            'email' => 'pegawai@example.test',
            'password' => 'secret',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('sys_user_group')->insert([
            [
                'id_user' => $adminUserId,
                'id_group' => $adminGroupId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_user' => $pegawaiUserId,
                'id_group' => $pegawaiGroupId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $response = $this->postJson('/api/eoffice/notifications', [
            'title' => 'test',
            'message' => 'test',
            'target_role' => 'admin_konten',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('total_records', 1)
            ->assertJsonPath('data.0.id_user', $adminUserId);

        $this->assertDatabaseHas('sys_notification', [
            'id_user' => $adminUserId,
            'title' => 'test',
            'message' => 'test',
        ]);
        $this->assertDatabaseMissing('sys_notification', [
            'id_user' => $pegawaiUserId,
            'title' => 'test',
        ]);
    }

    public function test_admin_konten_menyimpan_dan_memfilter_pengumuman(): void
    {
        $this->withSession(['nama_group' => 'Admin Konten']);

        $create = $this->postJson('/api/pengumuman', [
            'judul' => 'Jadwal Rapat Penting',
            'isi' => 'Rapat koordinasi seluruh tim pada hari Senin.',
            'kategori' => 'penting',
            'target_role' => 'pegawai',
            'lampiran' => 'https://example.test/rapat.pdf',
            'status' => 'publish',
            'tanggal_publish' => '2026-07-30',
        ]);

        $create->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.isi', 'Rapat koordinasi seluruh tim pada hari Senin.')
            ->assertJsonPath('data.kategori', 'penting')
            ->assertJsonPath('data.lampiran', 'https://example.test/rapat.pdf');

        DB::table('pengumuman')->insert([
            'judul' => 'Informasi Biasa',
            'konten' => 'Tidak sesuai filter.',
            'kategori' => 'informasi',
            'target_role' => 'semua',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/pengumuman?q[kategori]=penting&q[status]=publish&q[keyword]=koordinasi&pagesize=12');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('total_records', 1)
            ->assertJsonPath('data.0.judul', 'Jadwal Rapat Penting');
    }

    public function test_non_admin_konten_ditolak_mengelola_pengumuman(): void
    {
        $pegawai = SysUser::create([
            'name' => 'Pegawai Biasa',
            'email' => 'pegawai-biasa@example.test',
            'password' => 'secret',
        ]);

        $this->actingAs($pegawai)
            ->withSession(['nama_group' => 'Pegawai'])
            ->getJson('/api/pengumuman')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    private function bindOcrService(array $fields): void
    {
        $this->app->bind(SuratMasukService::class, fn () => new class($fields) extends SuratMasukService {
            public function __construct(private array $fields) {}

            protected function extractWithGemini(array $file): array
            {
                return $this->fields;
            }
        });
    }

    private function bindFailingOcrService(string $message): void
    {
        $this->app->bind(SuratMasukService::class, fn () => new class($message) extends SuratMasukService {
            public function __construct(private string $message) {}

            protected function extractWithGemini(array $file): array
            {
                throw new \RuntimeException($this->message);
            }
        });
    }

    private function fakePdf(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('surat.pdf', "%PDF-1.4\nTest PDF\n");
    }

    private function seedSuratMasuk(array $override = []): int
    {
        return DB::table('surat_masuk')->insertGetId(array_merge([
            'nomor_agenda' => 'SM/2026/07/' . str_pad((string) random_int(1, 999), 3, '0', STR_PAD_LEFT),
            'nomor_surat' => 'SM-SEED',
            'tanggal_surat' => '2026-07-07',
            'tanggal_terima' => '2026-07-07',
            'tenggat_waktu' => '2026-07-14',
            'asal_surat' => 'Seeder',
            'kepada_tujuan' => 'Pegawai',
            'topik' => 'Umum',
            'perihal' => 'Seed surat',
            'isi_ringkasan' => 'Seed ringkasan',
            'status' => 'baru',
            'source_type' => 'Manual',
            'ai_status' => 'belum_diproses',
            'created_at' => now(),
            'updated_at' => now(),
        ], $override));
    }

    private function createSchema(): void
    {
        foreach ([
            'surat_disposisi',
            'surat_masuk',
            'ai_document_job',
            'audit_trail_immutable',
            'sys_notification',
            'pengumuman',
            'sys_user_group',
            'sys_group',
            'sys_log',
            'sys_user',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('sys_user', function (Blueprint $table) {
            $table->bigIncrements('id_user');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_log', function (Blueprint $table) {
            $table->bigIncrements('id_log');
            $table->string('page', 500)->nullable();
            $table->string('activity')->nullable();
            $table->longText('data')->nullable();
            $table->string('ip', 50)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('activity_time')->nullable();
            $table->string('user_desc', 200)->nullable();
            $table->string('action', 50)->nullable();
            $table->string('table_name', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('audit_trail_immutable', function (Blueprint $table) {
            $table->bigIncrements('id_audit_trail');
            $table->unsignedBigInteger('id_user')->nullable();
            $table->string('table_name', 100);
            $table->string('record_id', 100)->nullable();
            $table->string('action', 50);
            $table->longText('old_values')->nullable();
            $table->longText('new_values')->nullable();
            $table->string('ip_address', 100)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('previous_hash', 128)->nullable();
            $table->string('current_hash', 128)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ai_document_job', function (Blueprint $table) {
            $table->bigIncrements('id_ai_document_job');
            $table->string('job_type', 50);
            $table->string('source_type', 50)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('file_path')->nullable();
            $table->longText('extracted_text')->nullable();
            $table->longText('summary')->nullable();
            $table->longText('result_payload')->nullable();
            $table->string('status', 50)->default('pending');
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('surat_masuk', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_agenda', 100)->nullable();
            $table->string('nomor_surat', 100)->nullable();
            $table->string('jenis', 100)->nullable();
            $table->date('tanggal_surat')->nullable();
            $table->date('tanggal_terima')->nullable();
            $table->date('tenggat_waktu')->nullable();
            $table->string('asal_surat')->nullable();
            $table->string('kepada_tujuan')->nullable();
            $table->string('unit_kerja')->nullable();
            $table->string('sifat', 100)->nullable();
            $table->string('topik', 100)->nullable();
            $table->string('perihal')->nullable();
            $table->text('isi_ringkasan')->nullable();
            $table->text('tembusan')->nullable();
            $table->string('file_surat')->nullable();
            $table->string('status', 50)->default('baru');
            $table->string('source_type', 20)->default('Manual');
            $table->string('ai_status', 30)->default('belum_diproses');
            $table->text('catatan')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->string('created_by_desc', 200)->nullable();
            $table->string('updated_by_desc', 200)->nullable();
            $table->string('deleted_by_desc', 200)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('surat_disposisi', function (Blueprint $table) {
            $table->bigIncrements('id_surat_disposisi');
            $table->unsignedBigInteger('id_surat_masuk')->nullable();
            $table->unsignedBigInteger('id_surat_distribusi')->nullable();
            $table->unsignedBigInteger('id_pemberi')->nullable();
            $table->unsignedBigInteger('id_penerima')->nullable();
            $table->text('instruksi')->nullable();
            $table->text('catatan_penyelesaian')->nullable();
            $table->string('file_bukti_path')->nullable();
            $table->string('status', 50)->default('baru');
            $table->date('tanggal_jatuh_tempo')->nullable();
            $table->timestamp('tanggal_disposisi')->nullable();
            $table->timestamp('tanggal_selesai')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->string('created_by_desc', 200)->nullable();
            $table->string('updated_by_desc', 200)->nullable();
            $table->string('deleted_by_desc', 200)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_group', function (Blueprint $table) {
            $table->bigIncrements('id_group');
            $table->string('nama', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_user_group', function (Blueprint $table) {
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_group');
            $table->unsignedBigInteger('id_jabatan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_notification', function (Blueprint $table) {
            $table->bigIncrements('id_notification');
            $table->unsignedBigInteger('id_user')->nullable();
            $table->string('channel', 50)->default('app');
            $table->string('title', 200);
            $table->text('message')->nullable();
            $table->string('url')->nullable();
            $table->longText('payload')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('pengumuman', function (Blueprint $table) {
            $table->bigIncrements('id_pengumuman');
            $table->string('judul', 200);
            $table->longText('konten');
            $table->string('kategori', 50)->default('informasi');
            $table->string('target_role', 100)->default('semua');
            $table->string('status', 50)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->string('lampiran', 2048)->nullable();
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
}
