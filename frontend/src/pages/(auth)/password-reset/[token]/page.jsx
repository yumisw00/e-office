import Button from 'components/Button'
import Input from 'components/Input'
import InputError from 'components/InputError'
import Label from 'components/Label'
import { useAuth } from 'hooks/auth'
import { useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import AuthSessionStatus from 'pages/(auth)/AuthSessionStatus'
import $ from 'jquery'
import { ModalLoginLoading } from 'pages/(auth)/login/page'

const PasswordReset = () => {
    const [searchParams] = useSearchParams()
    const params = useParams()

    // Get token from query parameter (?token=...) or route parameter (:token)
    const token = searchParams.get('token') || params.token

    const { resetPassword } = useAuth({ middleware: 'guest' })

    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: ''
    })
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [btn_loading, setbtn_loading] = useState(false)
    const [loginLoadingText, setloginLoadingText] = useState('')

    const submitForm = (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        // $('.layout-app').addClass('is-loading-global')
        setbtn_loading(true)
        resetPassword({
            token: token,
            password: formData.password,
            password_confirmation: formData.password_confirmation,
            setErrors,
            setStatus,
            onSuccess: () => {
                // Redirect to login after successful password reset
                // window.location.href = '/login'
            },
            onRequestDone: handleRequestDone
        })
        setIsSubmitting(false)
    }

    const handleRequestDone = () => {
        setbtn_loading(false)
        // $('.layout-app').removeClass('is-loading-global')

    }

    const handleChange = (field) => (value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Show error if no token is available
    if (!token) {
        return (
            <div className="p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> Link reset password tidak valid atau sudah expired.</span>
                </div>
                <div className="mt-4 d-flex justify-content-center">
                    <a href="/forgot-password" className="text-blue-600 hover:text-blue-800 underline">
                        Klik di sini untuk meminta link reset password baru
                    </a>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Session Status */}
            <AuthSessionStatus className="mb-4" status={status} />

            <form onSubmit={submitForm}>
                {/* Password */}
                <div className='container-form-login'>
                    <Label htmlFor="password">Password Baru</Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        className="block mt-1 w-full"
                        onChange={handleChange('password')}
                        required
                        autoFocus
                        placeholder="Masukkan password baru"
                    />

                    <InputError
                        messages={errors.password}
                        className="mt-2"
                    />
                </div>

                {/* Confirm Password */}
                <div className="mt-4 container-form-login">
                    <Label htmlFor="passwordConfirmation">
                        Konfirmasi Password
                    </Label>

                    <Input
                        id="passwordConfirmation"
                        type="password"
                        value={formData.password_confirmation}
                        className="block mt-1 w-full"
                        onChange={handleChange('password_confirmation')}
                        required
                        placeholder="Masukkan Konfirmasi password"
                    />

                    <InputError messages={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center justify-end mt-4 c-btn-login">
                    <Button disabled={isSubmitting}>
                        {isSubmitting ? 'Menyimpan...' : 'Reset Password'}
                    </Button>
                </div>
            </form>

            <ModalLoginLoading
                show={btn_loading}
                text={loginLoadingText}
            />
        </>
    )
}

export default PasswordReset