

import React, { useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'
import DropdownAction from 'components/DropdownAction'
import { checkNotAuthorized, arrayToTree, arrayToTree2, arrayToTree3, initAccessMethod } from 'pages/Utils';
import IconApp from 'components/IconApp';
import { Tree } from 'rc-easyui';
import { useRouter, redirect, usePathname } from 'components/Navigation';

import 'rc-easyui/dist/themes/default/easyui.css';
import 'rc-easyui/dist/themes/icon.css';
import 'rc-easyui/dist/themes/react.css';
import BtnIconAct from 'components/BtnIconAct';
import { api_services } from 'hooks/api_services';
import TableHead from 'components/TableHead';
import Button from 'components/Button';
import BtnGroup from 'components/BtnGroup';

const headers = [
    {
        name: "nama",
        label: "Nama",
        width: "auto",
        type: "char",
    },
]

const Sys_group = (props) => {
    const pathname = usePathname();
    const [errors, setErrors] = useState([])
    const [access_method, setaccess_method] = useState({})
    const [first_load, setfirst_load] = useState(false)
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)

    const [sys_group, setsys_group] = useState([])
    const { getapi_services, deleteapi_services } = api_services({
        api_path: `/sys_group`
    })
    const [datafilter, setdatafilter] = useState({
        paginate: {
            page: 1,
            pagesize: 1000
        },
    })

    const [sys_action_sidebar, setsys_action_sidebar] = useState(false)
    const [datasidebar, setdatasidebar] = useState({

    })

    const [listreferensi, setreferensi] = useState({})
    const [filter, setfilter] = useState({})
    const [order, setOrder] = useState('')

    useEffect(() => {
        handleInitAccessMethod()
        handlegetsys_group()
    }, [filter, datafilter.paginate.pagesize, datafilter.paginate.page, order])

    const handleInitAccessMethod = async () => {
        const { access_method } = await initAccessMethod('group')
        setaccess_method(access_method)
    }

    const handleChangeHead = (column, value) => {
        // console.log(column)
        // console.log(value)
        setdatafilter({
            ...datafilter,
            [column]: value
        })
    }

    const handlegetsys_group = async () => {
        // console.log("handlegetsys_group")

        var filterarr = {}
        headers.map((v, k) => {
            if (filter[v.name]) {
                if (v.type == 'list') {
                    filterarr[v.name] = filter[v.name]
                } else {
                    filterarr[v.name] = '%' + filter[v.name] + '%'
                }
            }
        })

        setis_loading(true)
        const response = await getapi_services({
            setErrors,
            filter: {
                ...datafilter,
                filter: filterarr,
                order: order,
            },

        })
        // console.log('getsys_group')
        // console.log(response)
        if (!response.error || response.error.message!= 'canceled')
            setis_loading(false)

        checkNotAuthorized(response)
        if (response.error || response.code) return

        setsys_group(response.data)
        setfirst_load(true)
        // initMenuTree(response.data)
    }

    const handledeletesys_group = async id => {
        const response = await deleteapi_services({ setErrors, id })

        checkNotAuthorized(response)
        if (response.error || response.code) return

        handlegetsys_group()
    }


    return (
        <>
            <div className='container pl-4 pr-4'>
                <div className="d-flex justify-content-end mb-3">
                    <BtnGroup
                        btn_top
                        data={
                            Object.keys(access_method).length > 0
                                ? access_method.btn_top.map(button => ({
                                    ...button,
                                    label: button.label === 'Add' ? 'Tambah' : button.label,
                                }))
                                : []
                        }
                    />
                </div>
                <div className='flex flex-row'>
                    <div className='flex-1'>

                        <table className="w-full table table-auto border-collapse border">
                            <thead>
                                <TableHead data={headers} access_role={[]}
                                    referensi={listreferensi}
                                    showfilter={datafilter.paginate.total_records > datafilter.paginate.pagesize}
                                    onChange={(key, value) => {
                                        setfilter({
                                            ...filter,
                                            [key]: value,
                                        })
                                    }}
                                    setOrder={v => {
                                        setOrder(v)
                                    }}
                                />
                            </thead>
                            <tbody>
                                {sys_group.map((m, i) => (
                                    <tr key={i}>
                                        <td className='border text-center'>{((parseInt(datafilter.paginate.page) - 1) * parseInt(datafilter.paginate.pagesize)) + i + 1}</td>
                                        <td className='border'>{m.nama}</td>
                                        <td className='border'>
                                            <div className='flex align-center justify-center td-action'>
                                                <BtnIconAct
                                                    className="btn-info"
                                                    icon="menu"
                                                    label="Action"
                                                    onTap={() => {
                                                        setdatasidebar(m)
                                                        setsys_action_sidebar(true)
                                                    }}
                                                />
                                                {access_method.btn_edit_delete?.delete ? (
                                                    <BtnIconAct
                                                        className="btn-danger"
                                                        icon="delete"
                                                        tooltips="Hapus"
                                                        onTap={() => {
                                                            if (confirm(`Yakin menghapus role \"${m.nama}\"?`)) {
                                                                handledeletesys_group(m.id_group)
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>

                    <Sys_action
                        id={datasidebar.id_group}
                        visible={sys_action_sidebar}
                        onClose={() => {
                            setsys_action_sidebar(false)
                        }}
                        datasidebar={datasidebar}
                    />
                </div>
            </div>
        </>
    )
}

export default Sys_group

const Sys_action = (props) => {
    const { getapi_services, getapi_servicesid, deleteapi_services, putapi_services } = api_services({
        api_path: `/sys_group`
    })

    const [sys_group_menu_tree, setsys_group_menu_tree] = useState([])
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)

    useEffect(() => {
        if (props.visible) {
            handlegetsys_actionid()
        }
    }, [props.visible, props.id])

    const setErrors = () => {

    }

    const handlegetsys_actionid = async () => {
        // console.log("handlegetsys_action")
        setis_loading(true)
        const response = await getapi_servicesid({ setErrors, id: `getmenu/${props.datasidebar.id_group}` })
        // console.log('getsys_action')
        // console.log(response)
        if (!response.error || response.error.message!= 'canceled')
            setis_loading(false)
        if (response.error || response.code) return
        // checkNotAuthorized(response)
        // console.log(first)
        // handleSysGroupMenuOriToTree1(response)
        const menu_tree = handledata_to_tree(response)
        // console.log('menu_tree')
        // console.log(menu_tree)

        setsys_group_menu_tree(menu_tree)
    }

    const handledata_to_tree = (response) => {
        arrayToTree2(response)
        return response
    }
    const handletree_to_data = (response) => {
        arrayToTree3(response)
        return response
    }

    const handleputsys_action = async () => {
        // console.log('sys_group_menu_tree')
        // console.log(sys_group_menu_tree)
        // return
        let menu = sys_group_menu_tree
        const menu_tree = handletree_to_data(menu)
        // console.log('menu_tree=>datainsert')
        // console.log(menu_tree)

        const sys_group_menuObj = menu_tree
        // return;

        const data = {
            id_group: props.datasidebar.id_group,
            body: sys_group_menuObj
        }

        setbtn_loading(true)
        const response = await putapi_services({ setErrors, customUrl: '/sys_group/setmenu', ...data.body, id: data.id_group })
        // console.log('putsys_action')
        // console.log(response)
        setbtn_loading(false)
        if (response.error || response.code) return
        // checkNotAuthorized(response)

        handlegetsys_actionid()

    }

    const handleCheckChange = () => {

    }

    return (
        <div className={`sidebar-right ${!props.visible ? 'display-none' : ''}`} style={{ height: "auto", width: "300px" }}>
            <div className='flex justify-between align-center'>
                <div className='title-sidebar'>{is_loading ? 'Loading...' : props.datasidebar.nama}</div>

                <BtnIconAct className="btn-danger" icon="close" onTap={props.onClose} />
            </div>

            <div style={{ height: 15 }}></div>

            <div style={{ height: "400px", overflowY: "auto" }}>
                {btn_loading ? 'Loading...' :
                    <Tree
                        data={sys_group_menu_tree}
                        checkbox
                        onCheckChange={handleCheckChange}
                    >
                    </Tree>}
            </div>

            <div style={{ height: 15 }}></div>

            <div className='flex justify-end'>
                <Button className="btn-default-app" disabled={btn_loading} onClick={handleputsys_action}>
                    {btn_loading ? 'Loading...' : (
                        <>
                            <span className='material-icons icon-btn-left mr-1'>save</span>
                            Save
                        </>
                    )}
                </Button>
            </div>

            <div style={{ height: 70 }}></div>

        </div>
    )
}

