import Model from "./Model"

class surat_masukModel extends Model {
    primaryKey = 'id'
    api_path = 'surat_masuk'
    allowedFields = [
        'nomor_agenda',
        'nomor_surat',
        'jenis',
        'tanggal_surat',
        'asal_surat',
        'kepada_tujuan',
        'penerima',
        'sifat',
        'perihal',
        'tanggal_terima',
        'isi_ringkasan',
        'file_surat',
        'status',
        'catatan',
        'id_penerima',
        'penerima_user',
        'jenis_pengiriman',
        'sumber_data',
        'lampiran',
        'lampiran_info',
        'file_surat_info',
        'sudah_diarsipkan',
        'arsip',
    ]
}

export default surat_masukModel
