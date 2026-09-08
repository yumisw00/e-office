

import Button from 'components/Button'
import Input from 'components/Input'
import InputError from 'components/InputError'
import Label from 'components/Label'
import Link from 'components/Link'
import { useAuth } from 'hooks/auth'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'components/Navigation'
import AuthSessionStatus from 'pages/(auth)/AuthSessionStatus'
import { getStorage, is_apply_login_with_sso, saveStorage, showToastr } from 'pages/Utils'
import { Modal } from 'react-bootstrap'
import BtnIcon from 'components/BtnIcon'
import { api_services } from 'hooks/api_services'
import { useLocation } from 'react-router-dom'
import axios from 'lib/axios'
import $ from 'jquery'

const Login = (props) => {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    const router = useRouter()

    const [email, setemail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [shouldRemember, setShouldRemember] = useState(false)
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [btn_loading, setbtn_loading] = useState(false)
    const [modalChooseGroup, setmodalChooseGroup] = useState(false)
    const [btn_popup_loading, setbtn_popup_loading] = useState(false)
    const [groups, setgroups] = useState([])
    const [groups_item, setgroups_item] = useState(null)
    const [modalTwoFactor, setmodalTwoFactor] = useState(false)
    const [twoFactorData, settwoFactorData] = useState(null)
    const [otpCode, setOtpCode] = useState('')
    const [twoFactorErrors, setTwoFactorErrors] = useState({})
    const [btn_two_factor_loading, setbtn_two_factor_loading] = useState(false)
    const [btn_resend_loading, setbtn_resend_loading] = useState(false)
    const [loginLoadingText, setLoginLoadingText] = useState('Memverifikasi akun dan menyiapkan OTP...')
    const [captcha, setCaptcha] = useState({ token: '', verified: false, loading: false })

    const [is_authenticate_error, setis_authenticate_error] = useState(false)
    const [messages_error_sso, setmessages_error_sso] = useState('')

    const handleshow_groups = async () => {
        const user_loginObj = await getStorage('user_login')
        const user_login = JSON.parse(user_loginObj)

        setbtn_loading(false)
        setbtn_popup_loading(false)
        setgroups(user_login.groups)
        setmodalChooseGroup(true)
    }

    const handleRequireTwoFactor = data => {
        $('.layout-app').removeClass('is-loading-global')
        setbtn_loading(false)
        setbtn_popup_loading(false)
        setOtpCode('')
        setTwoFactorErrors({})
        saveStorage('pending_2fa', JSON.stringify(data))
        settwoFactorData(data)
        setmodalChooseGroup(false)
        setmodalTwoFactor(true)
        showToastr('success', `OTP sedang dikirim ke ${data.masked_destination || 'email Anda'}.`)
    }

    const { login, logout, choose_group, check_sso, verify_two_factor, resend_two_factor } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    })



    const initialized = useRef(false)

    useEffect(() => {
        if (router.reset?.length > 0 && errors.length === 0) {
            setStatus(atob(router.reset))
        } else {
            setStatus(null)
        }

    }, [])



    useEffect(() => {
        const hasErrors = Array.isArray(errors)
            ? errors.length > 0
            : Object.keys(errors || {}).length > 0

        if (!hasErrors) return

        setbtn_loading(false)
        setbtn_popup_loading(false)
        setCaptcha({ token: '', verified: false, loading: false })
    }, [errors])

    useEffect(() => {
        if (!initialized.current) {
            restorePendingTwoFactor()
            checkIsLoggedIn()
            checkAuthenticate()
            initialized.current = true
        }
    }, [])

    const loadCaptcha = async () => {
        if (captcha.loading || captcha.verified || btn_loading) return

        setCaptcha({ token: '', verified: false, loading: true })

        try {
            const response = await axios.get('/login-captcha')
            const captchaToken = response.data?.data?.captcha_token || response.data?.captcha_token || response.data?.token || ''

            if (!captchaToken) {
                setCaptcha({ token: '', verified: false, loading: false })
                showToastr('error', 'Captcha gagal dimuat. Silakan klik ulang.')
                return
            }

            setCaptcha({
                token: captchaToken,
                verified: true,
                loading: false,
            })
        } catch (error) {
            setCaptcha({ token: '', verified: false, loading: false })
            showToastr('error', 'Captcha gagal dimuat. Silakan klik ulang.')
        }
    }

    const checkIsLoggedIn = async () => {
        const isLoggedIn = await getStorage('isLoggedIn')
        if (isLoggedIn) {
            window.location.pathname = '/'
        }
    }

    const restorePendingTwoFactor = async () => {
        const pendingTwoFactor = await getStorage('pending_2fa')
        if (!pendingTwoFactor) return

        // Normal login no longer uses OTP, so clear stale pending 2FA state.
        if (!props.is_page_authenticate) {
            localStorage.removeItem('pending_2fa')
            return
        }

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


    const submitForm = async event => {
        event.preventDefault()

        if (!captcha.verified || !captcha.token) {
            setErrors({
                captcha_answer: ['Centang captcha terlebih dahulu.'],
            })
            showToastr('error', 'Centang captcha terlebih dahulu sebelum login.')
            return
        }

        // logout()
        // return
        setLoginLoadingText('Memverifikasi akun dan menyiapkan OTP...')
        setbtn_loading(true)
        login({
            email,
            password,
            remember: shouldRemember,
            captcha_token: captcha.token,
            captcha_answer: captcha.verified ? 'checked' : '',
            setErrors,
            setStatus,
            onshow_groups: handleshow_groups,
            onRequireTwoFactor: handleRequireTwoFactor
        })
    }

    const login_on_group = async () => {
        setbtn_popup_loading(true)
        choose_group({
            id_group: groups_item.id_group,
            id_user_delegasi: groups_item.id_user_delegasi,
            id_user: groups_item.id_user,
            id_jabatan: groups_item?.id_jabatan || '',
            remember: shouldRemember,
            setErrors,
            setStatus,
            onRequireTwoFactor: handleRequireTwoFactor
        })
    }

    const login_on_sso = () => {
        const url = import.meta.env.VITE_IDENTIFIER_ID
        return (
            <a
                className="container-login-sso-btn"
                disabled={btn_loading}
                href={url}
            >
                {btn_loading ? 'Loading...' : 'Login with SSO'}
            </a>
        )
    }

    const checkAuthenticate = async () => {
        if (!props.is_page_authenticate) return

        if (!token) {
            const msg = 'Token tidak ditemukan!'
            setis_authenticate_error(true)
            setmessages_error_sso(msg)
            return showToastr('error', msg)

        }

        $('.layout-app').addClass('is-loading-global')

        check_sso({
            setErrors,
            setStatus,
            token,
            onshow_groups: handleshow_groups,
            onRequireTwoFactor: handleRequireTwoFactor,
            onError: handleErrorSSO
        })

    }

    const handleErrorSSO = (error) => {
        // console.log('handleErrorSSO');
        // console.log(error);

        setis_authenticate_error(true)
        $('.layout-app').removeClass('is-loading-global')
        if (error.response.data && error.response.data.messages && error.response.data.messages.errors) {
            const msg = error.response.data.messages.errors
            setmessages_error_sso(msg)
            return showToastr('error', msg)
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
            setStatus,
            onshow_groups: handleshow_groups,
        })
    }

    const resendOtp = async () => {
        if (!twoFactorData?.challenge_id) return

        setbtn_resend_loading(true)
        resend_two_factor({
            challenge_id: twoFactorData.challenge_id,
            setErrors: setTwoFactorErrors,
            setStatus,
            onRequireTwoFactor: handleRequireTwoFactor
        })
    }

    useEffect(() => {
        setbtn_two_factor_loading(false)
    }, [twoFactorErrors])

    useEffect(() => {
        setbtn_resend_loading(false)
    }, [twoFactorData])

    return (
        <>
            {!is_apply_login_with_sso ? (
                <>
                    <AuthSessionStatus className="mb-4" status={status} />
                    <form onSubmit={submitForm}>
                        <div className="container-form-login">
                            <Label htmlFor="email" className={errors.email ? `color-danger` : ''}>Email</Label>

                            <Input
                                id="email"
                                type="text"
                                value={email}
                                className={`block mt-1 w-full ${errors.email ? 'form-controll-error' : ''}`}
                                placeholder="Email"
                                onChange={value => setemail(value)}
                                required
                                autoFocus
                                formCol
                            />

                            <InputError messages={errors.email} className="mt-2" />
                        </div>

                        <div className="container-form-login">
                            <Label htmlFor="password">Password</Label>

                            <div style={{ position: 'relative' }}>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    className="block mt-1 w-full pr-5"
                                    onChange={value => setPassword(value)}
                                    required
                                    autoComplete="current-password"
                                    formCol
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(value => !value)}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        border: 0,
                                        background: 'transparent',
                                        color: '#64748b',
                                        padding: 4,
                                        lineHeight: 1,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: 20 }}>
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>

                            <InputError messages={errors.password} className="mt-2" />
                        </div>

                        <div className="text-end mt-2">
                            <Link href="/forgot-password" className="text-md">
                                Lupa Password?
                            </Link>
                        </div>

                        <div className="container-form-login mt-3">
                            <Label htmlFor="captcha_answer" className={errors.captcha_answer ? `color-danger` : ''}>Captcha</Label>
                            <div className="d-flex align-items-center">
                                <label
                                    id="captcha_answer"
                                    onClick={() => {
                                        loadCaptcha()
                                    }}
                                    className={`d-flex align-items-center justify-content-between ${errors.captcha_answer ? 'form-controll-error' : ''}`}
                                    style={{
                                        width: 320,
                                        maxWidth: '100%',
                                        minHeight: 78,
                                        border: `1px solid ${errors.captcha_answer ? '#ef4444' : '#d1d5db'}`,
                                        borderRadius: 3,
                                        background: '#f9f9f9',
                                        color: '#111827',
                                        padding: '12px 14px',
                                        textAlign: 'left',
                                        cursor: captcha.verified || captcha.loading ? 'default' : 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                                    }}
                                >
                                    <span className="d-flex align-items-center">
                                        <input
                                            type="checkbox"
                                            checked={captcha.verified}
                                            disabled={captcha.loading || btn_loading}
                                            onChange={() => loadCaptcha()}
                                            aria-label="Saya bukan robot"
                                            style={{
                                                position: 'absolute',
                                                opacity: 0,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        <span
                                            className="d-flex align-items-center justify-content-center mr-3"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                border: `2px solid ${captcha.verified ? '#19a974' : '#9aa4b2'}`,
                                                borderRadius: 2,
                                                background: captcha.verified ? '#19a974' : '#fff',
                                                color: '#fff',
                                                flex: '0 0 auto',
                                            }}
                                        >
                                            {captcha.verified ? (
                                                <span className="material-icons" style={{ fontSize: 24 }}>check</span>
                                            ) : null}
                                        </span>
                                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                                            {captcha.loading ? 'Memverifikasi...' : 'Saya bukan robot'}
                                        </span>
                                    </span>
                                    <span className="d-flex flex-column align-items-center justify-content-center ml-3" style={{ minWidth: 62 }}>
                                        <span className="material-icons" style={{ color: captcha.verified ? '#19a974' : '#7c8ca1', fontSize: 32 }}>
                                            {captcha.verified ? 'verified_user' : 'security'}
                                        </span>
                                        <span style={{ fontSize: 10, lineHeight: '12px', color: '#555' }}>
                                            reCAPTCHA
                                        </span>
                                        <span style={{ fontSize: 9, lineHeight: '11px', color: '#777' }}>
                                            Privacy - Terms
                                        </span>
                                    </span>
                                </label>
                            </div>
                            <InputError messages={errors.captcha_answer} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end mt-4 c-btn-login">
                            <Button className="" disabled={btn_loading || !captcha.verified}>
                                {btn_loading ? 'Loading...' : 'Login'}
                            </Button>
                        </div>


                        {/* {login_on_sso()} */}


                    </form>
                </>
            ) : (
                <div
                    className='container-login-sso'
                    style={{ backgroundImage: `url('/bg-login-sso${is_authenticate_error ? '-error' : ''}.png')` }}
                >

                    {!is_authenticate_error ? (

                        <div className='container-login-sso-card'>
                            <div className="layout-login-left-area-logo">
                                <img src="/logo.png" />
                            </div>

                            <div className='container-login-sso-title'>
                                E-Office
                            </div>
                            <div className='container-login-sso-hr'></div>

                            <div className='container-login-sso-mt-btn'></div>
                            <div className='container-login-sso-cbtn'>
                                {login_on_sso()}
                                <a
                                    className="container-login-sso-btn clsb-white"
                                    disabled={btn_loading}
                                    href="https://aka.ms/sspr"
                                >
                                    Reset Password
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className='container-login-sso-card clsc-error'>
                            <div>Login Gagal:</div>
                            <div>{messages_error_sso}</div>
                        </div>

                    )}


                </div>
            )}


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
                onHide={() => {
                    setmodalTwoFactor(false)
                    localStorage.removeItem('pending_2fa')
                }}
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
                show={btn_loading}
                text={loginLoadingText}
            />
        </>
    )
}

