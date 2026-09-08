import React, { useState, useEffect, useRef } from "react";
import Select, { components } from "react-select";
import AsyncCreatableSelect from "react-select/async-creatable";
import Label from "components/Label";
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

const InputSelectCreate = ({ disabled = false, className, ...props }) => {
  const [trigger, settrigger] = useState(0);
  // const [selected, setselected] = useState(props.isMulti ? [] : {})
  const [selected, setselected] = useState([]);
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
  }, [props.data, props.value, props.valueObj]);

  useEffect(() => {
    handleError();
  }, [trigger]);

  const Links = (props) => <TooltipsApp {...props} />;

  const handleInit = () => {
    // console.log('handleInit')
    // console.log(props.valueObj)
    // console.log(props.data)
    // let selected = props.isMulti ? [] : {}
    let selected = [];

    let propsValue = props.valueObj ? props.valueObj : props.value;
    for (let i = 0; i < props.data.length; i++) {
      if (props.valueObj && props.data[i].value === propsValue.value) {
        selected = props.data[i];
        break;
      } else if (!props.valueObj && props.data[i].value === propsValue) {
        selected = props.data[i];
        break;
      }
    }

    // console.log('selected')
    // console.log(selected)

    if (propsValue && !props.valueObj && Object.keys(selected).length == 0) {
      selected = { label: propsValue, value: null };
    } else if (
      propsValue &&
      props.valueObj &&
      Object.keys(selected).length == 0
    ) {
      selected = { label: propsValue.label, value: null };
    }
    // console.log('selected=>1')
    // console.log(selected)

    // console.log('selected')
    // console.log(selected)

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

  const handleChange = (val) => {
    // console.log(val)
    // console.log(val.value)
    settrigger(trigger + 1);
    setselected(val);
    if (val == null) props.onChange(null);
    else {
      props.onChange(props.valueItem ? val : val.value);
    }
  };

  const handleError = () => {
    let value_is_null = false;
    if (props.isMulti) {
      if (props.message_error && selected.length === 0) {
        value_is_null = true;
      }
    } else {
      if (props.message_error && Object.keys(selected).length === 0) {
        value_is_null = true;
      }
    }
    setmessage_error_visible(value_is_null);
  };

  return (
    <>
      {disabled ? (
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
        <AsyncCreatableSelect
          classNamePrefix="custom-select-rn-dnd"
          placeholder={<div>{props.placeholder}</div>}
          isMulti={props.isMulti}
          loadOptions={props.loadOptions ? props.loadOptions : null}
          defaultOptions={props.data}
          value={selected}
          isClearable={props.isClearable}
          styles={
            !props.transparent
              ? {
                ...stylesNormal,
              }
              : {
                ...stylesTransparent,
                control: (styles) => ({
                  ...styles,
                  border: 0,
                  boxShadow: "none",
                  backgroundColor: disabled ? "transparent" : "transparent",
                }),
                menu: (provided, state) => ({
                  ...provided,
                  marginTop: -5,
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

export default InputSelectCreate;
