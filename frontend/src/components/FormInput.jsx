

import TooltipsApp from './TooltipsApp'

const FormInput = ({ className, ...props }) => {
    return (

        props.edited != true ?
            (props.value ? props.value : <i>Tidak ada data</i>)
            : (
                <>
                    {props.type === 'textarea' ? (
                        <textarea
                            // ref={ref}
                            disabled={props.edited != true}
                            className={`${className} ${props.message_error && props.value === ''
                                ? 'form-controll-error'
                                : ''
                                } rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                            {...props}></textarea >
                    ) : (
                        <input
                            // ref={ref}
                            disabled={props.edited != true}
                            className={`${className} ${props.message_error && props.value === ''
                                ? 'form-controll-error'
                                : ''
                                } rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`
                            }
                            {...props}
                        />
                    )}
                </>
            )
    )
}

export default FormInput
