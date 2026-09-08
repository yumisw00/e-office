import React, { Component } from 'react'
import { Modal } from 'react-bootstrap'
import { Annotation } from 'react-mark-image';
import '../pages/editor_image.css'
// import Annotation from 'react-image-annotation/lib';

export default class EditorImage extends Component {
    constructor(props) {
        super(props)
        // inisialisasi state
        this.state = {
            is_loading: false,
            images: [],
            annotations: []
        }
    }

    // componentDidUpdate(prevProps, prevState) {
    //     if (prevProps.fileurl != this.props.fileurl) {
    //         const item = {
    //             src: this.props.fileurl,
    //             name: ''
    //         }
    //         if (this.props.evaluasi) {
    //             const evaluasi = JSON.parse(this.props.evaluasi)
    //             if (evaluasi.length > 0 && (evaluasi[0].regions || false)) {
    //                 item.regions = evaluasi[0]?.regions || null
    //             }
    //         }

    //         this.setState(state => ({
    //             images: [
    //                 item
    //             ]
    //         }))
    //     }
    // }

    CustomShape = ({ annotation }) => {
        const { geometry } = annotation;
        return (
            <div
                style={{
                    position: 'absolute',
                    left: `${geometry.x}%`,
                    top: `${geometry.y}%`,
                    width: `${geometry.width}%`,
                    height: `${geometry.height}%`,
                    // Ubah warna garis di sini
                    border: '3px solid #FF0000', // Contoh: Warna merah
                    boxSizing: 'border-box',
                }}
            />
        );
    };

    render() {
        return (
            <Modal
                show={this.props.show}
                className=""
                onShow={async () => {
                    // const item = {
                    //     src: this.props.fileurl,
                    //     name: ''
                    // }
                    // if (this.props.evaluasi) {
                    //     const evaluasi = JSON.parse(this.props.evaluasi)
                    //     if (evaluasi.length > 0 && (evaluasi[0].regions || false)) {
                    //         item.regions = evaluasi[0]?.regions || null
                    //     }
                    // }
                    // this.setState(state => ({
                    //     images: [
                    //         item
                    //     ]
                    // }))

                    if (this.props.evaluasi) {
                        const evaluasi = JSON.parse(this.props.evaluasi)
                        this.setState(state => ({
                            annotations: evaluasi
                        }))
                    }
                }}
                onHide={() => {
                    this.props.onHide()
                }}
                size="lg"
                fullscreen
            >
                <Modal.Header closeButton={true}>
                    {/* <BtnIcon
                        icon="arrow_back"
                        onTap={() => {
                            this.props.onHide()
                        }}
                        tooltips="Back"
                        tooltips_placement="bottom"
                    />
                    <div className="d-flex w-full justify-content-between">
                        <Modal.Title>
                            Evaluasi File {is_popup_loading ? 'Loading...' : ''}
                        </Modal.Title>


                    </div> */}

                    <Modal.Title>
                        Evaluasi File

                        {this.props.saveEvaluasi ? (
                            <button
                                onClick={() => {
                                    this.props.saveEvaluasi(this.props?.file_open?.id_file || '0', this.state.annotations)
                                    this.props.onHide()
                                }}
                                className="ms-2 btn btn-primary"
                                type="button"
                            >
                                Save
                            </button>
                        ) : null}
                    </Modal.Title>

                </Modal.Header>
                <Modal.Body>
                    {/* <div className={!this.props.saveEvaluasi ? "readonly-annotator" : ""}>
                        <ImageAnnotator
                            images={this.state.images}
                            regionClsList={["Benar", "Salah", "Sesuai", "Tidak Sesuai"]}
                            regionAttributes={["catatan", "rekomendasi"]}
                            enabledTools={["select", "box", "create-box"]}
                            showTags={true}
                            onExit={(data) => {
                                if (data.images && this.props.saveEvaluasi) {
                                    console.log('ON EXIT =>');
                                    console.log(data.images);

                                    this.props.saveEvaluasi(data.images)
                                    this.props.onHide()
                                }
                            }}
                            hideHeader={!this.props.saveEvaluasi}
                        />
                    </div> */}

                    <div className={!this.props.saveEvaluasi ? "readonly-annotator" : ""}></div>
                    <Annotation
                        src={this.props.fileurl || null}
                        alt="Evaluasi Image"
                        annotations={this.state.annotations}
                        onAnnotationsUpdate={val => {
                            this.setState(state => ({
                                annotations: val
                            }))
                        }}
                        allowTouch
                    // renderShape={this.CustomShape}
                    // allowedShapes={[
                    //     'rect',    // kotak / rectangle
                    //     'circle',  // lingkaran
                    //     'point',   // titik
                    //     'line',    // garis
                    //     'arrow',   // panah
                    //     'text',    // teks
                    //     'free'     // free draw / coret-coret
                    // ]}

                    />

                </Modal.Body>

            </Modal>
        )
    }
}
