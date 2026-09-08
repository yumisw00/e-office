"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'components/Navigation';
import HeaderApp from 'components/HeaderApp';
import { checkNotAuthorized, initAccessMethod } from 'pages/Utils';
import InputSelect from 'components/InputSelect';
import InputCheckbox from 'components/InputCheckbox';
import InputNumeric from 'components/InputNumeric';
import Input from 'components/Input';
import Button from 'components/Button';
import InputRadio from 'components/InputRadio';
import { api_services } from 'hooks/api_services';

const titlePage = "{!!$titlePageFrontend!!}"

const rules = {
  {!!$rulesFrontend!!}

}

const {{ucfirst($config->tableName)}}edit = (props) => {
    const page_url = "{{$config->tableName}}"

    const router = useRouter();
    const [errors, setErrors] = useState({})
    const [path, setpath] = useState("")
    const [is_disabled, setis_disabled] = useState(false)
    const [access_method, setaccess_method] = useState({})
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)
    const id = props.params.slug[1];

    const { getapi_services, getapi_servicesid, postapi_services, putapi_services } = api_services({
        api_path: `/${page_url}`
    })

    {!!$recordsFrontend!!}

    const initialized = useRef(false)

    useEffect(() => {
        //first load
        if (!initialized.current) {
            //initialized.current = true
            handleInitAccessMethod()
            handleget{{$config->tableName}}id()

            {!!$getDataRelationFrontend!!}
        }
    }, [])

    const handleInitAccessMethod = async () => {
        const { access_method, path, id } = await initAccessMethod(page_url, props.params)
        setaccess_method(access_method)
        setpath(path)
        if (path === "detail") {
            setis_disabled(true)
        }
    }

    const handleErrors = (column, message) => {
        setErrors({
            ...errors,
            [column]: message
        })
    }

    const handleget{{$config->tableName}}id = async () => {
        if (!id) return

        setis_loading(true)
        const response = await getapi_servicesid({ setErrors, id })
        console.log('get{{$config->tableName}}id')
        console.log(response)
        setis_loading(false)

        checkNotAuthorized(response)

        if (response.error) return

        {!!$setRecordsFrontend!!}

    }

    const handlepost{{$config->tableName}} = async () => {

        const body = {
            {!!$bodyInsertFrontend!!}
        }
        setbtn_loading(true)
        const response = await postapi_services({ setErrors, ...body })
        console.log('post{{$config->tableName}}')
        console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error) return

        router.push(`/${page_url}`)
    }

    const handleput{{$config->tableName}} = async () => {

        const body = {
            {!!$bodyInsertFrontend!!}
        }

        setbtn_loading(true)
        const response = await putapi_services({ setErrors, ...body, id })
        console.log('put{{$config->tableName}}')
        console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error) return

        router.push(`/${page_url}`)
    }

    {!!$fncDataRelationFrontend!!}

    return (
        <>
            <HeaderApp title={`${path === "add" ? "Tambah" : path === "edit" ? "Edit" : "Detail"} ${titlePage}`} is_loading={is_loading} data_btn={Object.keys(access_method).length > 0 ? access_method.btn_top : []} />
            <div className='container pl-4 pr-4'>
                <div className='flex'>
                    <div className='flex-1'>
                        {!!$inputsFrontendL!!}
                    </div>
                    <div className='flex-1'>
                        {!!$inputsFrontendR!!}
                    </div>
                 
                </div>

                {path !== 'detail' ? (
                    <div className='flex justify-end'>
                        <Button className="btn-default-app" disabled={btn_loading} onClick={!id ? handlepost{{$config->tableName}} : handleput{{$config->tableName}}}>
                            {btn_loading ? 'Loading...' : (
                                <>
                                    <span className='material-icons icon-btn-left mr-1'>save</span>
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                ) : null}
            </div>
        </>
    )
   
}

export default {{ucfirst($config->tableName)}}edit