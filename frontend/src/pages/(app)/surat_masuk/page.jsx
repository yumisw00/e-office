"use client"

import HeaderApp from "components/HeaderApp";
import Pagination from "components/Pagination";
import EditDelete from "components/EditDelete";
import EofficeTimelineModal from "components/EofficeTimelineModal";
import surat_masukModel from "hooks/models/surat_masukModel";
import Surat_masukedit from "./[...slug]/page";
import IndexPage from "../IndexPage";
import { formatDateApp, showToastr, urlPreview } from "pages/Utils";
import { api_services } from "hooks/api_services";
import Button from "components/Button";
import { Modal } from "react-bootstrap";
import { canUseEofficeAction } from "lib/eofficeAccess";
import {
    EofficeBadge,
    EofficeCard,
    EofficeEmptyState,
    EofficeFilterBadge,
    EofficeStatusBadge,
    EofficeTable,
    EofficeTableCell,
    EofficeTableEmpty,
    EofficeTableWithFilter,
    EofficeToolbar,
} from "components/EofficeModuleUI";
import {
    fallbackSuratMasukMasterData,
    normalizeSuratMasukMasterData,
    optionsToIndex,
} from "lib/suratMasukMasterData";

class Surat_masuk extends IndexPage {
    titlePage = ""
    model = new surat_masukModel()
    headers = [
        { name: "nomor_agenda", label: "Nomor Agenda", width: "170px", type: "string" },
        { name: "nomor_surat", label: "Nomor Surat", width: "230px", type: "string" },
        { name: "asal_surat", label: "Asal Surat", width: "240px", type: "string" },
        { name: "kepada_tujuan", label: "Kepada/Tujuan", width: "260px", type: "string" },
        { name: "perihal", label: "Perihal", width: "180px", type: "string" },
        { name: "tanggal_terima", label: "Tanggal Masuk", width: "130px", type: "date" },
        { name: "status", label: "Status", width: "110px", type: "list" },
    ]

    state = {
        ...this.state,
        showFilterPopup: false,
        showDistribusiPopup: false,
        showTimelinePopup: false,
        summary: { total: 0, baru: 0, distribusi: 0, selesai: 0 },
        distribusiLoading: false,
        selectedSurat: null,
        selectedDetailSurat: null,
        selectedTimelineSurat: null,
        inlineFilterValues: {},
        jenisPengirimanTab: 'semua',
        distribusiForm: {
            id_unit_tujuan: '',
            id_user_tujuan: '',
            catatan: '',
        },
        userOptions: [],
        masterData: fallbackSuratMasukMasterData,
        datafilter: {
            ...this.state.datafilter,
            paginate: {
                ...this.state.datafilter.paginate,
                pagesize: 10,
            },
        },
        listreferensi: {
            jenis: optionsToIndex(fallbackSuratMasukMasterData.jenis),
            status: optionsToIndex(fallbackSuratMasukMasterData.status),
            unit_kerja: {}
        }
    }

    formatValue = (item, header) => {
        if (header.type == 'list') {
            return this.state.listreferensi[header.name]
                ? this.state.listreferensi[header.name][item[header.name]] || item[header.name]
                : item[header.name]
        }

        if (header.type == 'date') {
            return item[header.name] ? formatDateApp(item[header.name], 'YYYY-MM-DD') : ''
        }

        return item[header.name]
    }

    get = async () => {
        const { filter, order, datafilter } = this.state
        const filterarr = {}
        this.headers.forEach(header => {
            if (filter[header.name]) {
                filterarr[header.name] = header.type === 'list'
                    ? filter[header.name]
                    : `%${filter[header.name]}%`
            }
        })
        if (this.state.jenisPengirimanTab !== 'semua') {
            filterarr.jenis_pengiriman = this.state.jenisPengirimanTab
        }

        this.setState({ is_loading: true })
        const response = await this.model.get({
            filter: { ...datafilter, filter: filterarr, order },
        })
        this.setState({ is_loading: false })
        if (response.error || response.code) return

        this.setState({
            list: response.data,
            summary: response.summary || { total: 0, baru: 0, distribusi: 0, selesai: 0 },
            datafilter: {
                ...datafilter,
                paginate: { ...datafilter.paginate, total_records: response.total_records },
            },
        })
    }

