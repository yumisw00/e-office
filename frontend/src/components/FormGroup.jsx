import React from 'react'
import Label from './Label'
import TooltipsApp from './TooltipsApp';

const FormGroup = ({ children, ...props }) => {
    let row = 'row'
    if (props.formCol) {
        row = ''
    }
    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    if (props.hideFormGroup) return children

    return (
        <div className={`form-group ${!props.noMb ? 'mb-3' : ''} ${row}`}>
            <Label
                className={`${row ? 'col-sm-4' : ''} ${row ? 'text-end' : ''} ${props.message_error
                    ? 'text-danger'
                    : ''
                    }`}
            >
                {props.label}
                {props.required && !props.disabled ? (
                    <span className="color-danger">*</span>
                ) : null}

                {!props.disabled && props.tooltips ? (
                    <Links id={props.tooltips} title={props.tooltips}>
                        <span className='material-icons icon-help-tooltips'>info</span>
                    </Links>
                ) : null}
            </Label>
            {children}

        </div>
    )
}

export default FormGroup