

import { colorsPallette } from 'pages/Utils'
import React from 'react'
import BtnIcon from './BtnIcon'
import Link from './Link'
import Button from './Button'
import TooltipsApp from './TooltipsApp'

const TabbarApp = (props) => {

    if (props.is_scroll) {
        let is_on_btn = false
        for (let a = 0; a < props.tabbar.length; a++) {
            if (a == props.tabbar.length - 1 && props.tabbar[a].is_btn) {
                is_on_btn = true
            }
        }
        return (

            <div className='d-flex'>
                <div className="flex-1 d-flex" style={{ overflowX: 'auto' }}>
                    {props.tabbar.map((m, i) => {
                        if (is_on_btn ? (i < props.tabbar.length - 1) : true) {
                            return (
                                <div key={i} className={`item-tabbar-scroll ${props.tabbar_index_active == m.idx ? `active ` : ``}`}>
                                    <a
                                        onClick={() => props.onsettabbar_index_active ? props.onsettabbar_index_active(m.idx) : null}
                                        className={`cursor-pointer nav-link ${props.tabbar_index_active == m.idx ? `active ` : ``}`}
                                    >
                                        {m.label}
                                    </a>
                                </div>

                            )
                        }
                    })}
                </div>
                {is_on_btn ? (
                    <>
                        {props.tabbar.map((m, i) => {
                            if (i == props.tabbar.length - 1) {
                                return (
                                    <Button
                                        key={i}
                                        className="btn-default-app bg-warning "
                                        disabled={false}
                                        onClick={
                                            () => props.onsettabbar_index_active ? props.onsettabbar_index_active(m.idx) : null
                                        }
                                    >
                                        <span className="material-icons icon-btn-left">
                                            add
                                        </span>

                                    </Button>
                                )
                            }
                        })}
                    </>
                ) : null}
            </div>
        )
    }

    if (props.block) {
        return (
            <div className='d-flex'>
                {props.tabbar.map((m, i) => {
                    let bg = 'bg-danger'
                    if (m.value == '1') {
                        bg = 'bg-success'
                    }
                    if (m.value == 'kri') {
                        bg = 'bg-warning'
                    }
                    return (
                        <div className='flex-1' key={i}>
                            <div
                                className={`btn-block-on-tap ${props.tabbar_index_active == i ? bg : ''}`}
                                onClick={() => props.onsettabbar_index_active ? props.onsettabbar_index_active(i) : null}
                                style={{ color: props.tabbar_index_active == i ? 'white' : colorsPallette.info }}
                            >
                                {m.label}
                            </div>
                        </div>
                    )
                })}

                {props.onDownload ? (
                    <BtnIcon
                        icon={
                            'download'
                        }
                        onTap={props.onDownload}
                        size={30}
                        color={colorsPallette.primary}
                        tooltips={
                            `Download`
                        }
                    />
                ) : null}
            </div>
        )
    }

    return (
        <ul className={`nav nav-pills mb-3 ${props.className ? props.className : ''}`}>
            {props.tabbar.map((m, i) => {
                // let bg = 'bg-danger'
                // if (m.value == '1') {
                //     bg = 'bg-success'
                // }

                let color_error = ''
                if (props.tab_error && props.tab_error[i]) {
                    color_error = 'color-danger'
                }
                return (
                    <li className="nav-item cursor-pointer" key={i}>
                        {m.href ? (
                            <Link
                                className={`nav-link ${color_error} ${props.tabbar_index_active == m.idx ? `active ` : ``}`}
                                href={m.href}
                            >
                                {m.label}
                                {m.gambar && (
                                    <TooltipsApp id={m.href} title="Fitur dilengkapi AI">
                                        <img src={m.gambar} style={{ width: 12, height: 12 }} />
                                    </TooltipsApp>
                                )}
                            </Link>
                        ) : (
                            <a onClick={() => props.onsettabbar_index_active ? props.onsettabbar_index_active(m.idx) : null} className={`nav-link ${color_error} ${props.tabbar_index_active == m.idx ? `active ` : ``}`}>{m.label}</a>
                        )}
                    </li>
                )
            })}

            {props.onDownload ? (
                <BtnIcon
                    icon={
                        'download'
                    }
                    onTap={props.onDownload}
                    size={30}
                    color={colorsPallette.primary}
                    tooltips={
                        `Download`
                    }
                />
            ) : null}
        </ul>
    )
}

export default TabbarApp