import Button from 'components/Button'
import Input from 'components/Input'
import InputError from 'components/InputError'
import Label from 'components/Label'
import { useAuth } from 'hooks/auth'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, saveStorage, showToastr } from 'pages/Utils'
import AuthSessionStatus from 'pages/(auth)/AuthSessionStatus'

const ForcePasswordChange = () => {
    const navigate = useNavigate()
    
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)
    const [reason, setReason] = useState('')
    const [passwordStrength, setPasswordStrength] = useState(null)

    const [userLogin, setUserLogin] = useState(null)

    useEffect(() => {
        const loadUserData = async () => {
            const userLoginObj = await getStorage('user_login')
            if (userLoginObj) {
                const userLogin = JSON.parse(userLoginObj)
                setUserLogin(userLogin)
                setReason(userLogin.reason_password_change || 'Anda diharuskan mengganti password')
            }
        }
        loadUserData()
    }, [])

    // Check password strength
    const checkPasswordStrength = async (pwd) => {
        if (!pwd || pwd.length < 8) {
            setPasswordStrength(null)
            return
        }
        
        try {
            const csrf = async () => {
                await axios.get('/sanctum/csrf-cookie')
            }
            await csrf()
            
            const response = await axios.post('/api/password/check-strength', { password: pwd })
            setPasswordStrength(response.data)
        } catch (error) {
            // Silently fail
        }
    }

    const handlePasswordChange = async (e) => {
        const newPassword = e.target.value
        setPassword(newPassword)
        checkPasswordStrength(newPassword)
    }

    const submitForm = async (event) => {
        event.preventDefault()
        setLoading(true)
        setErrors([])

        const { getapi_services } = window.api_services({ api_path: '/get_session' })
        const sessionRes = await getapi_services({})
        
        if (sessionRes.code || sessionRes.error) {
            showToastr('error', 'Sesi tidak valid. Silakan login ulang.')
            navigate('/login')
            return
        }

        try {
            await axios.put('/api/password/update', {
                current_password: currentPassword,
                password: password,
                password_confirmation: passwordConfirmation,
            }, {
                headers: {
                    'x-xsrf-token': sessionRes.token
                }
            }).then(response => {
                showToastr('success', 'Password berhasil diubah!')
                
                // Update local storage
                const updatedUser = { ...userLogin, need_password_change: false }
                saveStorage('user_login', JSON.stringify(updatedUser))
                
                navigate('/dashboard')
            })
        } catch (error) {
            setLoading(false)
            if (error.response && error.response.status !== 422) {
                throw error
            }
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors)
            } else if (error.response && error.response.data.messages) {
                showToastr('error', error.response.data.messages.errors)
            }
        }
        
        setLoading(false)
    }

    const getStrengthLabel = () => {
        if (!passwordStrength) return null
        const level = passwordStrength.level
        const score = passwordStrength.score
        
        let color = 'text-danger'
        if (score >= 80) color = 'text-success'
        else if (score >= 60) color = 'text-warning'
        
        return (
            <div className="mt-1">
                <small className={color}>
                    Kekuatan Password: {level} ({score}%)
                </small>
            </div>
        )
    }

    const getRequirementsList = () => {
        if (!password || password.length < 8) return null
        
        const reqs = []
        const rules = passwordStrength?.errors || []
        
        if (!rules.includes("Password harus minimal 8 karakter")) {
            reqs.push('✅ Minimal 8 karakter')
        } else {
            reqs.push('<span class="text-danger">❌</span> Minimal 8 karakter')
        }
        
        if (!rules.includes("Password harus mengandung huruf besar (A-Z)")) {
            reqs.push('✅ Huruf kapital')
        } else {
            reqs.push('<span class="text-danger">❌</span> Huruf kapital')
        }
        
        if (!rules.includes("Password harus mengandung huruf kecil (a-z)")) {
            reqs.push('✅ Huruf kecil')
        } else {
            reqs.push('<span class="text-danger">❌</span> Huruf kecil')
        }
        
        if (!rules.includes("Password harus mengandung angka (0-9)")) {
            reqs.push('✅ Angka')
        } else {
            reqs.push('<span class="text-danger">❌</span> Angka')
        }
        
        if (!rules.includes("Password harus mengandung karakter khusus")) {
            reqs.push('✅ Karakter khusus (!@#$%^&*)')
        } else {
            reqs.push('<span class="text-danger">❌</span> Karakter khusus (!@#$%^&*)')
        }
        
        return (
            <div className="mt-2 mb-3 p-2 bg-light rounded">
                <small>
                    <div dangerouslySetInnerHTML={{ __html: reqs.join('<br/>') }} />
                </small>
            </div>
        )
    }

    return (
        <>
            <div className="alert alert-warning mb-4">
                <h5 className="alert-heading">⚠️ Password Wajib Diubah</h5>
                <p className="mb-0">{reason}</p>
            </div>

            <AuthSessionStatus className="mb-4" status={status} />

            <form onSubmit={submitForm}>
                {/* Current Password */}
                <div>
                    <Label htmlFor="current_password">Password Saat Ini</Label>
                    <Input
                        id="current_password"
                        type="password"
                        value={currentPassword}
                        className="block mt-1 w-full"
                        onChange={value => setCurrentPassword(value)}
                        required
                        autoFocus
                    />
                    <InputError messages={errors.current_password} className="mt-2" />
                </div>

                {/* New Password */}
                <div className="mt-4">
                    <Label htmlFor="password">Password Baru</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        className="block mt-1 w-full"
                        onChange={handlePasswordChange}
                        required
                        autoComplete="new-password"
                    />
                    <InputError messages={errors.password} className="mt-2" />
                    {getStrengthLabel()}
                    {getRequirementsList()}
                </div>

                {/* Confirm Password */}
                <div className="mt-4">
                    <Label htmlFor="password_confirmation">
                        Konfirmasi Password Baru
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={passwordConfirmation}
                        className="block mt-1 w-full"
                        onChange={value => setPasswordConfirmation(value)}
                        required
                        autoComplete="new-password"
                    />
                    <InputError messages={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Button disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Password'}
                    </Button>
                </div>
            </form>
        </>
    )
}

export default ForcePasswordChange