import Link from "components/Link"
// import { fontMontserrat } from "../layout"
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from "react"
import { usePathname } from "components/Navigation"


const Header = ({ title, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const breadcrumbs = useSelector(state => state.breadcrumbs)
    const breadcrumbsCounter = useSelector(state => state.breadcrumbsCounter)
    const pathname = usePathname()
    const [breadcrumbs_data, setbreadcrumbs_data] = useState([])

    useEffect(() => {

        // initBreadcrumbs()
    }, [
        breadcrumbs.length,
        pathname,
        breadcrumbsCounter
    ])

    const initBreadcrumbs = () => {
        // console.log('initBreadcrumbs=>HEADER')
        if (breadcrumbs.length == 0) return
        // console.log(breadcrumbs)

        const lyt_risiko = LAYOUT_RISIKO_VAR_ARR
        const pathname_arr = pathname.split("/")
        const page_url = pathname_arr[1]

        let page_ready = false
        for (let i = 0; i < lyt_risiko.length; i++) {
            if (lyt_risiko[i] == page_url) {
                page_ready = true
                break
            }
        }
        if (!page_ready) {
            setbreadcrumbs_data([])
            return
        }

        let breadcrumbs_data = []
        breadcrumbs.map(m => {
             if (m.navigasi && parseInt(m.navigasi) == 1) {
                breadcrumbs_data.push({ label: m.nama, url: `/risk_profile/${m.id_register}` })
            } else {
                breadcrumbs_data.push({ label: m.nama })
            }
        })
        breadcrumbs_data.push({ label: title })
        setbreadcrumbs_data(breadcrumbs_data)
    
    }

    return (
        <header className="bg-white">
            <div className="mx-auto py-6 pl-3">

                <h2 className={`font-bold text-xl text-gray-800 leading-tight bold`}>
                    {title}
                </h2>
            

                {props.subtitle ? (
                    <div>{props.subtitle}</div>
                ) : null}

              

                {breadcrumbs_data.length > 0 ? (
                    <nav ariaLabel="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link href={'/risk_register'}>
                                    <span className="material-icons" style={{ fontSize: 18 }}>home</span>
                                </Link>
                            </li>
                            {breadcrumbs_data.map((m, i) => {
                                if (i == breadcrumbs_data.length - 1) {
                                    return (
                                        <li
                                            key={i}
                                            className="breadcrumb-item active"
                                            ariaCurrent="page"
                                        >
                                            {m.label}
                                        </li>
                                    )
                                }
                                return (
                                    <li key={i} className="breadcrumb-item">
                                        {m.url ? (
                                            <Link href={m.url}>
                                                {m.label}
                                            </Link>
                                        ) : m.label}
                                    </li>
                                )
                            })}
                        </ol>
                    </nav>
                ) : null}

            </div>
        </header>
    )
}

export default Header





