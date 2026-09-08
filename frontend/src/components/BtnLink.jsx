import React from 'react'
import Link from 'components/Link'

const BtnLink = (props) => {
    return (
        <Link
            style={{
                height: props?.height || 30
            }}
            className={`btn-default-app ${props.className || ''}`}
            href={props?.href || '/'}
            blank={props.blank || null}
        >
            {props.icon ? (<span className='material-icons mr-1' style={{ fontSize: 16, marginTop: 0 }}>{props.icon}</span>) : null}
            {props.label || ''}
        </Link>
    )
}

export default BtnLink