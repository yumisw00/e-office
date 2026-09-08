import React, { Component } from 'react'
import { Modal } from 'react-bootstrap'
import BtnIconAct from './BtnIconAct'

export default class HistoryPengajuan extends Component {
    constructor(props) {
        super(props)
        this.state = {
            modal_history_pengajuan: false
        }
    }

    modal_history_pengajuan = (child) => (
        <Modal
            show={this.state.modal_history_pengajuan}
            className=""
            onShow={() => {

            }}
            onHide={() => {
                this.setState({ modal_history_pengajuan: false })
            }}
            size="md"
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    History Pengajuan
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-12">
                        {this.props.listcombo?.id_status?.map((m, i) => (
                            <div className='c-item-timeline' key={i}>
                                <div className='c-item-timeline-c-dot'>
                                    <div className='c-item-timeline-dot'
                                        style={{
                                            backgroundColor: m?.color_code || '#fff'
                                        }}
                                    ></div>
                                </div>
                                <div className='c-item-timeline-c-ctn'>
                                    <div className='c-item-timeline-c-title'>
                                        {m.label}
                                    </div>
                                    <div className='c-item-timeline-c-desc'>
                                        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Corporis, sint?
                                    </div>
                                    <div className='c-item-timeline-c-time d-flex align-items-center'>
                                        <span className='material-icons me-1'>history</span>
                                        08:30 10-01-2025
                                        <span className='material-icons ms-2 me-1'>person</span>
                                        Andika Wahyu (VP Bagian Keuangan)
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>

        </Modal>
    )


    render() {
        return null
        return (
            <>
                <BtnIconAct
                    icon="history"
                    label="History Pengajuan"
                    className="unset-box-shadow"
                    tooltips="Klik untuk informasi lebih lanjut"
                    onTap={() => {
                        this.setState(state => ({
                            modal_history_pengajuan: true
                        }))
                    }}
                    classNameColorText="color-black"
                />
                {this.modal_history_pengajuan()}
            </>
        )
    }
}
