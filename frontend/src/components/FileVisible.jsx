


import React, { forwardRef, useEffect, useState, useCallback, useRef } from "react"
import { detectType, fileToBase64, fileUploadConfig, showToastr, urlDownload, urlPreview, urlPreviewNew } from "pages/Utils"
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


const FileVisible = (props) => {
    const [editor_img_open, seteditor_img_open] = useState(false)
    const [editor_pdf_open, seteditor_pdf_open] = useState(false)

    if (!props.file || (props.file && Object.keys(props.file).length == 0)) return null
    return (
        <>
            <div className="d-flex align-items-center justify-content-center mb-3">
                {((props.file.evaluasi) || props.saveEvaluasi) && props.file ? (
                    <BtnIconAct
                        icon="edit"
                        label="Evaluasi File"
                        className="bg-warning"
                        onTap={() => {

                            if (props.file.file_type.startsWith("image/")) {
                                seteditor_img_open(true)
                            } else if (props.file.file_type === "application/pdf") {
                                seteditor_pdf_open(true)
                            }
                        }}
                    />
                ) : null}
                <BtnIconAct
                    icon="open_in_new"
                    label="Preview new tab"
                    className="bg-primary"
                    onTap={() => {
                        window.open(props.file.fileurl)
                    }}
                />
            </div>

            <div className="d-flex justify-content-center">
                {props.file.jenisfilex == 'image' ? (
                    <div
                        className='container-file-image'
                        style={{
                            backgroundImage: `url(${props.file.fileurl})`
                        }}
                    >

                    </div>
                ) : props.file.jenisfilex == 'pdf' ? (
                    <div className='container-file-pdf'>
                        <iframe
                            src={props.file.fileurl}
                            className="w-full"
                            style={{
                                height: '100%',
                            }}>

                        </iframe>
                    </div>
                ) : null}
            </div>

            {(props.file && props.file.evaluasi) || props.saveEvaluasi ? (
                <>
                    <EditorPdf
                        show={editor_pdf_open}
                        onHide={() => {
                            seteditor_pdf_open(false)
                        }}
                        file_open={props.file}
                        fileurl={props.file.fileurl}
                        evaluasi={(props.file && props.file.evaluasi) && detectType(props.file.evaluasi) == 'json' ? props.file.evaluasi : null}
                        saveEvaluasi={props.saveEvaluasi || null}
                    />
                    <EditorImage
                        show={editor_img_open}
                        onHide={() => {
                            seteditor_img_open(false)
                        }}
                        file_open={props.file}
                        fileurl={props.file.fileurl}
                        evaluasi={(props.file && props.file.evaluasi) && detectType(props.file.evaluasi) == 'json' ? props.file.evaluasi : null}
                        saveEvaluasi={props.saveEvaluasi || null}
                    />
                </>
            ) : null}

        </>
    )
}



export default FileVisible

