

import Link from 'components/Link'
import AuthCard from 'pages/(auth)/AuthCard'
import ApplicationLogo from 'components/ApplicationLogo'

// export const metadata = {
//     title: 'Laravel',
// }

const Layout = ({ children, ...props }) => {
    return (
        <div>
            <div className="font-sans text-gray-900 antialiased">
                <AuthCard
                    title={props.title || null}
                    logo={
                        <Link href="/">
                            <ApplicationLogo width={100} className="w-20 h-20 fill-current text-gray-500" />
                        </Link>
                    }>
                    {children}
                </AuthCard>
            </div>
        </div>
    )
}

export default Layout
