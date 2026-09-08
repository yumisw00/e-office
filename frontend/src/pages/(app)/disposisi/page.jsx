"use client"

import HeaderApp from "components/HeaderApp";
import Pagination from "components/Pagination";
import Button from "components/Button";
import IndexPage from "../IndexPage";
import surat_disposisiModel from "hooks/models/surat_disposisiModel";
import { formatDateApp } from "pages/Utils";
import {
    EofficeBadge,
    EofficeCard,
    EofficeEmptyState,
    EofficeStatusBadge,
    EofficeTableCell,
    EofficeTableWithFilter,
    EofficeToolbar,
} from "components/EofficeModuleUI";

const statusReferensi = {
    baru: 'Baru',
    diproses: 'Diproses',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
}

// Table headers with filter configuration
const tableHeaders = [
    {
        name: 'nomor_surat',
        label: 'Nomor Surat',
        width: 190,
        align: 'center',
        filterType: 'text',
    },
    {
        name: 'pengirim',
        label: 'Pengirim',
        width: 220,
        align: 'center',
        filterType: 'text',
    },
    {
        name: 'penerima',
        label: 'Penerima/Tujuan',
        width: 220,
        align: 'center',
        filterType: 'text',
    },
    {
        name: 'instruksi',
        label: 'Instruksi',
        width: 260,
        align: 'center',
        filterType: 'text',
    },
    {
        name: 'status',
        label: 'Status',
        width: 130,
        align: 'center',
        filterType: 'select',
        filterOptions: Object.entries(statusReferensi).map(([key, label]) => ({ value: key, label })),
    },
]

const colgroup = [190, 220, 220, 260, 130]

class Disposisi extends IndexPage {
    titlePage = ""
    model = new surat_disposisiModel()

    state = {
        ...this.state,
        showModal: false,
        selectedDisposisi: null,
        path: 'detail',
        listreferensi: {
            status: statusReferensi,
        },
        inlineFilterValues: {},
        jenisPengirimanTab: 'semua',
        allList: [],
        summary: { total: 0, berjalan: 0, selesai: 0 },
    }

    // Override get to also fetch all data for accurate summary counts
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
        if (this.state.jenisPengirimanTab !== 'semua') {
            filterarr.jenis_pengiriman = this.state.jenisPengirimanTab
        }
        this.setState({ is_loading: true })
        const response = await this.model.get({
            filter: {
                ...datafilter,
                filter: filterarr,
                order,
            },
        })

        this.setState({ is_loading: false })
        if (response.error || response.code) return

