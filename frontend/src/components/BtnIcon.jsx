


import React, { useState } from 'react'
import NavLink from 'components/NavLink'
import Link from 'components/Link'
import TooltipsApp from './TooltipsApp'
import Dropdown from 'react-bootstrap/Dropdown';
import { colorsPallette } from 'pages/Utils';
import { usePathname, useRouter } from "components/Navigation";

export const iconNotif = {
    '15': 'undo',
    '16': 'undo',
    '17': 'undo',
    '5': 'done',
    '10': 'done',
}

const BtnIcon = (props) => {
    const router = useRouter();
    const [trigger, settrigger] = useState(0)
    const [dropdown, setdropdown] = useState(false)
    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    const handleTrigger = () => {
        settrigger(trigger => trigger + 1)
        setdropdown(false)
    }

    if (props.is_user_guide) {
        return (
            <div className='container-dropdown-notif'>
                <Dropdown>
                    <Dropdown.Toggle variant="" id="dropdown-basic-3">
                        <div className='btn-icons relative'>
                            <span className='material-icons'>{props.icon}</span>
                        </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item target='_blank' href={`${import.meta.env.VITE_BACKEND_URL}api/user_guide`}>
                            <Link target='_blank' href={`${import.meta.env.VITE_BACKEND_URL}api/user_guide`} className={`d-flex align-items-center`}>
                                <div className=''>
                                    <span className='material-icons'>
                                        visibility
                                    </span>
                                </div>
                                <div className='flex-1 ps-3'>
                                    <div className='dropdown-notif-item-title' style={{ fontWeight: 'bold' }}>
                                        Preview User Guide
                                    </div>

                                </div>

                            </Link>
                        </Dropdown.Item>

                    </Dropdown.Menu>

                </Dropdown>
            </div>
        )
    }

    if (props.dropdown) {
        return (
            <div className='container-dropdown-notif'>
                <Dropdown>
                    <Dropdown.Toggle variant="" id="dropdown-basic-2">
                        <div className='btn-icons relative'>
                            {props.notif ? (
                                <div className='item-count-notif'>{props.notif}</div>
                            ) : null}
                            <span className='material-icons'>{props.icon}</span>
                        </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <div className='dropdown-notif-body'>
                            {props.dropdown.data?.length ? (
                                <>
                                    {props.dropdown.data.map((m, i) => {
                                        // let icon = iconNotif[m.id_status_pengajuan] ? iconNotif[m.id_status_pengajuan] : 'arrow_forward'
                                        let icon = 'flag'
                                        return (
                                            <Dropdown.Item key={i} className={m.is_read == 1 ? '' : 'notif-un-read'}>
                                                <Link href={m.url} onClick={() => props.onRead(m)} className={`d-flex align-items-center ${m.is_read == 1 ? 'is-read' : ''}`}>
                                                    <div className=''>
                                                        <span className='material-icons' style={{ color: icon == 'undo' ? colorsPallette.danger : icon == 'done' ? colorsPallette.success : colorsPallette.info }}>
                                                            {icon}
                                                        </span>
                                                    </div>
                                                    <div className='flex-1 ps-3'>
                                                        <div className='dropdown-notif-item-title' style={{ fontWeight: m.is_read == 1 ? 'normal' : 'bold' }}>{m.msg}</div>
                                                        {m.note ? (
                                                            <div className='dropdown-notif-item-desc mb-1'>
                                                                <p>
                                                                    {m.note ? `Pesan: ${m.note}` : ''}
                                                                </p>
                                                            </div>
                                                        ) : null}
                                                        <p className='dropdown-notif-item-foot'>
                                                            {/* <span className='material-icons'>schedule</span> */}
                                                            {m.created_at} - {m.created_by_desc}
                                                            {/* <span className='material-icons'>person</span> */}


                                                        </p>
                                                    </div>

                                                </Link>
                                            </Dropdown.Item>

                                        )
                                    })}
                                </>
                            ) : (
                                <div className='text-center text-muted px-3 py-3'>
                                    Belum ada notifikasi.
                                </div>
                            )}
                        </div>

                        {/* <Dropdown.Item>
                            <Link onClick={handleTrigger} href={`/task`} className='text-center dropdown-link-more'>
                                View All Task
                            </Link>
                        </Dropdown.Item> */}
                        <Dropdown.Item>
                            <a
                                className='text-center dropdown-link-more'
                                onClick={() => {
                                    router.push(`/notifikasi`);
                                }}
                            >
                                Lihat Semua Notifikasi
                            </a>
                        </Dropdown.Item>
                    </Dropdown.Menu>

                </Dropdown>
            </div>
        )
    }

    if (props.href) {
        return (
            <NavLink
                href={props.href}
                active={false}>
                <div className='btn-icons relative'>
                    {props.notif ? (
                        <div className='item-count-notif'>{props.notif}</div>
                    ) : null}
                    <span className='material-icons'>{props.icon}</span>
                </div>
            </NavLink>
        )
    }

    if (props.is_refresh) {
        return (
            <div className='d-flex flex-direction-row justify-content-center align-items-center' style={props.style ? props.style : null}>
                <div className={`btn-icons relative`}
                    onClick={props.onTap ? props.onTap : null}
                >
                    {props.tooltips ? (
                        <Links title={props.tooltips} id={props.tooltips}>
                            <span className='material-icons' style={{ fontSize: props.size ? props.size : 24, color: props.color ? props.color : '#333' }}>{props.icon}</span>
                        </Links>
                    ) : (
                        <span className='material-icons' style={{ fontSize: props.size ? props.size : 24, color: props.color ? props.color : '#333' }}>{props.icon}</span>
                    )}
                </div>
            </div>
        )
    }
    return (
        <div className='d-flex flex-direction-row justify-content-center align-items-center' style={props.style ? props.style : null}>
            <div className={`btn-icons relative ${props.className}`}
                onClick={props.onTap ? props.onTap : null}
            // onClick={() => {
            //     console.log('cccc');
            //     props.onTap()
            // }}
            >
                {props.notif ? (
                    <div className='item-count-notif'>{props.notif}</div>
                ) : null}
                {props.tooltips ? (
                    <Links title={props.tooltips} id={props.tooltips}>
                        <span className='material-icons' style={{ fontSize: props.size ? props.size : 24, color: props.color ? props.color : '#333' }}>{props.icon}</span>
                    </Links>
                ) : (
                    <span className='material-icons' style={{ fontSize: props.size ? props.size : 24, color: props.color ? props.color : '#333' }}>{props.icon}</span>
                )}
            </div>
        </div>
    )
}

export default BtnIcon
