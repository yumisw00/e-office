import React, { useState, useEffect, useRef } from "react";
import Select, { components } from "react-select";
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

const InputSelect = ({ disabled = false, className, ...props }) => {
  // console.log('InputSelect=>rerender');

  const [trigger, settrigger] = useState(0);
  const [selected, setselected] = useState(props.isMulti ? [] : {});
  const [message_error_visible, setmessage_error_visible] = useState("");
  const [valuetext, setvaluetext] = useState("");

  const handleChange = (val, val1) => {
    if (props.isMulti) {
      // Send array of values so parent can handle comma-separated conversion
      props.onChange(val)
    } else {
      props.onChange(val?.value || '')
    }
  };

  return (
    <>
      {/* {disabled && !props.colorapply ? (
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
        <Select
          classNamePrefix="custom-select-rn-dnd"
          placeholder={<div>{props.placeholder}</div>}
          isMulti={props.isMulti}
          options={props.data}
          value={
            props.value
              ? props.isMulti
                ? (props.value === '' ? [] : String(props.value).split(',').map(v => v.trim()).filter(Boolean).map(val => props.data.find(m => String(m.value) === String(val)) || { value: val, label: val }))
                : (props?.data?.find(m => String(m.value) === String(props.value)) || null)
              : null
          }
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
      )} */}
      {disabled ? (
        <>
          {!props.value ? (
            <i className="mb-4">
              Tidak ada data.
            </i>
          ) : (
            <div>
              {props?.data?.find(m => m.value == props.value)?.label || ''}
            </div>
          )}
        </>
      ) : (
        <Select
          classNamePrefix="custom-select-rn-dnd"
          placeholder={<div>{props.placeholder}</div>}
          isMulti={props.isMulti}
          options={props.data}
          value={
            props.value
              ? props.isMulti
                ? (props.value === '' ? [] : String(props.value).split(',').map(v => v.trim()).filter(Boolean).map(val => props.data.find(m => String(m.value) === String(val)) || { value: val, label: val }))
                : (props?.data?.find(m => String(m.value) === String(props.value)) || null)
              : null
          }
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

// export default React.memo(InputSelect);

export default React.memo(InputSelect, (prevProps, nextProps) => {
  if (prevProps.value !== nextProps.value) return false;

  if (prevProps.placeholder !== nextProps.placeholder) return false;

  if (prevProps.disabled !== nextProps.disabled) return false;

  if (prevProps.message_error !== nextProps.message_error) return false;

  if (prevProps.data.length !== nextProps.data.length) return false;

  return prevProps.data.every((item, index) =>
    item.value === nextProps.data[index].value
  );
});