export default Login

export const ModalChooseGroup = props => {
    return (
        <Modal
            show={props.show}
            className=""
            onShow={() => {

            }}
            onHide={props.onHide}
            size="md"
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    Login Sebagai
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-12">
                        {props.groups.map((m, i) => {
                            const is_checked = (props.groups_item &&
                                (props.groups_item.id_user == m.id_user) &&
                                (props.groups_item.id_group == m.id_group) &&
                                (props.groups_item.id_jabatan == m.id_jabatan)) || false
                            return (
                                <div
                                    key={i}
                                    className={`items-groups d-flex align-items-center cursor-pointer ${is_checked ? 'active' : ''}`}
                                    onClick={() => props.setgroups_item(m)}
                                >
                                    <div className="flex-1">
                                        <div className='title'>
                                            {m.nama}
                                        </div>
                                        <div className='subtitle color-grey'>
                                            {m.nama_user} - {m.nama_jabatan}
                                        </div>
                                    </div>
                                    <BtnIcon
                                        icon={
                                            is_checked ? 'radio_button_checked' : 'radio_button_unchecked'}
                                        onTap={() => null}
                                    />
                                </div>
                            )
                        })}
                        <div className="d-flex justify-content-end">

                            <Button
                                type="button"
                                className="btn-default-app"
                                disabled={props.btn_popup_loading}
                                onClick={() => {
                                    props.onlogin_on_group()
                                }}
                            >
                                {props.btn_popup_loading ? (
                                    "Loading..."
                                ) : (
                                    <>
                                        <span className="material-icons icon-btn-left mr-1">
                                            login
                                        </span>
                                        Login
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

export const ModalTwoFactor = props => {
    return (
        <Modal
            show={props.show}
            onHide={() => {
                if (props.canClose === false) return
                if (props.onHide) props.onHide()
            }}
            size="md"
            backdrop={props.canClose === false ? "static" : true}
            keyboard={props.canClose === false ? false : true}
        >
            <Modal.Header closeButton={props.canClose === false ? false : true}>
                <Modal.Title>Verifikasi OTP</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={props.onVerify}>
                    <div className="mb-3">
                        <div className="mb-2">
                            Kode OTP sudah dikirim ke <strong>{props.twoFactorData?.masked_destination || '-'}</strong>.
                        </div>
                        {props.twoFactorData?.expires_in_seconds ? (
                            <div className="mb-2 color-grey">
                                Kode berlaku {Math.ceil(props.twoFactorData.expires_in_seconds / 60)} menit.
                            </div>
                        ) : null}
                        <Label htmlFor="otp_code">Kode OTP</Label>
                        <Input
                            id="otp_code"
                            type="text"
                            value={props.otpCode}
                            className="block mt-1 w-full"
                            placeholder="Masukkan 6 digit OTP"
                            onChange={value => props.setOtpCode(value)}
                        />
                        <InputError messages={props.errors?.otp_code || props.errors?.errors} className="mt-2" />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            type="button"
                            className="btn-default-app mr-2"
                            disabled={props.btn_resend_loading}
                            onClick={props.onResend}
                        >
                            {props.btn_resend_loading ? 'Loading...' : 'Kirim Ulang OTP'}
                        </Button>
                        <Button className="btn-default-app" disabled={props.btn_loading}>
                            {props.btn_loading ? 'Loading...' : 'Verifikasi'}
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    )
}

export const ModalLoginLoading = props => {
    return (
        <Modal
            show={props.show}
            centered
            backdrop="static"
            keyboard={false}
        >
            <Modal.Body>
                <div className="d-flex flex-column align-items-center justify-content-center py-4">
                    <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                        style={{ width: '3rem', height: '3rem' }}
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="text-center fw-semibold mb-2">
                        Sedang memuat data
                    </div>
                    <div className="text-center text-muted">
                        {props.text || 'Mohon tunggu sebentar...'}
                    </div>
                    {/* <div className="text-center text-muted mt-2">
                        Jangan klik tombol login berulang kali.
                    </div> */}
                </div>
            </Modal.Body>
        </Modal>
    )
}
