import React from 'react'

const ColorBadges = (props) => {
    return (
        <div className='d-flex color-badge-container'>
            {props.title ? (
                <div>{props.title}</div>
            ) : null}
            {props.data.map((m, i) => (
                <div className='' key={i}>
                    <div className={` ${m.bg ? `bg-${m.bg}` : ``}`}></div>
                    <div className=' '>
                        {m.label}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ColorBadges