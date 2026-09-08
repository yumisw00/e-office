

import React, { useEffect, useState, useRef } from 'react'
import Link from 'components/Link'
import { findTopParent, getStorage, is_tampil_disemua_halaman_modal_pemutakhiran, referensiSecurityPage, saveStorage } from 'pages/Utils'
import { usePathname } from 'components/Navigation'
import Overlay from 'react-bootstrap/Overlay'
import Tooltip from 'react-bootstrap/Tooltip'
import $ from 'jquery'
import { useSelector, useDispatch } from 'react-redux'
import { VAR_IS_PAGE_404, VAR_IS_PAGE_PREVIEW, VAR_IS_PAGE_READONLY } from 'hooks/redux'
import { api_services } from 'hooks/api_services'
import { Modal } from 'react-bootstrap'
import { canUseEofficeAction, eofficeDevPages, getAdminContentMenuSection, getAdminSystemMenuSection, getEofficeRole, getPegawaiMenuSection, getPimpinanMenuSection, mergeEofficeMenuByRole, resolveEofficePage } from 'lib/eofficeAccess'

export const page_without_menu = [
    'pengantar_kuesioner',
    'rcm_efektivitas_pertanyaan_csa'
]
const menu_escape = [
    'csa_tlc_edit',
    'csa_tlc_leadsheet',
    'csa_elc_edit',
    'csa_elc_leadsheet',
    'csa_itgc_edit',
    'csa_itgc_leadsheet',
    'tod_tlc_utp',
    'tod_tlc_inquiries',
    'tod_tlc_evaluation',
    'tod_tlc_mrc_ipe',
    'tod_tlc_mom',
    'tod_tlc_agreed_fact',
    'tod_tlc_leadsheet',
    'tod_elc_utp',
    'tod_elc_inquiries',
    'tod_elc_evaluation',
    'tod_elc_mrc_ipe',
    'tod_elc_mom',
    'tod_elc_agreed_fact',
    'tod_elc_leadsheet',
    'tod_itgc_utp',
    'tod_itgc_inquiries',
    'tod_itgc_evaluation',
    'tod_itgc_mrc_ipe',
    'tod_itgc_mom',
    'tod_itgc_agreed_fact',
    'tod_itgc_leadsheet',
    'tod_tlc_reviewer_evaluation',
    'tod_tlc_reviewer_mrc_ipe',
    'tod_tlc_reviewer_leadsheet',
    'tod_elc_reviewer_evaluation',
    'tod_elc_reviewer_mrc_ipe',
    'tod_elc_reviewer_leadsheet',
    'tod_itgc_reviewer_evaluation',
    'tod_itgc_reviewer_mrc_ipe',
    'tod_itgc_reviewer_leadsheet',
    'toe_tlc_wpd',
    'toe_tlc_agreed_fact',
    'toe_tlc_leadsheet',
    'toe_elc_wpd',
    'toe_elc_agreed_fact',
    'toe_elc_leadsheet',
    'toe_itgc_wpd',
    'toe_itgc_agreed_fact',
    'toe_itgc_leadsheet'
]

const eoffice_dev_pages = eofficeDevPages

const page_alias = {
    sys_group_menu: 'group',
    pegawai_surat_masuk: 'surat_masuk_pegawai',
}

const resolvePageAlias = page => page_alias[page] || resolveEofficePage(page)

