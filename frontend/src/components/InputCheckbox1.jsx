import React, { useEffect, useState } from 'react'
import Label from 'components/Label'

const InputCheckbox = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const [isSelected, setisSelected] = useState(false)

    const handleChange = (item) => {
        settrigger(trigger + 1)

        // if (props.isMulti) {
        handleChangeMulti(item)
        // } else {
        //     handleChangeSingle(item)
        // }
        // let selected = [...props.value]
        // let ready = false
        // for (let i = 0; i < selected.length; i++) {
        //     if (selected[i] === item.value) {
        //         ready = true
        //         break
        //     }
        // }
        // let selected_new = []
        // if (ready === true) {
        //     selected.map((m, i) => {
        //         if (m !== item.value) {
        //             selected_new.push(m)
        //         }
        //     })
        // } else {
        //     selected_new = [...selected]
        //     selected_new.push(item.value)
        // }
        // // console.log(selected_new)
        // props.onChange(selected_new)

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
        props.onChange(item.value)

    }


    return (
        <div className={`grid gap-4 ${props.label ? 'grid-cols-3' : ''}`}>
            {props.label ? (
                <Label className={`text-right font-medium ${props.message_error && props.value.length === 0 ? 'text-danger' : ''}`}>{props.label} {props.required ? <span className="color-danger">*</span> : null}</Label>
            ) : null}
            <div className="col-span-2 mb-5">
                <div className='flex flex-row'>
                    {props.data.map((m, i) => {
                        let checked = props.value.includes(m.value)
                        // if (props.isMulti) {

                        //     for (let x = 0; x < props.value.length; x++) {
                        //         if (props.value[x] === m.value) {
                        //             checked = true
                        //             break
                        //         }
                        //     }
                        // } else {
                        //     if (props.value === m.value) {
                        //         checked = true
                        //     }
                        // }

                        return (
                            <label key={i} className='mr-4 flex flex-row'>
                                <input
                                    value={m.value}
                                    disabled={disabled}
                                    checked={checked}
                                    className={`${className} mr-2 rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                    onChange={e =>
                                        handleChange(e.target.checked)
                                    }
                                    style={{ width: 15 }}
                                />
                                {m.label}
                            </label>
                        )
                    })}
                </div>
                {props.message_error && props.value.length === 0 ? (
                    <span className="text-danger message-error-form">{props.message_error}</span>
                ) : null}

            </div>
        </div>
    )
}

export default InputCheckbox