import { is_apply_login_with_sso, urlPreview } from "pages/Utils"

const AuthCard = ({ logo, children, ...props }) => (

    <div className="d-flex flex-direction-row layout-login">
        {!is_apply_login_with_sso ? (
            <>
                <div
                    className="layout-login-left"
                    style={{ backgroundImage: `url('/bg-login.png')` }}

                >
                    <div className="layout-login-left-area-logo">
                        <img src="/logo.png" />

                    </div>
                </div>
                <div className="layout-login-right">
                    <div className="d-flex flex-direction-row justify-content-center">{logo}</div>
                    <div className="title-login mt-3 mb-3">
                        {props.title || 'HALAMAN LOGIN'}
                    </div>


                    {children}
                </div>
            </>
        ) : children}

    </div>
)

export default AuthCard
