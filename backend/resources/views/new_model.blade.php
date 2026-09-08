import Model from "./Model"

{!!$definemodelFrontend!!}


class {{$config->tableName}}Model extends Model {
    primaryKey= '{{$customPrimaryKey}}'
            api_path= '{{$config->tableName}}'
            allowedFields= [
                {!!$allowedfieldmodelFrontend!!}
            ]

          {!!$echodefinemodelFrontend!!}
}

export default  {{$config->tableName}}Model