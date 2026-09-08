

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'components/Navigation'
import HeaderApp from 'components/HeaderApp'
import { checkNotAuthorized, clearStorage, getStorage, initAccessMethod, saveStorage, showToastr } from 'pages/Utils'
import Input from 'components/Input'
import Button from 'components/Button'
import { api_services } from 'hooks/api_services'
import { VAR_SET_NAME } from 'hooks/redux'
import { useSelector, useDispatch } from 'react-redux'
import FormGroup from 'components/FormGroup'
import { Modal } from 'react-bootstrap'
import { headers } from 'pages/(app)/sys_user/page'
import BtnIcon from 'components/BtnIcon'
import TableHead from 'components/TableHead'
import Pagination from 'components/Pagination'
import BtnIconAct from 'components/BtnIconAct'
import { useAuth } from 'hooks/auth'
import $ from 'jquery'
import { ModalChooseGroup, ModalLoginLoading, ModalTwoFactor } from 'pages/(auth)/login/page'

const titlePage = 'Profile'

// const rules = {
//     nid: { label: 'Nid', required: false },
//     email: { label: 'Email', required: false },
//     position_id: { label: 'Position Id ', required: false },
//     nama_lengkap: { label: 'Nama Lengkap ', required: true },
//     id_jabatan: { label: 'Jabatan ', required: false },
// }

const rules = {
    name: { label: "Nama", required: true },
    email: { label: "Username(Email)", required: true },
    email_verified_at: { label: "Email Verified At ", required: false },
    password: { label: "Password", required: true },
    passwordConfirm: { label: "Confirm Password", required: true },
    remember_token: { label: "Remember Token ", required: false },
    last_ip: { label: "Last Ip ", required: false },
    last_login: { label: "Last Login ", required: false },
    salt: { label: "Salt", required: false },
    id_pegawai: { label: "Pegawai ", required: false },
    id_jabatan: { label: "Jabatan ", required: false },
    id_group: { label: "Group", required: false },
    dataAll: { label: "Group Dan Jabatan", required: false },
};

