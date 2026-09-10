"use client"

import HeaderApp from "components/HeaderApp";
import Pagination from "components/Pagination";
import EditDelete from "components/EditDelete";
import Button from "components/Button";
import IndexPage from "../IndexPage";
import surat_keluarModel from "hooks/models/surat_keluarModel";
import Surat_keluar_edit from "./[...slug]/page";
import { formatDateApp } from "pages/Utils";
import { canUseEofficeAction, getEofficeRole, getStoredUserLogin } from "lib/eofficeAccess";
import EofficeTimelineModal from "components/EofficeTimelineModal";
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
    draft: 'Draf',
    submitted: 'Diajukan',
    review: 'Dalam Pemeriksaan',
    approved: 'Disetujui',
    signed: 'Ditandatangani',
    sent: 'Dikirim',
    archived: 'Diarsipkan',
    diajukan: 'Diajukan',
    revisi: 'Revisi',
    disetujui: 'Disetujui',
    ditandatangani: 'Ditandatangani',
    dikirim: 'Dikirim',
    arsip: 'Diarsipkan',
}

const statusOptionsUnik = Object.entries(statusReferensi)
    .filter(([, label], index, entries) => entries.findIndex(([, firstLabel]) => firstLabel === label) === index)
    .map(([key, label]) => ({ value: key, label }))

