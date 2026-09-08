"use client"

import HeaderApp from "components/HeaderApp";
import { Modal } from "react-bootstrap";
import Pagination from "components/Pagination";
import Button from "components/Button";
import IndexPage from "../IndexPage";
import surat_arsipModel from "hooks/models/surat_arsipModel";
import SuratArsipEdit from "./[...slug]/page";
import { formatDateApp, urlPreview } from "pages/Utils";
import { canUseEofficeAction } from "lib/eofficeAccess";
import {
    EofficeCard,
    EofficeEmptyState,
    EofficeTableCell,
    EofficeTableWithFilter,
} from "components/EofficeModuleUI";

const jenisReferensi = {
    surat_masuk: 'Surat Masuk',
    surat_keluar: 'Surat Keluar',
}

const jenisPengirimanReferensi = {
    internal: 'Internal',
    eksternal: 'Eksternal',
}

class SuratArsip extends IndexPage {
    titlePage = ""
    model = new surat_arsipModel()
    headers = [
        { name: "jenis_surat", label: "Jenis", width: "150px", type: "list" },
        { name: "jenis_pengiriman", label: "Pengiriman", width: "130px", type: "list" },
        { name: "nomor_surat", label: "Nomor Surat", width: "230px", type: "string" },
        { name: "perihal", label: "Perihal", width: "330px", type: "string" },
        { name: "lokasi_fisik", label: "Lokasi Fisik", width: "240px", type: "string" },
        { name: "file_path", label: "File", width: "280px", type: "string" },
        { name: "tanggal_arsip", label: "Tanggal Arsip", width: "150px", type: "date" },
    ]

    headerCellStyle = width => ({
        width,
        backgroundColor: '#138a98',
        color: '#fff',
        textAlign: 'center',
        verticalAlign: 'middle',
        padding: '10px 8px',
        fontWeight: 700,
        lineHeight: 1.25,
    })

    state = {
        ...this.state,
        inlineFilterValues: {},
        quickSearch: '',
        showDetail: false,
        selectedArsip: null,
        listreferensi: {
            jenis_surat: jenisReferensi,
            jenis_pengiriman: jenisPengirimanReferensi,
        },
    }

    formatValue = (item, header) => {
        if (header.type === 'list') {
            return this.state.listreferensi[header.name]?.[item[header.name]] || item[header.name]
        }

        if (header.type === 'date') {
            return item[header.name] ? formatDateApp(item[header.name], 'YYYY-MM-DD') : ''
        }

        return item[header.name]
    }

    handleDeleteArsip = id => {
        if (!window.confirm('Hapus arsip surat ini? Data yang dihapus tidak dapat dikembalikan.')) return
        this.delete(id)
    }

    handleInlineFilterChange = (colName, value) => {
        this.setState(prev => ({
            inlineFilterValues: {
                ...prev.inlineFilterValues,
                [colName]: value,
            },
        }))
    }

    getJenisOptions = () => {
        return Object.entries(jenisReferensi).map(([key, label]) => ({ value: key, label }))
    }

    getJenisPengirimanOptions = () => {
        return Object.entries(jenisPengirimanReferensi).map(([key, label]) => ({ value: key, label }))
    }

    getFilteredArsipList = () => {
        const filters = this.state.inlineFilterValues
        const quickSearch = String(this.state.quickSearch || '').trim().toLowerCase()
        const list = Array.isArray(this.state.list) ? this.state.list : []
        return list.filter(item => {
            if (quickSearch) {
                const searchable = [
                    item.jenis_surat,
                    jenisReferensi[item.jenis_surat],
                    item.nomor_surat,
                    item.perihal,
                    item.lokasi_fisik,
                    item.tanggal_arsip,
                ].join(' ').toLowerCase()

                if (!searchable.includes(quickSearch)) return false
            }

            // Jenis Surat filter (select)
            if (filters.jenis_surat) {
                if (String(item.jenis_surat || '') !== String(filters.jenis_surat)) return false
            }
            // Jenis Pengiriman filter (select)
            if (filters.jenis_pengiriman) {
                if (String(item.jenis_pengiriman || 'eksternal') !== String(filters.jenis_pengiriman)) return false
            }
            // Nomor Surat filter (text)
            if (filters.nomor_surat) {
                const search = filters.nomor_surat.toLowerCase()
                if (!String(item.nomor_surat || '').toLowerCase().includes(search)) return false
            }
            // Perihal filter (text)
            if (filters.perihal) {
                const search = filters.perihal.toLowerCase()
                if (!String(item.perihal || '').toLowerCase().includes(search)) return false
            }
            // Lokasi Fisik filter (text)
            if (filters.lokasi_fisik) {
                const search = filters.lokasi_fisik.toLowerCase()
                if (!String(item.lokasi_fisik || '').toLowerCase().includes(search)) return false
            }
            return true
        })
    }

