

import Button from 'components/Button'
import Input from 'components/Input'
import InputError from 'components/InputError'
import Label from 'components/Label'
import { useAuth } from 'hooks/auth'
import { useState } from 'react'
import AuthSessionStatus from 'pages/(auth)/AuthSessionStatus'
import $ from 'jquery'
import { ModalLoginLoading } from '../login/page'

const Page = () => {
    const { forgotPassword } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    })

    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [btn_loading, setbtn_loading] = useState(false)
    const [loginLoadingText, setloginLoadingText] = useState('')

    const submitForm = event => {
        event.preventDefault()
        setbtn_loading(true)
        // $('.layout-app').addClass('is-loading-global')
        forgotPassword({ email, setErrors, setStatus, onRequestDone: handleRequestDone })
    }

    const handleRequestDone = () => {
        setbtn_loading(false)
        // $('.layout-app').removeClass('is-loading-global')

    }

    return (
        <>
            <div className="mb-4 text-sm text-gray-600 text-center">
                Forgot your password? No problem. Just let us know your email
                email address and we will email you a password reset link that
                that will allow you to choose a new one.
            </div>

            {/* Session Status */}
            <AuthSessionStatus className="mb-4" status={status} />

            <form onSubmit={submitForm}>
                {/* Email Address */}
                <div className='container-form-login'>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        value={email}
                        className="block mt-1 w-full"
                        onChange={value => setEmail(value)}
                        required
                        autoFocus
                    />

                    <InputError messages={errors.email} className="mt-2" />
                </div>

                <div className="flex items-center justify-end mt-4 c-btn-login">
                    <Button>Email Password Reset Link</Button>
                </div>
            </form>

            <ModalLoginLoading
                show={btn_loading}
                text={loginLoadingText}
            />
        </>
    )
}

export default Page
