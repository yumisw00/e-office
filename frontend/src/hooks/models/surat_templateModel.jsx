import Model from "./Model"

class surat_templateModel extends Model {
    primaryKey = 'id_surat_template'
    api_path = 'surat_template'
    allowedFields = [
        'nama_template',
        'jenis_surat',
        'deskripsi',
        'file_template',
        'file_path',
        'office365_document_url',
        'drive_document_url',
        'pdf_path',
        'is_default',
        'status',
        'metadata',
    ]
}

export default surat_templateModel
