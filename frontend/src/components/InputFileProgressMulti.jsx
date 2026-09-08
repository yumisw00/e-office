


import React, { forwardRef, useEffect, useState, useCallback, useRef, Fragment } from "react"
import Label from 'components/Label'
import { detectType, fileToBase64, fileUploadConfig, urlDownload, urlPreview, urlPreviewNew } from "pages/Utils"
import Link from 'components/Link'
import BtnIcon from "./BtnIcon"
import BtnRemove from "./BtnRemove"
import Uploady, { useItemProgressListener, useBatchFinishListener, useUploady, useRequestPreSend } from "@rpldy/uploady";
import UploadButton from "@rpldy/upload-button";
import ProgressBar from 'react-bootstrap/ProgressBar';
import { api_services } from "hooks/api_services"
import UploadDropZone from "@rpldy/upload-drop-zone";
import { Modal } from "react-bootstrap"
import BtnIconAct from "./BtnIconAct"
import $ from 'jquery'
import EditorPdf from "./EditorPdf"
import EditorImage from "./EditorImage"
import InputFileProgress from "./InputFileProgress"





export const onemb = 1024

const CustomPreSend = () => {
    // return true
    useRequestPreSend(({ items, options }) => {
        // console.log('items');
        // console.log(items);
        // console.log(fileUploadConfig.allowed_types_default_ext);

        const validItems = items.filter((item) => {
            const allowedTypes = fileUploadConfig.allowed_types_default_ext;
            return allowedTypes.includes(item.file.type);
        });

        if (validItems.length === 0) {
            alert("Ekstensi yang diupload tidak diperbolehkan!");
            return false; // Batalkan pengunggahan jika tidak ada file valid
        }

        // return true;

        return {
            items: validItems,
            options: {
                ...options,
                withCredentials: true
            },
        };
    });

    return null;
};

