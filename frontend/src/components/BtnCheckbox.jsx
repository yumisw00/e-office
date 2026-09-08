import React from 'react'
import BtnIcon from './BtnIcon'
import BtnIconAct from './BtnIconAct'

const BtnCheckbox = (props) => {
    return (
        <BtnIconAct
            icon="check_box"
            label={props?.label || ''}
            className={`bg-primary ${props.className || ''}`}
            onTap={() => {

            }}
            height={40}
        />
    )
}

export default BtnCheckbox