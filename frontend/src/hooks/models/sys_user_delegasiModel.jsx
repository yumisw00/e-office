import Model from "./Model"

import sys_userModel from "./sys_userModel";
import sys_userModel from "./sys_userModel";



class sys_user_delegasiModel extends Model {
    primaryKey= 'id_user_delegasi'
            api_path= 'sys_user_delegasi'
            allowedFields= [
                "id_user" ,"id_user_parent" ,
            ]

          relasi= {
id_user: new sys_userModel(),
id_user_parent: new sys_userModel(),
}
}

export default  sys_user_delegasiModel