const LogProgress = (props) => {
    const [popup_open, setpopup_open] = useState(false)
    const [file_open, setfile_open] = useState(null)
    const [fileurl, setfileurl] = useState('')
    const [is_popup_loading, setis_popup_loading] = useState(false)

    const [completed, setcompleted] = useState(0)
    const [showprogress, setshowprogress] = useState(false)
    const [is_done, setis_done] = useState(false)

    const [editor_img_open, seteditor_img_open] = useState(false)
    const [annotations, setAnnotations] = useState([]);
    const [images, setimages] = useState([
        // {
        //     src: "",
        //     name: "",
        // }

        {
            "src": "https://10.106.219.254/hk-icofr/backend/public/api/rcm_csa_files/916",
            "name": "",
            "regions": [
                {
                    "type": "box",
                    "x": 0.65625,
                    "y": 0.2185605945009174,
                    "w": 0.28551136363636365,
                    "h": 0.08522727272727273,
                    "highlighted": false,
                    "editingLabels": false,
                    "color": "#f44336",
                    "cls": "Benar",
                    "id": "14847314953497448"
                },
                {
                    "type": "box",
                    "x": 0.2528409090909091,
                    "y": 0.7337121096524325,
                    "w": 0.3238636363636363,
                    "h": 0.09090909090909094,
                    "highlighted": false,
                    "editingLabels": false,
                    "color": "#2196f3",
                    "cls": "Salah",
                    "id": "9641694579726962"
                },
                {
                    "type": "box",
                    "x": 0.22585227272727273,
                    "y": 0.1465908975312204,
                    "w": 0.26846590909090906,
                    "h": 0.18371212121212122,
                    "highlighted": true,
                    "editingLabels": false,
                    "color": "#795548",
                    "cls": "Anomali",
                    "id": "016562841278363938"
                }
            ],
            // data: {
            //     catatan: '1234444',
            //     rekomendasi: 'abcabc'
            // }
        }
    ])
    const [is_edit_editor, setis_edit_editor] = useState(true)

    const [editor_pdf_open, seteditor_pdf_open] = useState(false)

    const { postapi_services, deleteapi_services } = api_services({})

    // useEffect(() => {
    //     console.log('USEEFFECT==>file_open');
    //     console.log(file_open);

    // }, [file_open])

    useItemProgressListener((item) => {
        // console.log('useItemProgressListener')
        // console.log(item)
        // console.log(`>>>>> (hook) File ${item.file.name} completed: ${item.completed}`);

        setcompleted(parseInt(item.completed).toFixed(0))
        setis_done(false)
        setshowprogress(true)
    });

    useBatchFinishListener((item) => {
        console.log('useBatchFinishListener')
        console.log(item)

        if (item.items && item.items.length > 0 && item.items[0].state == "cancelled") {
            return
        }
        let is_error = false
        let file = []
        if (props.value && props.value.length) {
            props.value.map(m => {
                file.push(m)
            })
        }

        if (item.items && item.items.length > 0) {

            let data_filename_and_id_file = []
            for (let m of item.items) {
                if ((m?.uploadResponse?.data?.data || false)) {
                    m.uploadResponse.data.data.map(x => {
                        if (!data_filename_and_id_file.some(a => a.id_file == x.id_file)) {
                            data_filename_and_id_file.push(x)
                        }
                    })
                }
            }

            let i = 0
            for (let m of item.items) {
                let is_array = false
                if (m.uploadResponse.data && m.uploadResponse.data.data && Array.isArray(m.uploadResponse.data.data)) {
                    is_array = true
                }

                if (is_array && m.uploadResponse.data.data[0].errors) {
                    props.onError(m.uploadResponse.data.data[0].errors)
                    i += 1
                    continue
                }
                if (!is_array && m.uploadResponse.data && m.uploadResponse.data.errors) {
                    props.onError(m.uploadResponse.data.errors)
                    i += 1
                    continue
                }



                const fitem = {
                    client_name: m.file.name,
                    file_size: m.file.size,
                    file_type: m.file.type,
                    // file_name: is_array ? m.uploadResponse.data.data[i].name : m.uploadResponse.data.name,
                    // id_file: is_array ? m.uploadResponse.data.data[i].id_file : m.uploadResponse.data.id_file,

                    file_name: is_array ? data_filename_and_id_file[i].name : m.uploadResponse.data.name,
                    id_file: is_array ? data_filename_and_id_file[i].id_file : m.uploadResponse.data.id_file,
                }

                file.push(fitem)

                i += 1
            }

            props.onChangeFile(file)

        }

        // const data1 = {id:1,nama:'bejo'}
        // const data2 = [{id:1,nama:'joko'}]

        setTimeout(() => {
            setshowprogress(false)
            setis_done(true)
        }, 1000)
    });

    // useRequestResponseListener((response) => {
    //     console.log("RAW RESPONSE DARI SERVER");
    //     console.log(response);

    // });

    const deletefile = async (item) => {
        console.log('DELETEFILE');
        console.log(item);

        if (props.onDelete) {
            return props.onDelete(item)
        }

        let id = ''
        if (item.id_file) {
            id = `${item.id_file}`

        }

        await sessionStorage.setItem('path', 'delete')

        const body = {
            // filename: props.filename
            id
        }
        // const response = await postapi_services({ ...body, api_path: "/deletefile", disabledAlert: true })
        const response = await deleteapi_services({ ...body, api_path: props.url ? `/${props.url}` : "/deletefile", disabledAlert: false })
        if (response.error) return

        let file = []
        props.value.map(m => {
            if (m.id_file != item.id_file) {
                file.push(m)
            }
        })
        props.onChangeFile(file)
    }

    // const fetchPDFwithBlob = async (url) => {
    //     setis_popup_loading(true)
    //     const response = await fetch(url);
    //     const blob = await response.blob();
    //     const blobUrl = URL.createObjectURL(blob);
    //     setis_popup_loading(false)
    //     return blobUrl
    // };

    const fetchPDFwithBlob = async (url) => {
        setis_popup_loading(true)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                action: 'index',
                page: props.page,
            },
            credentials: 'include',

        });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setis_popup_loading(false)
        return blobUrl
    };

    const handleOpen = async (item) => {
        $('.layout-app').addClass('is-loading-global')
        const urlblob = await fetchPDFwithBlob(urlPreviewNew(`${props.url}/${item?.id_file || ''}`))
        $('.layout-app').removeClass('is-loading-global')
        // console.log('urlblob');
        // console.log(urlblob);
        window.open(urlblob)
    }

    const view_files = () => {
        if (!props.value || (props.value && props.value.length == 0)) return null
        if (props.disabled && props.is_value_desc && (props.value && props.value.length > 0)) {
            return (
                <p className="">
                    {props.value.map((m, i) => (
                        <Fragment key={i}>
                            {value_files(m)}{i < props.value.length - 1 ? ', ' : ''}
                        </Fragment>
                    ))}
                </p>
            )
        }
        return props.value.map((m, i) => (
            <p className="flex flex-row items-center pb-2 mt-1" key={i}>
                {value_files(m)}
                {!props.disabled ? (
                    <BtnRemove icon="close" size={16} onTap={() => {
                        if (window.confirm('Yakin menghapus data ini?')) {
                            // handleDelete(props.value)
                            deletefile(m)
                        }
                    }} />
                ) : null}

                {((m.evaluasi) || props.saveEvaluasi) && (
                    <BtnIconAct
                        className="bg-warning"
                        icon="edit"
                        tooltips="Evaluasi file"
                        onTap={async () => {

                            setfile_open(m)

                            if (m.file_type.startsWith("image/")) {
                                setfileurl(urlPreviewNew(`${props.url}/${m.id_file}`))

                            } else {
                                const urlblob = await fetchPDFwithBlob(urlPreviewNew(`${props.url}/${m.id_file}`))
                                setfileurl(urlblob)

                            }

                            if (m.file_type.startsWith("image/")) {
                                console.log('IMGIMG==>');

                                seteditor_img_open(true)
                            } else if (m.file_type === "application/pdf") {
                                console.log('PDFPDF==>');

                                seteditor_pdf_open(true)

                            }
                        }}
                    />
                )}

                {/* <InputFileProgress
                    ref={null}
                    id='file'
                    type='file'
                    placeholder={'Bukti'}
                    className='block mt-1 w-full'
                    value={m}
                    onChangeFile={value => {

                    }}
                    message_error={null}
                    disabled
                    url="dok_pendukung"
                    saveEvaluasi={props.saveEvaluasi || null}
                /> */}
            </p>
        ))
    }

    const value_files = (m) => {
        if (m.file_type.startsWith("image/") || m.file_type.startsWith("application/pdf")) {
            return (
                <a
                    className="color-link pr-1"
                    style={{ cursor: 'pointer' }}
                    target="_blank"
                    onClick={async () => {
                        setpopup_open(true)
                        setfile_open(m)

                        if (m.file_type.startsWith("image/")) {
                            setfileurl(urlPreviewNew(`${props.url}/${m.id_file}`))

                        } else {
                            const urlblob = await fetchPDFwithBlob(urlPreviewNew(`${props.url}/${m.id_file}`))
                            setfileurl(urlblob)

                        }

                    }}
                >
                    {m.client_name}
                </a>
            )
        }
        return (
            <a
                className="color-link pr-1"
                style={{ cursor: 'pointer' }}
                target="_blank"
                onClick={() => handleOpen(m)}
            >
                {m.client_name}
            </a >
        )

    }

    return (
        <>
            {!showprogress ? (
                <>
                    {view_files()}
                </>
            ) : null}
            {showprogress ? (
                <ProgressBar className="mt-1" now={completed} label={`${completed}%`} />
            ) : null}

            <Modal
                show={popup_open}
                className=""
                onShow={async () => {
                    // if (file_open.file_type === "application/pdf") {

                    //     const urlblob = await fetchPDFwithBlob(urlPreviewNew(`${props.url}/${file_open.id_file}`))
                    //     setfileurl(urlblob)
                    // }
                }}
                onHide={() => {
                    setpopup_open(false)
                }}
                size="lg"
                fullscreen={file_open && file_open.file_type == 'application/pdf' ? true : false}
            >
                <Modal.Header closeButton={true}>
                    <BtnIcon
                        icon="arrow_back"
                        onTap={() => {
                            setpopup_open(false)
                        }}
                        tooltips="Back"
                        tooltips_placement="bottom"
                    />
                    <div className="d-flex w-full justify-content-between">
                        <Modal.Title>
                            Preview File {is_popup_loading ? 'Loading...' : ''}
                        </Modal.Title>

                        <div className="d-flex align-items-center">

                            {((file_open && file_open.evaluasi) || props.saveEvaluasi) && file_open ? (
                                <Modal.Title
                                    className="text-end color-link cursor-pointer me-3"
                                    onClick={() => {
                                        if (file_open.file_type.startsWith("image/")) {
                                            console.log('IMGIMG==>');
                                            seteditor_img_open(true)
                                        } else if (file_open.file_type === "application/pdf") {
                                            console.log('PDFPDF==>');

                                            seteditor_pdf_open(true)

                                        }
                                    }}
                                    style={{
                                        fontSize: 14,
                                        marginTop: 5
                                    }}
                                >
                                    Evaluasi File
                                </Modal.Title>
                            ) : null}

                            <Modal.Title
                                className="text-end color-link cursor-pointer me-3"
                                onClick={() => {
                                    handleOpen(file_open)
                                }}
                                style={{
                                    fontSize: 14,
                                    marginTop: 5
                                }}
                            >
                                Preview new tab
                            </Modal.Title>
                        </div>

                    </div>
                </Modal.Header>
                <Modal.Body>
                    {file_open && fileurl ? (
                        <>
                            {file_open.file_type.startsWith("image/") ? (
                                <img src={fileurl} alt="Preview" className="w-full" />
                            ) : file_open.file_type === "application/pdf" ? (
                                <iframe
                                    src={fileurl}
                                    className="w-full"
                                    style={{
                                        // height: 'calc(100vh - 59.02px)',
                                        height: '100%',
                                    }}>

                                </iframe>
                                // <Viewer fileUrl={fileurl} />
                            ) : (
                                <>
                                    <h2 className="text-center">Error!</h2>
                                    <p className="text-center">Preview tidak tersedia untuk file ini.</p>
                                </>
                            )}
                        </>
                    ) : null}
                </Modal.Body>

            </Modal>

            {(file_open && file_open.evaluasi) || props.saveEvaluasi ? (
                <>
                    <EditorPdf
                        show={editor_pdf_open}
                        onHide={() => {
                            seteditor_pdf_open(false)
                        }}
                        file_open={file_open}
                        fileurl={fileurl}
                        evaluasi={(file_open && file_open.evaluasi) && detectType(file_open.evaluasi) == 'json' ? file_open.evaluasi : null}
                        saveEvaluasi={props.saveEvaluasi || null}
                    />
                    <EditorImage
                        show={editor_img_open}
                        onHide={() => {
                            seteditor_img_open(false)
                        }}
                        file_open={file_open}
                        fileurl={fileurl}
                        evaluasi={(file_open && file_open.evaluasi) && detectType(file_open.evaluasi) == 'json' ? file_open.evaluasi : null}
                        saveEvaluasi={props.saveEvaluasi || null}
                    />
                </>
            ) : null}


        </>
    )

}

