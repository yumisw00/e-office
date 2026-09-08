

export default ({ disabled = false, className, ...props }) => {
    return (!props.edited ? (
        props.value ? (
            props.value
        ) : (
            <i>
                {props.value ? props.value : 'Tidak ada data.'}
            </i>
        )
    ) : (
        <textarea
            style={{ width: "100%" }}
            disabled={!props.edited}
            className={`${className} ${props.message_error && props.value === ''
                ? 'form-controll-error'
                : ''
                } rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
            {...props}></textarea>
    ))
};
