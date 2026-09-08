

import React, { useState, useEffect, useRef } from 'react'
import Dropdown from 'components/Dropdown'
import DropdownAction from 'components/DropdownAction'
import { useRouter, redirect, usePathname } from 'components/Navigation'
import {
    TreeGrid,
    GridColumn,
    LinkButton,
    ButtonGroup,
    MenuButton,
    Menu,
    MenuItem,
    ComboBox,
} from 'rc-easyui'
import HeaderApp from 'components/HeaderApp'
import { checkNotAuthorized, initAccessMethod } from 'pages/Utils'
import IconApp from 'components/IconApp'
import InputSelect from 'components/InputSelect'
import Input from 'components/Input'
import BtnGroup from 'components/BtnGroup'
import Button from 'components/Button'
import InputRadio from 'components/InputRadio'
import { api_services } from 'hooks/api_services'
import FormGroup from 'components/FormGroup'
import InputCheckbox from 'components/InputCheckbox'
import { is_insert_cepat_banyak } from '../page'

const rules = {
    nama: {
        label: 'Nama',
        required: true,
    },
    url: {
        label: 'Url',
        required: true,
    },
    is_show: {
        label: 'Tampil',
        required: true,
    },
    icon: {
        label: 'Icon',
        required: false,
    },
    sort: {
        label: 'Sort',
        required: false,
    },
    id_parent_menu: {
        label: 'Parent Menu',
        required: false,
    },

}


