


import React, { forwardRef, useEffect, useState, useCallback, useRef } from "react"
import Label from 'components/Label'
import { detectType, fileToBase64, fileUploadConfig, showToastr, urlDownload, urlPreview, urlPreviewNew } from "pages/Utils"
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

export const onemb = 1024

const CustomPreSend = (props) => {

    useRequestPreSend(({ items, options }) => {

        const validItems = items.filter((item) => {
            let allowedTypes = fileUploadConfig.allowed_types_default_ext;
            if (props.ext && props.allowed_types_default_ext) {
                allowedTypes = props.allowed_types_default_ext
            }
            return allowedTypes.includes(item.file.type);
        });

        if (validItems.length === 0) {
            alert("Ekstensi yang diupload tidak diperbolehkan!");
            return false;
        }

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

    const { postapi_services, deleteapi_services } = api_services({})

    const [editor_img_open, seteditor_img_open] = useState(false)
    const [editor_pdf_open, seteditor_pdf_open] = useState(false)

    useItemProgressListener((item) => {
        if (props.is_show_loading) {
            $('.layout-app').addClass('is-loading-global')
        }
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

        let is_error = false
        let message_error = ''
        if ((item?.items?.[0]?.uploadResponse?.data?.error || false) && (item?.items?.[0]?.uploadResponse?.data?.messages || false) && (item?.items?.[0]?.uploadResponse?.data?.messages?.errors || false)) {
            showToastr('error', item?.items?.[0]?.uploadResponse?.data?.messages?.errors)
            message_error = item?.items?.[0]?.uploadResponse?.data?.messages?.errors
            is_error = true
        }

        if (props.is_show_loading) {
            $('.layout-app').removeClass('is-loading-global')
        }



        if (item.items && item.items.length > 0 && item.items[0].state == "cancelled") {
            return
        }

        let file = null

        if (item.items && item.items.length > 0) {
            let i = 0
            for (let m of item.items) {
                let is_array = false
                if (m.uploadResponse.data && m.uploadResponse.data.data && Array.isArray(m.uploadResponse.data.data)) {
                    is_array = true
                }

                if (!m.uploadResponse.data && m.uploadResponse.code) {
                    props.onError(m.uploadResponse.message)
                    i += 1
                    continue
                }

                if (is_array && m.uploadResponse.data && m.uploadResponse.data.data[0].errors) {
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
                    file_name: is_array ? m.uploadResponse.data.data[i].name : m.uploadResponse.data.name,
                    id_file: is_array ? m.uploadResponse.data.data[i].id_file : m.uploadResponse.data.id_file,
                }
                file = fitem

                i += 1
            }

            if (!is_error) {
                props.onChangeFile(file)
            }

        }


        setTimeout(() => {
            setshowprogress(false)
            setis_done(true)
        }, 1000)

        if ((item?.items?.[0]?.uploadResponse?.data?.message || false)) {
            showToastr('success', item?.items?.[0]?.uploadResponse?.data?.message || '')
        }

        if (is_error) {
            return props.onError({ file: message_error })
        }
    });

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

        let file = null
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

    return (
        <>
            {!showprogress ? (
                <>
                    {props.value && Object.keys(props.value).length > 0 ? (
                        <p className="flex flex-row items-center pb-2 mt-1" >
                            {props.value.file_type.startsWith("image/") || props.value.file_type.startsWith("application/pdf") ? (
                                <>
                                    {!props.setClientNameTo ? (

                                        <a
                                            className="color-link pr-1"
                                            style={{ cursor: 'pointer' }}
                                            target="_blank"
                                            onClick={async () => {
                                                setpopup_open(true)
                                                setfile_open(props.value)

                                                if (props.value.file_type.startsWith("image/")) {
                                                    setfileurl(urlPreviewNew(`${props.url}/${props.value.id_file}`))

                                                } else {
                                                    const urlblob = await fetchPDFwithBlob(urlPreviewNew(`${props.url}/${props.value.id_file}`))
                                                    setfileurl(urlblob)

                                                }

                                            }}
                                        >
                                            {props.value.client_name}
                                        </a>
                                    ) : (
                                        <a
                                            className="color-link pr-1"
                                            style={{ cursor: 'pointer' }}
                                            target="_blank"
                                            onClick={async () => {
                                                setfile_open(props.value)

                                                if (props.value.file_type.startsWith("image/")) {
                                                    setfileurl(urlPreviewNew(`${props.url}/${props.value.id_file}`))

                                                } else {
                                                    const urlblob = await fetchPDFwithBlob(urlPreviewNew(`${props.url}/${props.value.id_file}`))
                                                    setfileurl(urlblob)

                                                }

                                                if (props.value.file_type.startsWith("image/")) {
                                                    console.log('IMGIMG==>');
                                                    seteditor_img_open(true)
                                                } else if (props.value.file_type === "application/pdf") {
                                                    console.log('PDFPDF==>');

                                                    seteditor_pdf_open(true)

                                                }

                                            }}
                                        >
                                            {props.setClientNameTo}
                                        </a>

                                    )}
                                </>
                            ) : (

                                <a
                                    className="color-link pr-1"
                                    style={{ cursor: 'pointer' }}
                                    target="_blank"
                                    // href={urlPreviewNew(`${props.url}/${props.value.id_file}`)}
                                    onClick={() => handleOpen(props.value)}
                                >
                                    {props.value.client_name}
                                </a>
                            )}
                            {!props.disabled ? (
                                <BtnRemove icon="close" size={16} onTap={() => {
                                    if (window.confirm('Yakin menghapus data ini?')) {
                                        // handleDelete(props.value)
                                        deletefile(props.value)
                                    }
                                }} />
                            ) : null}
                        </p>
                    ) : null}
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

const InputFileProgress = ({ disabled = false, className, ...props }) => {
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

    // const getCookieValue = (name) => {
    //     const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
    //     return match ? decodeURIComponent(match[2]) : null;
    // };

    // const xsrfToken = getCookieValue("XSRF-TOKEN");
    // console.log("XSRF Token:", xsrfToken);

    // const xsrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    // console.log("XSRF Token:", xsrfToken);

    return (

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
                            // "XSRF-TOKEN": xsrfToken,
                            // 'Cookie': 'aaaa'
                        },
                        withCredentials: true,
                        withXSRFToken: true,
                    }}
                    accept={accept}
                    multiple={false}
                // enhancer={withCredentialsEnhancer}
                // send={customSend}

                >
                    <CustomPreSend {...props} />

                    <UploadDropZone
                        onDragOverClassName="drag-over"
                        grouped={false}
                        maxGroupSize={3}
                        className="input-file-dropzone"
                        autoUpload
                        fileFilter={filterBySize}

                    >

                        {props.value ? null : (
                            <>
                                {disabled ? null : (
                                    <UploadButton
                                        fileFilter={filterBySize}
                                        grouped={false}
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
                        is_show_loading={props.is_show_loading || false}
                        onDelete={props.onDelete ? props.onDelete : null}
                        saveEvaluasi={props.saveEvaluasi || null}
                        setClientNameTo={props.setClientNameTo || null}
                    />


                </Uploady>

            </div>
        </>
    )
}



export default InputFileProgress

