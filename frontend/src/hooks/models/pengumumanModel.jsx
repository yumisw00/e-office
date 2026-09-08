import Model from "./Model"

class pengumumanModel extends Model {
    primaryKey = 'id_pengumuman'
    api_path = 'pengumuman'
    allowedFields = [
        'judul',
        'isi',
        'target_role',
        'tanggal_publish',
        'status',
    ]
}

export default pengumumanModel
