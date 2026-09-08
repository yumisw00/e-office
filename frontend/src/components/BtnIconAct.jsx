

import React, { useState } from 'react'
import NavLink from 'components/NavLink'
// import Link from 'components/Link'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import TooltipsApp from './TooltipsApp';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useSelector, useDispatch } from 'react-redux'
import { urlDownload, urlPreview } from 'pages/Utils';


const BtnIconAct = (props) => {
    const is_page_readonly = useSelector(state => state.is_page_readonly)

    let btn = 'btn-info'
    if (props.icon == 'delete') {
        btn = 'btn-danger'
    }
    if (props.icon == 'edit') {
        btn = 'btn-warning'
    }

    if (is_page_readonly && !props.abaikan_is_page_readonly) {
        return null
    }

    const Links = (props) => (
        <TooltipsApp {...props} />
    );


    if (props.href) {
        return (
            <>
                <NavLink
                    blank={props.blank ? props.blank : null}
                    href={props.href}
                    active={false}>
                    <div className={`btn-icon-act rounded-sm  ${props.className ? props.className : ''} ${props.label ? 'width-auto pl-1 pr-1' : ''}`}>
                        {!props.right ? (
                            <span className={`material-icons icon-btn-left ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.icon}</span>
                        ) : null}
                        {props.label ? (
                            <span className={`ml-1 btn-icon-act-label ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.label}</span>
                        ) : null}
                        {props.right ? (
                            <span className={`material-icons icon-btn-left ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.icon}</span>
                        ) : null}
                    </div>
                </NavLink>
            </>
        )
    }

    if (props.tooltips) {
        return (
            <Links title={props.tooltips} id={props.tooltips}>
                <div className={`btn-icon-act rounded-sm ${props.className ? props.className : ''} ${props.label ? 'width-auto pl-1 pr-1' : ''}`} onClick={props.onTap ? props.onTap : null}>
                    {!props.right ? (
                        <span className={`material-icons icon-btn-left ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.icon}</span>
                    ) : null}
                    {props.label ? (
                        <span className={`ml-1 btn-icon-act-label ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.label}</span>
                    ) : null}
                    {props.right ? (
                        <span className={`material-icons icon-btn-left ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.icon}</span>
                    ) : null}
                </div>
            </Links>
        )
    }
    return (
        <>
            <div
                style={{ width: props.width ? props.width : "auto", height: props.width ? props.width : "auto" }} className={`btn-icon-act rounded-sm pt-1 ${props.className ? props.className : ''} ${props.label ? 'width-auto pl-1 pr-1' : ''}`}
                onClick={() => {
                    if (props.onTap) {
                        props.onTap()
                    }
                    if (props.download) {
                        // window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}api/getfile${props.download}`
                        urlDownload(props.download)
                        // urlPreview(props.download)
                    }
                }}
            >
                {!props.right ? (
                    <span className={`material-icons icon-btn-left ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.icon}</span>
                ) : null}
                {props.label ? (
                    <span className={`ml-1 btn-icon-act-label ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.label}</span>
                ) : null}
                {props.right ? (
                    <span className={`material-icons icon-btn-left ${props.classNameColorText ? props.classNameColorText : ''}`}>{props.icon}</span>
                ) : null}
            </div>

        </>
    )
}

export default BtnIconAct