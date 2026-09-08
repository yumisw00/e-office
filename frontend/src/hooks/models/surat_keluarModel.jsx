import Model from "./Model"

class surat_keluarModel extends Model {
    primaryKey = 'id_surat_keluar'
    api_path = 'surat_keluar'
    allowedFields = [
        'nomor_agenda',
        'nomor_surat',
        'kode_draft',
        'id_surat_template',
        'jenis',
        'jenis_pengiriman',
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
        'template_nama',
        'penerima_internal',
        'tembusan_internal',
        'penerima_ids',
        'tembusan_ids',
        'approval',
        'arsip',
        'sudah_diarsipkan',
        'qr_code_path',
        'verification_url',
    ]
}

export default surat_keluarModel