const Sys_menuedit = props => {
    const page_url = 'sys_menu'

    const pathname = usePathname()
    const router = useRouter()
    const [errors, setErrors] = useState({})
    const [path, setpath] = useState('')
    const [is_disabled, setis_disabled] = useState(false)
    const [access_method, setaccess_method] = useState({})
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)
    const id = props.params.slug[1]

    const {
        getapi_servicesid,
        getapi_services,
        postapi_services,
        putapi_services,
    } = api_services({
        api_path: `/${page_url}`,
    })

    const [nid, setnid] = useState('')
    const [nama, setnama] = useState('')
    const [url, seturl] = useState('')
    const [icon, seticon] = useState('')
    const [is_show, setis_show] = useState(1)
    const [sort, setsort] = useState('')
    const [id_parent_menu, setid_parent_menu] = useState('')

    const [dataid_parent_menu, setdataid_parent_menu] = useState([])
    const [datais_show, setdatais_show] = useState([
        {
            label: 'Ya',
            value: 1,
        },
        {
            label: 'Tidak',
            value: 0,
        },
    ])

    useEffect(() => {
        // console.log("useEffect=>props")
        // console.log(props)
        handleFirstLoad()
    }, [pathname])

    const handleFirstLoad = () => {
        handleInitAccessMethod()
        handlegetsys_menu()
        handlegetsys_menuid()
    }

    const handleInitAccessMethod = async () => {
        // console.log('props.params')
        // console.log(props.params)
        const { access_method, path, id } = await initAccessMethod(
            page_url,
            props.params,
        )
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
            [column]: message,
        })
    }

    const handlegetsys_menu = async () => {
        const response = await getapi_services({
            setErrors,
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        })
        // console.log('getsys_menu')
        // console.log(response)

        checkNotAuthorized(response)
        if (response.error || response.code) return

        let name = {}
        response.data.map(m => {
            name[m.id_menu] = m.nama
        })

        let dataid_parent_menu = []
        response.data.map(m => {
            let label = m.nama
            if (m.id_parent_menu) {
                label = `${name[m.id_parent_menu]} > ${m.nama}`
            }
            dataid_parent_menu.push({ label, value: m.id_menu })
        })
        setdataid_parent_menu(dataid_parent_menu)
    }

    const handlegetsys_menuid = async () => {
        if (!id) return

        setis_loading(true)
        const response = await getapi_servicesid({ setErrors, id })
        // console.log('getsys_menuid')
        // console.log(response)
        if (!response.error || response.error.message != 'canceled')
            setis_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        setnama(response.nama)
        seturl(response.url)
        seticon(response.icon)
        setis_show(response.is_show)
        setsort(response.sort)
        setid_parent_menu(response.id_parent_menu)
    }

    const handlepostsys_menu = async () => {
        const body = {
            nama,
            url,
            icon,
            is_show,
            id_parent_menu,
            sort,
        }
        setbtn_loading(true)
        const response = await postapi_services({ setErrors, ...body })
        setbtn_loading(false)
        // console.log('postsys_menu')
        // console.log(response)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        for (let i = 0; i < 4; i++) {
            const body_act = {
                id_menu: response.id_menu,
                nama:
                    i === 0
                        ? 'index'
                        : i === 1
                            ? 'add'
                            : i === 2
                                ? 'edit'
                                : 'delete',
            }

            const response_act = await postapi_services({
                setErrors,
                customUrl: '/sys_action',
                ...body_act,
            })
            // console.log('postsys_action')
            // console.log(response_act)
        }
        setbtn_loading(false)

        router.push(`/${page_url}`)
    }

    const handleputsys_menu = async () => {
        const body = {
            nama,
            url,
            icon,
            is_show,
            id_parent_menu,
            sort,
        }
        // console.log(body)
        // return
        setbtn_loading(true)
        const response = await putapi_services({ setErrors, ...body, id })
        // console.log('putsys_menu')
        // console.log(response)
        setbtn_loading(false)

        checkNotAuthorized(response)

        if (response.error || response.code) return

        router.push(`/${page_url}`)
    }


    const handleinsert_cepat_banyak = async () => {
        const data = [
            // { nama: 'Pertanyaan Pengujian TOD', url: 'mt_pertanyaan_pengujian_tod', is_show: 1, id_parent_menu: '379' },
            // { nama: 'Pertanyaan MRC TOD', url: 'mt_pertanyaan_mrc_tod', is_show: 1, id_parent_menu: '379' },
            // { nama: 'Pertanyaan EUC TOD', url: 'mt_pertanyaan_euc_tod', is_show: 1, id_parent_menu: '379' },
            // { nama: 'Pertanyaan Kesimpulan TOD', url: 'mt_pertanyaan_kesimpulan_tod', is_show: 1, id_parent_menu: '379' },
            // { nama: 'Pertanyaan IPE TOD', url: 'mt_pertanyaan_ipe_tod', is_show: 1, id_parent_menu: '379' },

            { nama: 'Pertanyaan Pengujian TOD', url: 'mt_pertanyaan_pengujian_tod_detail', is_show: 1, id_parent_menu: '137' },
            { nama: 'Pertanyaan MRC TOD', url: 'mt_pertanyaan_mrc_tod', is_show: 1, id_parent_menu: '137' },
            { nama: 'Pertanyaan EUC TOD', url: 'mt_pertanyaan_euc_tod', is_show: 1, id_parent_menu: '137' },
            { nama: 'Pertanyaan Kesimpulan TOD', url: 'mt_pertanyaan_kesimpulan_tod_detail', is_show: 1, id_parent_menu: '137' },
            { nama: 'Pertanyaan IPE TOD', url: 'mt_pertanyaan_ipe_tod', is_show: 1, id_parent_menu: '137' },
        ]

        for (let m of data) {
            const response = await postapi_services({ setErrors, ...m })
            if (response.error || response.code) return

            for (let i = 0; i < 4; i++) {
                const body_act = {
                    id_menu: response.id_menu,
                    nama:
                        i === 0
                            ? 'index'
                            : i === 1
                                ? 'add'
                                : i === 2
                                    ? 'edit'
                                    : 'delete',
                }

                const response_act = await postapi_services({
                    setErrors,
                    customUrl: '/sys_action',
                    ...body_act,
                })
            }
        }

    }

    return (
        <>
            <HeaderApp
                title={path === 'add'
                    ? ''
                    : `${path === 'edit' ? 'Edit' : 'Detail'} Menu`}
                is_loading={is_loading}
                data_btn={
                    Object.keys(access_method).length > 0
                        ? access_method.btn_top.map(button => ({
                            ...button,
                            label: button.label === 'Back' ? 'Kembali' : button.label,
                        }))
                        : []
                }
            />
            <div className="container pl-4 pr-4">
                <div className="row">
                    <div className="col-md-6">



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
                                    label={rules.nama.label}
                                    placeholder={rules.nama.label}
                                    value={nama}
                                    className="block mt-1 w-full"
                                    onChange={value => setnama(value)}
                                    required={rules.nama.required}
                                    autoFocus
                                    message_error={errors.nama}
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                />
                            </div>
                        </FormGroup>

                        <FormGroup
                            label={"Url"}

                            message_error={errors.url}
                            disabled={is_disabled}
                        >
                            <div className="col">
                                <Input
                                    ref={null}
                                    id="url"
                                    type="text"
                                    placeholder={rules.url.label}
                                    value={url}
                                    className="block mt-1 w-full"
                                    onChange={value => seturl(value)}
                                    required={rules.url.required}
                                    autoFocus
                                    message_error={errors.url}
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                />
                            </div>
                        </FormGroup>

                        <FormGroup
                            label={"Icon"}

                            message_error={errors.icon}
                            disabled={is_disabled}
                        >
                            <div className="col">
                                <Input
                                    ref={null}
                                    id="icon"
                                    type="text"
                                    placeholder={rules.icon.label}
                                    value={icon}
                                    className="block mt-1 w-full"
                                    onChange={value => seticon(value)}
                                    required={rules.icon.required}
                                    autoFocus
                                    message_error={errors.icon}
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                />
                            </div>
                        </FormGroup>
                    </div>
                    <div className="flex-1">

                        <FormGroup
                            label={"Sort"}

                            message_error={errors.sorts}
                            disabled={is_disabled}
                        >
                            <div className="col">
                                <Input
                                    ref={null}
                                    id="sort"
                                    type="text"
                                    placeholder={rules.sort.label}
                                    value={sort}
                                    className="block mt-1 w-full"
                                    onChange={value => setsort(value)}
                                    required={rules.sort.required}
                                    autoFocus
                                    message_error={
                                        // Object.keys(errors).length > 0
                                        //     ? errors.sort
                                        //     : ''
                                        errors.sorts
                                    }
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                />
                            </div>
                        </FormGroup>

                        <FormGroup
                            label={"Tampil"}

                            message_error={errors.passwordConfirm}
                            disabled={is_disabled}
                        >
                            <div className="col">
                                {/* <InputRadio
                                    ref={null}
                                    id="is_show"
                                    type="radio"
                                    placeholder={rules.is_show.label}
                                    value={is_show}
                                    className="block mt-1"
                                    onChange={setis_show}
                                    data={datais_show}
                                    required={rules.is_show.required}
                                    autoFocus
                                    message_error={errors.is_show}
                                    onError={handleErrors}
                                /> */}
                                <InputCheckbox
                                    ref={null}
                                    id="is_show"
                                    type="checkbox"
                                    placeholder={rules.is_show.label}
                                    value={is_show}
                                    className="block mt-1"
                                    onChange={setis_show}
                                    data={[{ label: 'Ya', value: '1' }]}
                                    required={rules.is_show.required}
                                    autoFocus
                                    message_error={errors.is_show}
                                    onError={handleErrors}
                                />
                            </div>
                        </FormGroup>

                        <FormGroup
                            label={"Parent Menu"}

                            message_error={errors.id_parent_menu}
                            disabled={is_disabled}
                        >
                            <div className="col">
                                <InputSelect
                                    ref={null}
                                    id="id_parent_menu"
                                    type="select"
                                    placeholder={rules.id_parent_menu.label}
                                    value={id_parent_menu}
                                    className="block mt-1 w-full"
                                    data={dataid_parent_menu}
                                    onChange={setid_parent_menu}
                                    required={rules.id_parent_menu.required}
                                    isMulti={false}
                                    isClearable
                                    message_error={errors.id_parent_menu}
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                />
                            </div>
                        </FormGroup>
                    </div>
                </div>

                {is_insert_cepat_banyak ? (
                    <Button
                        className="btn-default-app"
                        onClick={
                            handleinsert_cepat_banyak
                        }
                        disabled={btn_loading}>
                        <span className="material-icons icon-btn-left mr-1">
                            save
                        </span>
                        Insert cepat banyak
                    </Button>
                ) : null}

                {path !== 'detail' ? (
                    <div className="flex justify-end">
                        <Button
                            className="btn-default-app"
                            onClick={
                                !id ? handlepostsys_menu : handleputsys_menu
                            }
                            disabled={btn_loading}>
                            {btn_loading ? (
                                'Loading...'
                            ) : (
                                <>
                                    <span className="material-icons icon-btn-left mr-1">
                                        save
                                    </span>
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

export default Sys_menuedit