const InputFileProgressMulti = ({ disabled = false, className, ...props }) => {
    const indicatorRef = useRef(null);

    const [ext, setext] = useState(null)
    const [max, setmax] = useState(null)
    const [maxsize, setmaxsize] = useState(null)
    const [extdefault, setextdefault] = useState([])

    const [filename, setfilename] = useState('')
    const [clientname, setclientname] = useState('')
    const [urlpath, seturlpath] = useState('')

    const [accept, setaccept] = useState('')

    useEffect(() => {
        init()
    }, [props.value])

    const filterBySize = useCallback((file) => {
        //filter out files larger than 5MB
        // return file.size < 5242880;
        return true
    }, []);

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

        // console.log('props.value')
        // console.log(props.value)
        if (props.value) {
            setfilename(props.value.file_name)
            setclientname(props.value.client_name)
        }

        const accept = ext.split(',').map(x => `.${x}`).join(',')
        setaccept(accept)
    }


    return (
        // <div className={`form-group row`}>
        //     {props.label ? (
        //         <Label className={`col-sm-4 text-right font-medium ${props.message_error && props.isMulti && props.value.length === 0 || props.message_error && !props.isMulti && Object.keys(props.value).length === 0 ? 'text-danger' : ''}`}>{props.label} {props.required ? <span className="color-danger">*</span> : null}</Label>
        //     ) : null}
        //     <div className="col-sm-8 mb-5 form-uploady">


        //     </div>
        // </div>

        <>
            <div className="container-input-upload">

                {props.message_error ? (
                    <span className="text-danger message-error-form mb-1" style={{ marginTop: -1, display: 'block' }}>{props.message_error}</span>
                ) : null}

                {!disabled ? (
                    <div className="d-flex flex-row">
                        <div className="input-ext">Ext : {props.ext ? props.ext : ext}</div>
                        <div className="input-max-size">Max size per file : {props.max ? `${props.max / onemb}Mb` : max}</div>
                    </div>
                ) : null}

                <Uploady
                    fileFilter={filterBySize}
                    destination={{
                        url: `${import.meta.env.VITE_BACKEND_URL}api/${props.url ? props.url : `upload`}`,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                            'action': props?.action || 'edit',
                            'page': props?.page || '',
                        },
                        withCredentials: true,
                        withXSRFToken: true,
                    }}
                    accept={accept}
                    maxGroupSize={100}
                >
                    <CustomPreSend />

                    <UploadDropZone
                        onDragOverClassName="drag-over"
                        grouped
                        maxGroupSize={3}
                        className="input-file-dropzone"
                        autoUpload
                        fileFilter={filterBySize}
                    >
                        {/* <span>Drag&amp;Drop File(s) Here</span> */}

                        {clientname ? null : (
                            <>
                                {disabled ? null : (
                                    <UploadButton
                                        fileFilter={filterBySize}
                                        grouped
                                    />
                                )}
                            </>
                        )}

                    </UploadDropZone>

                    <LogProgress
                        onChangeFile={props.onChangeFile}
                        disabled={disabled}
                        onError={props.onError ? props.onError : null}
                        handleError={props.handleError ? props.handleError : null}
                        id={props.id}
                        url={props.url ? props.url : null}
                        value={props.value ? props.value : null}
                        page={props?.page || null}
                        action={props?.action || null}
                        onDelete={props.onDelete ? props.onDelete : null}
                        is_value_desc={props?.is_value_desc || null}
                        saveEvaluasi={props.saveEvaluasi || null}
                    />


                </Uploady>

            </div>
        </>
    )
}



export default InputFileProgressMulti
