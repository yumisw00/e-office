import Model from "./Model"

class workflow_suratModel extends Model {
    primaryKey = 'id_workflow_surat'
    api_path = 'workflow_surat'
    allowedFields = [
        'nama_workflow',
        'jenis_surat',
        'deskripsi',
        'steps',
        'is_active',
        'status',
    ]
}

export default workflow_suratModel
