import Model from "./Model"

class surat_arsipModel extends Model {
    primaryKey = 'id_surat_arsip'
    api_path = 'surat_arsip'
    allowedFields = [
        'jenis_surat',
        'id_surat_masuk',
        'id_surat_keluar',
        'nomor_surat',
        'perihal',
        'file_path',
        'lokasi_fisik',
        'hash_file',
        'tanggal_arsip',
    ]
}

export default surat_arsipModel