const ApplicationMenu = props => {
    const { getapi_services } = api_services({})
    const menuREf = useRef()
    const pathname = usePathname()
    const dispatch = useDispatch()
    const [data_menu, setdata_menu] = useState([
        // {
        //     id_menu: "1",
        //     id_parent_menu: null,
        //     url: "/risk_visi_misi",
        //     label: "Visi Misi",
        //     active: false,
        //     collapsed: true,
        //     children: []
        // },
        // {
        //     id_menu: "2",
        //     id_parent_menu: null,
        //     url: "",
        //     label: "Master",
        //     active: false,
        //     collapsed: true,
        //     children: [
        //         {
        //             id_menu: "3",
        //             id_parent_menu: "2",
        //             url: "/master1",
        //             label: "Master1",
        //             active: false,
        //             collapsed: true,
        //             children: []
        //         },
        //         {
        //             id_menu: "4",
        //             id_parent_menu: "2",
        //             url: "/master2",
        //             label: "Master2",
        //             active: false,
        //             collapsed: true,
        //             children: [
        //                 {
        //                     id_menu: "6",
        //                     id_parent_menu: "4",
        //                     url: "/master6",
        //                     label: "Master6",
        //                     active: false,
        //                     collapsed: true,
        //                     children: []
        //                 },
        //                 {
        //                     id_menu: "7",
        //                     id_parent_menu: "4",
        //                     url: "/master7",
        //                     label: "Master7",
        //                     active: false,
        //                     collapsed: true,
        //                     children: []
        //                 },
        //             ]
        //         },
        //         {
        //             id_menu: "5",
        //             id_parent_menu: "2",
        //             url: "/master3",
        //             label: "Master3",
        //             active: false,
        //             collapsed: true,
        //             children: []
        //         },
        //     ]
        // },
    ])
    const [menu_clicked, setmenu_clicked] = useState(0)
    const [init_menu, setinit_menu] = useState(false)
    const [page_active, setpage_active] = useState('')
    const [sidebar_collapsed, setsidebar_collapsed] = useState(false)
    const [isAdminSystem, setIsAdminSystem] = useState(false)
    const [isAdminContent, setIsAdminContent] = useState(false)
    const [isPegawai, setIsPegawai] = useState(false)
    const [isPimpinan, setIsPimpinan] = useState(false)

    const [is_punya_akses_approve_pemutakhiran, setis_punya_akses_approve_pemutakhiran] = useState(false)
    const [is_modal_req_delete, setis_modal_req_delete] = useState(false)
    const [req_rcm_delete, setreq_rcm_delete] = useState([])

    // const initialized = useRef(false)
    // useEffect(() => {
    //     if (!initialized.current) {

    //         initMenu()
    //         handleget_hak_akses_halaman()

    //         initialized.current = true
    //     }

    // }, [])
    // useEffect(() => {
    //     if (init_menu) {
    //         initMenuActive()
    //         handleget_hak_akses_halaman()

    //     }
    // }, [pathname])
    // useEffect(() => {
    //     if (data_menu && data_menu.length > 0 && init_menu) {
    //         handleSecurityPage()
    //     }
    // }, [data_menu])


    const initialized = useRef(false)
    useEffect(() => {
        if (!initialized.current) {
            initMenu()
            initialized.current = true
        }
        // console.log('ApplicationMewnu->useEffect');
    }, [])

    useEffect(() => {
        if (data_menu && data_menu.length > 0 && init_menu) {
            // console.log('ApplicationMewnu->useEffect->2');

            initMenuActive()
            handleget_hak_akses_halaman()
            handleSecurityPage()
        }
    }, [data_menu, pathname])

    const initMenu = async () => {
        const user_loginObj = await getStorage('user_login')
        const user_login = JSON.parse(user_loginObj)

        // console.log('initMenu => user_login')
        // console.log(user_login)

        const menu = resInitMenuTree(mergeEofficeMenuByRole(user_login.menu || [], user_login))
        // console.log('menu')
        // console.log(menu)
        setdata_menu(menu)
        const role = getEofficeRole(user_login)
        setIsAdminSystem(role === 'admin_sistem')
        setIsAdminContent(role === 'admin_konten')
        setIsPimpinan(role === 'pimpinan')
        setIsPegawai(['pegawai', 'pegawai_sdm', 'pegawai_keuangan', 'pegawai_pemasaran', 'pegawai_operasional'].includes(role))
        setinit_menu(true)

        renderMenu(menu)

        initsidebar_collapsed()
    }

    const initsidebar_collapsed = () => {
        // console.log('initsidebar_collapsed')
        const body_classname = $('body').attr('class')
        // console.log('body_classname')
        // console.log(body_classname.attr('class'))

        if (body_classname)
            if (body_classname.includes('sidebar-collapsed')) {
                setsidebar_collapsed(true)
            } else {
                setsidebar_collapsed(false)
            }
    }

    const resInitMenuTree = data => {
        initMenuTree(data)
        return data
    }

    const initMenuTree = data => {
        // data.forEach(m => {
        for (let m of data) {

            const pathname_arr = pathname.split('/')
            const page = resolvePageAlias(pathname_arr[1])

            const pagearr = `${m.page}`.split('/')
            const mpage = resolvePageAlias(pagearr[0])
            // m.active = `${m.page}` === page ? true : false

            // if(page_without_menu.includes(page)) continue

            m.active = `${mpage}` === page ? true : false
            if (mpage == 'mt_risk_kriteria_dampak') {
                m.active = pathname === `/${m.page}` ? true : false
                if (pathname_arr.length > 3) {
                    let pathnamecut = ''
                    pathname_arr.map((x, y) => {
                        if (y < 3 && x) {
                            pathnamecut += '/'
                            pathnamecut += x
                        }
                    })
                    // console.log('pathnamecut')
                    // console.log(pathname_arr)
                    // console.log(pathnamecut)
                    // console.log(m.page)
                    m.active = `/${m.page}` === pathnamecut ? true : false
                }
            }
            if (init_menu) {
                m.collapsed = m.collapsed
            } else {
                m.collapsed = true
            }

            if (m.submenu && m.submenu.length > 0) {
                initMenuTree(m.submenu)
            }
        }
        // })
    }

    const initMenuActive = () => {
        setmenu_clicked(menu_clicked + 1)
        let menu = resInitMenuTree(data_menu)

        menu.forEach(setParentActive)
        setdata_menu(menu)

        dispatch({
            type: VAR_IS_PAGE_READONLY,
            value: false
        })

        let is_rcm_index = false
        const pathname_arr = pathname.split('/')
        const page = pathname_arr[1]
        const path = pathname_arr[2]

        if (['rcm_tlc', 'rcm_elc', 'rcm_itgc'].includes(page) && !['edit', 'detail', 'add'].includes(path)) {
            is_rcm_index = true
        }
        // console.log('pathname_arr');
        // console.log(pathname_arr);
        // console.log(is_rcm_index);


        if (is_rcm_index) {
            $('.layout-app-body>.flex-1.overflow-y-auto').addClass('container-content-rcm')
        } else {
            $('.layout-app-body>.flex-1.overflow-y-auto').removeClass('container-content-rcm')
        }
    }

    const setParentActive = (menu) => {
        // Periksa apakah menu memiliki properti `sub_menu`
        if (Array.isArray(menu.submenu)) {
            // Periksa setiap submenu secara rekursif
            menu.submenu.forEach(setParentActive);

            // Cek jika salah satu submenu aktif
            const hasActiveChild = menu.submenu.some(child => child.active === true);
            if (hasActiveChild) {
                menu.active = true;
            }
        }

        // Jika menu ini sendiri memiliki properti `active`, pertahankan nilainya
        if (menu.active !== true && menu.hasOwnProperty("active") && menu.active === true) {
            menu.active = true;
        }
    }

    const func_menu_active = data => {
        data.forEach(m => {
            if (m.active) {
                return m
            }
            if (m.submenu && m.submenu.length > 0) {
                func_menu_active(m.submenu)
            }
        })
    }

    const handleClickMenu = item_menu => {
        console.log('handleClickMenu');
        console.log(item_menu)

        setmenu_clicked(menu_clicked + 1)

        const data_menu_res = func_data_menu_foreach(data_menu, item_menu)

        if ((!item_menu.page || item_menu.page) && !item_menu.id_prent_menu) {
            data_menu_res.forEach(m => {
                if (m.label != item_menu.label) {
                    m.collapsed = true
                }
            })
        }

        setdata_menu(data_menu_res)
    }

    const func_data_menu_foreach = (data_menu, item_menu) => {
        data_menu_foreach(data_menu, item_menu)
        return data_menu
    }

    const data_menu_foreach = (data_menu, item_menu) => {
        return data_menu.forEach((m, i) => {

            if (m.id_menu === item_menu.id_menu) {
                m.collapsed = m.collapsed ? false : true
            }

            if (m.submenu !== undefined && m.submenu.length > 0) {
                data_menu_foreach(m.submenu, item_menu)
            }
        })
    }

    const handleSecurityPage = () => {
        const pathname_arr = pathname.split('/')
        const page = pathname_arr[1]
        const page_access = resolvePageAlias(page)

        if (canUseEofficeAction(page_access, 'view')) {
            dispatch({
                type: VAR_IS_PAGE_404,
                value: false
            })
            return
        }

        if (eoffice_dev_pages.includes(page_access)) {
            dispatch({
                type: VAR_IS_PAGE_404,
                value: !canUseEofficeAction(page_access, 'view')
            })
            return
        }

        // console.log('handleSecurityPage')
        // console.log(page);

        let checkpage = referensiSecurityPage(data_menu, page, pathname_arr)
        if (checkpage.is_error && page_access !== page) {
            checkpage = referensiSecurityPage(data_menu, page_access, pathname_arr)
        }
        // console.log('checkpage');
        // console.log(checkpage);
        dispatch({
            type: VAR_IS_PAGE_404,
            value: checkpage.is_error ? true : false
        })


    }

    const handleget_hak_akses_halaman = async () => {
        init_pemutakhiran()

        let urlsaved = ''
        if (!window.location.href.includes('/login')) {
            urlsaved = window.location.href
        }
        if (urlsaved) {
            sessionStorage.setItem('urlsaved', urlsaved)
        }

        const pathurlwarn = [
            'dod_severity_level',
            'dod_working_paper'
        ]
        const pathurlescape = [
            'remediasi_tlc_rencana',
            'remediasi_elc_rencana',
            'remediasi_itgc_rencana',
            'remediasi_tlc_pengujian',
            'remediasi_elc_pengujian',
            'remediasi_itgc_pengujian',

            'preview_document_with_authenticate'
        ]
        const pathname_arr = pathname.split('/')
        let pathurl = pathname_arr[1]
        const page_access = resolvePageAlias(pathurl)

        if (pathurl == 'dashboard' || pathurl == '') return
        if (canUseEofficeAction(page_access, 'view')) {
            dispatch({
                type: VAR_IS_PAGE_404,
                value: false
            })
            return
        }
        if (page_access !== pathurl && canUseEofficeAction(page_access, 'view')) {
            dispatch({
                type: VAR_IS_PAGE_404,
                value: false
            })
            return
        }
        if (eoffice_dev_pages.includes(page_access)) {
            dispatch({
                type: VAR_IS_PAGE_404,
                value: !canUseEofficeAction(page_access, 'view')
            })
            return
        }
        if (pathurlescape.includes(pathurl)) {
            if (pathurl == 'preview_document_with_authenticate') {
                dispatch({
                    type: VAR_IS_PAGE_PREVIEW,
                    value: true
                })
            }
            return
        }
        if (pathurl == 'laporan') return


        if (pathurlwarn.includes(pathurl)) {
            pathurl += `_${pathname_arr[2]}`
        }

        const response = await getapi_services({ api_path: `/access/index/${page_access}` })
        console.log('HAK AKSES HALAMAN=>');
        console.log(response);

        dispatch({
            type: VAR_IS_PAGE_404,
            value: response && response == true ? false : true
        })
    }

    const renderMenu = data_menu => {
        return data_menu.map((m, i) => {
            let children_exists = false
            if (m.submenu !== undefined && m.submenu.length > 0) {
                children_exists = true
            }
            return (
                <li
                    ref={menuREf}
                    dataToggle="tooltip"
                    title={m.label}
                    className={`sidebar-li ${m.collapsed === true ? 'collapsed' : ''
                        }`}
                    key={i}>
                    {/* {m.submenu !== undefined && m.submenu.length > 0 ? (
                        <Link href="#" className={`sidebar-a ${m.active ? 'active' : ''} ${children_exists ? "children-exists" : ""}`} onClick={() => handleClickMenu(m)}>
                            <span className="material-icons">{m.icon ? m.icon : 'pie_chart'}</span>
                            <span className='sidebar-a-label'>{m.label}</span>
                        </Link>
                    ) : (
                    )} */}
                    {/* <Link href={children_exists ? "#" : `/${m.page}`} className={`sidebar-a ${m.active ? 'active' : ''} ${children_exists ? "children-exists" : ""}`} onClick={() => children_exists ? handleClickMenu(m) : null}>
                        <span className="material-icons">{m.icon ? m.icon : 'pie_chart'}</span>
                        <span className='sidebar-a-label'>{m.label}</span>
                    </Link> */}
                    <ItemMenu
                        id_menu={m.id_menu}
                        label={m.label}
                        icon={m.icon ? m.icon : null}
                        children_exists={children_exists}
                        active={m.active}
                        page={m.page}
                        onClickMenu={handleClickMenu}
                        sidebar_collapsed={sidebar_collapsed}
                        data={m}
                    />
                    {m.submenu !== undefined && m.submenu.length > 0 ? (
                        <ul
                            className={`sidebar-ul ${m.collapsed === true ? 'collapsed' : ''
                                }`}>
                            {renderMenu(m.submenu)}
                        </ul>
                    ) : null}
                </li>
            )
        })
    }

    const renderAdminSystemMenu = () => {
        const sections = [
            { id: 'dashboard', label: null },
            { id: 'persuratan', label: 'PERSURATAN' },
            { id: 'aktivitas', label: 'AKTIVITAS' },
            { id: 'master_data', label: 'MASTER DATA' },
            { id: 'manajemen_sistem', label: 'MANAJEMEN SISTEM' },
            { id: 'sistem_pemeliharaan', label: 'SISTEM & PEMELIHARAAN' },
            { id: 'lainnya', label: 'LAINNYA' },
        ]

        return sections.map(section => {
            const items = data_menu.filter(item => getAdminSystemMenuSection(item.page) === section.id)
            if (items.length === 0) return null

            return (
                <React.Fragment key={section.id}>
                    {section.label && <li className="sidebar-section-label" aria-hidden="true">{section.label}</li>}
                    {renderMenu(items)}
                </React.Fragment>
            )
        })
    }

    const renderAdminContentMenu = () => {
        const sections = [
            { id: 'dashboard', label: null },
            { id: 'persuratan', label: 'PERSURATAN' },
            { id: 'disposisi', label: 'DISPOSISI' },
            { id: 'master_data', label: 'MASTER DATA' },
            { id: 'informasi', label: 'INFORMASI' },
            { id: 'lainnya', label: 'LAINNYA' },
        ]

        return sections.map(section => {
            const items = data_menu.filter(item => getAdminContentMenuSection(item.page) === section.id)
            if (items.length === 0) return null

            return (
                <React.Fragment key={section.id}>
                    {section.label && <li className="sidebar-section-label" aria-hidden="true">{section.label}</li>}
                    {renderMenu(items)}
                </React.Fragment>
            )
        })
    }

    const renderPegawaiMenu = () => {
        const sections = [
            { id: 'dashboard', label: null },
            { id: 'persuratan', label: 'PERSURATAN' },
            { id: 'disposisi', label: 'DISPOSISI' },
            { id: 'aktivitas', label: 'AKTIVITAS' },
        ]

        return sections.map(section => {
            const items = data_menu.filter(item => getPegawaiMenuSection(item.page) === section.id)
            if (items.length === 0) return null

            return (
                <React.Fragment key={section.id}>
                    {section.label && <li className="sidebar-section-label" aria-hidden="true">{section.label}</li>}
                    {renderMenu(items)}
                </React.Fragment>
            )
        })
    }

    const renderPimpinanMenu = () => {
        const sections = [
            { id: 'dashboard', label: null },
            { id: 'persuratan', label: 'PERSURATAN' },
            { id: 'disposisi', label: 'DISPOSISI' },
            { id: 'monitoring', label: 'MONITORING' },
        ]

        return sections.map(section => {
            const items = data_menu.filter(item => getPimpinanMenuSection(item.page) === section.id)
            if (items.length === 0) return null

            return (
                <React.Fragment key={section.id}>
                    {section.label && <li className="sidebar-section-label" aria-hidden="true">{section.label}</li>}
                    {renderMenu(items)}
                </React.Fragment>
            )
        })
    }


    const modal_req_delete = (child) => (
        <Modal
            show={is_modal_req_delete}
            className=""
            onShow={() => {

            }}
            onHide={() => {
                setis_modal_req_delete(false)
            }}
            size="lg"
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    Warning!
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {child}
            </Modal.Body>

        </Modal>
    )

    const init_pemutakhiran = async () => {
        // console.log('INIT=>USERLOGIN=>init_pemutakhiran');
        if (!is_tampil_disemua_halaman_modal_pemutakhiran) {
            return
        }
        const user_login = JSON.parse(await getStorage('user_login') || {})
        if (Object.keys(user_login).length == 0) {
            return
        }

        if (user_login.accessmethod.rcm_unit.approve_pemutakhiran) {
            const is_punya_akses_approve_pemutakhiran = user_login.accessmethod.rcm_unit.approve_pemutakhiran || false
            setis_punya_akses_approve_pemutakhiran(is_punya_akses_approve_pemutakhiran)

            if (is_punya_akses_approve_pemutakhiran) {
                handlegetreq_delete_pemutakhiran()
            }
        }
    }
    const handlegetreq_delete_pemutakhiran = async () => {

        const { getapi_services, putapi_services } = api_services({ api_path: `/req_delete` })
        const datafilter = {
            filter: {
                paginate: {
                    page: 1, pagesize: 1000
                },
                filter: {}
            }
        }
        const response = await getapi_services(datafilter)
        if (response.code || response.error) return

        setreq_rcm_delete(response || [])
        setis_modal_req_delete(response && response.length > 0 ? true : false)
    }

    const handleapprove_pemutakhiran = async (id, action) => {
        const { other_state } = this.state

        const { getapi_services, putapi_services } = api_services({ api_path: `/approve_delete` })
        const body = {
            action
        }
        const response = await putapi_services({ id, ...body })
        if (response.code || response.error) return

        handlegetreq_delete_pemutakhiran()
    }

    return (
        <>
            <ul className={`sidebar-ul ${isAdminSystem || isAdminContent || isPimpinan || isPegawai ? 'sidebar-ul-structured' : ''}`}>
                {isAdminSystem
                    ? renderAdminSystemMenu()
                    : isAdminContent
                        ? renderAdminContentMenu()
                        : isPimpinan
                            ? renderPimpinanMenu()
                        : isPegawai
                            ? renderPegawaiMenu()
                            : renderMenu(data_menu)}
            </ul>

            <SidebarFooterInfo />

          
        </>
    )
}

