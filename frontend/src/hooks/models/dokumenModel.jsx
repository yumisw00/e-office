import Model from "./Model"

// import mt_kategori_dokumanModel from "./mt_kategori_dokumanModel";



class dokumenModel extends Model {
    primaryKey= 'id_dokumen'
            api_path= 'dokumen'
            allowedFields= [
                "nomor_dokumen" ,"nama" ,"id_kategori_dokumen" ,"keterangan" ,"client_name" ,"file_name" ,"file_type" ,"file_size" ,"file_url" ,"tahun" ,
            ]

          relasi= {
// id_kategori_dokumen: new mt_kategori_dokumanModel(),
}
}

export default  dokumenModel