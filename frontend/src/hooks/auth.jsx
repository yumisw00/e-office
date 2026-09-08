import axios from "lib/axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clearStorage, getStorage, saveStorage, showToastr } from "pages/Utils";
import { usePathname, useRouter } from "components/Navigation";
import useSWR from 'swr'
import { page_without_menu } from "components/ApplicationMenu";
import { api_services } from "./api_services";

export const useAuth = ({ middleware, redirectIfAuthenticated, ...useAuthParams } = {}) => {
    const router = useRouter()
    const params = useParams()

    // const { data: user, error, mutate } = useSWR('/api/user', () =>
    //     axios
    //         .get('/api/user')
    //         .then(res => {
    //             return res.data
    //         })
    //         // .then(async res => {
    //         //     const isLoggedIn = await getStorage("isLoggedIn")
    //         //     if(!isLoggedIn) {
    //         //         window.location.href = '/login'
    //         //     }
    //         //     return res.data
    //         // })
    //         .catch(error => {
    //             if (error.response.status !== 409) throw error

    //             router.push('/verify-email')
    //         }),
    // )

    const mutate = async () => {
        const user_loginObj = getStorage("user_login");

        // console.log('MUTATE==>');
        // console.log('user_loginObj');
        // console.log(user_loginObj);

        if (user_loginObj) {
            const user_login = JSON.parse(user_loginObj)
            if (user_login.user && user_login.user.id_user) {
                // navigate(redirectIfAuthenticated);

                let path = '/dashboard'
                const urlsaved = sessionStorage.getItem('urlsaved')
                if (urlsaved) {
                    path = urlsaved
                }
                window.location.href = path
            }

        } else {
            sessionStorage.setItem('urlsaved', '')

            window.location.pathname = '/login'

        }
    }

    const csrf = () => axios.get('/sanctum/csrf-cookie')

    const buildMenu = data => {
        let menu = []

        if (data.menu) {
            data.menu.map(m => {
                if (!page_without_menu.includes(m.page)) {
                    menu.push(m)
                }
            })
        }

        return menu
    }

    const completeLogin = async (res, mergeWithExistingUser = false) => {
        const menu = buildMenu(res.data)
        localStorage.removeItem('pending_2fa')

        if (mergeWithExistingUser) {
            const user_loginObj = await getStorage('user_login')
            const user_login = user_loginObj ? JSON.parse(user_loginObj) : {}

            await handleSaveStorage('user_login', { ...user_login, ...res.data, menu })
        } else {
            await handleSaveStorage('user_login', { ...res.data, menu })
        }

        await save_default_filter(res)
        await handleSaveStorage('isLoggedIn', '1')
        showToastr('success', 'Login berhasil!')

        return mutate()
    }

    const normalizeAuthResponse = res => ({
        ...res,
        data: res?.data?.data || res?.data || {},
    })

    const extractErrorMessage = (error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') => {
        const status = error?.response?.status
        const data = error?.response?.data

        if (!data) {
            return status ? `${fallback} (HTTP ${status})` : fallback
        }

        if (typeof data === 'string') {
            return status ? `${fallback} (HTTP ${status})` : fallback
        }

        if (data?.message) return data.message
        if (data?.messages?.errors) return data.messages.errors

        const errors = data?.errors
        if (errors && typeof errors === 'object') {
            const firstKey = Object.keys(errors)[0]
            const firstError = errors[firstKey]

            if (Array.isArray(firstError)) return firstError[0]
            if (typeof firstError === 'string') return firstError
        }

        return status ? `${fallback} (HTTP ${status})` : fallback
    }

    const register = async ({ setErrors, ...props }) => {
        await csrf()

        setErrors([])

        axios
            .post('/register', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    // const [responDataLogin, setResponDataLogin] = useState({})
    const login = async ({ setErrors, setStatus, ...props }) => {
    await csrf()

    setErrors([])
    setStatus(null)

    try {
        // 🔥 FIX PENTING: pastikan CSRF benar-benar aktif
        await axios.get('/sanctum/csrf-cookie')

        const response = await axios.post('/login', props, {
            withCredentials: true
        })
        const res = normalizeAuthResponse(response)

        if (res.data.requires_2fa && props.onRequireTwoFactor) {
            return props.onRequireTwoFactor(res.data)
        }

        if (res.data.groups) {
            await handleSaveStorage('user_login', res.data)

            if (props.onshow_groups) {
                return props.onshow_groups()
            }

            return completeLogin(res)
        }

        if (res.data.user) {
            return completeLogin(res)
        }

        if (!res.data.requires_2fa && Object.keys(res.data).length > 0) {
            return completeLogin(res)
        }

        showToastr('error', 'Login gagal. Response backend tidak valid.')
        setErrors({ errors: ['Login gagal. Response backend tidak valid.'] })

    } catch (error) {
        if (error.response?.status !== 422) {
            const message = extractErrorMessage(error, 'Login gagal. Silakan coba lagi.')
            showToastr('error', message)
            setErrors({ errors: [message] })
            return
        }

        const message = extractErrorMessage(error, 'Login gagal. Silakan coba lagi.')
        showToastr('error', message)
        setErrors(error.response?.data?.errors || { errors: [message] })
    }
}

    const check_sso = async ({ setErrors, setStatus, ...props }) => {
        axios
            .get(`/authenticate?token=${props.token || ''}`, props)
            .then(async response => {
                const res = normalizeAuthResponse(response)

                if (res.data.requires_2fa && props.onRequireTwoFactor) {
                    return props.onRequireTwoFactor(res.data)
                }

                if (res.data.groups) {
                    await handleSaveStorage('user_login', res.data)

                    if (props.onshow_groups) {
                        return props.onshow_groups()
                    }

                    return completeLogin(res)
                }

                if (res.data.user) {
                    return completeLogin(res)
                }

            })
            .catch(error => {
                if (error.response.data.redirect)
                    window.location.href = error.response.data.redirect
                // console.log('CATCH=>');
                // console.log(error.response.data.messages.errors);

                if (props.onError) {
                    return props.onError(error)
                }

                if (error.response.status !== 422) throw error
                if (error.response.data.error && error.response.data.messages && error.response.data.messages.errors) {
                    showToastr('error', `Login gagal! ${error.response.data.messages.errors}`)
                }
                setErrors(error.response.data.errors)


            })
    }

    const choose_group = async ({ setErrors, setStatus, ...props }) => {

        if (setErrors) {
            setErrors([])

        }
        if (setStatus) {

            setStatus(null)
        }

        axios
            .post('/choseGroup', props)
            .then(async response => {
                const res = normalizeAuthResponse(response)

                if (res.data.requires_2fa && props.onRequireTwoFactor) {
                    return props.onRequireTwoFactor(res.data)
                }

                if (res.data.groups) {
                    await handleSaveStorage('user_login', res.data)
                }

                return completeLogin(res, true)


            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                if (error.response.data.error && error.response.data.messages.errors) {
                    showToastr('error', `Login gagal! ${error.response.data.messages.errors}`)
                }
                setErrors(error.response.data.errors)
            })
    }

    const verify_two_factor = async ({ setErrors, setStatus, ...props }) => {
        if (setErrors) {
            setErrors([])
        }

        if (setStatus) {
            setStatus(null)
        }

        axios
            .post('/2fa/verify', props)
            .then(async response => {
                const res = normalizeAuthResponse(response)

                if ((res.data.requires_group_selection || res.data.groups) && props.onshow_groups) {
                    await handleSaveStorage('user_login', res.data)
                    return props.onshow_groups()
                }

                return completeLogin(res, true)
            })
            .catch(error => {
                if (error.response.status !== 422) {
                    const message = extractErrorMessage(error, 'Verifikasi gagal. Silakan coba lagi.')
                    showToastr('error', message)
                    setErrors({ errors: [message] })
                    return
                }
                const message = extractErrorMessage(error, 'Verifikasi gagal. Silakan coba lagi.')
                showToastr('error', message)
                setErrors(error.response.data.errors || error.response.data.messages || { errors: [message] })
            })
    }

    const resend_two_factor = async ({ setErrors, setStatus, ...props }) => {
        if (setErrors) {
            setErrors([])
        }

        if (setStatus) {
            setStatus(null)
        }

        axios
            .post('/2fa/resend', props)
            .then(async response => {
                const res = normalizeAuthResponse(response)

                if (props.onRequireTwoFactor) {
                    props.onRequireTwoFactor(res.data)
                }

                showToastr('success', 'Kode OTP baru sudah dikirim.')
            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                if (error.response.data.error && error.response.data.messages.errors) {
                    showToastr('error', `Kirim ulang gagal! ${error.response.data.messages.errors}`)
                }
                setErrors(error.response.data.errors || error.response.data.messages)
            })
    }

    const login_as = async ({ setErrors, setStatus, ...props }) => {

        // setErrors([])
        // setStatus(null)

        axios
            .post('/loginAs', props)
            .then(async res => {

                if (res.data.groups) {
                    await handleSaveStorage('user_login', res.data)
                }

                await handleSaveStorage('isLoggedIn', '1')

                let menu = []
                if (res.data.menu) {
                    res.data.menu.map(m => {
                        if (!page_without_menu.includes(m.page)) {
                            menu.push(m)
                        }
                    })

                    const user_loginObj = await getStorage('user_login')
                    const user_login = JSON.parse(user_loginObj)

                    await handleSaveStorage('user_login', { ...user_login, ...res.data, menu })
                }

                await save_default_filter(res)

                showToastr('success', 'Login berhasil!')
                return mutate()


            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                if (error.response.data.error && error.response.data.messages.errors) {
                    showToastr('error', `Login gagal! ${error.response.data.messages.errors}`)
                }
                setErrors(error.response.data.errors)
            })
    }

    const forgotPassword = async ({ setErrors, setStatus, ...props }) => {
        await csrf()

        setErrors([])
        if (setStatus) setStatus(null)

        axios
            .post('/forgot-password', { email: props.email })
            .then(response => {
                if (props.onSuccess) {
                    props.onSuccess(response.data.message)
                }
                showToastr('success', response.data.message || 'Link reset password sudah dikirim ke email Anda')
                if (props.onRequestDone) {
                    props.onRequestDone()
                }
            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                if (error.response.data.messages && error.response.data.messages.errors) {
                    showToastr('error', error.response.data.messages.errors)
                }
                setErrors(error.response.data.errors)
                if (props.onRequestDone) {
                    props.onRequestDone()
                }
            })
    }

    const resetPassword = async ({ setErrors, setStatus, ...props }) => {
        await csrf()

        setErrors([])
        if (setStatus) setStatus(null)

        axios
            .post('/password-reset', {
                token: props.token,
                password: props.password,
                password_confirmation: props.password_confirmation
            })
            .then(response => {
                if (props.onSuccess) {
                    props.onSuccess(response.data)
                }
                showToastr('success', 'Password berhasil direset. Silakan login.')
                if (props.onRequestDone) {
                    props.onRequestDone()
                }
            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                if (error.response.data.errors) {
                    setErrors(error.response.data.errors)
                } else {
                    showToastr('error', error.response.data.messages?.errors || 'Gagal reset password')
                }
                if (props.onRequestDone) {
                    // console.log('CATCH=>ONREQUEST DONE');
                    
                    props.onRequestDone()
                }
            })
    }

    const resendEmailVerification = ({ setStatus }) => {
        axios
            .post('/email/verification-notification')
            .then(response => setStatus(response.data.status))
    }

    const logout = async () => {
        // if (!error) {
        //     // await clearStorage()
        // }
        await clearStorage()
        const { getapi_services } = api_services({ api_path: '/get_session' })
        const response = await getapi_services({})
        if (response.code || response.error) return


        let xtoken = ''
        // const user_loginObj = getStorage("user_login");
        // if (user_loginObj) {
        //    const user_login = JSON.parse(user_loginObj)
        //    xtoken = user_login['x-xsrf-token']
        // }
        xtoken = response.token

        await axios.post('/logout', {}, {
            headers: {
                'x-xsrf-token': xtoken
            }
        }).then(() => {
            return mutate()
        }).catch(error => {
            if (error.response.data && error.response.data.message == 'Unauthenticated.') {
                //   window.location.pathname = '/login'
            }
        })

        // window.location.pathname = '/login'
    }

    const update_periode_jadwal = async () => {
        axios
            .get('/update_periode_jadwal')
            .then(res => res)
            .catch(error => {
                return error.response.data.errors
            })
    }

    const handleSaveStorage = async (key, data) => {
        await saveStorage(key, JSON.stringify(data))
    }


    const handleRedirectLogin = async () => {
        const isLoggedIn = await getStorage('isLoggedIn')
        if (isLoggedIn == '1') {
            router.push(redirectIfAuthenticated)
        }
    }

    const save_default_filter = async (res) => {

        const filter = {
            dashboard: {
                jenis_progress_efektivitas: 'progres'
            },
            rcm_master: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            rcm_unit: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            csa: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            tod: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            toe: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            perubahan_kuesioner: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            remediasi: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            kuesioner: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            tod_edit: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            dod: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            too: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            too_remediasi: {
                tlc: {},
                elc: {},
                itgc: {}
            },
            laporan_perubahan_rcm: {

            },
            periode: {}
        }

        // if (res && res.data && res.data.id_group == 2) {
        //     filter.toe.tlc.id_status = '12'
        //     filter.toe.elc.id_status = '12'
        //     filter.toe.itgc.id_status = '12'
        // }
        return await handleSaveStorage('filter', filter)
    }

    return {
        // user,
        register,
        login,
        forgotPassword,
        resetPassword,
        resendEmailVerification,
        logout,
        choose_group,
        login_as,
        check_sso,
        verify_two_factor,
        resend_two_factor
    }
}
