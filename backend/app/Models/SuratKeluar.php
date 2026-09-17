<?php

namespace App\Models;

class SuratKeluar extends BaseModel
{
    public $table = 'surat_keluar';
    public $primaryKey = 'id_surat_keluar';

    public $fillable = [
        'nomor_agenda',
        'nomor_surat',
        'kode_draft',
        'id_surat_template',
        'jenis',
        'jenis_pengiriman',
        'id_jenis_surat',
        'perihal',
        'tujuan_id',
        'tujuan_nama',
        'tujuan_email',
        'tujuan_alamat',
        'tujuan_kontak',
        'tujuan_jabatan',
        'tanggal_surat',
        'ringkasan',
        'isi_surat',
        'klasifikasi',
        'sifat',
        'id_pemeriksa',
        'nama_pemeriksa',
        'jabatan_pemeriksa',
        'tembusan',
        'tembusan_email',
        'generate_qr_code',
        'kirim_email_otomatis',
        'lampiran_path',
        'status',
        'office365_document_url',
        'google_drive_document_url',
        'file_draft_path',
        'file_pdf_path',
        'id_penandatangan',
        'nama_penandatangan',
        'jabatan_penandatangan',
        'qr_code_path',
        'verification_url',
        'created_by',
        'created_by_desc',
    ];

    public array $rules = [
        'nomor_agenda' => 'nullable|string|max:100',
        'nomor_surat' => 'nullable|string|max:100',
        'kode_draft' => 'nullable|string|max:100',
        'id_surat_template' => 'nullable',
        'jenis' => 'nullable|string|max:100',
        'jenis_pengiriman' => 'required|in:internal,eksternal',
        'id_jenis_surat' => 'required|integer|exists:master_jenis_surat,id_jenis_surat',
        'jenis' => 'required|string|max:150',
        'perihal' => 'required|string|max:255',
        'tujuan_id' => 'nullable|integer',
        'tujuan_nama' => 'nullable|string|max:200',
        'tujuan_email' => 'nullable|string|max:200',
        'tujuan_alamat' => 'nullable|string|max:500',
        'tujuan_kontak' => 'nullable|string|max:100',
        'tujuan_jabatan' => 'nullable|string|max:200',
        'tanggal_surat' => 'nullable|date',
        'ringkasan' => 'nullable|string',
        'isi_surat' => 'nullable|string',
        'klasifikasi' => 'nullable|string|max:50',
        'sifat' => 'nullable|string|max:100',
        'id_pemeriksa' => 'nullable|integer',
        'nama_pemeriksa' => 'nullable|string|max:255',
        'jabatan_pemeriksa' => 'nullable|string|max:255',
        'tembusan' => 'nullable|string',
        'tembusan_email' => 'nullable|string|max:500',
        'generate_qr_code' => 'nullable|boolean',
        'kirim_email_otomatis' => 'nullable|boolean',
        'lampiran_path' => 'nullable|string|max:500',
        'status' => 'nullable|string|max:50',
        'office365_document_url' => 'nullable|string|max:255',
        'google_drive_document_url' => 'nullable|string|max:255',
        'file_draft_path' => 'nullable|string|max:255',
        'file_pdf_path' => 'nullable|string|max:255',
        'id_penandatangan' => 'nullable',
        'nama_penandatangan' => 'nullable|string|max:200',
        'jabatan_penandatangan' => 'nullable|string|max:200',
        'qr_code_path' => 'nullable|string|max:255',
        'verification_url' => 'nullable|string|max:500',
    ];

    public function penerimaInternal(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(SysUser::class, 'surat_keluar_penerima', 'id_surat_keluar', 'id_user')->withTimestamps();
    }

    public function tembusanInternal(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(SysUser::class, 'surat_keluar_tembusan', 'id_surat_keluar', 'id_user')->withTimestamps();
    }

    public function jenisSurat(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(MasterJenisSurat::class, 'id_jenis_surat', 'id_jenis_surat');
    }
}
