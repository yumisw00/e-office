

import { forwardRef, useEffect, useRef, useState } from "react"
import Label from 'components/Label'
import { extUploadFile } from "pages/Utils"
import InputSelect from "./InputSelect"
import InputNumeric from "./InputNumeric"
import BtnIconAct from "./BtnIconAct"
import TooltipsApp from "./TooltipsApp"
import InputSelectCreate from "./InputSelectCreate"
import InputCheckbox from "./InputCheckbox"

// const Input = ({ disabled = false, className, ...props }) => (
//     <input
//         disabled={disabled}
//         className={`${className} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
//         {...props}
//     />
// )

const datapolaritas = {
    '+': 'Lower Better',
    '-': 'Higher Better',
    '+-': 'Stabilize'
}


const InputColumnMultipleMerge = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const [datanewkri_trigger, setdatanewkri_trigger] = useState(0)
    const [datanewkri, setdatanewkri] = useState('')
    const [add_and_select, setadd_and_select] = useState(1)

    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
        }
        if (true) {
            handlesetdatanewkri()
        }
        // console.log('props.value')
        // console.log(props.value)
    }, [datanewkri_trigger])

    const handlesetdatanewkri = () => {
        if (props.risk_profile) {
            setdatanewkri('')
            setadd_and_select(1)
        }
    }

    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    const handleChange = (column, value, index) => {
        // console.log(column)
        // console.log(value)
        // console.log(index)
        // console.log(props.value)
        let dataobj = props.value
        dataobj.map((m, i) => {
            if (i == index) {
                m[column] = value
            }
        })
        // console.log('dataobj')
        // console.log(dataobj)
        settrigger(trigger + 1)
        props.onChange(dataobj)
    }

    const handleChangeDampak = (column, value, index) => {
        // console.log(handleChangeDampak)
        // console.log(value)
        let dataobj = props.value
        dataobj.map((m, i) => {
            if (i == index) {
                if (column == 'id_dampak') {
                    m[column] = value.__isNew__ ? null : value.value
                    m['nama'] = value.label
                }
            }
        })
        settrigger(trigger + 1)
        props.onChange(dataobj)
    }

    const handleAdd = (is_kuantitatif) => {
        let dataObj = props.value

        dataObj.push({ ...props.datainit, is_kuantitatif })
        settrigger(trigger + 1)

        // console.log('kriObj')
        // console.log(props.datainit)
        // console.log(kriObj)

        props.onChange(dataObj)

        setdatanewkri_trigger(datanewkri_trigger => datanewkri_trigger + 1)
    }

    const handleDelete = index => {
        let dataObj = []
        props.value.map((m, i) => {
            if (i != index) {
                dataObj.push(m)
            }
        })
        // settrigger(trigger + 1)
        props.onChange(dataObj)

        // handleChangeParentState(input_selectObj)
    }

    return (
        <div className={props.formCol ? '' : `grid gap-4 ${props.label ? 'grid-cols-3' : ''}`}>
            {props.label ? (
                <>
                    {props.tooltips ? (


                        <Label className={`${props.formCol ? 'text-left' : 'text-right'} font-medium ${props.message_error ? 'text-danger' : ''}`}>
                            {props.label} {props.required && !disabled ? <span className="color-danger">*</span> : null} {props.i && !disabled ? (
                                <Links id={props.tooltips} title={props.tooltips}>
                                    <span className='material-icons icon-help-tooltips'>info</span>
                                </Links>
                            ) : null}
                        </Label>

                    ) : (

                        <Label className={`${props.formCol ? 'text-left' : 'text-right'} font-medium ${props.message_error ? 'text-danger' : ''}`}>{props.label} {props.required && !disabled ? <span className="color-danger">*</span> : null}</Label>
                    )}
                </>
            ) : null}
            <div className="col-span-2 mb-5">
                {props.value.map((m, i) => {
                    if (parseInt(m.is_kuantitatif) == 0) {
                        return (
                            <table className="w-full table table-auto border-collapse border table-input-multiple">
                                <thead dangerouslySetInnerHTML={{ __html: props.htmlheadkrikualitatif }}></thead>
                                <tbody>
                                    <tr>
                                        <td className="border">{i + 1}</td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.nama}</div>
                                            ) : (
                                                <>
                                                    {props.risk_profile ? (
                                                        <input
                                                            id={`nama`}
                                                            placeholder="Nama KRI"
                                                            disabled={disabled}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.nama}
                                                            onChange={(event) => handleChange('nama', event.target.value, i)}
                                                        />
                                                    ) : (
                                                        <InputSelect
                                                            formOnly
                                                            placeholder="Nama KRI"
                                                            disabled={true}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.id_kri}
                                                            data={props.datarisk_profile_kri}
                                                            onChange={(selected) => handleChange('id_kri', selected, i)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        {props.risk_profile ? (
                                            <td className="border">
                                                {disabled ? (
                                                    <div>{m.satuan}</div>
                                                ) : (

                                                    <input
                                                        placeholder="Satuan"
                                                        disabled={disabled}
                                                        className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                        value={m.satuan}
                                                        onChange={(event) => handleChange('satuan', event.target.value, i)}
                                                    />
                                                )}
                                            </td>
                                        ) : null}
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.aman}</div>
                                            ) : (
                                                <input
                                                    placeholder="Aman"
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.aman}
                                                    onChange={(event) => handleChange('aman', event.target.value, i)}
                                                />
                                            )}
                                        </td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.hati_hati}</div>
                                            ) : (

                                                <input
                                                    placeholder="Hati-hati"
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.hati_hati}
                                                    onChange={(event) => handleChange('hati_hati', event.target.value, i)}
                                                />
                                            )}
                                        </td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.bahaya}</div>
                                            ) : (

                                                <input
                                                    placeholder="Bahaya"
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.bahaya}
                                                    onChange={(event) => handleChange('bahaya', event.target.value, i)}
                                                />
                                            )}
                                        </td>
                                        {props.risk_profile ? null : (
                                            <>
                                                <td className="border">
                                                    {disabled ? (
                                                        <div>{m.threshold}</div>
                                                    ) : (

                                                        <input
                                                            placeholder="Threshold"
                                                            disabled={disabled}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.threshold}
                                                            onChange={(event) => handleChange('threshold', event.target.value, i)}
                                                        />
                                                    )}
                                                </td>
                                                <td className="border">
                                                    {disabled ? (
                                                        <div>{m.nilai}</div>
                                                    ) : (

                                                        <input
                                                            placeholder="Hasil"
                                                            disabled={disabled}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.nilai}
                                                            onChange={(event) => handleChange('nilai', event.target.value, i)}
                                                        />
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        <td className="border">
                                            {disabled ? null : (
                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td>
                                    </tr>

                                </tbody>
                            </table>
                        )
                    }
                    if (parseInt(m.is_kuantitatif) == 1) {
                        return (
                            <table className="w-full table table-auto border-collapse border table-input-multiple">
                                <thead dangerouslySetInnerHTML={{ __html: m.polaritas == '+-' ? props.htmlheadkrikuantitatifStabilize : m.polaritas == '+' ? props.htmlheadkrikuantitatifPositif : m.polaritas == '-' ? props.htmlheadkrikuantitatifNegatif : props.htmlheadkrikuantitatifnull }}></thead>
                                <tbody>
                                    <tr>
                                        <td className="border">{i + 1}</td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.nama}</div>
                                            ) : (
                                                <>
                                                    {props.risk_profile ? (
                                                        <input
                                                            placeholder="Nama KRI"
                                                            id={`nama`}
                                                            disabled={disabled}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.nama}
                                                            onChange={(event) => handleChange('nama', event.target.value, i)}
                                                        />
                                                    ) : (
                                                        <InputSelect
                                                            placeholder="Nama KRI"
                                                            formOnly
                                                            disabled={true}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.id_kri}
                                                            data={props.datarisk_profile_kri}
                                                            onChange={(selected) => handleChange('id_kri', selected, i)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        {props.risk_profile ? (
                                            <>
                                                <td className="border">
                                                    {disabled ? (
                                                        <div>{datapolaritas[m.polaritas]}</div>
                                                    ) : (

                                                        <InputSelect
                                                            placeholder="Polaritas"
                                                            formOnly
                                                            disabled={disabled}
                                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                            value={m.polaritas}
                                                            data={[
                                                                // { label: 'Positif', value: '+' },
                                                                // { label: 'Negatif', value: '-' },
                                                                // { label: 'Stabilize', value: '+-' },
                                                                // { label: 'Higher', value: '+' },
                                                                // { label: 'Lower', value: '-' },
                                                                // { label: 'Better', value: '+-' },
                                                                { label: 'Lower Better', value: '+' },
                                                                { label: 'Higher Better', value: '-' },
                                                                { label: 'Stabilize', value: '+-' },
                                                            ]}
                                                            onChange={(selected) => handleChange('polaritas', selected, i)}
                                                        />
                                                    )}
                                                </td>
                                                {m.polaritas == '' ? null : (
                                                    <td className="border">
                                                        {disabled ? (
                                                            <div>{m.satuan}</div>
                                                        ) : (

                                                            <input
                                                                placeholder="Satuan"
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.satuan}
                                                                onChange={(event) => handleChange('satuan', event.target.value, i)}
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                            </>
                                        ) : null}

                                        {m.polaritas == '' ? null : (
                                            <>
                                                {m.polaritas == '+' ? (
                                                    <>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Batas Atas Normal"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.target_sampai}
                                                                onChange={(value) => handleChange('target_sampai', value, i)}
                                                            />
                                                        </td>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Ambang Batas Bahaya"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.batas_bawah}
                                                                onChange={(value) => handleChange('batas_bawah', value, i)}
                                                            />
                                                        </td>
                                                    </>
                                                ) : null}
                                                {m.polaritas == '-' ? (
                                                    <>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Batas Bawah Normal"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.target_mulai}
                                                                onChange={(value) => handleChange('target_mulai', value, i)}
                                                            />
                                                        </td>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Ambang Batas Bahaya"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.batas_atas}
                                                                onChange={(value) => handleChange('batas_atas', value, i)}
                                                            />
                                                        </td>
                                                    </>
                                                ) : null}
                                                {m.polaritas == '+-' ? (
                                                    <>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Target Mulai"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.target_mulai}
                                                                onChange={(value) => handleChange('target_mulai', value, i)}
                                                            />
                                                        </td>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Target Sampai"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.target_sampai}
                                                                onChange={(value) => handleChange('target_sampai', value, i)}
                                                            />
                                                        </td>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Batas Bawah"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.batas_bawah}
                                                                onChange={(value) => handleChange('batas_bawah', value, i)}
                                                            />
                                                        </td>
                                                        <td className="border">

                                                            <InputNumeric
                                                                placeholder="Batas Atas"
                                                                formOnly
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.batas_atas}
                                                                onChange={(value) => handleChange('batas_atas', value, i)}
                                                            />
                                                        </td>
                                                    </>
                                                ) : null}

                                                {props.risk_profile ? (
                                                    <td className="border">
                                                        {disabled ? (
                                                            <div>{m.keterangan}</div>
                                                        ) : (

                                                            <input
                                                                placeholder="Keterangan"
                                                                disabled={disabled}
                                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                value={m.keterangan}
                                                                onChange={(event) => handleChange('keterangan', event.target.value, i)}
                                                            />
                                                        )}
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="border">
                                                            {disabled ? (
                                                                <div>{m.threshold}</div>
                                                            ) : (

                                                                <input
                                                                    placeholder="Threshold"
                                                                    disabled={disabled}
                                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                    value={m.threshold}
                                                                    onChange={(event) => handleChange('threshold', event.target.value, i)}
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="border">
                                                            {disabled ? (
                                                                <div>{m.nilai}</div>
                                                            ) : (

                                                                <input
                                                                    placeholder="Hasil"
                                                                    disabled={disabled}
                                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                                    value={m.nilai}
                                                                    onChange={(event) => handleChange('nilai', event.target.value, i)}
                                                                />
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        <td className="border">
                                            {disabled ? null : (
                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        )
                    }

                })}

                {props.notAdd ? null : (
                    <>
                        {disabled ? null : (
                            <div className='flex justify-between'>
                                <div className="flex-1">
                                    {add_and_select == 1 ? null : (
                                        <InputSelect
                                            placeholder={"Pili " + props.label}
                                            formOnly
                                            disabled={disabled}
                                            className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                            value={datanewkri}
                                            data={props.risk_profile ? props.datakuantitatif : props.datarisk_profile_kri}
                                            onChange={(selected) => {
                                                handleAdd(selected)
                                            }}
                                        />
                                    )}
                                </div>
                                <BtnIconAct width={20} icon="add" className="btn-info" onTap={() => {
                                    setadd_and_select(2)
                                }} />
                            </div>
                        )}
                    </>
                )}

                {props.message_error ? (
                    <span className="text-danger message-error-form">{props.message_error}</span>
                ) : null}
            </div>
        </div>
    )
}

export default InputColumnMultipleMerge
