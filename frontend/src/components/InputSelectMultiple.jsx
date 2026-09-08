import React from 'react'
import BtnIconAct from './BtnIconAct'
import InputSelect from './InputSelect'
import InputSelectAsync from './InputSelectAsync'


const InputSelectMultiple = (props) => {
    // console.log('InputSelectMultiple=>');
    // console.log(props.options);
    // console.log(props.data);

    return (
        <>
            <div>
                {props.data.map((m, i) => (
                    <div key={i} className="d-flex">
                        <div className='bold pe-2'>{i + 1}</div>
                        <div className="flex-1">
                            {!props.disabled ? (
                                <>
                                    {!props.is_async ? (
                                        <InputSelect
                                            ref={null}
                                            id=''
                                            type='text'
                                            placeholder={props.placeholder}
                                            className='block mt-1 w-full'
                                            required={false}
                                            data={props.options}
                                            value={m?.value || ''}
                                            onChange={value => props.onChange(value, i)}
                                            message_error={null}
                                            onError={() => null}
                                            disabled={false}
                                        />
                                    ) : (
                                        <InputSelectAsync
                                            ref={null}
                                            id=''
                                            type='text'
                                            placeholder={props.placeholder}
                                            className='block mt-1 w-full'
                                            required={false}
                                            data={props.options}
                                            value={m?.value || ''}
                                            onChange={value => props.onChange(value, i)}
                                            message_error={null}
                                            onError={() => null}
                                            disabled={false}
                                            loadOptions={props.loadOptions}
                                        />
                                    )}
                                </>

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

}

export default InputSelectMultiple