        this.setState({
            list: response.data,
            allList: response.data,
            summary: response.summary || { total: 0, berjalan: 0, selesai: 0 },
            datafilter: {
                ...datafilter,
                paginate: {
                    ...datafilter.paginate,
                    total_records: response.total_records,
                },
            },
        })
    }

    getSuratNumber = item => item?.surat_masuk?.nomor_surat || item?.nomor_surat || item?.id_surat_masuk || '-'

    getSuratSender = item => item?.surat_masuk?.asal_surat || item?.asal_surat || item?.pengirim || '-'

    getReceiver = item => item?.penerima?.name || item?.nama_penerima || item?.id_penerima || '-'

    handleInlineFilterChange = (colName, value) => {
        this.setState(state => ({
            inlineFilterValues: {
                ...state.inlineFilterValues,
                [colName]: value,
            },
        }))
    }

    getVisibleList = () => {
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const filters = this.state.inlineFilterValues
        const category = this.state.jenisPengirimanTab

        return list.filter(item => {
            if (category !== 'semua' && String(item.surat_masuk?.jenis_pengiriman || item.jenis_pengiriman || '').toLowerCase() !== category) return false
            // Nomor Surat filter
            if (filters.nomor_surat) {
                const search = filters.nomor_surat.toLowerCase()
                if (!this.getSuratNumber(item).toLowerCase().includes(search)) return false
            }

            // Pengirim filter
            if (filters.pengirim) {
                const search = filters.pengirim.toLowerCase()
                if (!this.getSuratSender(item).toLowerCase().includes(search)) return false
            }

            // Penerima filter
            if (filters.penerima) {
                const search = filters.penerima.toLowerCase()
                if (!this.getReceiver(item).toLowerCase().includes(search)) return false
            }

            // Instruksi filter
            if (filters.instruksi) {
                const search = filters.instruksi.toLowerCase()
                const instr = String(item.instruksi || '').toLowerCase()
                if (!instr.includes(search)) return false
            }

            // Status filter
            if (filters.status) {
                if (item.status !== filters.status) return false
            }

            return true
        })
    }

    getReportSummary = (list = []) => {
        return list.reduce((summary, item) => {
            const status = String(item.status || '').toLowerCase()
            summary.total += 1
            if (['selesai', 'arsip'].includes(status)) {
                summary.selesai += 1
            } else {
                summary.berjalan += 1
            }
            return summary
        }, { total: 0, berjalan: 0, selesai: 0 })
    }

    escapeHtml = (value = '') => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    renderPrintableRows = (rows = []) => {
        const columns = [
            { label: 'No', render: (_, index) => index + 1 },
            ...tableHeaders.map(header => ({
                label: header.label,
                render: item => {
                    if (header.name === 'nomor_surat') return this.getSuratNumber(item)
                    if (header.name === 'pengirim') return this.getSuratSender(item)
                    if (header.name === 'penerima') return this.getReceiver(item)
                    if (header.name === 'instruksi') return item.instruksi || ''
                    if (header.name === 'status') return statusReferensi[item.status] || item.status || ''
                    return ''
                },
            })),
        ]

        return `
            <table>
                <thead>
                    <tr>
                        ${columns.map(column => `<th>${this.escapeHtml(column.label)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((item, index) => `
                        <tr>
                            ${columns.map(column => `<td>${this.escapeHtml(column.render(item, index))}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `
    }

    openPrintWindow = (title, body) => {
        const printWindow = window.open('', '_blank', 'width=980,height=720')
        if (!printWindow) return
        printWindow.document.write(`
            <html>
                <head>
                    <title>${this.escapeHtml(title)}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                        h1 { font-size: 22px; margin: 0 0 8px; }
                        .meta { color: #4b5563; margin-bottom: 18px; }
                        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
                        .summary div { border: 1px solid #d1d5db; padding: 10px; border-radius: 6px; }
                        .summary strong { display: block; font-size: 20px; margin-top: 6px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #9ca3af; padding: 7px; vertical-align: top; }
                        th { background: #e5f4f6; text-align: left; }
                    </style>
                </head>
                <body>${body}</body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }

    handlePrintReport = () => {
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const summary = this.state.summary
        const generatedAt = formatDateApp(new Date(), 'YYYY-MM-DD HH:mm')

        this.openPrintWindow('Laporan Disposisi', `
            <h1>Laporan Disposisi</h1>
            <div class="meta">Dicetak pada ${this.escapeHtml(generatedAt)}</div>
            <div class="summary">
                <div>Total<strong>${summary.total}</strong></div>
                <div>Berjalan<strong>${summary.berjalan}</strong></div>
                <div>Selesai<strong>${summary.selesai}</strong></div>
            </div>
            ${this.renderPrintableRows(list)}
        `)
    }

    renderSummaryCard = (label, value, icon, color = '#118b9b') => (
        <div className="col-md-4 col-sm-6 mb-3">
            <div className="card card-dashboard" style={{ borderRadius: 8 }}>
                <div className="card-body d-flex align-items-center">
                    <div
                        className="d-flex align-items-center justify-content-center mr-3"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            background: '#e7f7fa',
                            color,
                        }}
                    >
                        <span className="material-icons">{icon}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 13, color: '#5f6b7a', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
                    </div>
                </div>
            </div>
        </div>
    )

    renderDisposisiTable = (list) => (
        <EofficeTableWithFilter
            headers={tableHeaders}
            colgroup={colgroup}
            filterValues={this.state.inlineFilterValues}
            onFilterChange={this.handleInlineFilterChange}
            align="start"
            minWidth={1040}
        >
            {list.map(item => (
                <tr key={item[this.model.primaryKey] || item.id_surat_masuk} className="align-top">
                    <EofficeTableCell width={190} align="start" wrap>
                        <a
                            href={`/disposisi/detail/${item[this.model.primaryKey] || item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="color-link font-semibold"
                            style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left' }}
                        >
                            {this.getSuratNumber(item)}
                        </a>
                    </EofficeTableCell>
                    <EofficeTableCell width={220} align="start" wrap>
                        {this.getSuratSender(item)}
                    </EofficeTableCell>
                    <EofficeTableCell width={220} align="start" wrap>
                        {this.getReceiver(item)}
                    </EofficeTableCell>
                    <EofficeTableCell width={260} align="start" wrap>
                        {item.instruksi || '-'}
                    </EofficeTableCell>
                    <EofficeTableCell width={130}>
                        <EofficeStatusBadge value={item.status} label={statusReferensi[item.status] || item.status} />
                    </EofficeTableCell>
                </tr>
            ))}
        </EofficeTableWithFilter>
    )

    render() {
        const list = this.getVisibleList()
        const summary = this.getReportSummary(list)

        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={[]}
                    filterTabs={<div style={{ marginTop: 16, marginBottom: 0 }}>{[['semua', 'Semua Disposisi'], ['internal', 'Internal'], ['eksternal', 'Eksternal']].map(([value, label]) => <button key={value} type="button" className={`btn btn-sm ${this.state.jenisPengirimanTab === value ? 'btn-info' : 'btn-outline-secondary'}`} onClick={() => this.setState(state => ({ jenisPengirimanTab: value, datafilter: { ...state.datafilter, paginate: { ...state.datafilter.paginate, page: 1 } } }), this.get)}>{label}</button>)}</div>}
                    btnCustom={
                        <div style={{ marginTop: 16, marginBottom: 0 }}>
                        <EofficeToolbar>
                            <Button
                                className="btn-default-app btn-secondary"
                                onClick={this.handlePrintReport}
                            >
                                <span className="material-icons mr-1" style={{ fontSize: 16 }}>
                                    print
                                </span>
                                Cetak
                            </Button>
                        </EofficeToolbar>
                        </div>
                    }
                />

                <div className="container pl-4 pr-4">
                    <div className="row mb-2">
                        {this.renderSummaryCard('Total', summary.total, 'assignment')}
                        {this.renderSummaryCard('Berjalan', summary.berjalan, 'pending_actions')}
                        {this.renderSummaryCard('Selesai', summary.selesai, 'task_alt', '#22a06b')}
                    </div>

                    <EofficeCard className="p-3 mb-3">
                        {list.length > 0 ? this.renderDisposisiTable(list) : (
                            <EofficeEmptyState
                                icon="assignment_turned_in"
                                title="Belum ada distribusi"
                                description="Data distribusi yang sesuai filter akan muncul di sini."
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

            </>
        );
    }
}

export default Disposisi