const formatProfileDate = value => {
    if (!value) return '-'

    const dateValue = new Date(value)
    if (Number.isNaN(dateValue.getTime())) return String(value)

    return dateValue.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const Profileedit = props => {
    const page_url = 'profile'

    const dispatch = useDispatch()
    const pathname = usePathname()
    const router = useRouter()
    const [errors, setErrors] = useState({})
    const [path, setpath] = useState('detail')
    const [is_disabled, setis_disabled] = useState(true)
    const [access_method, setaccess_method] = useState({})
    const [is_loading, setis_loading] = useState(false)
    const [btn_loading, setbtn_loading] = useState(false)
    // const id = props.params.slug[1]



    const {
        getapi_services,
        getapi_servicesid,
        postapi_services,
        putapi_services,
        deleteapi_services,
    } = api_services({})

    const { login_as, choose_group, verify_two_factor, resend_two_factor } = useAuth({})

    // const { login, logout, choose_group } = useAuth({
    //     middleware: 'guest',
    //     redirectIfAuthenticated: '/dashboard',
    //     onRequestDone: handleRequestDone,

    // })

    // const [nid, setnid] = useState('')
    // const [email, setemail] = useState('')
    // const [position_id, setposition_id] = useState('')
    // const [nama_lengkap, setnama_lengkap] = useState('')
    // const [id_jabatan, setid_jabatan] = useState('')

    const [name, setname] = useState("");
    const [email, setemail] = useState("");
    const [email_verified_at, setemail_verified_at] = useState("");
    const [password, setpassword] = useState("");
    const [passwordConfirm, setpasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [id, setid] = useState('')
    const [user_login, setuser_login] = useState({})
    const [id_user_delegasi, setid_user_delegasi] = useState('')
    const [modalDelegasiJabatan, setmodalDelegasiJabatan] = useState(false)
    const [modalSelectJabatan, setmodalSelectJabatan] = useState(false)
    const [delegasiList, setDelegasiList] = useState([])
    const [delegasi_delete, setDelegasi_delete] = useState([])
    const [modalLoginAsJabatan, setmodalLoginAsJabatan] = useState(false)

    const [listreferensi, setlistreferensi] = useState([])
    const [filter, setfilter] = useState([])
    const [order, setorder] = useState([])

    const [sys_user, setsys_user] = useState([]);
    const [sys_user_item, setsys_user_item] = useState(null);
    const [datafilter, setdatafilter] = useState({
        paginate: {
            page: 1,
            pagesize: 20,
        },
    });
    const [btn_popup_loading, setbtn_popup_loading] = useState(false)
    const [dt_jabatan, setdt_jabatan] = useState([])
    const [delegasi, setdelegasi] = useState([])
    const [is_login_as, setis_login_as] = useState(false)
    const [is_sedang_login_as, setis_sedang_login_as] = useState(false)
    const [nama_group, setnama_group] = useState('')
    const [isDelegasiAktif, setisDelegasiAktif] = useState('')
    const [dataDelegasi, setdataDelegasi] = useState('')

    const [modalChooseGroup, setmodalChooseGroup] = useState(false)
    const [groups, setgroups] = useState([])
    const [groups_item, setgroups_item] = useState(null)
    const [is_login_role, setis_login_role] = useState(false)
    const [modalTwoFactor, setmodalTwoFactor] = useState(false)
    const [twoFactorData, settwoFactorData] = useState(null)
    const [otpCode, setOtpCode] = useState('')
    const [twoFactorErrors, setTwoFactorErrors] = useState({})
    const [btn_two_factor_loading, setbtn_two_factor_loading] = useState(false)
    const [btn_resend_loading, setbtn_resend_loading] = useState(false)
    const [btn_login_role_loading, setbtn_login_role_loading] = useState(false)
    const [loginLoadingText, setLoginLoadingText] = useState('Memverifikasi role dan menyiapkan OTP...')

    const initialized = useRef(false)

    useEffect(() => {
        //first load
        handleInitAccessMethod()
        restorePendingTwoFactor()

        // handlegetmt_sdm_pegawaiid()

        // handlegetid_jabatan()
        if (!initialized.current) {
            initialized.current = true
            handleInitMyAccount()
            initUserLogin()

            handlegetid_pegawai();
            handlegetmt_sdm_jabatan();
            handlegetmt_sdm_unit();
            handlegetmt_sdm_dit_bid();
            handlegetsys_group();
        }
    }, [pathname])

    useEffect(() => {
        handlegetsys_user();
    }, [filter, datafilter.paginate.pagesize, datafilter.paginate.page, order])

    const handleInitAccessMethod = async () => {
        console.log('handleInitAccessMethod')
        // const { access_method, path, id } = await initAccessMethod(
        //     page_url,
        //     props.params,
        // )

        let path = 'detail'
        const pathnamearr = pathname.split('/')
        // console.log(pathnamearr)
        for (let i = 0; i < pathnamearr.length; i++) {
            if (pathnamearr[i] == 'edit') {
                path = 'edit'
                break
            }
        }


        let btn_top = []

        if (path == 'detail') {

            btn_top.push({
                icon: 'edit',
                label: 'Edit',
                url: `/profile/edit`
            })
        } else {

            btn_top.push({
                icon: 'visibility',
                label: 'Detail',
                url: `/profile/detail`
            })
        }

        btn_top.push({
            icon: 'arrow_back',
            label: 'Kembali',
            url: '/dashboard'
        })
        setaccess_method({
            btn_top
        })

        // setaccess_method(access_method)
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

    const handleInitMyAccount = async () => {
        const user_loginObj = await getStorage('user_login')
        const user_login = JSON.parse(user_loginObj)

        setname(user_login.user.name)
        setemail(user_login.user.email)
        setid(user_login.user.id_user)

        setuser_login(user_login)

        handlegetmy_jabatan(user_login.user.id_user)

        const is_login_as = user_login?.accessmethod?.dashboard?.login_as || false
        setis_login_as(is_login_as)

        if (user_login.id_group_old && user_login.id_user_old) {
            setis_sedang_login_as(true)
        }
    }

    const initUserLogin = async () => {
        const userLoginObj = await getStorage("user_login")
        const user_login = JSON.parse(userLoginObj)

        console.log('initUserLogin=>user_login')
        console.log(user_login)

        setnama_group(user_login.nama_group ? user_login.nama_group : "")

        dispatch({
            type: VAR_SET_NAME,
            value: user_login.user.name,
        });

        const delegasiAccessmethod = user_login?.accessmethod?.dashboard?.delegasi

        const isDelegasiAktif = delegasiAccessmethod === true || delegasiAccessmethod === 'true' || delegasiAccessmethod === 1



        console.log('Delegasi aktif:', isDelegasiAktif)
        setisDelegasiAktif(isDelegasiAktif)

        // const dataDelegasi = user_login?.data_delegasi ?? []
        // setdataDelegasi(Array.isArray(dataDelegasi) ? dataDelegasi : [])

        const is_login_role = user_login?.groups || false
        let groups = []
        if (is_login_role) {
            groups = user_login.groups
        }
        setis_login_role(is_login_role)
        setgroups(groups)
    };


    const handleputsys_profile = async () => {
        // const body = {
        //     nid,
        //     email,
        //     // position_id,
        //     nama_lengkap,
        //     id_jabatan,
        // }
        // setbtn_loading(true)
        // const response = await postapi_services({ setErrors, ...body })
        // // console.log('postmt_sdm_pegawai')
        // // console.log(response)
        // setbtn_loading(false)

        // checkNotAuthorized(response)

        // if (response.error || response.code) return

        // router.push(`/${page_url}`)
    }

    const handlegetsys_userid = async (id) => {
        const { getapi_servicesid } = api_services({ api_path: '/sys_user' })
        if (!id) return;

        const response = await getapi_servicesid({ setErrors, id });
        if (response.code || response.error) return

        // if(response.delegasi && response.delegasi.length > 0) {
        //     setsys_user_item(response.delegasi[0])
        // }

        setdelegasi(response.delegasi ? response.delegasi : [])
    };

    const handleputsys_user = async () => {
        // console.log(typeof password)
        // const body = {
        //     name,
        //     email,
        // }



        let body = {
            name,
            email,
            id_user: id,
            id_user_delegasi
        };
        if (password && passwordConfirm !== password) {
            showToastr("error", "Confirm Password Salah!");
            return
        }
        if (password) {
            body = { ...body, password: password };
        }
        setbtn_loading(true);
        const response = await postapi_services({
            setErrors,
            ...body,
            // api_path: `/update_profile/${id}`
            api_path: `/update_profile`,
            disabledAlert: true
        });

        setbtn_loading(false);

        checkNotAuthorized(response);
        if (response.error || response.code) return;

        const new_user_login = {
            ...user_login,
            user: {
                ...user_login.user,
                name: response.name,
                email: response.email
            }
        }
        await saveStorage('user_login', JSON.stringify(new_user_login))

        dispatch({
            type: VAR_SET_NAME,
            value: response.name
        })

        router.push(`/${page_url}/detail`)
    };

    // const handleputmt_sdm_pegawai = async () => {
    //     const body = {
    //         nid,
    //         email,
    //         // position_id,
    //         nama_lengkap,
    //         id_jabatan,
    //     }

    //     setbtn_loading(true)
    //     const response = await putapi_services({ setErrors, ...body, id })
    //     // console.log('putmt_sdm_pegawai')
    //     // console.log(response)
    //     setbtn_loading(false)

    //     checkNotAuthorized(response)

    //     if (response.error || response.code) return

    //     router.push(`/${page_url}`)
    // }

    // const [dataid_jabatan, setdataid_jabatan] = useState([])

    // const handlegetid_jabatan = async () => {
    //     const response = await getapi_services({
    //         setErrors,
    //         api_path: '/mt_sdm_jabatan',
    //         filter: {
    //             paginate: {
    //                 page: 1,
    //                 pagesize: 10,
    //             },
    //         },
    //     })
    //     // console.log('getmt_sdm_jabatan')
    //     // console.log(response)

    //     checkNotAuthorized(response)
    //     if (response.error || response.code) return
    //     let dataarr = []
    //     response.data.map(m => {
    //         dataarr.push({
    //             label: m.nama,
    //             value: m.id_jabatan,
    //         })
    //     })
    //     setdataid_jabatan(dataarr)
    // }

    const handlegetsys_user = async () => {
        const { getapi_services } = api_services({ api_path: `/sys_user` })
        setis_loading(true);

        var filterarr = {};
        headers.map((v, k) => {
            if (filter[v.name]) {
                if (v.type == "list") {
                    filterarr[v.name] = filter[v.name];
                } else {
                    filterarr[v.name] = "%" + filter[v.name] + "%";
                }
            }
        });

        const fltr = {
            ...datafilter,
            filter: filterarr,
            order: order,
        }

        // fltr.filter.id_user_delegasi = false

        const response = await getapi_services({
            setErrors,
            filter: fltr,
        });
        // console.log('getsys_user')
        // console.log(response)
        if (!response.error || response.error.message != "canceled")
            setis_loading(false);

        checkNotAuthorized(response);
        if (response.error || response.code) return;
        setsys_user(Array.isArray(response.data) ? response.data : []);
        setdatafilter({
            ...datafilter,
            paginate: {
                ...datafilter.paginate,
                total_records: response.total_records,
            },
        });
    };

    const handlegetid_pegawai = async () => {
        const response = await getapi_services({
            setErrors,
            api_path: "/mt_sdm_pegawai",
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        });
        // console.log('getmt_sdm_pegawai')
        // console.log(response)

        checkNotAuthorized(response);
        if (response.error || response.code) return;
        let dataarr = [];
        ;(Array.isArray(response.data) ? response.data : []).map((m) => {
            dataarr[m.id_pegawai] = m.nama;
        });
        setlistreferensi((listreferensi) => ({
            ...listreferensi,
            id_pegawai: dataarr,
        }));
    };

    const handlegetmt_sdm_jabatan = async (inputValue, callback) => {
        // console.log('handlegetmt_sdm_jabatan');
        // console.log(inputValue);
        // console.log(callback);

        const datafilter = {
            paginate: {
                page: 1,
                pagesize: 20,
            },
        }
        if (inputValue && callback) {
            datafilter.paginate.pagesize = 20
            datafilter.filter = {
                nama: inputValue
            }
        }
        const response = await getapi_services({
            setErrors,
            api_path: "/mt_sdm_jabatan",
            filter: datafilter
        });
        // console.log('mt_sdm_jabatan')
        // console.log(response)

        checkNotAuthorized(response);
        if (response.error || response.code) return;

        let namearr = {};
        let dataarr = [];
        ;(Array.isArray(response.data) ? response.data : []).map((m) => {
            namearr[m.id_jabatan] = m.nama;
            dataarr.push({ label: m.nama, value: m.id_jabatan })
        });

        if (inputValue && callback) {
            return callback(dataarr)
        }

        setlistreferensi((listreferensi) => ({
            ...listreferensi,
            id_jabatan: namearr,
        }));
    };

    const handlegetmt_sdm_unit = async () => {
        const response = await getapi_services({
            setErrors,
            api_path: "/mt_sdm_unit",
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        });
        // console.log('mt_sdm_jabatan')
        // console.log(response)

        checkNotAuthorized(response);
        if (response.error || response.code) return;
        let dataarr = [];
        ;(Array.isArray(response.data) ? response.data : []).map((m) => {
            dataarr[m.id_unit] = m.nama;
        });
        setlistreferensi((listreferensi) => ({
            ...listreferensi,
            id_unit: dataarr,
        }));
    };

    const handlegetmt_sdm_dit_bid = async () => {
        const response = await getapi_services({
            setErrors,
            api_path: "/mt_sdm_dit_bid",
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        });
        // console.log('mt_sdm_jabatan')
        // console.log(response)

        checkNotAuthorized(response);
        if (response.error) return;

        let dataarr = {};
        ;(Array.isArray(response.data) ? response.data : []).map((m) => {
            dataarr[m.code] = m.nama;
        });
        setlistreferensi((listreferensi) => ({
            ...listreferensi,
            id_dit_bid: dataarr,
        }));
    };

    const handlegetsys_group = async () => {
        const response = await getapi_services({
            setErrors,
            api_path: "/sys_group",
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        });
        // console.log('mt_sdm_jabatan')
        // console.log(response)

        checkNotAuthorized(response);
        if (response.error || response.code) return;
        let dataarr = [];
        response.data.map((m) => {
            dataarr[m.id_group] = m.nama;
        });
        setlistreferensi((listreferensi) => ({
            ...listreferensi,
            id_group: dataarr,
        }));
    };

    const handlegetmy_jabatan = async (id) => {
        const response = await getapi_services({
            setErrors,
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 1000,
                },
                filter: {
                    id_user: id,
                },
            },
            api_path: "/sys_user_group",
        });
        if (response.code || response.error) return

        setdt_jabatan(Array.isArray(response.data) ? response.data : [])
    }

    const handlepost_delegasi_jabatan = async () => {
        setbtn_popup_loading(true);
        let response;
        for (let m of delegasi) {
            if (m.hasOwnProperty('id_user_delegasi') && m.id_user_delegasi) {
                const body = {
                    id_user_parent: user_login.user.id_user,
                    id_user: m.id_user,
                };
                response = await putapi_services({
                    disabledAlert: true,
                    ...body,
                    api_path: `/sys_user_delegasi`,
                    id: m.id_user_delegasi
                });
            } else {
                const body = {
                    id_user_parent: user_login.user.id_user,
                    id_user: m.id_user,
                };
                response = await postapi_services({
                    disabledAlert: true,
                    setErrors,
                    ...body,
                    api_path: `/sys_user_delegasi`
                });
            }
        }

        if (delegasi_delete.length > 0) {
            for (let item of delegasi_delete) {
                if (item.id_user_delegasi) {
                    await deleteapi_services({
                        disabledAlert: true,
                        api_path: `/sys_user_delegasi`,
                        id: item.id_user_delegasi
                    })
                }

            }
        }
        setbtn_popup_loading(false);
        // if (response.code || response.error) return

        showToastr('success', 'Data berhasil disimpan!')
        setmodalDelegasiJabatan(false);
        setsys_user_item(null);
    }

    const handlelogin_as = async (item) => {
        const body = {
            id_group: item.id_group,
            id_user: item.id_user,
            id_jabatan: item?.id_jabatan || ''
        }
        // console.log('body');
        // console.log(body);

        // return

        $('.layout-app').addClass('is-loading-global')
        await clearStorage()

        const response = await login_as({
            ...body,
        });
        if (response.code || response.error) return

    }

    const handleLoadOptions = (inputValue, callback, name_column) => {
        if (name_column == 'id_jabatan') {
            handlegetmt_sdm_jabatan(inputValue, callback)
        }

    }

    const login_on_group = async () => {
        if (!groups_item?.id_group) return

        setLoginLoadingText('Memverifikasi role dan menyiapkan OTP...')
        setbtn_login_role_loading(true)
        setbtn_popup_loading(true)
        choose_group({
            id_group: groups_item.id_group,
            id_user_delegasi: groups_item.id_user_delegasi,
            id_user: groups_item.id_user,
            id_jabatan: groups_item?.id_jabatan || '',
            setErrors: setTwoFactorErrors,
            onRequireTwoFactor: handleRequireTwoFactor
        })
    }

    const handleRequireTwoFactor = data => {
        setbtn_login_role_loading(false)
        setbtn_popup_loading(false)
        setOtpCode('')
        setTwoFactorErrors({})
        saveStorage('pending_2fa', JSON.stringify(data))
        settwoFactorData(data)
        setmodalChooseGroup(false)
        setmodalTwoFactor(true)
        showToastr('success', `OTP sedang dikirim ke ${data.masked_destination || 'email Anda'}.`)
    }

    const restorePendingTwoFactor = async () => {
        const pendingTwoFactor = await getStorage('pending_2fa')
        if (!pendingTwoFactor) return

        try {
            const parsed = JSON.parse(pendingTwoFactor)
            if (parsed?.challenge_id) {
                settwoFactorData(parsed)
                setmodalTwoFactor(true)
            }
        } catch (error) {
            localStorage.removeItem('pending_2fa')
        }
    }

    const verifyOtp = async event => {
        event?.preventDefault()
        if (!twoFactorData?.challenge_id) return

        setbtn_two_factor_loading(true)
        verify_two_factor({
            challenge_id: twoFactorData.challenge_id,
            otp_code: otpCode,
            setErrors: setTwoFactorErrors,
        })
    }

    const resendOtp = async () => {
        if (!twoFactorData?.challenge_id) return

        setbtn_resend_loading(true)
        resend_two_factor({
            challenge_id: twoFactorData.challenge_id,
            setErrors: setTwoFactorErrors,
            onRequireTwoFactor: handleRequireTwoFactor
        })
    }

    useEffect(() => {
        const hasErrors = Array.isArray(twoFactorErrors)
            ? twoFactorErrors.length > 0
            : Object.keys(twoFactorErrors || {}).length > 0

        if (!hasErrors) return

        setbtn_login_role_loading(false)
        setbtn_popup_loading(false)
        setbtn_two_factor_loading(false)
    }, [twoFactorErrors])

    useEffect(() => {
        setbtn_resend_loading(false)
    }, [twoFactorData])

    const profileInitials = String(name || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase()

    const roleLabel = nama_group || user_login?.nama_group || 'Belum ada role'
    const jabatanNames = [...new Set((dt_jabatan || [])
        .map(item => item.nama_jabatan || item.nama || item.jabatan)
        .filter(Boolean))]
    const jabatanLabel = jabatanNames.length > 0 ? jabatanNames.join(', ') : 'Belum ada jabatan'
    const accessSummary = [
        { icon: 'verified_user', label: 'Role Aktif', value: roleLabel },
        { icon: 'badge', label: 'Jabatan', value: jabatanLabel },
        { icon: 'mail', label: 'Email', value: email || '-' },
    ]

    return (
        <>
            <HeaderApp
                title={`${path === 'add'
                    ? 'Tambah'
                    : path === 'edit'
                        ? 'Edit'
                        : ''
                    } ${titlePage}`}
                is_loading={is_loading}
                data_btn={
                    Object.keys(access_method).length > 0
                        ? access_method.btn_top
                        : []
                }
            />
            <div className="container pl-4 pr-4">
                {is_sedang_login_as ? (
                    <div
                        className="alert mt-3 d-flex justify-content-between align-items-center"
                        role="alert"
                        style={{ border: '1px solid #facc15', background: '#fffbeb', borderRadius: 8 }}
                    >
                        <div>
                            <div className="font-weight-bold" style={{ color: '#92400e' }}>Mode Login As Aktif</div>
                            <div style={{ color: '#78350f' }}>Anda sedang masuk sebagai {user_login?.nama_group || 'role lain'}.</div>
                        </div>
                        <BtnIconAct
                            icon={'keyboard_return'}
                            label={'Kembali'}
                            onTap={() => {
                                handlelogin_as({ id_user: user_login?.id_user_old || '', id_group: user_login?.id_group_old || '' })
                            }}
                            className="bg-warning"
                        />
                    </div>
                ) : null}

                <div className="row mt-3">
                    <div className="col-lg-4 mb-3">
                        <div
                            className="card h-100"
                            style={{
                                borderRadius: 8,
                                border: '1px solid #dbe4ea',
                                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ height: 10, background: '#168c9b' }} />
                            <div className="p-4">
                                <div className="d-flex align-items-center">
                                    <div
                                        className="d-flex align-items-center justify-content-center text-white font-weight-bold"
                                        style={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: 8,
                                            background: '#168c9b',
                                            fontSize: 28,
                                            letterSpacing: 0,
                                        }}
                                    >
                                        {profileInitials}
                                    </div>
                                    <div className="ml-3" style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                                            {name || '-'}
                                        </div>
                                        <div style={{ color: '#64748b', wordBreak: 'break-word' }}>{email || '-'}</div>
                                        <span
                                            className="badge mt-2"
                                            style={{ background: '#e6f6f8', color: '#126b77', border: '1px solid #bde7ec' }}
                                        >
                                            {roleLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {accessSummary.map((item) => (
                                        <div
                                            key={item.label}
                                            className="d-flex align-items-start mb-3 p-3"
                                            style={{ border: '1px solid #e5edf2', borderRadius: 8, background: '#f8fafc' }}
                                        >
                                            <span className="material-icons mr-3" style={{ fontSize: 20, color: '#168c9b' }}>
                                                {item.icon}
                                            </span>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 12, color: '#64748b' }}>{item.label}</div>
                                                <div style={{ fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="d-flex flex-wrap mt-4" style={{ gap: 8 }}>
                                    {is_login_role ? (
                                        <Button
                                            disabled={false}
                                            className={`btn-default-app bg-success`}
                                            onClick={() => {
                                                setmodalChooseGroup(true)
                                            }}
                                        >
                                            <span className="material-icons icon-btn-left mr-1">switch_account</span>
                                            Login Role
                                        </Button>
                                    ) : null}

                                    {is_login_as ? (
                                        <Button
                                            disabled={false}
                                            className={`btn-default-app bg-danger`}
                                            onClick={() => {
                                                setmodalLoginAsJabatan(true)
                                            }}
                                        >
                                            <span className="material-icons icon-btn-left mr-1">login</span>
                                            Login As
                                        </Button>
                                    ) : null}

                                    {isDelegasiAktif == true && (
                                        <Button
                                            disabled={false}
                                            className={`btn-default-app`}
                                            onClick={() => {
                                                setmodalDelegasiJabatan(true)
                                                handlegetsys_userid(user_login.user.id_user)
                                            }}
                                        >
                                            <span className="material-icons icon-btn-left mr-1">share</span>
                                            Delegasi
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-8 mb-3">
                        <div
                            className="card h-100"
                            style={{
                                borderRadius: 8,
                                border: '1px solid #dbe4ea',
                                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                            }}
                        >
                            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Informasi Akun</div>
                                    <div style={{ color: '#64748b' }}>{path === 'edit' ? 'Perbarui identitas dan password akun.' : 'Ringkasan identitas pengguna aktif.'}</div>
                                </div>
                                <span className="material-icons" style={{ color: '#168c9b' }}>
                                    {path === 'edit' ? 'manage_accounts' : 'account_circle'}
                                </span>
                            </div>

                            <div className="p-4">
                                {path === 'detail' ? (
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Nama</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{name || '-'}</div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Email</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>{email || '-'}</div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Role</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{roleLabel}</div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Jabatan Pegawai</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{jabatanLabel}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <FormGroup
                                                    label={"Nama"}
                                                    required={rules.name.required}
                                                    message_error={errors.name}
                                                    disabled={is_disabled}
                                                >
                                                    <div className="col">
                                                        <Input
                                                            ref={null}
                                                            id="name"
                                                            type="textarea"
                                                            label={rules.name.label}
                                                            placeholder={rules.name.label}
                                                            value={name}
                                                            className="block mt-1 w-full"
                                                            onChange={(value) => setname(value)}
                                                            required={rules.name.required}
                                                            autoFocus
                                                            message_error={errors.name}
                                                            onError={handleErrors}
                                                            disabled={is_disabled}
                                                        />
                                                    </div>
                                                </FormGroup>
                                            </div>
                                            <div className="col-md-6">
                                                <FormGroup
                                                    label={"Email"}
                                                    required={rules.email.required}
                                                    message_error={errors.email}
                                                    disabled={is_disabled}
                                                >
                                                    <div className="col">
                                                        <Input
                                                            ref={null}
                                                            id="email"
                                                            type="email"
                                                            label={rules.email.label}
                                                            placeholder={rules.email.label}
                                                            value={email}
                                                            className="block mt-1 w-full"
                                                            onChange={(value) => setemail(value)}
                                                            required={rules.email.required}
                                                            autoFocus
                                                            message_error={errors.email}
                                                            onError={handleErrors}
                                                            disabled={is_disabled}
                                                        />
                                                    </div>
                                                </FormGroup>
                                            </div>
                                        </div>

                                        <div className="mt-3 p-3" style={{ background: '#f8fafc', border: '1px solid #e5edf2', borderRadius: 8 }}>
                                            <div className="d-flex align-items-center mb-3">
                                                <span className="material-icons mr-2" style={{ color: '#168c9b', fontSize: 20 }}>lock</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Password</div>
                                                    <div style={{ color: '#64748b', fontSize: 13 }}>Kosongkan jika tidak ingin mengubah password.</div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <FormGroup
                                                        label={"Password"}
                                                        required={false}
                                                        message_error={errors.password}
                                                        disabled={is_disabled}
                                                    >
                                                    <div className="col password-field-wrap">
                                                        <Input
                                                            ref={null}
                                                            id="password"
                                                            type="text"
                                                            style={showPassword ? undefined : { WebkitTextSecurity: 'disc' }}
                                                                label={rules.password.label}
                                                                placeholder={rules.password.label}
                                                                value={is_disabled ? '' : password}
                                                                className="block mt-1 w-full"
                                                                onChange={(value) => setpassword(value)}
                                                                required={false}
                                                                autoFocus
                                                                message_error={errors.password}
                                                                onError={handleErrors}
                                                            disabled={is_disabled}
                                                        />
                                                        <button type="button" className="password-visibility-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}>
                                                            <span className="material-icons">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                                        </button>
                                                    </div>
                                                    </FormGroup>
                                                </div>
                                                <div className="col-md-6">
                                                    <FormGroup
                                                        label={"Confirm Password"}
                                                        required={false}
                                                        message_error={errors.passwordConfirm}
                                                        disabled={is_disabled}
                                                    >
                                                    <div className="col password-field-wrap">
                                                        <Input
                                                            ref={null}
                                                            id="passwordConfirm"
                                                            type="text"
                                                            style={showPasswordConfirm ? undefined : { WebkitTextSecurity: 'disc' }}
                                                                label={rules.passwordConfirm.label}
                                                                placeholder={rules.passwordConfirm.label}
                                                                value={is_disabled ? '' : passwordConfirm}
                                                                className="block mt-1 w-full"
                                                                onChange={(value) => setpasswordConfirm(value)}
                                                                required={false}
                                                                autoFocus
                                                                message_error={errors.passwordConfirm}
                                                                onError={handleErrors}
                                                            disabled={is_disabled}
                                                        />
                                                        <button type="button" className="password-visibility-toggle" onClick={() => setShowPasswordConfirm(value => !value)} aria-label={showPasswordConfirm ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}>
                                                            <span className="material-icons">{showPasswordConfirm ? 'visibility_off' : 'visibility'}</span>
                                                        </button>
                                                    </div>
                                                    </FormGroup>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {path !== 'detail' ? (
                                <div className="p-4 border-top d-flex justify-content-end">
                                    <Button
                                        className="btn-default-app"
                                        disabled={btn_loading}
                                        onClick={
                                            handleputsys_user
                                        }>
                                        {btn_loading ? (
                                            'Loading...'
                                        ) : (
                                            <>
                                                <span className="material-icons icon-btn-left mr-1">
                                                    save
                                                </span>
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <ModalDelegasiJabatan
                btn_popup_loading={btn_popup_loading}
                show={modalDelegasiJabatan}
                onHide={() => setmodalDelegasiJabatan(false)}
                setmodalSelectJabatan={() => {
                    setmodalSelectJabatan(true)
                }}
                sys_user_item={sys_user_item}
                setsys_user_item={setsys_user_item}
                setDelegasi_delete={setDelegasi_delete}
                delegasi_delete={delegasi_delete}
                delegasi={delegasi}
                onAdd={handlepost_delegasi_jabatan}
                onDelete={(m) => {
                    delegasi_delete.push(m)
                    setDelegasi_delete(delegasi_delete)
                    let delegasiNew = []
                    for (let x of delegasi) {
                        if (x.id_user == m.id_user) continue
                        delegasiNew.push(x)
                    }
                    setdelegasi(delegasiNew)
                }}
                onEdit={(m) => {
                    delegasi_delete.push(m)
                    setDelegasi_delete(delegasi_delete)
                    let delegasiNew = []
                    for (let x of delegasi) {
                        if (x.id_user == m.id_user) continue
                        delegasiNew.push(x)
                    }
                    setdelegasi(delegasiNew)
                }}
            />
            <ModalSelectJabatan
                show={modalSelectJabatan}
                onHide={() => setmodalSelectJabatan(false)}
                filter={filter}
                order={order}
                setfilter={setfilter}
                setorder={setorder}
                listreferensi={listreferensi}
                setsys_user_item={setsys_user_item}
                sys_user_item={sys_user_item}
                sys_user={sys_user}
                datafilter={datafilter}
                setdatafilter={page => {
                    setdatafilter({
                        ...datafilter,
                        paginate: {
                            ...datafilter.paginate,
                            page: page.selected + 1,
                        },
                    });
                }}
                onPilih={item => {
                    setmodalSelectJabatan(false);
                    setsys_user_item(item)
                    setdelegasi(prev => [...prev, item]);
                }}
                handleLoadOptions={handleLoadOptions}
            />

            <ModalLoginAsJabatan
                show={modalLoginAsJabatan}
                onHide={() => setmodalLoginAsJabatan(false)}
                filter={filter}
                order={order}
                setfilter={setfilter}
                setorder={setorder}
                listreferensi={listreferensi}
                setsys_user_item={setsys_user_item}
                sys_user_item={sys_user_item}
                sys_user={sys_user}
                datafilter={datafilter}
                setdatafilter={page => {
                    setdatafilter({
                        ...datafilter,
                        paginate: {
                            ...datafilter.paginate,
                            page: page.selected + 1,
                        },
                    });
                }}
                onPilih={item => {
                    setmodalLoginAsJabatan(false)
                    handlelogin_as(item)
                }}
                handleLoadOptions={handleLoadOptions}
            />

            <ModalChooseGroup
                show={modalChooseGroup}
                onHide={() => {
                    setmodalChooseGroup(false)
                    // logout()
                }}
                btn_popup_loading={btn_popup_loading}
                groups={groups}
                groups_item={groups_item}
                setgroups_item={setgroups_item}
                onlogin_on_group={login_on_group}
            />

            <ModalTwoFactor
                show={modalTwoFactor}
                canClose={false}
                onHide={() => null}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                twoFactorData={twoFactorData}
                errors={twoFactorErrors}
                btn_loading={btn_two_factor_loading}
                btn_resend_loading={btn_resend_loading}
                onVerify={verifyOtp}
                onResend={resendOtp}
            />

            <ModalLoginLoading
                show={btn_login_role_loading}
                text={loginLoadingText}
            />
        </>
    )
}

export default Profileedit

const ModalDelegasiJabatan = props => {
    return (
        <Modal
            show={props.show}
            className=""
            onShow={() => {

            }}
            onHide={props.onHide}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    Delegasi Jabatan
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-12">

                        {/* {props.delegasi.map((m, i) => (
                            <div
                                key={i}
                                className={`items-groups d-flex align-items-center`}
                            >
                                <div className="flex-1">
                                    <div className='title'>
                                        {m.nama}
                                    </div>
                                    <div className='subtitle color-grey'>
                                        {m.nid} {m.name}
                                    </div>
                                </div>
                                <BtnIcon
                                    icon={props.sys_user_item ? 'edit' : 'add'}
                                    onTap={() => props.setmodalSelectJabatan()}
                                    tooltips={props.sys_user_item ? "Edit user..." : "Tambah user..."}
                                />
                                <BtnIcon
                                    icon={'delete'}
                                    onTap={() => props.setmodalSelectJabatan()}
                                    tooltips="Delete user..."
                                />
                            </div>

                        ))} */}
                        {props.delegasi.map((m, i) => (
                            <div key={i} className="items-groups d-flex align-items-center">
                                <div className="flex-1">
                                    <div className='title'>{m.nama}</div>
                                    <div className='subtitle color-grey'>{m.nid} {m.name}</div>
                                </div>
                                <BtnIcon
                                    icon="edit"
                                    onTap={() => {
                                        props.onEdit(m)
                                        props.setsys_user_item(m)
                                        props.setmodalSelectJabatan(true)
                                    }}
                                    tooltips="Edit user..."
                                />
                                <BtnIcon
                                    icon={'delete'}
                                    onTap={() => props.onDelete(m)}
                                    tooltips="Delete user..."
                                />
                            </div>
                        ))}

                        <div
                            className={`items-groups d-flex justify-content-center align-items-center`}
                        >
                            <BtnIcon
                                icon={'add'}
                                onTap={() => {
                                    props.setsys_user_item(null)
                                    props.setmodalSelectJabatan(true)
                                }}
                                tooltips={"Tambah user..."}
                                size={40}
                            />
                        </div>

                        <div className="d-flex justify-content-end">


                            <Button
                                className="btn-default-app"
                                disabled={props.btn_popup_loading}
                                onClick={() => {
                                    props.onAdd()
                                }}
                            >
                                {props.btn_popup_loading ? (
                                    "Loading..."
                                ) : (
                                    <>
                                        <span className="material-icons icon-btn-left mr-1">
                                            save
                                        </span>
                                        Save
                                    </>
                                )}
                            </Button>


                        </div>
                    </div>
                </div>
            </Modal.Body>

        </Modal>
    )
}

const ModalSelectJabatan = props => {
    return (
        <Modal
            show={props.show}
            className=""
            onShow={() => {

            }}
            onHide={props.onHide}
            size="md"
            fullscreen
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    Pilih Jabatan
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-12">
                        <table className="w-full table table-auto border-collapse border">
                            <thead>
                                <TableHead
                                    data={headers}
                                    access_role={[]}
                                    referensi={props.listreferensi}
                                    onChange={(key, value) => {
                                        props.setfilter({
                                            ...props.filter,
                                            [key]: value,
                                        });
                                    }}
                                    setOrder={(v) => {
                                        props.setOrder(v);
                                    }}
                                    filter={props.filter}
                                    loadOptions={props.handleLoadOptions}
                                />
                            </thead>
                            <tbody>
                                {(Array.isArray(props.sys_user) ? props.sys_user : []).map((m, i) => (
                                    <tr key={i}>
                                        <td className="border text-center">
                                            {(parseInt(props.datafilter.paginate.page) - 1) *
                                                parseInt(props.datafilter.paginate.pagesize) +
                                                i +
                                                1}
                                        </td>

                                        {headers.map((x, k) => (
                                            <td key={k} className="border">
                                                {/* {x.type == "list"
                                                    ? props.listreferensi[x.name]
                                                        ? props.listreferensi[x.name][m[x.name]]
                                                        : null
                                                    : m[x.name]} */}

                                                {x.type == "list" ? (
                                                    <>
                                                        {x.name == 'id_jabatan' ? (
                                                            <>
                                                                {m.nama_jabatan}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {props.listreferensi[x.name]
                                                                    ? props.listreferensi[x.name][m[x.name]]
                                                                    : null}
                                                            </>
                                                        )}
                                                    </>
                                                ) : m[x.name]}
                                            </td>
                                        ))}

                                        <td className="border">
                                            <div className="flex align-center justify-end td-action">
                                                <BtnIconAct
                                                    icon="done"
                                                    label="Pilih"
                                                    // onTap={() => props.onPilih(m)}
                                                    onTap={() => {
                                                        console.log("DATA M:", m);
                                                        props.onPilih(m);
                                                    }}
                                                    className="bg-primary"
                                                />
                                            </div>

                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination
                            paginate={props.datafilter.paginate}
                            onPageClick={(page) => {
                                props.setdatafilter(page)

                            }}
                        />

                    </div>
                </div>
            </Modal.Body>

        </Modal>
    )
}

const ModalLoginAsJabatan = props => {
    return (
        <Modal
            show={props.show}
            className=""
            onShow={() => {

            }}
            onHide={props.onHide}
            size="md"
            fullscreen
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    Login As
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-12">
                        <table className="w-full table table-auto border-collapse border">
                            <thead>
                                <TableHead
                                    data={headers}
                                    access_role={[]}
                                    referensi={props.listreferensi}
                                    onChange={(key, value) => {
                                        props.setfilter({
                                            ...props.filter,
                                            [key]: value,
                                        });
                                    }}
                                    setOrder={(v) => {
                                        props.setOrder(v);
                                    }}
                                    filter={props.filter}
                                    loadOptions={props.handleLoadOptions}
                                />
                            </thead>
                            <tbody>
                                {(Array.isArray(props.sys_user) ? props.sys_user : []).map((m, i) => (
                                    <tr key={i}>
                                        <td className="border text-center">
                                            {(parseInt(props.datafilter.paginate.page) - 1) *
                                                parseInt(props.datafilter.paginate.pagesize) +
                                                i +
                                                1}
                                        </td>

                                        {headers.map((x, k) => (
                                            <td key={k} className="border">
                                                {x.type == "list" ? (
                                                    <>
                                                        {x.name == 'id_jabatan' ? (
                                                            <>
                                                                {m.nama_jabatan}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {props.listreferensi[x.name]
                                                                    ? props.listreferensi[x.name][m[x.name]]
                                                                    : null}
                                                            </>
                                                        )}
                                                    </>
                                                ) : m[x.name]}
                                            </td>
                                        ))}

                                        <td className="border">
                                            <div className="flex align-center justify-end td-action">
                                                <BtnIconAct
                                                    icon="login"
                                                    label="Login"
                                                    // onTap={() => props.onPilih(m)}
                                                    onTap={() => {
                                                        // console.log("DATA M:", m);
                                                        props.onPilih(m);
                                                    }}
                                                    className="bg-primary"
                                                />
                                            </div>

                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination
                            paginate={props.datafilter.paginate}
                            onPageClick={(page) => {
                                props.setdatafilter(page)

                            }}
                        />

                    </div>
                </div>
            </Modal.Body>

        </Modal>
    )
}
