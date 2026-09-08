import React, { Fragment, useState } from 'react'
import TooltipsApp from './TooltipsApp';
import { Modal } from 'react-bootstrap';
import Button from './Button';

const text_proses = 'Sedang Diproses oleh AI'
const text_generated_ai = 'Isian Telah Direkomendasikan oleh AI'

const AITooltips = (props) => {
    const [popup_open, setpopup_open] = useState(false)
    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    let src = '/ai.png'
    if (props.iconWhite) {
        src = '/ai-w.png'
    }

    const btn = () => (
        <div
            className={`d-flex align-items-center ${props.klik ? 'btn-ai' : ''} ${props.disabled && 'disabled'}`}
            onClick={() => {
                if (props.klik && !props.disabled) {
                    setpopup_open(true)
                }
            }}
        >
            <img
                style={{
                    width: props.size || 24,
                    height: props.size || 24,
                    minWidth: props.size || 24
                }}
                src={src}

            />
            {props.klik && (
                <div className='ms-1'>
                    Generate AI
                </div>
            )}
            {props.process && (
                <i>Loading AI...</i>
            )}
        </div>
    )

    if (props.disabled) return btn()

    let tooltips = ''
    if (props.process) {
        tooltips = text_proses
    }
    if (props.generated_ai) {
        tooltips = text_generated_ai
    }
    if (props.tooltips) {
        tooltips = props.tooltips
    }
    return (
        <>
            {(props.process || props.generated_ai || props.klik) && (
                <Links
                    id={tooltips} title={tooltips}>
                    {btn()}
                </Links>
            )}
            {props.klik && (
                <Modal
                    show={popup_open}
                    className=""
                    onShow={async () => {

                    }}
                    onHide={() => {
                        setpopup_open(false)
                    }}
                    size="lg"
                >
                    <Modal.Header closeButton={true}>
                        <Modal.Title>
                            Generate AI
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className='text-center title-mdl'>
                            {props.title || 'Proses Generate dengan AI'}
                        </div>
                        <div className='text-center desc-mdl font-15'>
                            {props.desc || `Fitur ini akan menggunakan kecerdasan buatan (AI) untuk menganalisis dan mengisi data secara otomatis berdasarkan informasi yang tersedia.
                            Proses ini mungkin memerlukan waktu beberapa saat, tergantung pada jumlah dan kompleksitas data yang diproses. Selama proses berlangsung, mohon untuk tidak menutup halaman atau melakukan refresh agar hasil dapat dihasilkan dengan optimal.
                      `}
                        </div>
                        <div className='bold desc-mdl color-black font-15 mt-3 mb-2'>
                            Aplikasi menampilkan indikator status yang dapat dipantau:
                        </div>
                        <table className='w-full table table-auto border-collapse border'>
                            <tbody>
                                <tr>
                                    <td className='border'>
                                        <AITooltips
                                            size={18}
                                            process
                                        />
                                    </td>
                                    <td className='border'>
                                        “{text_proses}” : Ketika masih dalam proses generate
                                    </td>
                                </tr>
                                <tr>
                                    <td className='border'>
                                        <AITooltips
                                            size={18}
                                            generated_ai
                                        />
                                    </td>
                                    <td className='border'>
                                        “{text_generated_ai}” : Ketika hasil tersedia atau proses generate selesai
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="d-flex justify-content-end mt-3">

                            <Button
                                className="btn-default-app"
                                onClick={() => {
                                    setpopup_open(false)
                                    if (props.onTap) {
                                        props.onTap()
                                    }
                                }}
                            >
                                <span className="material-icons icon-btn-left mr-1">
                                    done
                                </span>
                                OK, Lanjutkan
                            </Button>

                        </div>
                    </Modal.Body>

                </Modal>
            )}
        </>

    )
}

export default AITooltips