    resetFilters = () => {
        this.setState({ inlineFilterValues: {}, quickSearch: '' })
    }

    renderFilePath = value => {
        if (!value) return '-'
        const text = String(value)
        return (
            <div className="d-block text-truncate" style={{ maxWidth: '100%' }} title={text}>
                {text}
            </div>
        )
    }

    getPreviewFileUrl = filePath => {
        if (!filePath) return ''
        const value = String(filePath)
        if (value.startsWith('http') || value.startsWith('data:')) return value
        return urlPreview(value.startsWith('/') ? value : `/${value}`)
    }

    renderDetailModal = () => {
        const item = this.state.selectedArsip
        if (!item) return null

        const fileUrl = this.getPreviewFileUrl(item.file_path)
        const isImage = /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(item.file_path || '')
        const fields = [
            { label: 'Jenis Surat', value: jenisReferensi[item.jenis_surat] || item.jenis_surat || '-' },
            { label: 'Tanggal Arsip', value: item.tanggal_arsip ? formatDateApp(item.tanggal_arsip, 'YYYY-MM-DD') : '-' },
            { label: 'Nomor Surat', value: item.nomor_surat || '-' },
            { label: 'Lokasi Fisik', value: item.lokasi_fisik || '-' },
        ]

        return (
            <Modal
                show={this.state.showDetail}
                onHide={() => this.setState({ showDetail: false, selectedArsip: null })}
                className="eoffice-modal eoffice-modal-detail"
                dialogClassName="eoffice-modal-wide"
                size="xl"
            >
                <Modal.Header closeButton style={{ background: '#138a98', color: '#fff' }}>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <span className="material-icons">archive</span>
                        Detail Arsip Surat
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="eoffice-modal-body" style={{ overflow: 'auto' }}>
                    <div className="d-flex flex-wrap h-100" style={{ gap: 14, minHeight: 0 }}>
                        <div style={{ flex: '0 1 330px', minWidth: 280 }}>
                            <div className="arsip-preview-card h-100">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div>
                                        <div className="font-semibold text-slate-800">{item.perihal || 'Arsip Surat'}</div>
                                        <div className="text-muted" style={{ fontSize: 12 }}>Informasi arsip</div>
                                    </div>
                                    <span className={`arsip-jenis arsip-jenis-${item.jenis_surat || 'lainnya'}`}>
                                        {jenisReferensi[item.jenis_surat] || item.jenis_surat || '-'}
                                    </span>
                                </div>
                                <div className="row g-2">
                                    {fields.map(field => (
                                        <div className="col-12" key={field.label}>
                                            <div className="arsip-detail-field">
                                                <div className="arsip-detail-label">{field.label}</div>
                                                <div className="arsip-detail-value">{field.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="col-12">
                                        <div className="arsip-detail-field">
                                            <div className="arsip-detail-label">Path File</div>
                                            <div className="arsip-detail-value">{item.file_path || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="arsip-detail-field">
                                            <div className="arsip-detail-label">Hash File</div>
                                            <div className="arsip-detail-value">{item.hash_file || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex flex-column" style={{ flex: '1 1 600px', minWidth: 320, minHeight: 460 }}>
                            <div className="arsip-preview-card d-flex flex-column h-100" style={{ minHeight: 0 }}>
                                <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="font-semibold text-slate-800">
                                            <span className="material-icons mr-1" style={{ fontSize: 17, verticalAlign: 'middle' }}>attach_file</span>
                                            Preview Dokumen
                                        </div>
                                        <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{item.file_path || 'Belum ada file lampiran'}</div>
                                    </div>
                                    {fileUrl ? (
                                        <Button type="button" className="btn-default-app btn-info btn-sm" onClick={() => window.open(fileUrl, '_blank')}>
                                            <span className="material-icons mr-1" style={{ fontSize: 14 }}>open_in_new</span>
                                            Buka
                                        </Button>
                                    ) : null}
                                </div>
                                {!fileUrl ? (
                                    <div className="arsip-preview-empty">
                                        <span className="material-icons" style={{ fontSize: 44 }}>description</span>
                                        <div className="font-semibold mt-2">Belum ada lampiran dokumen</div>
                                        <div className="text-muted mt-1">Preview tersedia saat file arsip tersimpan.</div>
                                    </div>
                                ) : isImage ? (
                                    <div className="arsip-preview-frame d-flex align-items-center justify-content-center">
                                        <img src={fileUrl} alt="Lampiran arsip surat" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <iframe title="Preview arsip surat" src={fileUrl} className="arsip-preview-frame" />
                                )}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-default-app btn-light" onClick={() => this.setState({ showDetail: false, selectedArsip: null })}>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }

    renderLokasiFisik = value => {
        if (!value) return <span className="text-muted">-</span>
        const text = String(value)
        return (
            <div className="d-block text-truncate" style={{ maxWidth: '100%' }} title={text}>
                {text}
            </div>
        )
    }

    // Table headers with filter config for EofficeTableWithFilter
    tableHeaders = [
        { name: 'jenis_pengiriman', label: 'Pengiriman', width: 130, align: 'center', filterType: 'select' },
        { name: 'nomor_surat', label: 'Nomor Surat', width: 230, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'perihal', label: 'Perihal', width: 330, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'lokasi_fisik', label: 'Lokasi Fisik', width: 240, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'tanggal_arsip', label: 'Tanggal Arsip', width: 150, align: 'center', filterType: 'date' },
        { name: 'aksi', label: 'Aksi', width: 72, align: 'center', filterType: 'none' },
    ]

    tableColgroup = [130, 230, 330, 240, 150, 72]

    renderArsipTable = list => {
        const jenisOptions = this.getJenisOptions()
        const jenisPengirimanOptions = this.getJenisPengirimanOptions()
        const canDelete = canUseEofficeAction('surat_arsip', 'delete')

        const jenisCol = { name: 'jenis_surat', label: 'Jenis', width: 150, align: 'center', filterType: 'select', filterOptions: jenisOptions }
        const headersWithOptions = [
            jenisCol,
            ...this.tableHeaders.map(header => header.name === 'jenis_pengiriman'
                ? { ...header, filterOptions: jenisPengirimanOptions }
                : header),
        ]

        return (
            <EofficeTableWithFilter
                headers={headersWithOptions}
                colgroup={[150, 130, 230, 330, 240, 150, 72]}
                filterValues={this.state.inlineFilterValues}
                onFilterChange={this.handleInlineFilterChange}
                align="start"
                minWidth={1100}
            >
                {list.map((item, i) => (
                    <tr key={item[this.model.primaryKey] || i} className="align-top">
                        <EofficeTableCell width={150} align="start" wrap>
                            {jenisReferensi[item.jenis_surat] || item.jenis_surat || '-'}
                        </EofficeTableCell>
                        <EofficeTableCell width={130} align="start">
                            {jenisPengirimanReferensi[item.jenis_pengiriman] || 'Eksternal'}
                        </EofficeTableCell>
                        <EofficeTableCell width={230} align="start" wrap>
                            <a
                                href={`/surat_arsip/detail/${item[this.model.primaryKey]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="color-link font-semibold"
                                style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left' }}
                            >
                                {item.nomor_surat || '-'}
                            </a>
                        </EofficeTableCell>
                        <EofficeTableCell width={330} align="start" wrap>{item.perihal || '-'}</EofficeTableCell>
                        <EofficeTableCell width={240} align="start" wrap>
                            {this.renderLokasiFisik(item.lokasi_fisik)}
                        </EofficeTableCell>
                        <EofficeTableCell width={150} align="center">
                            {item.tanggal_arsip ? formatDateApp(item.tanggal_arsip, 'YYYY-MM-DD') : '-'}
                        </EofficeTableCell>
                        <EofficeTableCell width={72}>
                            {canDelete ? (
                                <div className="d-flex align-items-center justify-content-center td-action">
                                    <Button
                                        type="button"
                                        className="btn-default-app btn-danger btn-sm"
                                        onClick={() => this.handleDeleteArsip(item[this.model.primaryKey])}
                                        title="Hapus arsip"
                                        aria-label="Hapus arsip"
                                    >
                                        <span className="material-icons" style={{ fontSize: 15 }}>delete</span>
                                    </Button>
                                </div>
                            ) : null}
                        </EofficeTableCell>
                    </tr>
                ))}
            </EofficeTableWithFilter>
        )
    }

    render() {
        const list = this.getFilteredArsipList()
        const allArsip = Array.isArray(this.state.list) ? this.state.list : []
        const suratMasukCount = allArsip.filter(item => item.jenis_surat === 'surat_masuk').length
        const suratKeluarCount = allArsip.filter(item => item.jenis_surat === 'surat_keluar').length
        const hasFilters = Boolean(this.state.quickSearch || Object.values(this.state.inlineFilterValues).some(Boolean))

        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={[]}
                    hideTitle
                />

                <div className="container pl-4 pr-4 pb-4">
                    <div className="row g-3 mb-1">
                        <div className="col-md-4">
                            <div className="arsip-summary-card">
                                <span className="material-icons arsip-summary-icon">archive</span>
                                <div><div className="arsip-summary-value">{allArsip.length}</div><div className="arsip-summary-label">Arsip pada halaman ini</div></div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="arsip-summary-card">
                                <span className="material-icons arsip-summary-icon">inbox</span>
                                <div><div className="arsip-summary-value">{suratMasukCount}</div><div className="arsip-summary-label">Surat masuk</div></div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="arsip-summary-card">
                                <span className="material-icons arsip-summary-icon">outgoing_mail</span>
                                <div><div className="arsip-summary-value">{suratKeluarCount}</div><div className="arsip-summary-label">Surat keluar</div></div>
                            </div>
                        </div>
                    </div>

                    <EofficeCard className="p-3 mb-3">
                        {list.length > 0 ? this.renderArsipTable(list) : (
                            <EofficeEmptyState
                                icon={hasFilters ? "search_off" : "archive"}
                                title={hasFilters ? "Arsip tidak ditemukan" : "Belum ada arsip surat"}
                                description={hasFilters ? "Ubah kata kunci atau reset filter untuk melihat seluruh arsip." : "Data arsip surat akan muncul di sini."}
                            />
                        )}
                    </EofficeCard>

                    <Pagination
                        paginate={this.state.datafilter.paginate}
                        onPageClick={(page) => {
                            const { datafilter } = this.state
                            this.setState({
                                datafilter: {
                                    ...datafilter,
                                    paginate: {
                                        ...datafilter.paginate,
                                        page: page.selected + 1,
                                    },
                                }
                            }, () => this.get());
                        }}
                    />
                </div>

                {this.modaldetail(
                    <SuratArsipEdit
                        params={{
                            id: this.id,
                            slug: [this.state.path, this.id]
                        }}
                        router={this.props.router}
                        pathname={`${this.props.pathname}/${this.state.path}/${this.id}`}
                        pathaccess={this.props.pathaccess}
                        onLoad={() => {
                            this.setState({ showModal: false })
                            this.get()
                        }}
                    />
                )}

                <style>{`
                    .arsip-summary-card { display: flex; align-items: center; gap: 12px; min-height: 82px; padding: 16px; border: 1px solid #d9e5e8; border-radius: 10px; background: #fff; box-shadow: 0 2px 5px rgba(15, 116, 128, .06); }
                    .arsip-summary-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 9px; color: #0f7480; background: #e6f5f6; }
                    .arsip-summary-value { color: #164e63; font-size: 24px; font-weight: 700; line-height: 1; }
                    .arsip-summary-label { margin-top: 4px; color: #64748b; font-size: 13px; }
                    .arsip-search-wrap { min-width: min(100%, 410px); }
                    .arsip-search-wrap .form-control { min-width: 220px; }
                    .arsip-jenis { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
                    .arsip-jenis-surat_masuk { color: #0f766e; background: #ccfbf1; }
                    .arsip-jenis-surat_keluar { color: #1d4ed8; background: #dbeafe; }
                    .arsip-pengiriman-internal { color: #7c3aed; background: #ede9fe; }
                    .arsip-pengiriman-eksternal { color: #b45309; background: #fef3c7; }
                    .arsip-detail-field { height: 100%; padding: 12px; border: 1px solid #d9e5e8; border-radius: 8px; background: #f8fcfc; }
                    .arsip-detail-label { margin-bottom: 5px; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
                    .arsip-detail-value { color: #1e293b; font-size: 14px; overflow-wrap: anywhere; }
                    .arsip-preview-card { padding: 14px; border: 1px solid #d9e5e8; border-radius: 8px; background: #fff; }
                    .arsip-preview-frame { width: 100%; flex: 1; min-height: 0; border: 1px solid #d9e2e7; border-radius: 6px; background: #343a40; }
                    .arsip-preview-empty { flex: 1; min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; text-align: center; }
                    @media (max-width: 576px) { .arsip-search-wrap { width: 100%; } .arsip-search-wrap .form-control { min-width: 0; } }
                `}</style>
            </>
        );
    }
}

export default SuratArsip
