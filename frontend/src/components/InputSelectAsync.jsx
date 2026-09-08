import React, { useState, useEffect, useRef } from 'react'
import Select, { components } from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import AsyncSelect from 'react-select/async';


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

const InputSelectAsync = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const [selected, setselected] = useState(props.isMulti ? [] : {})
    const [message_error_visible, setmessage_error_visible] = useState("")
    const [valuetext, setvaluetext] = useState("")


    const initialized = useRef(false)
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
        }
        if (true) {
            handleInit()
        }
    }, [props.data, props.value])

    // useEffect(()=> {
    //     if(props.length && props.length > 0 && props.id == 'id_pic') {
    //         handleInit()
    //     }
    // }, [props.length])

    useEffect(() => {
        handleError()
    }, [trigger])


    const handleInit = () => {
        // if(props.id == 'id_pic') {
        //     console.log('handleInit')
        //     console.log(props.data.length)

        // }
        let newSelected = [];
        if (props.isMulti) {
            props.value.map((m, i) => {
                props.data.forEach(e => {
                    if (m === e.value) {
                        newSelected.push(e)
                    }
                });
            })
            // preserve existing selections that aren't in new data yet
            if (newSelected.length === 0 && selected.length > 0) {
                newSelected = selected.filter(s =>
                    props.value.includes(s.value)
                );
            }
        } else {
            // first, try to find in current data
            let found = false;
            for (let i = 0; i < props.data.length; i++) {
                if (props.data[i].value == props.value) {
                    newSelected = props.data[i];
                    found = true;
                    break;
                }
            }
            // if not found in new data but we already have a matching selected, keep it
            if (!found && selected && selected.value == props.value) {
                newSelected = selected;
            }
        }

        // console.log('selected')
        // console.log(props.data)
        // console.log(props.value)
        // console.log(selected)

        setselected(newSelected)
        settrigger(trigger + 1)

        let valuetext = ""
        if (props.isMulti) {
            newSelected.map((m, i) => {
                valuetext += `${m.label}${i === newSelected.length - 1 ? '' : ','} `;
            })
        } else {
            valuetext = newSelected && newSelected.label ? newSelected.label : (selected && selected.label ? selected.label : "")
        }
        setvaluetext(valuetext)
    }

    const handleChange = (val, val1) => {
        // console.log(val)
        // console.log(val1)
        // console.log(val.value)
        settrigger(trigger + 1)
        setselected(val)
        if (val == null) {
            props.onChange(null)
            // props.onChange([])
        } else {
            if (props.isMulti) {
                let dataarr = []
                val.map(m => {
                    dataarr.push(m.value)
                })
                props.onChange(dataarr)
            } else {
                // Pass full val (label + value) so parent can show label correctly
                props.onChange(val, val)
            }
        }
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



    return (
        <>
            {disabled ? (
                <>
                    {props.isMulti && selected.length > 0 ? (
                        <>
                            {valuetext}
                        </>
                    ) : !props.isMulti && Object.keys(selected).length > 0 ? (
                        <>
                            {valuetext}
                        </>
                    ) : (
                        <i className="mb-4">{props.value ? props.value : "Tidak ada data."}</i>
                    )}
                </>
            ) : (
                <>
                    {props.create ? (
                        <AsyncCreatableSelect
                            classNamePrefix="custom-select-rn-dnd"
                            placeholder={<div>{props.placeholder}</div>}
                            isMulti={props.isMulti}
                            options={props.data}
                            defaultOptions={props.data}
                            cacheOptions
                            loadOptions={props.loadOptions ? props.loadOptions : null}
                            value={selected}
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
                            // components={props.transparent ? {
                            //     DropdownIndicator: () => null,
                            //     IndicatorSeparator: () => null
                            // } : undefined}
                            onChange={handleChange}
                            isDisabled={disabled}
                        />

                    ) : (
                        <AsyncSelect
                            classNamePrefix={`custom-select-rn-dnd ${props.className ? props.className : ''}`}
                            placeholder={<div>{props.placeholder}</div>}
                            isMulti={props.isMulti}
                            options={props.data}
                            defaultOptions={props.data}
                            cacheOptions
                            loadOptions={props.loadOptions ? props.loadOptions : null}
                            value={selected}
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
                            // components={props.transparent ? {
                            //     DropdownIndicator: () => null,
                            //     IndicatorSeparator: () => null
                            // } : undefined}
                            onChange={handleChange}
                            isDisabled={disabled}
                        // inputValue={props.inputValue || ''}
                        // onInputChange={props.onInputChange ? props.onInputChange : null}
                        // onBlur={props.onBlur ? props.onBlur : null}
                        />
                    )}
                </>
            )}
            {props.message_error ? (
                <span className="text-danger message-error-form">{props.message_error}</span>
            ) : null}
        </>





    )
}

export default InputSelectAsync
