import React, { useEffect, useState } from 'react'


const InputCheckbox = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const [isSelected, setisSelected] = useState(false)

    const handleChange = (item) => {
        settrigger(trigger + 1)

        if (props.isMulti) {
            handleChangeMulti(item)
        } else {
            handleChangeSingle(item)
        }

    }

    const handleChangeMulti = (item) => {
        let selected = [...props.value]
        let ready = false
        for (let i = 0; i < selected.length; i++) {
            if (selected[i] === item.value) {
                ready = true
                break
            }
        }
        let selected_new = []
        if (ready === true) {
            selected.map((m, i) => {
                if (m !== item.value) {
                    selected_new.push(m)
                }
            })
        } else {
            selected_new = [...selected]
            selected_new.push(item.value)
        }
        // console.log(selected_new)
        props.onChange(selected_new)

    }

    const handleChangeSingle = (item) => {
        // console.log('handleChangeSingle')
        // console.log(item)
        settrigger(trigger + 1)
        props.onChange(item == true ? '1' : '')

    }

    return (
        <>
            {props.data && props.data.length > 0 ? props.data.map((m, i) => {
                let checked = false
                if (parseInt(props.value) === parseInt(m.value)) {
                    checked = true
                }
                return (
                    <label key={i} className='mr-4 flex flex-row'>
                        <input
                            value="1"
                            disabled={disabled}
                            checked={checked}
                            className={`${className} mr-2 rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                            {...props}
                            onChange={e =>
                                handleChange(e.target.checked)
                            }
                            style={{ width: 15 }}
                        />
                        {m.label}
                    </label>
                )
            }) : null}
            {props.message_error ? (
                <span className="text-danger message-error-form">{props.message_error}</span>
            ) : null}
        </>
    )
}

export default InputCheckbox