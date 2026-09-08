

import { forwardRef } from 'react'
import Label from 'components/Label'
import TooltipsApp from './TooltipsApp';

const FormLabel = ({ children, ...props }) => {
    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    return (
        <div className={
            props.formCol
                ? ''
                : `form-group row`
        }>

            <Label
                className={`${props.formCol ? 'text-left' : 'text-right'
                    } col-sm-4 font-medium ${props.message_error && props.value === ''
                        ? 'text-danger'
                        : ''
                    }`}>
                {props.label}{' '}
                {props.required ? (
                    <span className="color-danger">*</span>
                ) : null}

                {props.tooltips && !props.disabled ? (
                    <Links id={props.tooltips} title={props.tooltips}>
                        <span className='material-icons icon-help-tooltips'>info</span>
                    </Links>
                ) : null}
            </Label>
            <div className="col-sm-8 mb-5">
                {children ? children : props.form}
                {props.message_error && props.value === '' ? (
                    <span className="text-danger message-error-form">
                        {props.message_error}
                    </span>
                ) : null}
            </div>
        </div>
    )
}

export default FormLabel
