import React from 'react'
import BtnIconAct from './BtnIconAct'
import Input from './Input'

const InputMultiple = (props) => {

    return (
        <>
            <div>
                {props.data.map((m, i) => (
                    <div key={i} className="d-flex">
                        {/* <div className='bold pe-2'>{i + 1}</div> */}
                        <div className="flex-1">
                            {!props.disabled ? (
                                <Input
                                    ref={null}
                                    id=''
                                    type='textarea'
                                    placeholder={props.placeholder}
                                    className='block mt-1 w-full'
                                    required={false}
                                    value={m.value}
                                    onChange={value => props.onChange(value, i)}
                                    message_error={null}
                                    onError={() => null}
                                    disabled={false}
                                />
                            ) : m.value}
                        </div>
                        {!props.disabled ? (

                            <div className='ps-2'>
                                <BtnIconAct icon="remove" className="btn-danger" onTap={
                                    () => {
                                        props.onRemove(i)
                                    }
                                } />
                            </div>
                        ) : null}
                    </div>
                ))}
                {!props.disabled ? (

                    <div className="d-flex justify-content-end">
                        <BtnIconAct icon="add" className="btn-info" onTap={props.onAdd} />
                    </div>
                ) : null}
            </div>
        </>
    )
    return (
        <>
        </>
    )
}

export default InputMultiple