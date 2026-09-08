
import { NumericFormat } from 'react-number-format';
import { rupiah } from "lib/helper";


const InputNumeric = ({ disabled = false, className, ...props }) => {

    return (
        <>
            {disabled ? (
                <>
                    {props.value ? (
                        <div className="mb-4">{rupiah(props.value)}</div>

                    ) : (
                        // <i className="mb-4">{props.value ? props.value : "Tidak ada data."}</i>
                        <i className="mb-4">{props.value == '0' || props.value == 0 ? '0' : ''}</i>

                    )}
                </>
            ) : (
                <NumericFormat
                    className={`${className} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                    style={{
                        backgroundColor: 'white',
                        textAlign: 'right'
                    }}
                    placeholder={props.placeholder}
                    // thousandsGroupStyle="thousand"
                    value={props.value}
                    prefix={props.prefix ? "Rp" : ""}
                    decimalSeparator=","
                    // displayType="input"
                    type="text"
                    thousandSeparator="."
                    // allowNegative={false}
                    onValueChange={(valueObj) => {
                        props.onChange(valueObj.value)
                    }}
                    disabled={disabled}
                    allowLeadingZeros
                    maxLength={props.maxLength ? props.maxLength : null}
                    onBlur={props.onBlur ? props.onBlur : null}
                />

            )}
            {props.message_error ? (
                <span className="text-danger message-error-form">{props.message_error}</span>
            ) : null}
        </>
    )
}

export default InputNumeric