class Surat_keluar extends IndexPage {
    titlePage = ""
    model = new surat_keluarModel()
    headers = [
        { name: "nomor_agenda", label: "Nomor Agenda", width: "170px", type: "string" },
        { name: "nomor_surat", label: "Nomor Surat", width: "180px", type: "string" },
        { name: "tanggal_surat", label: "Tanggal", width: "120px", type: "date" },
        { name: "tujuan_nama", label: "Kepada/Tujuan", width: "220px", type: "string" },
        { name: "status", label: "Status", width: "130px", type: "list" },
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
        showTimeline: false,
        timelinePath: '',
        selectedSurat: null,
        inlineFilterValues: {},
        jenisPengirimanTab: 'semua',
        summary: { total: 0, draft: 0, proses: 0, selesai: 0, internal: 0, eksternal: 0 },
        categorySummary: { total: 0, draft: 0, proses: 0, selesai: 0, internal: 0, eksternal: 0 },
        listreferensi: {
            status: statusReferensi,
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

    getRowActions = item => {
        const suratId = this.getItemId(item)
        const actions = [{
            label: 'Detail',
            icon: 'visibility',
            href: `/surat_keluar/detail/${suratId}`,
            blank: true,
        }]

        actions.push({
            label: 'Cetak',
            icon: 'print',
            onClick: () => this.printItem(item),
        })

        actions.push({
            label: 'Timeline',
            icon: 'timeline',
            onClick: () => this.openTimeline(item),
        })

        actions.push({
            label: 'Info TTD',
            icon: 'draw',
            onClick: () => this.openSignatureInfo(item),
        })

        if (canUseEofficeAction('surat_keluar', 'delete')) {
            actions.push({ label: 'Delete', icon: 'delete', url: 'surat_keluar' })
        }

        return actions
    }

    setFilterValue = (key, value, shouldFetch = true) => {
        this.setState(state => ({
            filter: {
                ...state.filter,
                [key]: value || '',
            },
            datafilter: {
                ...state.datafilter,
                paginate: {
                    ...state.datafilter.paginate,
                    page: 1,
                },
            },
        }), () => {
            if (shouldFetch) this.get()
        })
    }

    get = async () => {
        const { filter, order, datafilter } = this.state
        const filterarr = {}

        this.headers.forEach(header => {
            if (!filter[header.name]) return
            filterarr[header.name] = header.type === 'list'
                ? filter[header.name]
                : `%${filter[header.name]}%`
        })
        if (this.state.jenisPengirimanTab !== 'semua') {
            filterarr.jenis_pengiriman = this.state.jenisPengirimanTab
        }

        const user = getStoredUserLogin()
        const role = getEofficeRole(user)
        const userId = user?.id_user || user?.user?.id_user || user?.id || user?.user?.id

        // Setiap role operasional, termasuk pimpinan, hanya melihat surat yang
        // dibuat oleh akunnya. Approval pimpinan tersedia pada menu Approval.
        if (userId && !['admin_sistem', 'admin_konten'].includes(role)) {
            filterarr.created_by = userId
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
            summary: response.summary || { total: 0, draft: 0, proses: 0, selesai: 0, internal: 0, eksternal: 0 },
            categorySummary: response.category_summary || response.summary || { total: 0, draft: 0, proses: 0, selesai: 0, internal: 0, eksternal: 0 },
            datafilter: {
                ...datafilter,
                paginate: {
                    ...datafilter.paginate,
                    total_records: response.total_records,
                },
            },
        })
    }

    getVisibleList = () => {
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const keyword = String(this.state.filter?.keyword || '').toLowerCase().trim()

        if (!keyword) return list

        return list.filter(item => [
            item.nomor_surat,
            item.tujuan_nama,
            item.status,
        ].join(' ').toLowerCase().includes(keyword))
    }

    handleInlineFilterChange = (colName, value) => {
        this.setState(prev => ({
            inlineFilterValues: {
                ...prev.inlineFilterValues,
                [colName]: value,
            },
        }))
    }

    capitalizeFirst = str => {
        if (!str) return ''
        return String(str).charAt(0).toUpperCase() + String(str).slice(1)
    }

    getStatusOptions = () => {
        return statusOptionsUnik
    }

    getFilteredSuratKeluarList = () => {
        const filters = this.state.inlineFilterValues
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const category = this.state.jenisPengirimanTab
        const user = getStoredUserLogin()
        const role = getEofficeRole(user)
        const userId = user?.id_user || user?.user?.id_user || user?.id || user?.user?.id
        const isAdmin = ['admin_sistem', 'admin_konten'].includes(role)

        return list.filter(item => {
            if (category !== 'semua' && String(item.jenis_pengiriman || (item.tujuan_id ? 'internal' : 'eksternal')).toLowerCase() !== category) return false
            // Surat internal untuk penerima hanya boleh ada di Surat Masuk.
            // Surat Keluar selalu dibatasi pada surat yang dibuat akun aktif.
            if (!isAdmin && (!userId || String(item.created_by) !== String(userId))) return false

            // Nomor Surat filter
            if (filters.nomor_surat) {
                const search = filters.nomor_surat.toLowerCase()
                if (!String(item.nomor_surat || '').toLowerCase().includes(search)) return false
            }
            // Kepada/Tujuan filter
            if (filters.tujuan_nama) {
                const search = filters.tujuan_nama.toLowerCase()
                if (!String(item.tujuan_nama || '').toLowerCase().includes(search)) return false
            }
            // Status filter (dropdown select - match by value)
            if (filters.status) {
                if (String(item.status || '') !== String(filters.status)) return false
            }
            return true
        })
    }

    getCellStyle = header => ({
        width: header.width,
        maxWidth: header.width,
        verticalAlign: 'top',
        whiteSpace: header.type === 'date' ? 'nowrap' : 'normal',
        overflowWrap: header.type === 'date' ? 'normal' : 'anywhere',
        wordBreak: header.type === 'date' ? 'normal' : 'break-word',
        lineHeight: 1.35,
        padding: '10px 8px',
    })

    getItemId = item => item?.[this.model.primaryKey] || item?.id

    openTimeline = item => {
        const id = this.getItemId(item)
        this.setState({
            selectedSurat: item,
            timelinePath: `/surat_keluar/${id}/timeline`,
            showTimeline: true,
        })
    }

    openSignatureInfo = item => {
        const params = new URLSearchParams({
            nomor_surat: item?.nomor_surat || item?.kode_draft || '',
            penandatangan: item?.nama_penandatangan || item?.penandatangan_nama || '',
            tanggal_ttd: item?.signed_at || item?.tanggal_ttd || '',
        })

        window.open(`/informasi_tanda_tangan_surat?${params.toString()}`, '_blank')
    }

    escapeHtml = (value = '') => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    printItem = item => {
        const printWindow = window.open('', '_blank', 'width=980,height=720')
        if (!printWindow) return

        printWindow.document.write(`
            <html>
                <head>
                    <title>${this.escapeHtml(item?.nomor_surat || item?.kode_draft || 'Surat Keluar')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 36px; color: #111827; line-height: 1.55; }
                        h1 { font-size: 22px; margin-bottom: 4px; }
                        .muted { color: #4b5563; }
                        .box { border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 18px 0; }
                    </style>
                </head>
                <body>
                    <h1>${this.escapeHtml(item?.nomor_surat || item?.kode_draft || 'Surat Keluar')}</h1>
                    <div class="muted">${this.escapeHtml(item?.nomor_surat || item?.kode_draft || '-')}</div>
                    <div class="box">
                        <strong>Kepada:</strong><br />
                        ${this.escapeHtml(item?.tujuan_nama || '-')}<br />
                        ${this.escapeHtml(item?.tujuan_email || '')}
                    </div>
                    <div>${this.escapeHtml(item?.isi_surat || item?.ringkasan || '-').replace(/\n/g, '<br />')}</div>
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }

    renderCellValue = (item, header) => {
        if (header.name === 'status') {
            return <EofficeStatusBadge value={item?.status || 'draft'} label={this.formatValue(item, header)} />
        }

        if (header.name === 'nomor_surat' || header.name === 'kode_draft') {
            return (
                <a
                    className="color-link cursor-pointer"
                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    href={`/surat_keluar/detail/${this.getItemId(item)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {this.formatValue(item, header) || '-'}
                </a>
            )
        }

        return this.formatValue(item, header) || '-'
    }

    getReportSummary = (list = []) => {
        return list.reduce((summary, item) => {
            const status = String(item.status || 'draft').toLowerCase()
            summary.total += 1
            if (['draft', 'revisi'].includes(status)) summary.draft += 1
            if (['submitted', 'review', 'diajukan'].includes(status)) summary.proses += 1
            if (['approved', 'disetujui', 'signed', 'ditandatangani', 'sent', 'dikirim', 'archived', 'arsip', 'selesai'].includes(status)) summary.selesai += 1
            return summary
        }, {
            total: 0,
            draft: 0,
            proses: 0,
            selesai: 0,
            arsip: 0,
        })
    }

    renderSummaryCard = (label, value, icon, color = '#118b9b') => (
        <div className="col-md-3 col-sm-6 mb-3">
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

    renderActiveFilters = () => {
        const filter = this.state.filter || {}

        return (
            <div className="d-flex flex-wrap align-items-center mt-3" style={{ gap: 8 }}>
                <EofficeFilterBadge label="Keyword" value={filter.keyword} onRemove={() => this.setFilterValue('keyword', '', false)} />
                <EofficeFilterBadge label="Status" value={statusReferensi[filter.status] || filter.status} onRemove={() => this.setFilterValue('status', '')} />
            </div>
        )
    }

    // Table headers with filter config for EofficeTableWithFilter
    tableHeaders = [
        { name: 'nomor_agenda', label: 'Nomor Agenda', width: 170, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'nomor_surat', label: 'Nomor Surat', width: 220, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'tujuan_nama', label: 'Kepada/Tujuan', width: 240, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'status', label: 'Status', width: 140, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...' },
        { name: 'aksi', label: 'Aksi', width: 130, align: 'center', filterType: 'none' },
    ]

    tableColgroup = [170, 220, 240, 140, 130]

    renderSuratKeluarTable = list => {
        const statusOptions = this.getStatusOptions()

        // Build headers with dynamic select options for status
        const headersWithOptions = this.tableHeaders.map(h => {
            if (h.name === 'status') return { ...h, filterOptions: statusOptions }
            return h
        })

        return (
            <EofficeTableWithFilter
                headers={headersWithOptions}
                colgroup={this.tableColgroup}
                filterValues={this.state.inlineFilterValues}
                onFilterChange={this.handleInlineFilterChange}
                align="start"
                minWidth={1030}
            >
                {list.map(item => {
                    const rowActions = this.getRowActions(item)

                    return (
                        <tr key={this.getItemId(item) || item.kode_draft} className="align-top">
                            <EofficeTableCell width={170} align="start" wrap>
                                {item.nomor_agenda || '-'}
                            </EofficeTableCell>
                            <EofficeTableCell width={220} align="start" wrap>
                                <a
                                    className="color-link font-semibold"
                                    style={{ background: 'transparent', border: 0, padding: 0 }}
                                    href={`/surat_keluar/detail/${this.getItemId(item)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {item.nomor_surat || '-'}
                                </a>
                            </EofficeTableCell>
                            <EofficeTableCell width={240} align="start" wrap>
                                {item.tujuan_nama || '-'}
                            </EofficeTableCell>
                            <EofficeTableCell width={140}>
                                <EofficeStatusBadge value={item.status || 'draft'} label={this.capitalizeFirst(statusReferensi[item.status] || item.status || 'Draft')} />
                            </EofficeTableCell>
                            <EofficeTableCell width={130} style={{ paddingLeft: 6, paddingRight: 6 }}>
                                <div className="d-flex align-items-center justify-content-center td-action">
                                    <EditDelete
                                        data={rowActions}
                                        id={this.getItemId(item)}
                                        onDelete={() => this.delete(this.getItemId(item))}
                                    />
                                </div>
                            </EofficeTableCell>
                        </tr>
                    )
                })}
            </EofficeTableWithFilter>
        )
    }

    render() {
        const list = this.getFilteredSuratKeluarList()
        const canAdd = canUseEofficeAction('surat_keluar', 'add')
        const summary = this.state.summary
        const categorySummary = this.state.categorySummary

        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={[]}
                    filterTabs={<div style={{ marginTop: 16, marginBottom: 0 }}>{[
                        ['semua', 'Semua Surat', categorySummary.total],
                        ['internal', 'Internal', categorySummary.internal],
                        ['eksternal', 'Eksternal', categorySummary.eksternal],
                    ].map(([value, label, count]) => <button key={value} type="button" className={`btn btn-sm ${this.state.jenisPengirimanTab === value ? 'btn-info' : 'btn-outline-secondary'}`} onClick={() => { this.setState(state => ({ jenisPengirimanTab: value, datafilter: { ...state.datafilter, paginate: { ...state.datafilter.paginate, page: 1 } } }), this.get) }}>{label} ({count || 0})</button>)}</div>}
                    btnCustom={
                        <div style={{ marginTop: 16, marginBottom: 0 }}>
                        <EofficeToolbar>
                            {canAdd ? (
                                <Button
                                    className="btn-default-app btn-info"
                                    onClick={() => {
                                        this.id = null
                                        this.setState({ showModal: true, path: 'add' })
                                    }}
                                >
                                    <span className="material-icons mr-1" style={{ fontSize: 16 }}>add</span>
                                    Tambah Surat
                                </Button>
                            ) : null}
                        </EofficeToolbar>
                        </div>
                    }
                />

                <div className="container pl-4 pr-4">
                    <div className="row mb-2">
                        {this.renderSummaryCard('Total', summary.total, 'outbox')}
                        {this.renderSummaryCard('Draft', summary.draft, 'edit_document')}
                        {this.renderSummaryCard('Proses', summary.proses, 'pending_actions')}
                        {this.renderSummaryCard('Selesai', summary.selesai, 'task_alt', '#22a06b')}
                    </div>

                    <EofficeCard className="p-3 mb-3">
                        {list.length > 0 ? this.renderSuratKeluarTable(list) : (
                            <EofficeEmptyState
                                icon="outbox"
                                title="Belum ada surat keluar"
                                description="Data surat keluar yang sesuai filter akan muncul di sini."
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

                <EofficeTimelineModal
                    show={this.state.showTimeline}
                    onHide={() => this.setState({ showTimeline: false })}
                    suratId={this.getItemId(this.state.selectedSurat)}
                    surat={this.state.selectedSurat}
                    timelinePath={this.state.timelinePath}
                />

                {this.state.path !== 'detail' ? this.modaldetail(
                    <Surat_keluar_edit
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
                ) : null}
            </>
        );
    }
}

export default Surat_keluar