    getreferensi = async () => {
        if (this.model.relasi) {
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

        await this.handlegetmt_sdm_unit()
        await this.handlegetSysUser()
        await this.handlegetSuratMasukMasterData()
    }

    handlegetSuratMasukMasterData = async () => {
        const { getapi_services } = api_services({ api_path: `/surat_masuk/master-data` })
        const response = await getapi_services({})
        if (response.error || response.code) return

        const masterData = normalizeSuratMasukMasterData(response)
        // Override status with properly capitalized labels from fallback
        masterData.status = fallbackSuratMasukMasterData.status
        this.setState(state => ({
            masterData,
            listreferensi: {
                ...state.listreferensi,
                jenis: optionsToIndex(masterData.jenis),
                status: optionsToIndex(masterData.status),
            },
        }))
    }

    handlegetSysUser = async () => {
        const { getapi_services } = api_services({ api_path: `/surat_keluar/recipients` })
        const response = await getapi_services({
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        })
        if (response.error || response.code) return

        const userOptions = (response.data || []).map(item => ({
            value: item.id_user,
            label: item.name || item.nama || item.email || `User ${item.id_user}`,
        }))

        this.setState({ userOptions })
    }

    handlegetmt_sdm_unit = async () => {
        const { getapi_services } = api_services({ api_path: `/mt_sdm_unit` })
        const response = await getapi_services({
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000,
                },
            },
        })
        if (response.error || response.code) return;