// === SIDEBAR FOOTER INFO ===
const SidebarFooterInfo = () => {
    const [lastLoginInfo, setLastLoginInfo] = useState(null)
    const [failedAttempts, setFailedAttempts] = useState(0)

    useEffect(() => {
        const loadUserData = async () => {
            const userLoginObj = await getStorage('user_login')
            if (userLoginObj) {
                const data = JSON.parse(userLoginObj)
                setLastLoginInfo(data.user?.last_login)
                setFailedAttempts(data.user?.failed_login_attempts || 0)
            }
        }
        loadUserData()
    }, [])

    const formatLastLogin = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="sidebar-footer-info mt-auto pt-3" style={{ padding: '15px', color: 'white' }}>
            {lastLoginInfo && (
                <div className="small mb-1">
                    <span className="material-icons" style={{ fontSize: '14px' }}>access_time</span>
                    {' '}Login Terakhir: {formatLastLogin(lastLoginInfo)}
                </div>
            )}
            {failedAttempts > 0 && (
                <div className="small text-warning">
                    <span className="material-icons" style={{ fontSize: '14px' }}>warning</span>
                    {' '}{failedAttempts}x percobaan login gagal
                </div>
            )}
        </div>
    )
}

export default ApplicationMenu

const ItemMenu = propsx => {
    const total_ews = useSelector(state => state.total_ews)
    const [show, setShow] = useState(false)
    const target = useRef(null)

    const handleShow = () => {
        // console.log('handleShow')
        if (checksidebar_collapsed()) {
            setShow(true)
        }
    }
    const handleHide = () => {
        if (checksidebar_collapsed()) {
            setShow(false)
        }
    }

    const checksidebar_collapsed = () => {
        // console.log('initsidebar_collapsed')
        const body_classname = $('body').attr('class')
        // console.log('body_classname')
        // console.log(body_classname.attr('class'))

        if (body_classname && body_classname.includes('sidebar-collapsed')) {
            return true
        }
        return false
    }

    return (
        <>
            {/* <span
                className="material-icons"
                ref={target}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {propsx.icon}
            </span> */}
            <Link
                href={propsx.children_exists ? '#' : `/${propsx.page}`}
                className={`sidebar-a ${propsx.active ? 'active' : ''} ${propsx.children_exists ? 'children-exists' : ''
                    }`}
                onClick={(e) => {
                    if (propsx.children_exists) {
                        e.preventDefault();
                        propsx.onClickMenu(propsx.data);
                    }
                    // For items without children, let the Link handle navigation naturally
                }}
            // onMouseEnter={handleShow}
            // onMouseLeave={handleHide}
            // dataBsToggle="tooltip"
            // dataBsPlacement="top"
            // title="Tooltip on top"
            >
                {propsx.icon ? (
                    <span className="material-icons">{propsx.icon}</span>
                ) : null}
                <span className="sidebar-a-label">{propsx.label} {propsx.label == 'Early Warning System' && total_ews ? <span className='item-count-ews'>{total_ews}</span> : null}</span>
            </Link>
            {/* <Overlay target={target.current} show={show} placement="right">
                {props => (
                    <Tooltip id={propsx.id_menu} {...props} style={{ position: 'fixed' }}>
                        {propsx.label}
                    </Tooltip>
                )}
            </Overlay> */}
        </>
    )
}
