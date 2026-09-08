import React, { Fragment, useState } from 'react'
import TooltipsApp from './TooltipsApp';
import { Modal } from 'react-bootstrap';
import Button from './Button';


const AICancel = (props) => {
    const [popup_open, setpopup_open] = useState(false)
    const Links = (props) => (
        <TooltipsApp {...props} />
    );

    const btn = () => (
        <div
            className={`d-flex align-items-center btn-ai bg-danger`}
            onClick={() => {
                setpopup_open(true)
            }}
        >
            <span
                className='material-icons'
                style={{
                    fontSize: props.size || 24,
                    color: 'white',
                    marginRight: 2
                }}
            >cancel</span>

            Cancel
        </div>
    )

    let tooltips = 'Batalkan Generate AI'
    if(props.tooltips) {
        tooltips = props.tooltips
    }
    return (
        <>
            <Links
                id={tooltips} title={tooltips}>
                {btn()}
            </Links>

            <Modal
                show={popup_open}
                className=""
                onShow={async () => {

                }}
                onHide={() => {
                    setpopup_open(false)
                }}
                size="md"
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        Generate AI
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='text-center title-mdl'>
                        {props.title || 'Batalkan Proses Generate AI?'}
                    </div>
                    <div className='text-center desc-mdl font-15'>
                        {props.desc || `
                        Proses Generate AI sedang berjalan dan mungkin memerlukan beberapa saat untuk diselesaikan. Jika Anda membatalkan sekarang, proses yang sedang berlangsung akan dihentikan dan data yang belum tersimpan bisa hilang.

Apakah Anda yakin ingin membatalkan proses ini?
                        `}
                    </div>

                    <div className="d-flex justify-content-end mt-3">

                        <Button
                            className="btn-default-app bg-danger"
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
                            OK, Batalkan Proses
                        </Button>

                    </div>
                </Modal.Body>

            </Modal>

        </>

    )
}

export default AICancel