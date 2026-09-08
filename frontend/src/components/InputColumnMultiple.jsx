

import React, { forwardRef, useEffect, useRef, useState } from "react"
import Label from 'components/Label'
import { colorsPallette, combostatuswarna, datacolorapply, extUploadFile, statusKriOtomatis } from "pages/Utils"
import InputSelect from "./InputSelect"
import InputNumeric from "./InputNumeric"
import BtnIconAct from "./BtnIconAct"
import TooltipsApp from "./TooltipsApp"
import InputSelectCreate from "./InputSelectCreate"
import InputCheckbox from "./InputCheckbox"
import Input from "./Input"
import ContentEditable from 'react-contenteditable'

// const Input = ({ disabled = false, className, ...props }) => (
//     <input
//         disabled={disabled}
//         className={`${className} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
//         {...props}
//     />
// )



const InputColumnMultiple = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)

    const initialized = useRef(false)
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
        }
        if (true) {
            // console.log('props.value')
            // console.log(props.value)
        }
        // console.log('props.value')
        // console.log(props.value)
    }, [trigger])

    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    const handleChange = (column, value, index, event) => {
        // console.log(column)
        // console.log(value)
        // console.log(index)
        // console.log(props.value)

        let dataobj = props.value
        if (!event) {

            dataobj.map((m, i) => {
                if (i == index) {
                    m[column] = value
                }
            })
        } else {
            let item = {}
            dataobj.map((m, i) => {
                if (i == index) {
                    item = m
                }
            })
            if (event == 'kri_kuantitatif_realisasi_status_otomatis') {
                const status = statusKriOtomatis(item, value)

                dataobj.map((m, i) => {
                    if (i == index) {
                        m[column] = value,
                            m['status'] = status,
                            m['status_kuantitatif'] = status
                    }
                })
            }
        }
        // console.log('dataobj')
        // console.log(dataobj)

        // console.log('dataobj')
        // console.log(props.id)
        // console.log(dataobj)
        settrigger(trigger => trigger + 1)
        props.onChange(dataobj)

        if (props.onChangeColumn) {
            props.onChangeColumn(column, value, props.id)
        }
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

    const handleAdd = () => {
        // console.log('handleAdd')
        // console.log(handleAdd)
        let dataObj = props.value

        dataObj.push({ ...props.datainit })
        settrigger(trigger => trigger + 1)

        // console.log('kriObj')
        // console.log(props.datainit)
        // console.log(kriObj)

        props.onChange(dataObj)
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
                            {props.label} {props.required && !disabled ? <span className="color-danger">*</span> : null}  {props.i && !disabled ? (
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
                <table className="w-full table table-auto border-collapse border table-input-multiple">
                    {props.id == 'nilai_dampak_inheren' || props.id == 'id_dampak_inheren' || props.id == 'nilai_kemungkinan' || props.id == 'id_kemungkinan_inheren' ? (
                        <thead>
                            <tr>
                                <th className="border" style={{ width: '25%' }}>Q1</th>
                                <th className="border" style={{ width: '25%' }}>Q2</th>
                                <th className="border" style={{ width: '25%' }}>Q3</th>
                                <th className="border" style={{ width: '25%' }}>Q4</th>
                            </tr>
                        </thead>
                    ) : props.id == 'timeline' ? (
                        <thead>
                            {/* <tr>
                                <th className="text-center" colSpan={12}>{props.tahun}</th>
                            </tr> */}
                            <tr>
                                <th className="border text-center">1</th>
                                <th className="border text-center">2</th>
                                <th className="border text-center">3</th>
                                <th className="border text-center">4</th>
                                <th className="border text-center">5</th>
                                <th className="border text-center">6</th>
                                <th className="border text-center">7</th>
                                <th className="border text-center">8</th>
                                <th className="border text-center">9</th>
                                <th className="border text-center">10</th>
                                <th className="border text-center">11</th>
                                <th className="border text-center">12</th>
                            </tr>
                        </thead>
                    ) : props.id == 'realisasi_timeline' && props.dataheader && props.dataheader.length > 0 ? (
                        <tr>
                            {props.dataheader.map((m, i) => (
                                <th className="border text-center" key={i}>{parseInt(m.value)}</th>
                            ))}
                        </tr>
                    ) : (
                        <thead dangerouslySetInnerHTML={{ __html: props.htmlhead }}></thead>
                    )}
                    <tbody>
                        {props.id == 'kri' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border">{i + 1}</td>
                                        {/* <td className="border">
                                            <input
                                                type="checkbox"
                                                value="1"
                                                disabled={disabled}
                                                checked={m.is_kualitatif ? true : false}
                                                className={`${className} mr-2 rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                onChange={e =>
                                                    handleChange('is_kualitatif', e.target.checked, i)
                                                }
                                                style={{ width: 15 }}
                                            />
                                        </td> */}
                                        <td className="border">
                                            <input
                                                id={`nama${i}`}
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nama}
                                                onChange={(event) => handleChange('nama', event.target.value, i)}
                                            />
                                        </td>
                                        {props.is_kuantitatif ? (
                                            <td className="border">
                                                <InputSelect
                                                    formOnly
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.polaritas}
                                                    data={[{ label: 'Positif', value: '1' }, { label: 'Negatif', value: '0' }]}
                                                    onChange={(selected) => handleChange('polaritas', selected, i)}
                                                />
                                            </td>
                                        ) : null}
                                        <td className="border">
                                            <input
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.satuan}
                                                onChange={(event) => handleChange('satuan', event.target.value, i)}
                                            />
                                        </td>
                                        {props.is_kuantitatif ? (
                                            <td className="border">
                                                <InputNumeric
                                                    formOnly
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.batas_bawah}
                                                    onChange={(value) => handleChange('batas_bawah', value, i)}
                                                />
                                            </td>
                                        ) : null}
                                        {props.is_kuantitatif ? (

                                            <td className="border">
                                                <InputNumeric
                                                    formOnly
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.batas_atas}
                                                    onChange={(value) => handleChange('batas_atas', value, i)}
                                                />
                                            </td>
                                        ) : null}
                                        {props.is_kuantitatif ? (

                                            <td className="border">
                                                <InputNumeric
                                                    formOnly
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.target_mulai}
                                                    onChange={(value) => handleChange('target_mulai', value, i)}
                                                />
                                            </td>
                                        ) : null}
                                        {props.is_kuantitatif ? (

                                            <td className="border">
                                                <InputNumeric
                                                    formOnly
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.target_sampai}
                                                    onChange={(value) => handleChange('target_sampai', value, i)}
                                                />
                                            </td>
                                        ) : null}
                                        {props.is_kuantitatif ? (

                                            <td className="border">
                                                <input
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.keterangan}
                                                    onChange={(event) => handleChange('keterangan', event.target.value, i)}
                                                />
                                            </td>
                                        ) : null}

                                        {props.is_kualitatif ? (

                                            <td className="border">
                                                <input
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.aman}
                                                    onChange={(event) => handleChange('aman', event.target.value, i)}
                                                />
                                            </td>
                                        ) : null}
                                        {props.is_kualitatif ? (

                                            <td className="border">
                                                <input
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.hati_hati}
                                                    onChange={(event) => handleChange('hati_hati', event.target.value, i)}
                                                />
                                            </td>
                                        ) : null}
                                        {props.is_kualitatif ? (

                                            <td className="border">
                                                <input
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.bahaya}
                                                    onChange={(event) => handleChange('bahaya', event.target.value, i)}
                                                />
                                            </td>
                                        ) : null}


                                        <td className="border">
                                            {disabled ? null : (

                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'existing_control' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border">{i + 1}</td>
                                        <td className="border">
                                            <InputSelect
                                                placeholder="Jenis Existing Control"
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_jenis_control}
                                                data={props.datamt_risk_jenis_control}
                                                onChange={(selected) => handleChange('id_jenis_control', selected, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.nama}</div>
                                            ) : (

                                                <textarea
                                                    style={{ height: 40 }}
                                                    placeholder="Existing Control"
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.nama}
                                                    onChange={(event) => handleChange('nama', event.target.value, i)}
                                                />
                                            )}
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                placeholder="Penilaian Efektifitas Control"
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_efektifitas_control}
                                                data={props.datamt_risk_efektifitas_control}
                                                onChange={(selected) => handleChange('id_efektifitas_control', selected, i)}
                                            />
                                        </td>

                                        <td className="border">
                                            {disabled ? null : (

                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'dampak' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border">{i + 1}</td>

                                        <td className="border">
                                            {/* <input
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.penjelasan_dampak}
                                                onChange={(event) => handleChange('penjelasan_dampak', event.target.value, i)}
                                            /> */}
                                            <InputSelectCreate
                                                placeholder="Deskripsi Dampak"
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                // value={m.id_dampak}
                                                valueObj={{
                                                    label: m.nama,
                                                    value: m.id_dampak
                                                }}
                                                data={props.datamt_risk_dampak}
                                                onChange={(selected) => {
                                                    // console.log(selected)
                                                    handleChangeDampak('id_dampak', selected, i)
                                                }}
                                                valueItem
                                                loadOptions={props.loadOptions ? props.loadOptions : null}
                                            />
                                        </td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.perkiraan_terpapar}</div>
                                            ) : (

                                                <input
                                                    placeholder="Perkiraan Waktu Terpapar Risiko"
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.perkiraan_terpapar}
                                                    onChange={(event) => handleChange('perkiraan_terpapar', event.target.value, i)}
                                                />
                                            )}
                                        </td>

                                        <td className="border">
                                            {disabled ? null : (

                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'skala_dampak' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        {/* <td className="border">{i + 1}</td> */}

                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_bumn}
                                                data={props.dataid_jenis_risiko}
                                                onChange={(selected) => handleChangeDampak('id_bumn', selected, i)}
                                            // valueItem
                                            />
                                        </td>
                                        <td className="border">
                                            <input
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.bumn}
                                                onChange={(event) => handleChange('bumn', event.target.value, i)}
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (

                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'skala_probabilitas' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        {/* <td className="border">{i + 1}</td> */}

                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_bumn}
                                                data={props.dataid_jenis_risiko}
                                                onChange={(selected) => handleChangeDampak('id_bumn', selected, i)}
                                            // valueItem
                                            />
                                        </td>
                                        <td className="border">
                                            <input
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.bumn}
                                                onChange={(event) => handleChange('bumn', event.target.value, i)}
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (

                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'skala_risiko' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        {/* <td className="border">{i + 1}</td> */}

                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_bumn}
                                                data={props.dataid_jenis_risiko}
                                                onChange={(selected) => handleChangeDampak('id_bumn', selected, i)}
                                            // valueItem
                                            />
                                        </td>
                                        <td className="border">
                                            <input
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.bumn}
                                                onChange={(event) => handleChange('bumn', event.target.value, i)}
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (

                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'level_risiko' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        {/* <td className="border">{i + 1}</td> */}

                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_bumn}
                                                data={props.datamt_risk_dampak}
                                                onChange={(selected) => handleChangeDampak('id_bumn', selected, i)}
                                            // valueItem
                                            />
                                        </td>
                                        <td className="border">
                                            <input
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.bumn}
                                                onChange={(event) => handleChange('bumn', event.target.value, i)}
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (

                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'nilai_dampak_inheren' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>

                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init1_1}
                                                onChange={(value) => handleChange('q_init1_1', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init1_2}
                                                onChange={(value) => handleChange('q_init1_2', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init1_3}
                                                onChange={(value) => handleChange('q_init1_3', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init1_4}
                                                onChange={(value) => handleChange('q_init1_4', value, i)}
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (
                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'id_dampak_inheren' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>

                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init2_1}
                                                data={props.datamt_risk_dampak}
                                                onChange={(selected) => handleChange('q_init2_1', selected, i)}
                                                colorapply
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init2_2}
                                                data={props.datamt_risk_dampak}
                                                onChange={(selected) => handleChange('q_init2_2', selected, i)}
                                                colorapply
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init2_3}
                                                data={props.datamt_risk_dampak}
                                                onChange={(selected) => handleChange('q_init2_3', selected, i)}
                                                colorapply
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init2_4}
                                                data={props.datamt_risk_dampak}
                                                onChange={(selected) => handleChange('q_init2_4', selected, i)}
                                                colorapply
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (
                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'nilai_kemungkinan' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>

                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init3_1}
                                                onChange={(value) => handleChange('q_init3_1', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init3_2}
                                                onChange={(value) => handleChange('q_init3_2', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init3_3}
                                                onChange={(value) => handleChange('q_init3_3', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init3_4}
                                                onChange={(value) => handleChange('q_init3_4', value, i)}
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (
                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'id_kemungkinan_inheren' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>

                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init4_1}
                                                data={props.datamt_risk_kemungkinan}
                                                onChange={(selected) => handleChange('q_init4_1', selected, i)}
                                                colorapply
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init4_2}
                                                data={props.datamt_risk_kemungkinan}
                                                onChange={(selected) => handleChange('q_init4_2', selected, i)}
                                                colorapply
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init4_3}
                                                data={props.datamt_risk_kemungkinan}
                                                onChange={(selected) => handleChange('q_init4_3', selected, i)}
                                                colorapply
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.q_init4_4}
                                                data={props.datamt_risk_kemungkinan}
                                                onChange={(selected) => handleChange('q_init4_4', selected, i)}
                                                colorapply
                                            />
                                        </td>

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (
                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'timeline' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>

                                        {Object.keys(m).map((x, y) => (
                                            <td className="border" key={y}>
                                                <InputCheckbox
                                                    ref={null}
                                                    type='checkbox'
                                                    data={[{ label: '', value: '1' }]}
                                                    value={m[x]}
                                                    className='block mt-1 w-full'
                                                    onChange={(value) => handleChange(x, value, i)}
                                                    required={false}
                                                    isMulti={false}
                                                    autoFocus
                                                    disabled={disabled}
                                                    formOnly
                                                    center
                                                />
                                            </td>
                                        ))}

                                        {props.notAdd ? null : (
                                            <td className="border">
                                                {disabled ? null : (
                                                    <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'realisasi_timeline' ? (
                            <>
                                <tr>
                                    {props.value.map((m, i) => (

                                        <td className="border" key={i}>
                                            <InputCheckbox
                                                ref={null}
                                                type='checkbox'
                                                data={[{ label: '', value: '1' }]}
                                                value={m.value}
                                                className='block mt-1 w-full'
                                                onChange={(value) => handleChange('value', value, i)}
                                                required={false}
                                                isMulti={false}
                                                autoFocus
                                                disabled={disabled}
                                                formOnly
                                                center
                                            />
                                        </td>

                                    ))}
                                    {props.notAdd ? null : (
                                        <td className="border">
                                            {disabled ? null : (
                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td>
                                    )}
                                </tr>
                            </>
                        ) : null}
                        {props.id == 'kri_realisasi' && props.is_kuantitatif ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border">{i + 1}</td>
                                        <td className="border">
                                            {/* <input
                                                disabled={true}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nama}
                                                onChange={(event) => handleChange('nama', event.target.value, i)}
                                            /> */}
                                            <div>{m.nama}</div>
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nilai == null ? '' : m.nilai}
                                                onChange={(value) => handleChange('nilai', value, i, 'kri_kuantitatif_realisasi_status_otomatis')}
                                            />
                                        </td>
                                        <td className="border">
                                            <input
                                                disabled={true}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.status_kuantitatif == null ? '' : m.status_kuantitatif}
                                                onChange={(event) => handleChange('status_kuantitatif', event.target.value, i)}
                                                style={{
                                                    backgroundColor: datacolorapply[m.status_kuantitatif]
                                                }}
                                            />
                                        </td>

                                        {/* <td className="border">
                                            {disabled ? null : (

                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td> */}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'kri_realisasi' && props.is_kualitatif ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border">{i + 1}</td>
                                        <td className="border">
                                            {/* <input
                                                disabled={true}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nama}
                                                onChange={(event) => handleChange('nama', event.target.value, i)}
                                            /> */}
                                            <div>{m.nama}</div>
                                        </td>
                                        <td className="border">
                                            {/* <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nilai_kualitatif == null ? '' : m.nilai_kualitatif}
                                                onChange={(value) => handleChange('nilai_kualitatif', value, i)}
                                            /> */}
                                            <Input
                                                type="text"
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nilai_kualitatif == null ? '' : m.nilai_kualitatif}
                                                onChange={(e) => handleChange('nilai_kualitatif', e.target.value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.status}
                                                data={combostatuswarna()}
                                                onChange={(selected) => handleChange('status', selected, i)}
                                                colorapply
                                            />
                                        </td>

                                        {/* <td className="border">
                                            {disabled ? null : (

                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td> */}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                        {props.id == 'realisasi_perlakuan_risiko' ? (
                            <>
                                {props.value.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border">{i + 1}</td>
                                        <td className="border">
                                            <div>{m.penyebab}</div>
                                        </td>
                                        <td className="border">
                                            {/* <input
                                                disabled={true}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.nama}
                                                onChange={(event) => handleChange('nama', event.target.value, i)}
                                            /> */}
                                            <ContentEditable
                                                html={m.nama_realisasi} // innerHTML of the editable div
                                                disabled={disabled}       // use true to disable editing
                                                onChange={(e) => handleChange('nama_realisasi', e.target.value, i)} // handle innerHTML change
                                                tagName='div' // Use a custom HTML tag (uses a div by default)
                                            />
                                        </td>
                                        <td className="border">
                                            <InputCheckbox
                                                ref={null}
                                                type='checkbox'
                                                data={[{ label: '', value: '1' }]}
                                                value={m.is_ada_progress}
                                                className='block mt-1 w-full'
                                                onChange={(value) => handleChange('is_ada_progress', value, i)}
                                                required={false}
                                                isMulti={false}
                                                autoFocus
                                                disabled={disabled}
                                                formOnly
                                                center
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.progress == null ? '' : m.progress}
                                                onChange={(value) => handleChange('progress', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputNumeric
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.biaya == null ? '' : m.biaya}
                                                onChange={(value) => handleChange('biaya', value, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            <InputSelect
                                                formOnly
                                                disabled={disabled}
                                                className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                value={m.id_status_rencana_perlakuan}
                                                data={props.datamt_status_rencana_perlakuan}
                                                onChange={(selected) => handleChange('id_status_rencana_perlakuan', selected, i)}
                                            />
                                        </td>
                                        <td className="border">
                                            {disabled ? (
                                                <div>{m.penjelasan_status_rencana_perlakuan}</div>
                                            ) : (

                                                <input
                                                    disabled={disabled}
                                                    className={`${className} ${props.message_error && props.value === "" ? 'form-controll-error' : ''} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                                    value={m.penjelasan_status_rencana_perlakuan == null ? '' : m.penjelasan_status_rencana_perlakuan}
                                                    onChange={(event) => handleChange('penjelasan_status_rencana_perlakuan', event.target.value, i)}
                                                />
                                            )}
                                        </td>


                                        {/* <td className="border">
                                            {disabled ? null : (

                                                <BtnIconAct width={20} icon="delete" className="btn-danger" onTap={() => handleDelete(i)} />
                                            )}
                                        </td> */}
                                    </tr>
                                ))}
                            </>
                        ) : null}
                    </tbody>
                </table>
                {props.notAdd ? null : (
                    <>
                        {disabled ? null : (
                            <div className='flex justify-end'>
                                <BtnIconAct width={20} icon="add" className="btn-info" onTap={handleAdd} />
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

export default InputColumnMultiple

