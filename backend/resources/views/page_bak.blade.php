@php
    echo "<?php".PHP_EOL;
@endphp

\"use client\"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'
import HeaderApp from 'components/HeaderApp';
import { checkNotAuthorized, initAccessMethod } from 'app/Utils';
import InputSelect from 'components/InputSelect';
import Input from 'components/Input';
import Button from 'components/Button';
import InputRadio from 'components/InputRadio';
import { api_services } from 'hooks/api_services';

const rules = {
    @foreach($this->config->fields as $fields)
    name: {
        label: '{{ucfirst($fields->name)}}',
        required: @if($fields->isNotNull && empty($fields->validations) {{true}} @else {{false}} @endif ,
    },
    @endforeach

}

const {{ucfirst($this->config->tableName)}}edit = (props) => {
    const page_url = \"{{$this->config->tableName}}\"

    const router = useRouter();
    const [errors, setErrors] = useState({})
    const [path, setpath] = useState(\"\")
    const [is_disabled, setis_disabled] = useState(false)
    const [access_method, setaccess_method] = useState({})
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)
    const id = props.params.slug[1];

    const { getapi_services, getapi_servicesid, postapi_services, putapi_services } = api_services({
        api_path: `/${page_url}`
    })

    @foreach($this->config->fields as $fields)
    const [{{$fields->name}}, set{{$fields->name}}] = useState(\"\")
    @endforeach


    useEffect(() => {
        handleFirstLoad()
    }, [])

    const handleFirstLoad = () => {
        handleInitAccessMethod()
        handleget{{$this->config->tableName}}id()
    }

    const handleInitAccessMethod = async () => {
        const { access_method, path, id } = await initAccessMethod(page_url, props.params)
        setaccess_method(access_method)
        setpath(path)
        if (path === \"detail\") {
            setis_disabled(true)
        }
    }

    const handleErrors = (column, message) => {
        setErrors({
            ...errors,
            [column]: message
        })
    }

    const handleget{{$this->config->tableName}}id = async () => {
        if (!id) return

        setis_loading(true)
        const response = await getapi_servicesid({ setErrors, id })
        console.log('get{{$this->config->tableName}}id')
        console.log(response)
        setis_loading(false)

        checkNotAuthorized(response)

        if (response.error) return

        @foreach($this->config->fields as $fields)
        set{{$fields->name}}(response.{{$fields->name}})
        @endforeach

    }

    const handlepost{{$this->config->tableName}} = async () => {

        const body = {
            @foreach($this->config->fields as $fields)
            {{$fields->name}},
            @endforeach
        }
        setbtn_loading(true)
        const response = await postapi_services({ setErrors, ...body })
        console.log('post{{$this->config->tableName}}')
        console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error) return

        router.push(`/${page_url}`)
    }

    const handleput{{$this->config->tableName}} = async () => {

        const body = {
            @foreach($this->config->fields as $fields)
            {{$fields->name}},
            @endforeach
        }

        setbtn_loading(true)
        const response = await putapi_services({ setErrors, ...body, id })
        console.log('put{{$this->config->tableName}}')
        console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error) return

        router.push(`/${page_url}`)
    }

    return (
        <>
            <HeaderApp title={`${path === \"add\" ? \"Tambah\" : path === \"edit\" ? \"Edit\" : \"Detail\"} {{ucfirst($this->config->tableName)}}`} is_loading={is_loading} data_btn={Object.keys(access_method).length > 0 ? access_method.btn_top : []} />
            <div className='container pl-4 pr-4'>
                <div className='flex'>
                    <div className='flex-1'>
                        <Input
                            ref={null}
                            id="name"
                            type="text"
                            label={rules.name.label}
                            placeholder={rules.name.label}
                            value={name}
                            className="block mt-1 w-full"
                            onChange={event => setname(event.target.value)}
                            required={rules.name.required}
                            autoFocus
                            message_error={errors.name}
                            onError={handleErrors}
                            disabled={is_disabled}
                        />
                        <Input
                            ref={null}
                            id="email"
                            type="email"
                            label={rules.email.label}
                            placeholder={rules.email.label}
                            value={email}
                            className="block mt-1 w-full"
                            onChange={event => setemail(event.target.value)}
                            required={rules.email.required}
                            autoFocus
                            message_error={errors.email}
                            onError={handleErrors}
                            disabled={is_disabled}
                        />
                    </div>
                    <div className='flex-1'>
                        <Input
                            ref={null}
                            id="password"
                            type="password"
                            label={rules.password.label}
                            placeholder={`${rules.password.label} ${path === 'edit' ? '(kosongkan jika tidak diubah)' : ''}`}
                            value={sort}
                            className="block mt-1 w-full"
                            onChange={event => setpassword(event.target.value)}
                            required={path === 'add' ? rules.password.required : false}
                            autoFocus
                            message_error={errors.password}
                            onError={handleErrors}
                            disabled={is_disabled}
                        />
                        <Input
                            ref={null}
                            id="confirm_password"
                            type="password"
                            label={rules.confirm_password.label}
                            placeholder={`${rules.confirm_password.label} ${path === 'edit' ? '(kosongkan jika tidak diubah)' : ''}`}
                            value={confirm_password}
                            className="block mt-1 w-full"
                            onChange={event => setconfirm_password(event.target.value)}
                            required={path === 'add' ? rules.confirm_password.required : false}
                            autoFocus
                            message_error={errors.confirm_password}
                            onError={handleErrors}
                            disabled={is_disabled}
                        />


                    </div>
                </div>

                {path !== 'detail' ? (
                    <div className='flex justify-end'>
                        <Button className="btn-default-app" disabled={btn_loading} onClick={!id ? handlepostsys_user : handleputsys_user}>
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

export default {{ucfirst($this->config->tableName)}}edit