import Model from "./Model"


class sys_settingModel extends Model {
    primaryKey = 'id_setting'
    api_path = 'sys_setting'
    allowedFields = [
        'nama',
        'isi'
    ]
}

export default sys_settingModel