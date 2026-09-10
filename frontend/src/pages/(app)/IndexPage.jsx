import React, { Component, createRef, PureComponent } from "react";
import { initAccessMethod } from "pages/Utils";
import { Modal } from "react-bootstrap";

class IndexPage extends Component {
    constructor(props) {
        super(props)
        // inisialisasi state
        this.state = {
            access_method: [],
            datafilter: {
                paginate: {
                    page: 1,
                    pagesize: 20
                }
            },
            is_loading: false,
            list: [],
            listreferensi: [],
            listcombo: [],
            filter: {},
            order: '',
            showModal: false,
            path: '',
            other_state: {}
        }
    }


    model = null
    primaryKey = this.model ? this.model.primaryKey : null
    id = null
    headers = []
    initialized = createRef(false);
    referensi_other = {}

    componentDidMount() {
        if (!this.initialized.current) {
            this.init()
            this.initialized.current = true
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // Re-initialize when URL slug changes (e.g., open Add/Edit/Detail modal)
        const prevSlug = prevProps.params?.slug?.join('/') || ''
        const currSlug = this.props.params?.slug?.join('/') || ''
        if (prevSlug !== currSlug) {
            this.init()
        }
    }

    init = async () => {
        const { access_method, path } = await initAccessMethod(this.props.pathaccess);
        this.setState({ path, access_method }, () => {
            this.get()
            this.getreferensi()
            this.getreferensi_other()
        })
    }

    get = async () => {
        const { filter, order, datafilter } = this.state
        var filterarr = {}
        this.headers.map(v => {
            if (filter[v.name]) {
                if (v.type == 'list') {
                    filterarr[v.name] = filter[v.name]
                } else {
                    filterarr[v.name] = '%' + filter[v.name] + '%'
                }
            }
        })
        this.setState({ is_loading: true })
        const response = await this.model.get({
            filter: {
                ...datafilter,
                filter: filterarr,
                order
            },
        })
        this.setState({ is_loading: false })
        if (response.error || response.code) return

        this.setState({
            list: response.data,
            datafilter: {
                ...datafilter,
                paginate: {
                    ...datafilter.paginate,
                    total_records: response.total_records
                }
            }
        })
    }

    delete = async (id) => {
        const response = await this.model.delete(id)
        if (response.error || response.code) return
        this.get()
    }

    getreferensi = async () => {
        if (!this.model.relasi) return
        for (let m in this.model.relasi) {
            const thismodel = this.model.relasi[m]
            const dataarr = await thismodel.getCombo()
            if (dataarr.error || dataarr.code) return

            let dataidx = {}
            dataarr.map(x => {
                dataidx[x.value] = x.label
            })
            this.setState(state => ({
                listreferensi: {
                    ...state.listreferensi,
                    [m]: dataidx
                },
            }))
        }
    }

    getreferensi_other = async () => {
        if (Object.keys(this.referensi_other).length == 0) return
        for (let m in this.referensi_other) {
            const thismodel = this.referensi_other[m]
            const dataarr = await thismodel.getCombo()
            if (dataarr.error || dataarr.code) return

            let dataidx = {}
            dataarr.map(x => {
                dataidx[x.value] = x.label
            })
            this.setState(state => ({
                listreferensi: {
                    ...state.listreferensi,
                    [m]: dataidx
                },
                listcombo: {
                    ...state.listcombo,
                    [m]: dataarr
                }
            }))
        }
    }

    modaldetail = (child) => (
        <Modal
            show={this.state.showModal}
            className={this.state.path === 'detail' ? 'eoffice-modal eoffice-modal-detail' : 'eoffice-modal'}
            dialogClassName={this.state.path === 'detail' ? 'eoffice-modal-wide' : ''}
            onShow={() => {

            }}
            // Form/detail modals must be closed deliberately with the X button.
            onHide={() => {}}
            backdrop="static"
            keyboard={false}
            size="xl"
        >
            <Modal.Header closeButton={false} className="d-flex justify-content-between align-items-center">
                <Modal.Title>
                    {`${this.state.path === "add" ? "Tambah" : this.state.path === "edit" ? "Edit" : "Detail"} ${this.titlePage}`}
                </Modal.Title>
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Tutup"
                    onClick={() => this.setState({ showModal: false })}
                />
            </Modal.Header>
            <Modal.Body
                className={this.state.path === 'detail' ? 'eoffice-modal-body' : ''}
                style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
            >
                {child}
            </Modal.Body>

        </Modal>
    )
}

export default IndexPage
