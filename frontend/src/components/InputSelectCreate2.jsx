import React, { useState, useEffect, useRef } from "react";
import Select, { components } from "react-select";
import Label from "components/Label";
import Creatable from "react-select/creatable";

import TooltipsApp from "./TooltipsApp";

const { IndicatorSeparator, DropdownIndicator, MultiValueContainer } =
    components;

const stylesNormal = {
    placeholder: (provided, state) => ({
        ...provided,
        position: "absolute",
        top: state.hasValue || state.selectProps.inputValue ? -15 : "15%",
        fontSize: 14,
    }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
            ...styles,
            fontSize: 14,
        };
    },
    control: (styles) => ({
        ...styles,
        fontSize: 14,
    }),
};

const stylesTransparent = {
    ...stylesNormal,
    control: (styles) => ({
        ...styles,
        border: 0,
        boxShadow: "none",
    }),
    container: (styles) => ({
        ...styles,
        height: 30,
    }),
};

const InputSelectCreate2 = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0);
    const [selected, setselected] = useState(props.isMulti ? [] : {});
    const [message_error_visible, setmessage_error_visible] = useState("");
    const [valuetext, setvaluetext] = useState("");

    const initialized = useRef(false);
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
        }
        if (true) {
            handleInit();
        }
    }, [props.data, props.value]);

    useEffect(() => {
        handleError();
    }, [trigger]);

    const Links = (props) => <TooltipsApp {...props} />;

    const handleInit = () => {
        // console.log('handleInit')
        // console.log(handleInit)
        // let selected = props.isMulti ? [] : {}
        let selected = [];
        if (props.isMulti) {
            props.value.map((m, i) => {
                props.data.forEach((e) => {
                    if (m === e.value) {
                        selected.push(e);
                    }
                });
            });
        } else {
            for (let i = 0; i < props.data.length; i++) {
                if (props.data[i].value === props.value) {
                    selected = props.data[i];
                    break;
                }
            }
        }

        // console.log('selected============>')
        // console.log(selected)
        // console.log(props.data)
        // console.log(props.value)
        // console.log('selected=>end============>')

        setselected(selected);
        settrigger(trigger + 1);

        let valuetext = "";
        if (props.isMulti) {
            selected.map((m, i) => {
                valuetext += `${m.label}${i === selected.length - 1 ? "" : ","} `;
            });
        } else {
            valuetext = selected.label;
        }
        setvaluetext(valuetext);
    };

    const handleChange = (val, val1) => {
        // console.log('val')
        // console.log(val)
        // console.log(val.value)
        // return
        settrigger(trigger + 1);
        setselected(val);
        if (val == null) {
            props.onChange(null);
            // props.onChange([])
        } else {
            if (props.isMulti) {
                let dataarr = [];
                val.map((m) => {
                    dataarr.push(m.value);
                });
                props.onChange(dataarr);
            } else {
                props.onChange(props.valueItem ? val : val.value, val1);
            }
        }
    };

    const handleError = () => {
        let value_is_null = false;
        if (props.isMulti) {
            if (props.message_error && selected.length === 0) {
                value_is_null = true;
            }
        } else {
            if (
                props.message_error &&
                selected &&
                Object.keys(selected).length === 0
            ) {
                value_is_null = true;
            }
        }
        setmessage_error_visible(value_is_null);
    };


    return (
        <>
            {disabled && !props.colorapply ? (
                <>
                    {props.isMulti && selected.length > 0 ? (
                        <>{valuetext}</>
                    ) : !props.isMulti && Object.keys(selected).length > 0 ? (
                        <>{valuetext}</>
                    ) : (
                        <i className="mb-4">
                            {props.value ? props.value : "Tidak ada data."}
                        </i>
                    )}
                </>
            ) : (
                <Creatable
                    classNamePrefix="custom-select-rn-dnd"
                    placeholder={<div>{props.placeholder}</div>}
                    isMulti={props.isMulti}
                    options={props.data}
                    value={selected}
                    isClearable={props.isClearable}
                    styles={{
                        ...stylesNormal,
                        control: (styles) => ({
                            ...styles,
                            backgroundColor:
                                props.colorapply && selected.colorapply
                                    ? selected.colorapply
                                    : "transparent",
                        }),
                    }
                    }
                    onChange={handleChange}
                    isDisabled={disabled}
                />
            )}
            {props.message_error ? (
                <span className="text-danger message-error-form">
                    {props.message_error}
                </span>
            ) : null}
        </>
    );
};

export default InputSelectCreate2;
