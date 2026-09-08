import Model from "./Model"

export class mt_sdm_unitModel extends Model {
    primaryKey = 'id_unit'
    api_path = 'mt_sdm_unit'
    allowedFields = [
        'kode_unit',
        'nama_unit',
        'nama',
        'id_parent',
        'status',
    ]
}

export class mt_sdm_jabatanModel extends Model {
    primaryKey = 'id_jabatan'
    api_path = 'mt_sdm_jabatan'
    allowedFields = [
        'kode_jabatan',
        'nama_jabatan',
        'nama',
        'id_unit',
        'level_jabatan',
        'status',
    ]
}
