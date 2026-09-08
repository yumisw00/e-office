

import React, { forwardRef } from 'react'
import { extUploadFile, formatDateApp, stringEnter } from 'pages/Utils'


const Input = ({ disabled = false, className, ...props }) => {
    // console.log('Input=>rerender');
    const onChange = e => props.onChange(e.target.value)
    return (
        <>
            {disabled ? (
                <>
                    {props.value ? (
                        // <div className="">{props.type == 'date' && props.formatDate ? formatDateApp(props.value, props.formatDate) : props.value}</div>
                        <div className="">{props.type == 'date' && props.formatDate ? formatDateApp(props.value, props.formatDate) : (
                            <div dangerouslySetInnerHTML={{ __html: stringEnter(props.value || '') }}></div>
                        )}</div>
                    ) : (
                        <i className="">
                            {props.value ? props.value : 'Tidak ada data.'}
                        </i>
                    )}
                </>
            ) : (
                <>
                    {props.type === 'textarea' ? (
                        <textarea
                            disabled={disabled}
                            readOnly={props.readOnly}
                            className={`${className} ${props.message_error
                                ? 'form-controll-error'
                                : ''
                                } rounded-md  border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                            value={props.value}
                            type={props.type}
                            placeholder={props.placeholder}
                            onChange={onChange}
                            onBlur={props.onBlur ? props.onBlur : null}
                        ></textarea>
                    ) : (
                        <input
                            disabled={disabled}
                            readOnly={props.readOnly}
                            className={`${className} ${props.message_error ? 'form-controll-error'
                                : ''
                                } rounded-md  border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                            value={props.value}
                            type={props.type}
                            style={props.style}
                            placeholder={props.placeholder}
                            onChange={onChange}
                            onBlur={props.onBlur ? props.onBlur : null}
                        />
                    )}

                    {props.message_error ? (
                        <span className="text-danger message-error-form">
                            {props.message_error}
                        </span>
                    ) : null}
                </>
            )}
        </>
    )
}

// export default React.memo(Input)

export default React.memo(
    Input,
    (prevProps, nextProps) => {
        return prevProps.value === nextProps.value &&
            prevProps.type === nextProps.type &&
            prevProps.disabled === nextProps.disabled &&
            prevProps.readOnly === nextProps.readOnly &&
            prevProps.placeholder === nextProps.placeholder &&
            prevProps.style === nextProps.style &&
            prevProps.message_error === nextProps.message_error
    })
