import Model from "./Model"

class surat_disposisiModel extends Model {
    primaryKey = 'id_surat_disposisi'
    api_path = 'surat_disposisi'
    allowedFields = [
        'id_surat_masuk',
        'id_surat_distribusi',
        'id_pemberi',
        'id_penerima',
        'instruksi',
        'catatan_penyelesaian',
        'file_bukti_path',
        'status',
        'tanggal_jatuh_tempo',
        'tanggal_selesai',
    ]
}

export default surat_disposisiModel
