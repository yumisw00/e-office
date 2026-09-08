import React, { useState, useEffect, useRef } from 'react'
import Select, { components } from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import Label from 'components/Label'
import BtnIconAct from './BtnIconAct';
import TooltipsApp from './TooltipsApp';


const { IndicatorSeparator, DropdownIndicator, MultiValueContainer } = components;

const stylesNormal = {
    placeholder: (provided, state) => ({
        ...provided,
        position: "absolute",
        top: state.hasValue || state.selectProps.inputValue ? -15 : "15%",
        fontSize: 14
    }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
            ...styles,
            fontSize: 14
        };
    },
    control: styles => ({
        ...styles,
        fontSize: 14
    }),
}

const stylesTransparent = {
    ...stylesNormal,
    control: styles => ({
        ...styles,
        border: 0,
        boxShadow: 'none',
    }),
    container: (styles) => ({
        ...styles,
        height: 30
    }),
}

const InputSelectCombo = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const [selected, setselected] = useState(props.isMulti ? [] : {})
    const [message_error_visible, setmessage_error_visible] = useState("")
    const [valuetext, setvaluetext] = useState("")
    const [input_select, setinput_select] = useState([{ selected: {} }])

    const initialized = useRef(false)
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
        }
        if (true) {
            handleInit()
        }
    }, [props.data, props.value])

    useEffect(() => {
        handleError()
    }, [trigger])

    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    const handleInit = () => {
        // console.log('handleInit')
        // console.log(props.value)

        let input_select = []
        props.value.map(m => {
            input_select.push({ selected: m })
        })

        // console.log('input_select')
        // console.log(input_select)

        if (input_select.length == 0) {
            // input_select.push({ selected: {} })
            input_select.push({ selected: [] })
        }
        setinput_select(input_select)
        settrigger(trigger + 1)

        // let valuetext = ""
        // if (props.isMulti) {
        //     selected.map((m, i) => {
        //         valuetext += `${m.label}${i === selected.length - 1 ? '' : ','} `;
        //     })
        // } else {
        //     valuetext = selected.label
        // }
        // setvaluetext(valuetext)
    }

    const handleChange = (val, index) => {
        // console.log(val)
        // console.log(val.value)
        settrigger(trigger + 1)
        setselected(val)

        input_select.map((m, i) => {
            if (i == index) {
                m.selected = val
            }
        })
        setinput_select(input_select)


        handleChangeParentState(input_select)
    }

    const handleChangeParentState = (input_select) => {
        let val_selected = []
        input_select.map(m => {
            val_selected.push({ ...m.selected, value: m.selected.__isNew__ ? null : m.selected.value, label: m.selected.label })
        })
        // console.log('val_selected')
        // console.log(val_selected)
        props.onChange(val_selected)
    }

    const handleError = () => {
        let value_is_null = false
        if (props.isMulti) {
            if (props.message_error && selected.length === 0) {
                value_is_null = true
            }
        } else {
            if (props.message_error && Object.keys(selected).length === 0) {
                value_is_null = true
            }
        }
        setmessage_error_visible(value_is_null)
    }

    const handleAddSelect = () => {
        let input_selectObj = input_select
        // console.log(input_selectObj)
        // console.log(input_selectObj)
        // input_selectObj.push({ selected: {} })
        input_selectObj.push({ selected: [] })
        settrigger(trigger + 1)
        setinput_select(input_selectObj)
    }

    const handleDeleteSelect = index => {
        let input_selectObj = []
        input_select.map((m, i) => {
            if (i != index) {
                input_selectObj.push(m)
            }
        })
        settrigger(trigger + 1)
        setinput_select(input_selectObj)

        handleChangeParentState(input_selectObj)
    }

    return (
        <>
            {input_select.map((m, i) => (
                <div key={i} className='flex items-center'>
                    {props.withNumb ? (
                        <div className='me-2'>{i + 1}.</div>
                    ) : null}
                    <div className='flex-1'>
                        {disabled ? (
                            <div>{m.selected.label}</div>
                        ) : (
                            <>
                                {props.notCreate ? (
                                    <Select
                                        classNamePrefix="custom-select-rn-dnd"
                                        placeholder={<div>{props.placeholder}</div>}
                                        isMulti={false}
                                        options={props.data}
                                        value={m.selected}
                                        isClearable={false}
                                        styles={!props.transparent ? {
                                            ...stylesNormal,
                                        } : {
                                            ...stylesTransparent,
                                            control: styles => ({
                                                ...styles,
                                                border: 0,
                                                boxShadow: 'none',
                                                backgroundColor: disabled ? 'transparent' : 'transparent',
                                            }),
                                            menu: (provided, state) => ({
                                                ...provided,
                                                marginTop: -5
                                            }),
                                        }}
                                        onChange={(selected) => handleChange(selected, i)}
                                        isDisabled={disabled}

                                    />
                                ) : (
                                    <AsyncCreatableSelect
                                        classNamePrefix="custom-select-rn-dnd"
                                        placeholder={<div>{props.placeholder}</div>}
                                        isMulti={false}
                                        defaultOptions={props.data}
                                        cacheOptions
                                        loadOptions={props.loadOptions}
                                        value={m.selected}
                                        isClearable={props.isClearable}
                                        styles={!props.transparent ? {
                                            ...stylesNormal,
                                        } : {
                                            ...stylesTransparent,
                                            control: styles => ({
                                                ...styles,
                                                border: 0,
                                                boxShadow: 'none',
                                                backgroundColor: disabled ? 'transparent' : 'transparent',
                                            }),
                                            menu: (provided, state) => ({
                                                ...provided,
                                                marginTop: -5
                                            }),
                                        }}
                                        onChange={(selected) => handleChange(selected, i)}
                                        isDisabled={disabled}
                                    />
                                )}
                            </>
                        )}
                    </div>
                    {disabled ? null : (
                        <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDeleteSelect(i)} />
                    )}
                </div>
            ))}

            {disabled ? null : (

                <div className='flex justify-end'>
                    <BtnIconAct width={20} icon="add" className="btn-info" onTap={handleAddSelect} />
                </div>
            )}

            {props.message_error ? (
                <span className="text-danger message-error-form">{props.message_error}</span>
            ) : null}
        </>




    )
}

export default InputSelectCombo
