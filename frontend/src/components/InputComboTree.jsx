import React, { useState, useEffect } from 'react'
import Label from './Label'
import { ComboBox, ComboTree, Tree } from 'rc-easyui'

const InputComboTree = (props) => {
    const [value, setvalue] = useState(null)

    // useEffect(() => {
    //     initValue()
    // }, [props.data, props.value])

    const initValue = () => {
        let value = null
        for (let i = 0; i < props.data.length; i++) {
            if (props.data[i].id == props.value) {
                value = props.data[i]
                break
            }
        }

        // console.log('initValue')
        // console.log(props.data)
        // console.log(props.value)
        // console.log(value)
        setvalue(value)
    }

    return (
        <>
            <Label
                className={`font-medium`}>
                {props.label}{' '}
                <span className="color-danger">*</span>
            </Label>
            <ComboTree
                placeholder={props.placeholder}
                data={props.data}
                value={props.defaultValue}
                onChange={props.onChange}
            />
        </>
    )
}

export default InputComboTree