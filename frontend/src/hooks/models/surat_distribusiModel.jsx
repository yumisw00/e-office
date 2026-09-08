import Model from "./Model"

class surat_distribusiModel extends Model {
    primaryKey = 'id_surat_distribusi'
    api_path = 'surat_distribusi'
    allowedFields = [
        'id_surat_masuk',
        'id_unit_tujuan',
        'id_user_tujuan',
        'status',
        'catatan',
        'tanggal_distribusi',
        'tanggal_dibaca',
    ]
}

export default surat_distribusiModel
