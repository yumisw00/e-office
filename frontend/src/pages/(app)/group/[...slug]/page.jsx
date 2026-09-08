

import React, { useState, useEffect, useRef } from 'react';
import Dropdown from 'components/Dropdown'
import DropdownAction from 'components/DropdownAction'
import { useRouter, redirect, usePathname } from 'components/Navigation'
import { TreeGrid, GridColumn, LinkButton, ButtonGroup, MenuButton, Menu, MenuItem, ComboBox } from 'rc-easyui';
import HeaderApp from 'components/HeaderApp';
import { checkNotAuthorized, initAccessMethod } from 'pages/Utils';
import IconApp from 'components/IconApp';
import InputSelect from 'components/InputSelect';
import Input from 'components/Input';
import BtnGroup from 'components/BtnGroup';
import Button from 'components/Button';
import InputRadio from 'components/InputRadio';
import { api_services } from 'hooks/api_services';
import FormGroup from 'components/FormGroup';

const rules = {
    nama: {
        label: 'Nama',
        required: true,
    },

}

const Sys_groupedit = (props) => {
    const page_url = 'group'

    const pathname = usePathname();
    const router = useRouter();
    const [errors, setErrors] = useState({})
    const [path, setpath] = useState("")
    const [is_disabled, setis_disabled] = useState(false)
    const [access_method, setaccess_method] = useState({})
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)
    const id = props.params.slug[1];

    const { getapi_servicesid, getapi_services, postapi_services, putapi_services } = api_services({
        api_path: `/sys_group`,
    })

    const [nama, setnama] = useState("")
    const [url, seturl] = useState("")
    const [icon, seticon] = useState("")
    const [is_show, setis_show] = useState(1)
    const [sort, setsort] = useState("")
    const [id_parent_menu, setid_parent_menu] = useState("")

    const initialized = useRef(false)

    useEffect(() => {
        handleInitAccessMethod()
        handlegetsys_groupid()
        if (!initialized.current) {
            initialized.current = true

        } else {

        }

    }, [pathname])

    const handleInitAccessMethod = async () => {
        // console.log('props.params')
        // console.log(props.params)
        const { access_method, path, id } = await initAccessMethod('group|sys_group', props.params)
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

    const handlegetsys_groupid = async () => {
        if (!id) return

        setis_loading(true)
        const response = await getapi_servicesid({ setErrors, id })
        // console.log('getsys_groupid')
        // console.log(response)
        if (!response.error || response.error.message != 'canceled')
            setis_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        setnama(response.nama)

    }

    const handlepostsys_group = async () => {

        const body = {
            nama,
        }

        setbtn_loading(true)
        const response = await postapi_services({ setErrors, ...body })
        setbtn_loading(false)
        // console.log('postsys_group')
        // console.log(response)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        router.push(`/group`)
    }

    const handleputsys_group = async () => {

        const body = {
            nama,
        }
        // console.log(body)
        // return
        setbtn_loading(true)
        const response = await putapi_services({ setErrors, ...body, id })
        // console.log('putsys_group')
        // console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        router.push(`/${page_url}`)
    }

    return (
        <>
            <HeaderApp
                title={path === "add" ? "" : path === "edit" ? "Edit" : "Detail"}
                is_loading={is_loading}
                data_btn={Object.keys(access_method).length > 0
                    ? access_method.btn_top.map(button => ({
                        ...button,
                        label: button.label === 'Back' ? 'Kembali' : button.label,
                    }))
                    : []}
            />
            <div className='container pl-4 pr-4'>
                <div className="row">
                    <div className="col-sm-6">
                        <FormGroup
                            label={"Nama"}
                            required
                            message_error={errors.nama}
                            disabled={is_disabled}
                        >
                            <div className="col">
                                <Input
                                    ref={null}
                                    id="nama"
                                    type="text"
                                    placeholder={'Nama'}
                                    value={nama}
                                    className="block mt-1 w-full"
                                    onChange={value => setnama(value)}
                                    message_error={errors.nama}
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                />
                            </div>
                        </FormGroup>
                    </div>
                </div>


                {path !== 'detail' ? (
                    <div className='flex justify-end'>
                        <Button className="btn-default-app" disabled={btn_loading} onClick={!id ? handlepostsys_group : handleputsys_group}>
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

export default Sys_groupedit
