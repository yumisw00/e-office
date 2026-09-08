import React from 'react'
import BtnIcon from './BtnIcon'

const BtnResetFilter = (props) => {
    return (
        <div>
            <BtnIcon
                icon="restart_alt"
                tooltips="Reset semua filter"
                onTap={() => {
                    props.onTap()
                }}
                className={`btn-icons-add ${props.className ? props.className : ''}`}
            />
        </div>
    )
}

export default BtnResetFilter