        let dataarr = {}
        response.data.map((m) => {
            dataarr[m.id_unit] = m.nama
        })
        this.setState(state => ({
            listreferensi: {
                ...state.listreferensi,
                unit_kerja: dataarr,
            },
        }))
    }

    getTodayDate = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    getSuratId = item => item?.id_surat_masuk || item?.id

    openDistribusiModal = item => {
        this.setState({
            showDistribusiPopup: true,
            selectedSurat: item,
            distribusiForm: {
                id_unit_tujuan: '',
                id_user_tujuan: '',
                catatan: '',
            },
        })
    }

    openTimelineModal = item => {
        if (!this.getSuratId(item)) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        this.setState({
            showTimelinePopup: true,
            selectedTimelineSurat: item,
        })
    }

    handleDistribusiChange = (key, value) => {
        this.setState(state => ({
            distribusiForm: {
                ...state.distribusiForm,
                [key]: value,
            },
        }))
    }

    handleDistribusiSubmit = async () => {
        const surat = this.state.selectedSurat
        const idSurat = this.getSuratId(surat)
        const form = this.state.distribusiForm

        if (!idSurat) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        if (!form.id_unit_tujuan && !form.id_user_tujuan) {
            showToastr('error', 'Pilih unit tujuan atau penerima terlebih dahulu.')
            return
        }

        this.setState({ distribusiLoading: true })
        const { postapi_services } = api_services({ api_path: `/surat_masuk/${idSurat}/distribute` })
        const response = await postapi_services({
            disabledAlert: true,
            id_unit_tujuan: form.id_unit_tujuan || null,
            id_user_tujuan: form.id_user_tujuan || null,
            catatan: form.catatan || '',
        })

        if (response?.error || response?.code || response?.success === false) {
            this.setState({ distribusiLoading: false })
            return
        }

        this.setState({
            distribusiLoading: false,
            showDistribusiPopup: false,
            selectedSurat: null,
        })
        showToastr('success', 'Surat berhasil didistribusikan.')
        this.get()
    }

    handleArchive = async item => {
        const idSurat = this.getSuratId(item)
        if (!idSurat) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        if (!confirm('Arsipkan surat masuk ini?')) return

        const { postapi_services } = api_services({ api_path: `/surat_arsip` })
        const response = await postapi_services({
            disabledAlert: true,
            jenis_surat: 'surat_masuk',
            id_surat_masuk: idSurat,
            nomor_surat: item.nomor_surat || '',
            perihal: item.perihal || '',
            file_path: this.getAttachmentValue(item),
            tanggal_arsip: this.getTodayDate(),
        })

        if (response.error || response.code) return

        await this.model.update(idSurat, {
            disabledAlert: true,
            status: 'selesai',
        })

        showToastr('success', 'Surat berhasil masuk arsip.')
        this.get()
    }

    getStatusLabel = item => {
        const status = item.status || 'pending'
        const raw = this.state.listreferensi.status?.[status] || status
        return this.capitalizeFirst(raw)
    }

    capitalizeFirst = str => {
        if (!str) return ''
        return String(str).charAt(0).toUpperCase() + String(str).slice(1)
    }

    getAttachmentValue = item => item?.file_surat || item?.lampiran || item?.file_path || item?.path || item?.lampiran_info?.path || item?.file_surat_info?.path || item?.lampiran_info?.url || item?.file_surat_info?.url || ''

    hasAttachment = item => Boolean(this.getAttachmentValue(item))

    getVisibleList = () => {
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const filter = this.state.filter || {}
        const keyword = String(filter.keyword || '').toLowerCase().trim()

        return list.filter(item => {
            if (keyword) {
                const searchText = [
                    item.nomor_surat,
                    item.asal_surat,
                    item.email,
                    item.email_pengirim,
                    item.kepada_tujuan,
                    item.perihal,
                ].join(' ').toLowerCase()
                if (!searchText.includes(keyword)) return false
            }

            if (filter.has_lampiran === 'yes' && !this.hasAttachment(item)) return false
            if (filter.has_lampiran === 'no' && this.hasAttachment(item)) return false

            return true
        })
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

    clearFilterValue = key => {
        const clientOnly = ['keyword', 'has_lampiran']
        this.setFilterValue(key, '', !clientOnly.includes(key))
    }

    resetFilters = () => {
        this.setState(state => ({
            filter: {},
            inlineFilterValues: {},
            datafilter: {
                ...state.datafilter,
                paginate: {
                    ...state.datafilter.paginate,
                    page: 1,
                },
            },
        }), () => this.get())
    }

    handleInlineFilterChange = (colName, value) => {
        this.setState(prev => ({
            inlineFilterValues: {
                ...prev.inlineFilterValues,
                [colName]: value,
            },
        }))
    }

    getFilteredSuratList = () => {
        const filters = this.state.inlineFilterValues
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const category = this.state.jenisPengirimanTab
        return list.filter(item => {
            if (category !== 'semua' && String(item.jenis_pengiriman || (item.id_surat_keluar ? 'internal' : 'eksternal')).toLowerCase() !== category) return false
            // Nomor Agenda filter
            if (filters.nomor_agenda) {
                const search = filters.nomor_agenda.toLowerCase()
                if (!String(item.nomor_agenda || '').toLowerCase().includes(search)) return false
            }
            // Nomor Surat filter
            if (filters.nomor_surat) {
                const search = filters.nomor_surat.toLowerCase()
                if (!String(item.nomor_surat || '').toLowerCase().includes(search)) return false
            }
            // Pengirim filter
            if (filters.asal_surat) {
                const search = filters.asal_surat.toLowerCase()
                if (!String(item.asal_surat || '').toLowerCase().includes(search)) return false
            }
            // Penerima/Tujuan filter
            if (filters.kepada_tujuan) {
                const search = filters.kepada_tujuan.toLowerCase()
                if (!String(item.kepada_tujuan || '').toLowerCase().includes(search)) return false
            }
            // Status filter (dropdown select - match by value)
            if (filters.status) {
                if (String(item.status || '') !== String(filters.status)) return false
            }
            return true
        })
    }

    renderPrintableRows = rows => rows.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.nomor_agenda || ''}</td>
            <td>${item.nomor_surat || ''}</td>
            <td>${item.jenis || ''}</td>
            <td>${item.asal_surat || ''}</td>
            <td>${item.kepada_tujuan || ''}</td>
            <td>${item.perihal || ''}</td>
            <td>${this.formatValue(item, { name: 'tanggal_surat', type: 'date' })}</td>
            <td>${this.formatValue(item, { name: 'status', type: 'list' })}</td>
        </tr>
    `).join('')

    openPrintWindow = (title, body) => {
        const printWindow = window.open('', '_blank', 'width=1000,height=700')
        if (!printWindow) {
            showToastr('error', 'Browser memblokir popup cetak.')
            return
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
                        h1 { font-size: 22px; margin: 0 0 16px; }
                        table { border-collapse: collapse; width: 100%; font-size: 12px; }
                        th, td { border: 1px solid #888; padding: 6px 8px; vertical-align: top; }
                        th { background: #d9eef2; }
                        .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
                    </style>
                </head>
                <body>
                    ${body}
                    <script>
                        window.onload = function () {
                            window.print();
                        }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    handlePrintItem = item => {
        const body = `
            <h1>Detail Surat Masuk</h1>
            <div class="meta">Dicetak pada ${new Date().toLocaleString('id-ID')}</div>
            <table>
                <tbody>
                    <tr><th>Nomor Agenda</th><td>${item.nomor_agenda || ''}</td></tr>
                    <tr><th>Nomor Surat</th><td>${item.nomor_surat || ''}</td></tr>
                    <tr><th>Jenis</th><td>${item.jenis || ''}</td></tr>
                    <tr><th>Asal Surat</th><td>${item.asal_surat || ''}</td></tr>
                    <tr><th>Kepada/Tujuan</th><td>${item.kepada_tujuan || ''}</td></tr>
                    <tr><th>Perihal</th><td>${item.perihal || ''}</td></tr>
                    <tr><th>Isi/Ringkasan</th><td>${item.isi_ringkasan || ''}</td></tr>
                    <tr><th>Tanggal Surat</th><td>${this.formatValue(item, { name: 'tanggal_surat', type: 'date' })}</td></tr>
                    <tr><th>Status</th><td>${this.formatValue(item, { name: 'status', type: 'list' })}</td></tr>
                    <tr><th>Catatan</th><td>${item.catatan || ''}</td></tr>
                </tbody>
            </table>
        `
        this.openPrintWindow('Detail Surat Masuk', body)
    }

    handlePrintRecap = () => {
        const body = `
            <h1>Rekap Surat Masuk</h1>
            <div class="meta">Dicetak pada ${new Date().toLocaleString('id-ID')}</div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nomor Agenda</th>
                        <th>Nomor Surat</th>
                        <th>Jenis</th>
                        <th>Asal Surat</th>
                        <th>Kepada/Tujuan</th>
                        <th>Perihal</th>
                        <th>Tanggal Surat</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${this.renderPrintableRows(this.state.list || [])}</tbody>
            </table>
        `
        this.openPrintWindow('Rekap Surat Masuk', body)
    }

    handleOpenAttachment = item => {
        const file = this.getAttachmentValue(item)

        if (!file) {
            showToastr('error', 'Lampiran surat belum tersedia.')
            return
        }

        let url = ''

        if (typeof file === 'string') {
            if (file.startsWith('http') || file.startsWith('data:')) {
                url = file
            } else {
                url = urlPreview(file.startsWith('/') ? file : `/${file}`)
            }
        } else if (file.src) {
            url = file.src
        }

        if (!url) {
            showToastr('error', 'Format lampiran belum bisa dibuka.')
            return
        }

        window.open(url, '_blank')
    }

    getRowActions = item => {
        const suratId = this.getSuratId(item)
        const actions = [{
            label: 'Detail',
            icon: 'visibility',
            href: `/surat_masuk/detail/${suratId}`,
            blank: true,
        }]

        if (canUseEofficeAction('surat_masuk', 'delete')) {
            actions.push({ label: 'Delete', icon: 'delete', url: 'surat_masuk' })
        }

        return actions
    }

    renderActiveFilters = () => {
        const filter = this.state.filter || {}
        const statusLabel = this.state.listreferensi.status?.[filter.status] || filter.status

        return (
            <div className="d-flex flex-wrap align-items-center mt-3" style={{ gap: 8 }}>
                <EofficeFilterBadge label="Keyword" value={filter.keyword} onRemove={() => this.clearFilterValue('keyword')} />
                <EofficeFilterBadge label="Status" value={statusLabel} onRemove={() => this.clearFilterValue('status')} />
                <EofficeFilterBadge label="Tanggal masuk" value={filter.tanggal_terima} onRemove={() => this.clearFilterValue('tanggal_terima')} />
                <EofficeFilterBadge label="Email/Pengirim" value={filter.asal_surat} onRemove={() => this.clearFilterValue('asal_surat')} />
                <EofficeFilterBadge label="Penerima/Tujuan" value={filter.kepada_tujuan} onRemove={() => this.clearFilterValue('kepada_tujuan')} />
                <EofficeFilterBadge label="Lampiran" value={filter.has_lampiran === 'yes' ? 'Ada' : filter.has_lampiran === 'no' ? 'Tidak ada' : ''} onRemove={() => this.clearFilterValue('has_lampiran')} />
            </div>
        )
    }

    getReportSummary = (list = []) => {
        return list.reduce((summary, item) => {
            const status = String(item.status || '').toLowerCase()

            summary.total += 1
            if (['pending', 'masuk', 'baru'].includes(status)) summary.baru += 1
            if (['didistribusikan', 'didisposisikan', 'diproses', 'proses'].includes(status)) summary.proses += 1
            if (['selesai', 'arsip'].includes(status)) summary.selesai += 1

            return summary
        }, {
            total: 0,
            baru: 0,
            proses: 0,
            selesai: 0,
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

    // Table headers with filter config for EofficeTableWithFilter
    tableHeaders = [
        { name: 'nomor_agenda', label: 'Nomor Agenda', width: 170, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'nomor_surat', label: 'Nomor Surat', width: 190, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'asal_surat', label: 'Pengirim', width: 180, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'kepada_tujuan', label: 'Penerima/Tujuan', width: 190, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'status', label: 'Status', width: 150, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...' },
        { name: 'aksi', label: 'Aksi', width: 56, align: 'center', filterType: 'none' },
    ]

    tableColgroup = [170, 190, 180, 190, 150, 56]

    getStatusOptions = () => {
        const masterData = this.state.masterData || fallbackSuratMasukMasterData
        return (masterData.status || []).map(opt => ({ value: opt.value, label: opt.label }))
    }

    renderLetterTable = list => {
        const statusOptions = this.getStatusOptions()

        // Build headers with dynamic select options for status.
        const headersWithOptions = this.tableHeaders.map(h => {
            if (h.name === 'status') return { ...h, filterOptions: statusOptions }
            return h
        })

        return (
            <EofficeTableWithFilter
                className="surat-masuk-table"
                headers={headersWithOptions}
                colgroup={this.tableColgroup}
                filterValues={this.state.inlineFilterValues}
                onFilterChange={this.handleInlineFilterChange}
                align="start"
                minWidth={1080}
            >
                {list.map(item => {
                    const rowActions = this.getRowActions(item)
                    return (
                        <tr key={this.getSuratId(item) || item.nomor_surat} className="align-top">
                            <EofficeTableCell width={170} align="start" wrap>{item.nomor_agenda || '-'}</EofficeTableCell>
                            <EofficeTableCell width={190} align="start" wrap>
                                <a
                                    className="color-link cursor-pointer font-semibold"
                                    href={`/surat_masuk/detail/${this.getSuratId(item)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {item.nomor_surat || '-'}
                                </a>
                            </EofficeTableCell>
                            <EofficeTableCell width={180} align="start" wrap>{item.asal_surat || '-'}</EofficeTableCell>
                            <EofficeTableCell width={190} align="start" wrap>{item.kepada_tujuan || '-'}</EofficeTableCell>
                            <EofficeTableCell width={150}>
                                <EofficeStatusBadge value={item.status} label={this.getStatusLabel(item)} />
                            </EofficeTableCell>
                            <EofficeTableCell width={56} className="surat-masuk-action-cell">
                                {rowActions.length > 0 ? (
                                    <div className="d-flex align-items-center justify-content-center td-action">
                                        <EditDelete
                                            data={rowActions}
                                            id={this.getSuratId(item)}
                                            onDelete={() => this.delete(this.getSuratId(item))}
                                        />
                                    </div>
                                ) : null}
                            </EofficeTableCell>
                        </tr>
                    )
                })}
            </EofficeTableWithFilter>
        )
    }

    render() {
        const list = this.getFilteredSuratList()
        const canAdd = canUseEofficeAction('surat_masuk', 'add')
        const summary = this.state.summary

        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={[]}
                    filterTabs={<div style={{ marginTop: 16, marginBottom: 0 }}>{[['semua', 'Semua Surat'], ['internal', 'Internal'], ['eksternal', 'Eksternal']].map(([value, label]) => <button key={value} type="button" className={`btn btn-sm ${this.state.jenisPengirimanTab === value ? 'btn-info' : 'btn-outline-secondary'}`} onClick={() => this.setState(state => ({ jenisPengirimanTab: value, datafilter: { ...state.datafilter, paginate: { ...state.datafilter.paginate, page: 1 } } }), this.get)}>{label}</button>)}</div>}
                    btnCustom={
                        <div style={{ marginTop: 16, marginBottom: 0 }}>
                        <EofficeToolbar>
                            <Button
                                className="btn-default-app btn-secondary"
                                onClick={this.handlePrintRecap}
                            >
                                <span className="material-icons mr-1" style={{ fontSize: 16 }}>
                                    print
                                </span>
                                Cetak Rekap
                            </Button>
                            {canAdd ? (
                                <Button
                                    className="btn-default-app btn-info"
                                    onClick={() => {
                                        this.id = null
                                        this.setState({ showModal: true, path: 'add' })
                                    }}
                                >
                                    <span className="material-icons mr-1" style={{ fontSize: 16 }}>
                                        add
                                    </span>
                                    Tambah Surat
                                </Button>
                            ) : null}
                        </EofficeToolbar>
                        </div>
                    }
                    onAdd={() => {
                        this.id = null
                        this.setState({ showModal: true, path: 'add' })
                    }}
                />
                <div className="container pl-4 pr-4">
                    <div className="row mb-2">
                        {this.renderSummaryCard('Total', summary.total, 'move_to_inbox')}
                        {this.renderSummaryCard('Baru', summary.baru, 'mark_email_unread')}
                        {this.renderSummaryCard('Distribusi', summary.distribusi, 'pending_actions')}
                        {this.renderSummaryCard('Selesai', summary.selesai, 'task_alt', '#22a06b')}
                    </div>

                    <EofficeCard className="p-3 mb-3">
                        {list.length > 0 ? this.renderLetterTable(list) : (
                            <EofficeEmptyState
                                icon="move_to_inbox"
                                title="Belum ada surat masuk"
                                description="Data surat yang sesuai filter akan muncul di sini."
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

                <Modal
                    show={this.state.showFilterPopup}
                    onHide={() => this.setState({ showFilterPopup: false })}
                    size="lg"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Filter Surat Masuk</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label>Pencarian kata kunci</label>
                                <input className="form-control" value={this.state.filter?.keyword || ''} onChange={e => this.setFilterValue('keyword', e.target.value, false)} placeholder="Nomor surat, email, pengirim, atau penerima..." />
                            </div>
                            <div className="col-md-6">
                                <label>Status</label>
                                <select className="form-control" value={this.state.filter?.status || ''} onChange={e => this.setFilterValue('status', e.target.value)}>
                                    <option value="">Semua Status</option>
                                    {this.getStatusOptions().map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label>Tanggal Masuk</label>
                                <input type="date" className="form-control" value={this.state.filter?.tanggal_terima || ''} onChange={e => this.setFilterValue('tanggal_terima', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <label>Email/Pengirim</label>
                                <input className="form-control" value={this.state.filter?.asal_surat || ''} onChange={e => this.setFilterValue('asal_surat', e.target.value)} placeholder="Email atau nama pengirim" />
                            </div>
                            <div className="col-md-6">
                                <label>Penerima/Tujuan</label>
                                <input className="form-control" value={this.state.filter?.kepada_tujuan || ''} onChange={e => this.setFilterValue('kepada_tujuan', e.target.value)} placeholder="Nama penerima atau unit tujuan" />
                            </div>
                            <div className="col-md-6">
                                <label>Lampiran</label>
                                <select className="form-control" value={this.state.filter?.has_lampiran || ''} onChange={e => this.setFilterValue('has_lampiran', e.target.value, false)}>
                                    <option value="">Semua</option>
                                    <option value="yes">Memiliki lampiran</option>
                                    <option value="no">Tanpa lampiran</option>
                                </select>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            className="btn-default-app btn-light"
                            onClick={this.resetFilters}
                        >
                            Reset
                        </Button>
                        <Button
                            className="btn-default-app btn-light"
                            onClick={() => this.setState({ showFilterPopup: false })}
                        >
                            Tutup
                        </Button>
                        <Button
                            className="btn-default-app btn-info"
                            onClick={() => this.setState({ showFilterPopup: false })}
                        >
                            Terapkan
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal
                    show={this.state.showDistribusiPopup}
                    onHide={() => this.setState({ showDistribusiPopup: false })}
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Distribusi Surat Masuk</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <div className="text-muted" style={{ fontSize: 13 }}>Surat</div>
                            <div className="font-semibold">
                                {this.state.selectedSurat?.nomor_surat || this.state.selectedSurat?.perihal || '-'}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Unit Tujuan</label>
                            <select
                                className="form-control"
                                value={this.state.distribusiForm.id_unit_tujuan}
                                onChange={(event) => this.handleDistribusiChange('id_unit_tujuan', event.target.value)}
                            >
                                <option value="">Pilih unit tujuan</option>
                                {Object.entries(this.state.listreferensi.unit_kerja || {}).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Penerima Pegawai</label>
                            <select
                                className="form-control"
                                value={this.state.distribusiForm.id_user_tujuan}
                                onChange={(event) => this.handleDistribusiChange('id_user_tujuan', event.target.value)}
                            >
                                <option value="">Pilih pegawai penerima</option>
                                {this.state.userOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Catatan</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                value={this.state.distribusiForm.catatan}
                                onChange={(event) => this.handleDistribusiChange('catatan', event.target.value)}
                                placeholder="Catatan distribusi"
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            className="btn-default-app btn-light"
                            onClick={() => this.setState({ showDistribusiPopup: false })}
                        >
                            Tutup
                        </Button>
                        <Button
                            className="btn-default-app btn-info"
                            onClick={this.handleDistribusiSubmit}
                            disabled={this.state.distribusiLoading}
                        >
                            {this.state.distribusiLoading ? 'Mengirim...' : 'Kirim Distribusi'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                <EofficeTimelineModal
                    show={this.state.showTimelinePopup}
                    onHide={() => this.setState({ showTimelinePopup: false, selectedTimelineSurat: null })}
                    suratId={this.getSuratId(this.state.selectedTimelineSurat)}
                    surat={this.state.selectedTimelineSurat}
                />

                {this.state.path !== 'detail' ? this.modaldetail(
                    <Surat_masukedit
                        key={`${this.state.path || 'detail'}-${this.id || 'new'}`}
                        params={{
                            id: this.id,
                            slug: [this.state.path, this.id]
                        }}
                        initialData={this.state.selectedDetailSurat}
                        router={this.props.router}
                        pathname={`${this.props.pathname}/${this.state.path}/${this.id}`}
                        pathaccess={this.props.pathaccess}
                        onLoad={() => {
                            this.setState({ showModal: false, selectedDetailSurat: null })
                            this.get()
                        }}
                    />
                ) : null}
            </>
        );
    }
}

export default Surat_masuk
