


import React, { forwardRef, useEffect, useState } from "react"
import { fileToBase64, fileUploadConfig, urlDownload, urlPreview } from "pages/Utils"
import Link from 'components/Link'
import BtnRemove from "./BtnRemove"

const showPreview = false
const onemb = 1024

const InputFile = ({ disabled = false, className, ...props }) => {
    const [trigger, settrigger] = useState(0)
    const [ext, setext] = useState(null)
    const [max, setmax] = useState(null)
    const [maxsize, setmaxsize] = useState(null)
    const [extdefault, setextdefault] = useState([])

    useEffect(() => {
        init()
    }, [])

    const init = () => {
        let ext = ''
        let max = ''
        let maxsize = 0
        let extdefault = []
        if (!props.ext) {
            ext = fileUploadConfig.allowed_types_default.join(",")
            extdefault = fileUploadConfig.allowed_types_default
        } else {
            ext = props.ext.join(",")
            extdefault = props.ext
        }
        if (!props.max) {
            max = `${fileUploadConfig.maxSize / onemb} Mb`
            maxsize = fileUploadConfig.maxSize
        } else {
            if (parseInt(props.max) >= onemb) {
                max = `${parseInt(props.max) / onemb} Mb`
            } else {
                max = `${props.max} Kb`
            }
            maxsize = props.max
        }
        setext(ext)
        setmax(max)
        setmaxsize(maxsize)
        setextdefault(extdefault)

    }

    const handleChange = async (e) => {
        // settrigger(trigger + 1)
        const files = e.target.files[0]
        // console.log(files)
        // console.log(fileUploadConfig.allowed_types_default)
        const filesSplit = files.name.split(".")
        // console.log('filesSplit')
        // console.log(filesSplit)
        const fileType = filesSplit[filesSplit.length - 1]
        // console.log('fileType')
        // console.log(fileType)
        // const validImageTypes = [...fileUploadConfig.allowed_types_default];
        // const validImageTypes = [...fileUploadConfig.allowed_types_default];
        const validImageTypes = extdefault;
        // console.log(validImageTypes)
        if (!validImageTypes.includes(fileType)) {
            props.onError(props.id, `Ekstensi yang dipilih tidak diperbolehkan.`)
            return;
        }

        props.onError(props.id, '')

        // console.log(files.size / 1000)
        if ((files.size / 1000) > maxsize) {
            props.onError(props.id, `File yang dipilih terlalu besar.`)
            return
        }

        // console.log('files')
        // console.log(files)
        let datafile_arr = []

        const base64 = await fileToBase64(files)
        let file_input = {
            src: base64,
            type: files.type,
            size: files.size,
            name: files.name
        }

        if (props.isMulti) {
            datafile_arr.push(...props.value)
            datafile_arr.push(datafile)

            props.onChange(datafile_arr)
        } else {
            // console.log('datafile')
            // console.log(datafile)
            // console.log('files')
            // console.log(files)

            props.onChange(file_input)
        }
    }

    const handleDelete = (item) => {
        settrigger(trigger => trigger + 1)
        props.onChange('')
        if (props.preview) {
            props.onDelete()
        }
    }

    return (
        <>
            {props.message_error ? (
                <span className="text-danger message-error-form mb-1" style={{ marginTop: -1, display: 'block' }}>{props.message_error}</span>
            ) : null}
            {props.isMulti ? (
                <>
                    {props.value.map((m, i) => (
                        <p className="flex flex-row items-center pb-2 ">
                            <Link key={i} className="color-link pr-1" href="/">{m.name}</Link>
                            <BtnRemove icon="close" size={16} onTap={() => handleDelete(m)} />
                        </p>
                    ))}
                </>
            ) : (
                <>
                    <p className="flex flex-row items-center pb-2">
                        {props.preview ? (

                            <a
                                className="color-link pr-1"
                                style={{ cursor: 'pointer' }}
                                // onClick={() => {
                                //     urlDownload(props.preview)
                                // }}
                                target="_blank"
                                href={urlPreview(props.preview)}
                            >
                                {props.preview}
                            </a>
                        ) : (
                            <a className="pr-1">{props.value.name}</a>

                        )}
                        {!disabled && props.value ? (
                            <BtnRemove icon="close" size={16} onTap={() => {
                                if (window.confirm('Yakin menghapus data ini?')) {
                                    handleDelete(props.value)
                                }
                            }} />
                        ) : null}
                    </p>
                </>
            )}

            {!disabled ? (
                <>
                    <div className="flex flex-row">
                        <div className="input-ext">Ext : {ext}</div>
                        <div className="input-max-size">Max : {max}</div>
                    </div>

                    {!props.isMulti && props.value ? null : (

                        <input
                            disabled={disabled}
                            className={`${className} rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                            // {...props}
                            type={'file'}
                            onChange={handleChange}
                            value={''}
                        // value={props.value}
                        />
                    )}
                </>
            ) : null}
        </>
    )
}

export default InputFile
