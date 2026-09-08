import { NumericFormat } from "react-number-format";

export default ({ disabled = false, className, ...props }) => {
    return (!props.edited ? (props.value ? props.value : <i>Tidak ada data.</i>) : (
        <NumericFormat
            className={`${className} ${props.message_error && props.value === ''
                ? 'form-controll-error'
                : ''
                } rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
            style={{
                backgroundColor: 'white',
                textAlign: 'right'
            }}
            placeholder={props.placeholder}
            value={props.value}
            prefix={props.prefix ? "Rp" : ""}
            decimalSeparator=","
            type="text"
            thousandSeparator="."
            onValueChange={(valueObj) => {
                props.onChange(valueObj.value)
            }}
            disabled={disabled}
            allowLeadingZeros
        />
    ))
};
