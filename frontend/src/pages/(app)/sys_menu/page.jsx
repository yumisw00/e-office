

import React, { useState, useEffect, useRef } from 'react'
import Dropdown from 'components/Dropdown'
import DropdownAction from 'components/DropdownAction'
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
import BtnGroup from 'components/BtnGroup'
import { checkNotAuthorized, initAccessMethod, arrayToTree } from 'pages/Utils'
import IconApp from 'components/IconApp'
import { useRouter, redirect } from 'components/Navigation'

import 'rc-easyui/dist/themes/default/easyui.css'
import 'rc-easyui/dist/themes/icon.css'
import 'rc-easyui/dist/themes/react.css'
import BtnIconAct from 'components/BtnIconAct'
import { api_services } from 'hooks/api_services'
import EditDelete from 'components/EditDelete'

export const is_insert_cepat_banyak = false
const Sys_menu = props => {
    // console.log("Sys_menu =>")
    const page_url = 'sys_menu'

    const router = useRouter()
    const [errors, setErrors] = useState([])
    const [access_method, setaccess_method] = useState({})
    const [is_loading, setis_loading] = useState(false)
    // const [_loading, setis_loading] = useState(false)

    const [sys_menu_tree, setsys_menu_tree] = useState([])
    const { getapi_services, deleteapi_services } = api_services({
        api_path: `/${page_url}`,
    })
    const [datafilter, setdatafilter] = useState({
        paginate: {
            page: 1,
            pagesize: 2000,
            order: 'sort',
        },
    })

    const [sys_action_sidebar, setsys_action_sidebar] = useState(false)
    const [datasidebar, setdatasidebar] = useState({})

    useEffect(() => {
        // console.log("useEffect")
        handleFirstLoad()
    }, [])

    const handleFirstLoad = () => {
        handleInitAccessMethod()
        handlegetsys_menu()
    }

    const handleInitAccessMethod = async () => {
        const { access_method } = await initAccessMethod(page_url)
        setaccess_method(access_method)
    }

    const handlegetsys_menu = async () => {
        // console.log("handlegetsys_menu")
        setis_loading(true)
        const response = await getapi_services({
            setErrors,
            filter: datafilter,
        })
        // console.log('getsys_menu')
        // console.log(response)
        if (!response.error || response.error.message != 'canceled')
            setis_loading(false)

        checkNotAuthorized(response)
        if (response.error || response.code) return
        // setsys_menu_tree(response.data)
        initMenuTree(response.data)
    }

    const initMenuTree = data => {
        const sys_menu_tree = arrayToTree(data)
        // console.log('sys_menu_tree')
        // console.log(sys_menu_tree)

        setsys_menu_tree(sys_menu_tree)
    }

    const handledeletesys_menu = async id => {
        const response = await deleteapi_services({ setErrors, id })
        // console.log('deletesys_menu')
        // console.log(response)

        checkNotAuthorized(response)
        if (response.error || response.code) return
        handlegetsys_menu()
    }

    return (
        <>
            <div className="container pl-4 pr-4 sys_menu">
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
                <div className="flex flex-row">
                    <div className="flex-1" style={{ minHeight: "500px", overflowY: "auto" }}>
                        <TreeGrid
                            style={{ height: 'auto' }}
                            data={sys_menu_tree}
                            idField="id_menu"
                            treeField="nama"
                            selectionMode={`single`}
                            onSelectionChange={selection => {
                                // console.log("onSelectionChange")
                                // console.log(selection)
                                // setsys_menu_item(selection)
                                // handleGetDtSysAction(selection)
                            }}>
                            {/* {is_insert_cepat_banyak ? (
                                <GridColumn field="id_menu" title="ID Menu"></GridColumn>
                            ) : null} */}
                            <GridColumn field="nama" title="Nama"></GridColumn>
                            <GridColumn field="url" title="Url"></GridColumn>
                            <GridColumn field="icon" title="Icon" width={120}></GridColumn>
                            <GridColumn
                                field="is_show"
                                title="Tampil"
                                align="center"
                                width={80}
                                render={({ row }) => row.is_show ? 'Ya' : 'Tidak'}
                            ></GridColumn>
                            <GridColumn field="sort" title="Sort" align="center" width={80}></GridColumn>
                            <GridColumn
                                field="opsi"
                                title="Aksi"
                                align="center"
                                width={200}
                                render={({ row }) => (
                                    <div className="flex align-center justify-center td-action">
                                        <BtnIconAct
                                            className="btn-info"
                                            icon="menu"
                                            label="Action"
                                            onTap={() => {
                                                setdatasidebar(row)
                                                setsys_action_sidebar(true)
                                            }}
                                        />
                                        <BtnIconAct
                                            className="btn-warning"
                                            icon="edit"
                                            href={`/${page_url}/edit/${row.id_menu}`}
                                        />
                                        <BtnIconAct
                                            className="btn-danger"
                                            icon="delete"
                                            onTap={() => {
                                                if (confirm('Yakin menghapus data ini?')) {
                                                    handledeletesys_menu(row.id_menu)
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            />
                        </TreeGrid>
                    </div>

                    <Sys_action
                        id={datasidebar.id_menu}
                        visible={sys_action_sidebar}
                        onClose={() => {
                            setsys_action_sidebar(false)
                        }}
                        datasidebar={datasidebar}
                    />
                </div>
                <div className='height70'></div>
            </div>
        </>
    )
}

export default Sys_menu

const Sys_action = props => {
    const [sys_action, setsys_action] = useState([])
    const {
        getapi_services,
        deleteapi_services,
        putapi_services,
        postapi_services,
    } = api_services({
        api_path: '/sys_action',
    })

    const [nama, setnama] = useState('')
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)

    useEffect(() => {
        if (props.visible) {
            handlegetsys_action()
        }
    }, [props.visible, props.id])

    const setErrors = () => { }

    const handlegetsys_action = async () => {
        // console.log("handlegetsys_action")
        setis_loading(true)
        const response = await getapi_services({
            setErrors,
            filter: {
                paginate: { page: 1, pagesize: 1000 },
                filter: { id_menu: props.datasidebar.id_menu },
            },
        })
        // console.log('getsys_action')
        // console.log(response)
        if (!response.error || response.error.message != 'canceled')
            setis_loading(false)

        // checkNotAuthorized(response)
        let sys_action = []
        response.data.map(m => {
            sys_action.push({ ...m, is_edited: false })
        })
        setsys_action(sys_action)
    }

    const handledeletesys_action = async id => {
        const response = await deleteapi_services({ setErrors, id })
        // console.log('deletesys_action')
        // console.log(response)

        // checkNotAuthorized(response)
        handlegetsys_action()
    }

    const handlepostsys_action = async event => {
        event.preventDefault()

        const response = await postapi_services({
            setErrors,
            nama,
            id_menu: props.datasidebar.id_menu,
        })
        // console.log('postsys_action')
        // console.log(response)

        setnama('')
        // checkNotAuthorized(response)
        handlegetsys_action()
    }

    const handleputsys_action = async (event, di) => {
        // event.preventDefault()
        di.id = di.id_action
        delete di.is_edited

        const response = await putapi_services({ setErrors, ...di })
        // console.log('putsys_action')
        // console.log(response)

        // checkNotAuthorized(response)
        handlegetsys_action()
    }

    return (
        <div
            className={`sidebar-right ${!props.visible ? 'display-none' : ''}`}>
            <div className="flex justify-between align-center">
                <div className="title-sidebar">
                    {is_loading ? 'Loading...' : props.datasidebar.nama}
                </div>

                <BtnIconAct
                    className="btn-danger"
                    icon="close"
                    onTap={props.onClose}
                />
            </div>

            <div style={{ height: 15 }}></div>

            {sys_action.map((m, i) => (
                <div key={i} className="flex justify-between align-center mb-1">
                    {!m.is_edited ? (
                        <div>{m.nama}</div>

                    ) : (
                        <input value={m.nama}
                            onChange={e => {
                                // console.log(e.target.value);

                                // sys_action.forEach(mm => {
                                //     if (mm.id_action == m.id_action) {
                                //         mm.nama = e.target.value
                                //     }
                                // })
                                // setsys_action(sys_action)

                                let sys_action_new = []
                                for (let x of sys_action) {
                                    if (x.id_action == m.id_action) {
                                        x.nama = e.target.value
                                    }
                                    sys_action_new.push(x)
                                }
                                setsys_action(sys_action => sys_action_new)
                            }}
                        />
                    )}
                    <div className="flex">
                        {m.is_edited ? (
                            <BtnIconAct
                                className="btn-info"
                                icon="done"
                                onTap={() => {
                                    handleputsys_action(null, m)
                                }}
                            />
                        ) : (
                            <>
                                <BtnIconAct
                                    className="btn-warning mr-1"
                                    icon="edit"
                                    onTap={() => {
                                        let newsys_action = []
                                        sys_action.forEach(mm => {
                                            if (mm.id_action == m.id_action) {
                                                mm.is_edited = true
                                            } else {
                                                mm.is_edited = false

                                            }
                                            newsys_action.push(mm)
                                        })
                                        setsys_action(newsys_action)
                                    }}
                                />
                                <BtnIconAct
                                    className="btn-danger"
                                    icon="delete"
                                    onTap={() => {
                                        if (confirm('Yakin menghapus data ini?')) {
                                            handledeletesys_action(m.id_action)
                                        }
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>
            ))}

            <div style={{ height: 15 }}></div>

            <form onSubmit={handlepostsys_action}>
                <input
                    type="text"
                    placeholder="Nama Aksi"
                    onChange={event => setnama(event.target.value)}
                    value={nama}
                />
            </form>
        </div>
    )
}
