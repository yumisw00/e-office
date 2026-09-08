

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'components/Navigation'
import HeaderApp from 'components/HeaderApp';
import { checkNotAuthorized, initAccessMethod } from 'pages/Utils';
import InputSelect from 'components/InputSelect';
import InputCheckbox from 'components/InputCheckbox';
import InputNumeric from 'components/InputNumeric';
import Input from 'components/Input';
import Button from 'components/Button';
import InputRadio from 'components/InputRadio';
import { api_services } from 'hooks/api_services';

const titlePage = "Log Audit Trail"

const rules = {
  page: {label:'Page',required:false},
activity: {label:'Activity',required:false},
ip: {label:'Ip',required:false},
activity_time: {label:'Activity Time ',required:false},
user_desc: {label:'User Desc ',required:false},
action: {label:'Action',required:false},
table_name: {label:'Table Name ',required:false},


}

const Sys_logedit = (props) => {
    const page_url = "sys_log"

    const pathname = usePathname();
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

    const [page, setpage] = useState('');
const [activity, setactivity] = useState('');
const [ip, setip] = useState('');
const [activity_time, setactivity_time] = useState('');
const [user_desc, setuser_desc] = useState('');
const [action, setaction] = useState('');
const [table_name, settable_name] = useState('');


    const initialized = useRef(false)

    useEffect(() => {
        //first load
        if (!initialized.current) {
            initialized.current = true
            handleInitAccessMethod()
            handlegetsys_logid()

            
        }
    }, [])

    const handleInitAccessMethod = async () => {
        const { access_method, path, id } = await initAccessMethod(page_url, props.params)
        setaccess_method(access_method)
        setpath(path)
        if (path === 'detail') {
            setis_disabled(true)
        } else {
            setis_disabled(false)

        }
    }

    const handleErrors = (column, message) => {
        setErrors({
            ...errors,
            [column]: message
        })
    }

    const handlegetsys_logid = async () => {
        if (!id) return

        setis_loading(true)
        const response = await getapi_servicesid({ setErrors, id })
        // console.log('getsys_logid')
        // console.log(response)
        if (!response.error || response.error.message!= 'canceled')
            setis_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        setpage(response.page);
setactivity(response.activity);
setip(response.ip);
setactivity_time(response.activity_time);
setuser_desc(response.user_desc);
setaction(response.action);
settable_name(response.table_name);


    }

    const handlepostsys_log = async () => {

        const body = {
            page,
activity,
ip,
activity_time,
user_desc,
action,
table_name,

        }
        setbtn_loading(true)
        const response = await postapi_services({ setErrors, ...body })
        // console.log('postsys_log')
        // console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        router.push(`/${page_url}`)
    }

    const handleputsys_log = async () => {

        const body = {
            page,
activity,
ip,
activity_time,
user_desc,
action,
table_name,

        }

        setbtn_loading(true)
        const response = await putapi_services({ setErrors, ...body, id })
        // console.log('putsys_log')
        // console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        router.push(`/${page_url}`)
    }

    

    return (
        <>
            <HeaderApp
                title={`${path === "add" ? "Tambah" : path === "edit" ? "Edit" : "Detail"} ${titlePage}`}
                is_loading={is_loading}
                data_btn={Object.keys(access_method).length > 0
                    ? access_method.btn_top.map(button => ({
                        ...button,
                        label: button.label === 'Back' ? 'Kembali' : button.label,
                    }))
                    : []}
            />
            <div className='container pl-4 pr-4'>
                <div className='flex'>
                    <div className='flex-1'>
                        
            <Input
            ref={null}
            id='page'
            type='textarea'
            label={rules.page.label}
            placeholder={rules.page.label}
            value={page}
            className='block mt-1 w-full'
            onChange={event => setpage(event.target.value)}
            required={rules.page.required}
            autoFocus
            message_error={errors.page}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

            <Input
            ref={null}
            id='activity'
            type='textarea'
            label={rules.activity.label}
            placeholder={rules.activity.label}
            value={activity}
            className='block mt-1 w-full'
            onChange={event => setactivity(event.target.value)}
            required={rules.activity.required}
            autoFocus
            message_error={errors.activity}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

            <Input
            ref={null}
            id='ip'
            type='text'
            label={rules.ip.label}
            placeholder={rules.ip.label}
            value={ip}
            className='block mt-1 w-full'
            onChange={event => setip(event.target.value)}
            required={rules.ip.required}
            autoFocus
            message_error={errors.ip}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

            <Input
            ref={null}
            id='activity_time'
            type='date'
            label={rules.activity_time.label}
            placeholder={rules.activity_time.label}
            value={activity_time}
            className='block mt-1 w-full'
            onChange={event => setactivity_time(event.target.value)}
            required={rules.activity_time.required}
            autoFocus
            message_error={errors.activity_time}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

                    </div>
                    <div className='flex-1'>
                        
            <Input
            ref={null}
            id='user_desc'
            type='textarea'
            label={rules.user_desc.label}
            placeholder={rules.user_desc.label}
            value={user_desc}
            className='block mt-1 w-full'
            onChange={event => setuser_desc(event.target.value)}
            required={rules.user_desc.required}
            autoFocus
            message_error={errors.user_desc}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

            <Input
            ref={null}
            id='action'
            type='text'
            label={rules.action.label}
            placeholder={rules.action.label}
            value={action}
            className='block mt-1 w-full'
            onChange={event => setaction(event.target.value)}
            required={rules.action.required}
            autoFocus
            message_error={errors.action}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

            <Input
            ref={null}
            id='table_name'
            type='text'
            label={rules.table_name.label}
            placeholder={rules.table_name.label}
            value={table_name}
            className='block mt-1 w-full'
            onChange={event => settable_name(event.target.value)}
            required={rules.table_name.required}
            autoFocus
            message_error={errors.table_name}
            onError={handleErrors}
            disabled={is_disabled}
        />
            

                    </div>
                 
                </div>

                {path !== 'detail' ? (
                    <div className='flex justify-end'>
                        <Button className="btn-default-app" disabled={btn_loading} onClick={!id ? handlepostsys_log : handleputsys_log}>
                            {btn_loading ? 'Loading...' : (
                                <>
                                    <span className='material-icons icon-btn-left mr-1'>save</span>
                                    Simpan
                                </>
                            )}
                        </Button>
                    </div>
                ) : null}
            </div>
        </>
    )
   
}

export default Sys_logedit
