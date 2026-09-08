import React from 'react'
import TooltipsApp from './TooltipsApp';

const CheckboxSameValue = (props) => {
    if (props.is_disabled) return null

    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    let tooltipstext = 'Checklis jika isian sama di kolom ini!'
    if (props.tooltips) {
        tooltipstext = props.tooltips
    }

    return (
        <Links id={tooltipstext} title={tooltipstext}>
            <input
                type="checkbox"
                checked={props.checked}
                value={''}
                onChange={e => {
                    props.onChange(e.target.checked)
                }}
            />
        </Links>
    )
}

export default CheckboxSameValue