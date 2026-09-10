"use client"

import HeaderApp from "components/HeaderApp";
import Pagination from "components/Pagination";
import Button from "components/Button";
import EditDelete from "components/EditDelete";
import EofficeTimelineModal from "components/EofficeTimelineModal";
import { Modal } from "react-bootstrap";
import IndexPage from "../IndexPage";
import surat_distribusiModel from "hooks/models/surat_distribusiModel";
import surat_masukModel from "hooks/models/surat_masukModel";
import { api_services } from "hooks/api_services";
import axios from "lib/axios";
import { formatDateApp, initAccessMethod, showToastr, urlPreview } from "pages/Utils";
import {
    EofficeCard,
    EofficeEmptyState,
    EofficeInfoGrid,
    EofficeStatusBadge,
    EofficeTableCell,
    EofficeTableWithFilter,
} from "components/EofficeModuleUI";

const statusReferensi = {
    dikirim: "Dikirim",
    distributed: "Dikirim",
    dibaca: "Dibaca",
    read: "Dibaca",
    proses: "Proses",
    selesai: "Selesai",
    done: "Selesai",
    arsip: "Arsip",
    archived: "Arsip",
}

const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "dikirim", label: "Dikirim" },
    { value: "dibaca", label: "Dibaca" },
    { value: "proses", label: "Proses" },
    { value: "selesai", label: "Selesai" },
    { value: "arsip", label: "Arsip" },
]

class SuratMasukPegawai extends IndexPage {
    titlePage = ""
    model = new surat_distribusiModel()
    suratMasukModel = new surat_masukModel()
    workflowService = api_services({})
    headers = [
        { name: "surat_masuk", label: "Surat Masuk", width: "220px", type: "string" },
        { name: "catatan", label: "Catatan", width: "260px", type: "string" },
        { name: "tanggal_distribusi", label: "Tanggal Dikirim", width: "140px", type: "date" },
        { name: "tanggal_dibaca", label: "Tanggal Dibaca", width: "140px", type: "date" },
        { name: "status", label: "Status", width: "120px", type: "list" },
    ]

    state = {
        ...this.state,
        inlineFilterValues: {},
        jenisPengirimanTab: "semua",
        listreferensi: {
            status: statusReferensi,
        },
        scopeWarning: "",
        summary: { total: 0, baru: 0, distribusi: 0, selesai: 0 },
        showTimelinePopup: false,
        selectedTimelineSurat: null,
        showDetailPopup: false,
        detailLoading: false,
        selectedDistribution: null,
        selectedSuratDetail: null,
        userOptions: [],
        inlineTracking: [],
        inlineTrackingLoading: false,
        attachmentPage: 1,
        disposisiLoading: false,
        disposisiForm: {
            id_penerima: "",
            tanggal_jatuh_tempo: "",
        },
    }

    init = async () => {
        const { access_method, path } = await initAccessMethod(this.props.pathaccess)
        this.setState({ path, access_method }, () => {
            this.get()
            this.handlegetUserOptions()
            this.openNotificationSuratDetail()
        })
    }

    openNotificationSuratDetail = () => {
        const suratId = this.props.searchParams?.get("surat_id")
        if (!suratId) return

        this.openDetailModal({ id_surat_masuk: suratId })
    }

    handlegetUserOptions = async () => {
        try {
            // Endpoint ini dapat diakses pimpinan tanpa membuka data lengkap pengguna.
            const response = await axios.get("/api/surat_keluar/recipients")
            const rows = Array.isArray(response?.data?.data) ? response.data.data : []

            this.setState({
                userOptions: rows
                    .map(item => ({
                        value: item.id_user || item.id,
                        label: item.name || item.nama || item.email || `User ${item.id_user || item.id}`,
                    }))
                    .filter(item => item.value),
            })
        } catch (error) {
            this.setState({ userOptions: [] })
        }
    }

    get = async () => {
        const { filter, order, datafilter } = this.state
        const filterarr = { recipient_scope: "me" }

        this.headers.forEach(header => {
            if (filter[header.name] && header.name !== "surat_masuk") {
                if (header.type === "list") {
                    filterarr[header.name] = filter[header.name]
                } else {
                    filterarr[header.name] = "%" + filter[header.name] + "%"
                }
            }
        })

        this.setState({ is_loading: true, scopeWarning: "" })
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
            list: Array.isArray(response.data) ? response.data : [],
            summary: response.summary || this.state.summary,
            datafilter: {
                ...datafilter,
                paginate: {
                    ...datafilter.paginate,
                    total_records: response.total_records
                }
            }
        })
    }

    formatValue = (item, header) => {
        if (header.name === "surat_masuk") {
            const surat = item.surat_masuk || item.suratMasuk || {}
            return surat.nomor_surat || surat.perihal || item.nomor_surat || item.id_surat_masuk || "-"
        }

        if (header.name === "id_unit_tujuan") {
            return item.nama_unit_tujuan || item.unit_tujuan || item.id_unit_tujuan || "-"
        }

        if (header.type === "list") {
            return this.state.listreferensi[header.name]?.[item[header.name]] || item[header.name] || "-"
        }

        if (header.type === "date") {
            return item[header.name] ? formatDateApp(item[header.name], "YYYY-MM-DD") : ""
        }

        return item[header.name] || ""
    }

    getSuratId = item => (
        item?.id_surat_masuk ||
        item?.surat_masuk?.id_surat_masuk ||
        item?.suratMasuk?.id_surat_masuk ||
        item?.surat_masuk?.id ||
        item?.suratMasuk?.id
    )

    openTimelineModal = item => {
        if (!this.getSuratId(item)) {
            showToastr("error", "ID surat masuk tidak ditemukan.")
            return
        }

        this.setState({
            showTimelinePopup: true,
            selectedTimelineSurat: item,
        })
    }

    getTodayDate = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")

        return `${year}-${month}-${day}`
    }

    markAsRead = async item => {
        const distributionId = item?.[this.model.primaryKey]
        const suratId = this.getSuratId(item)

        if (!distributionId || !suratId || ["dibaca", "read"].includes(item?.status)) return

        const tanggalDibaca = this.getTodayDate()
        const response = await this.workflowService.postapi_services({
            disabledAlert: true,
            api_path: `/surat_masuk/${suratId}/read`,
            id_surat_distribusi: distributionId,
        })

        if (response?.error || response?.code) return

        this.setState(state => ({
            list: (state.list || []).map(row =>
                row?.[this.model.primaryKey] === distributionId
                    ? { ...row, status: "read", tanggal_dibaca: tanggalDibaca }
                    : row
            ),
        }))
    }

    normalizeSuratDetail = response => {
        if (!response) return null

        if (response.data && !Array.isArray(response.data)) {
            return response.data
        }

        return response
    }

    openDetailModal = async item => {
        const suratId = this.getSuratId(item)

        if (!suratId) {
            showToastr("error", "ID surat masuk tidak ditemukan.")
            return
        }

        // Use the shared detail page so Pimpinan sees the same new layout as
        // Admin Konten instead of the legacy modal implementation.
        window.location.href = `/surat_masuk/detail/${suratId}`
    }

    handlegetInlineTracking = async suratId => {
        if (!suratId) return

        this.setState({ inlineTrackingLoading: true })
        try {
            const response = await axios.get(`/api/surat_masuk/${suratId}/timeline`)
            this.setState({
                inlineTracking: response.data?.data || response.data || [],
                inlineTrackingLoading: false,
            })
        } catch (error) {
            this.setState({ inlineTracking: [], inlineTrackingLoading: false })
        }
    }

    handleDisposisiFormChange = (key, value) => {
        this.setState(state => ({
            disposisiForm: {
                ...state.disposisiForm,
                [key]: value,
            },
        }))
    }

    submitDisposisi = async () => {
        const suratId = this.getSuratId(this.state.selectedDistribution) || this.state.selectedSuratDetail?.id || this.state.selectedSuratDetail?.id_surat_masuk
        const form = this.state.disposisiForm

        if (!suratId) {
            showToastr("error", "ID surat masuk tidak ditemukan.")
            return
        }

        if (!form.id_penerima) {
            showToastr("error", "Penerima disposisi wajib dipilih.")
            return
        }

        const { postapi_services } = api_services({ api_path: "/surat_disposisi" })
        this.setState({ disposisiLoading: true })

        const response = await postapi_services({
            disabledAlert: true,
            id_surat_masuk: suratId,
            id_surat_distribusi: this.state.selectedDistribution?.id_surat_distribusi || null,
            id_penerima: form.id_penerima || null,
            tanggal_jatuh_tempo: form.tanggal_jatuh_tempo || null,
            status: "baru",
        })

        if (!response?.success || !response?.data) {
            this.setState({ disposisiLoading: false })
            showToastr("error", response?.message || "Disposisi gagal dibuat.")
            return
        }

        this.setState({
            disposisiLoading: false,
            disposisiForm: {
                id_penerima: "",
                tanggal_jatuh_tempo: "",
            },
        })
        this.handlegetInlineTracking(suratId)
        showToastr("success", "Disposisi berhasil dibuat.")
    }

    getAttachmentUrl = file => {
        if (!file) return ""

        if (typeof file === "string") {
            if (file.startsWith("http") || file.startsWith("data:")) return file
            return urlPreview(file.startsWith("/") ? file : `/${file}`)
        }

        return file.src || ""
    }

    getAttachmentValue = data => data?.file_surat || data?.lampiran || data?.file_path || data?.path || data?.file_surat_info?.path || data?.lampiran_info?.path || ""

    getFileName = value => String(value || "").split("/").pop() || "-"

    isPdfFile = value => /\.pdf$/i.test(String(value || "").split("?")[0])

    isImageFile = value => /\.(png|jpe?g|gif|webp)$/i.test(String(value || "").split("?")[0])

    isGoogleDriveUrl = value => /(^https?:\/\/)?(docs|drive)\.google\.com\//i.test(String(value || ""))

    getGoogleDrivePreviewUrl = value => {
        try {
            const url = new URL(value)
            const documentMatch = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/i)
            if (documentMatch) {
                return `https://docs.google.com/${documentMatch[1]}/d/${documentMatch[2]}/preview`
            }

            const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)/i)
            if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`

            const fileId = url.searchParams.get("id")
            return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : value
        } catch {
            return value
        }
    }

    getPreviewUrl = file => {
        const fileUrl = this.getAttachmentUrl(file)
        if (!fileUrl) return ""
        if (this.isGoogleDriveUrl(fileUrl)) return this.getGoogleDrivePreviewUrl(fileUrl)
        if (!this.isPdfFile(file)) return fileUrl

        const separator = fileUrl.includes("#") ? "&" : "#"
        return `${fileUrl}${separator}toolbar=0&navpanes=0&view=FitH&page=${this.state.attachmentPage}`
    }

    changeAttachmentPage = direction => {
        this.setState(state => ({
            attachmentPage: Math.max(1, state.attachmentPage + direction),
        }))
    }

    getVisibleList = () => {
        const list = Array.isArray(this.state.list) ? this.state.list : []
        const filters = this.state.inlineFilterValues || {}
        const category = this.state.jenisPengirimanTab

        return list.filter(item => {
            const surat = item.surat_masuk || item.suratMasuk || {}
            const jenisPengiriman = String(
                surat.jenis_pengiriman || item.jenis_pengiriman || (surat.id_surat_keluar ? "internal" : "eksternal")
            ).toLowerCase()
            if (category !== "semua" && jenisPengiriman !== category) return false

            const nomorSurat = String(surat.nomor_surat || "").toLowerCase()
            const asalSurat = String(surat.asal_surat || "").toLowerCase()
            const kepadaTujuan = String(surat.kepada_tujuan || "").toLowerCase()

            if (filters.nomor_surat && !nomorSurat.includes(String(filters.nomor_surat).toLowerCase())) return false
            if (filters.asal_surat && !asalSurat.includes(String(filters.asal_surat).toLowerCase())) return false
            if (filters.kepada_tujuan && !kepadaTujuan.includes(String(filters.kepada_tujuan).toLowerCase())) return false
            if (filters.status && String(item.status || "") !== String(filters.status)) return false
            return true
        })
    }

    handleInlineFilterChange = (name, value) => {
        this.setState(state => ({
            inlineFilterValues: {
                ...state.inlineFilterValues,
                [name]: value,
            },
        }))
    }

    getReportSummary = list => (
        (list || []).reduce((summary, item) => {
            const status = String(item.status || "").toLowerCase()

            summary.total += 1
            if (["dikirim", "distributed", "baru", "pending"].includes(status)) summary.baru += 1
            if (["dibaca", "read"].includes(status)) summary.dibaca += 1
            if (["proses", "diproses"].includes(status)) summary.proses += 1
            if (["selesai", "done", "arsip", "archived"].includes(status)) summary.selesai += 1

            return summary
        }, {
            total: 0,
            baru: 0,
            dibaca: 0,
            proses: 0,
            selesai: 0,
        })
    )

    renderSummaryCard = (label, value, icon, color = "#138a98") => (
        <div className="col-lg col-md-4 col-sm-6 mb-3">
            <div className="card card-dashboard h-100" style={{ borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div className="card-body d-flex align-items-center">
                    <div
                        className="d-flex align-items-center justify-content-center mr-3"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            background: `${color}15`,
                            color,
                            flex: "0 0 42px",
                        }}
                    >
                        <span className="material-icons">{icon}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: "#1e293b" }}>{value}</div>
                    </div>
                </div>
            </div>
        </div>
    )

    getRowActions = item => {
        const actions = []

        actions.push({
            label: "Lihat Surat",
            icon: "visibility",
            onClick: () => this.openDetailModal(item),
        })
        actions.push({
            label: "Lihat Riwayat",
            icon: "timeline",
            onClick: () => this.openTimelineModal(item),
        })

        return actions
    }

    getSurat = item => item?.surat_masuk || item?.suratMasuk || item || {}

    handleDeleteDistribution = async item => {
        const distributionId = item?.[this.model.primaryKey]

        if (!distributionId) {
            showToastr("error", "ID distribusi tidak ditemukan.")
            return
        }

        if (!confirm("Hapus distribusi surat ini dari pegawai?")) return

        const response = await this.model.delete(distributionId)

        if (response?.error || response?.code) return

        showToastr("success", "Distribusi surat berhasil dihapus.")
        this.get()
    }

    tableHeaders = [
        { name: "nomor_surat", label: "Nomor Surat", width: 190, align: "center", filterType: "text" },
        { name: "asal_surat", label: "Pengirim", width: 180, align: "center", filterType: "text" },
        { name: "kepada_tujuan", label: "Penerima/Tujuan", width: 190, align: "center", filterType: "text" },
        { name: "status", label: "Status", width: 150, align: "center", filterType: "select", filterOptions: statusOptions },
        { name: "aksi", label: "Aksi", width: 110, align: "center", filterType: "none" },
    ]

    renderLetterTable = list => (
        <EofficeTableWithFilter
            headers={this.tableHeaders}
            colgroup={[190, 180, 190, 150, 110]}
            filterValues={this.state.inlineFilterValues}
            onFilterChange={this.handleInlineFilterChange}
            align="start"
            minWidth={900}
        >
            {list.map((item, index) => (
                <tr key={item[this.model.primaryKey] || index} className="align-top">
                    <EofficeTableCell width={190} align="start" wrap>
                        <button
                            type="button"
                            className="color-link font-semibold"
                            style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left' }}
                            onClick={() => this.openDetailModal(item)}
                        >
                            {this.getSurat(item).nomor_surat || "-"}
                        </button>
                        <div className="text-gray-500 mt-1" style={{ fontSize: 12 }}>
                            {this.getSurat(item).nomor_agenda || "Tanpa nomor agenda"}
                        </div>
                    </EofficeTableCell>
                    <EofficeTableCell width={180} align="start" wrap>
                        {this.getSurat(item).asal_surat || "-"}
                    </EofficeTableCell>
                    <EofficeTableCell width={190} align="start" wrap>
                        {this.getSurat(item).kepada_tujuan || "-"}
                    </EofficeTableCell>
                    <EofficeTableCell width={150} align="center">
                        <EofficeStatusBadge
                            value={item.status}
                            label={this.state.listreferensi.status?.[item.status] || item.status || "-"}
                        />
                    </EofficeTableCell>
                    <EofficeTableCell width={110} align="center" style={{ paddingLeft: 8, paddingRight: 8 }}>
                        <div className="d-flex align-items-center justify-content-center td-action">
                            <EditDelete data={this.getRowActions(item)} id={item[this.model.primaryKey]} />
                        </div>
                    </EofficeTableCell>
                </tr>
            ))}
        </EofficeTableWithFilter>
    )

    renderDetailValue = value => value || "-"

    getTrackingBadgeColor = type => {
        const colors = {
            created: "bg-success",
            updated: "bg-info",
            distributed: "bg-primary",
            read: "bg-secondary",
            disposition: "bg-warning text-dark",
            disposition_completed: "bg-success",
            archived: "bg-dark",
        }
        return colors[type] || "bg-secondary"
    }

    getTrackingIcon = type => {
        const icons = {
            created: "check",
            updated: "edit",
            distributed: "east",
            read: "visibility",
            disposition: "call_split",
            disposition_completed: "done_all",
            archived: "archive",
        }
        return icons[type] || "fiber_manual_record"
    }

    getTrackingTitle = event => {
        const titles = {
            created: "Surat dibuat",
            updated: "Diperbarui",
            distributed: "Didistribusikan",
            read: "Dibaca",
            disposition: "Disposisi",
            disposition_completed: "Disposisi selesai",
            archived: "Diarsipkan",
        }
        return titles[event.type] || event.description || event.title || event.type || "Aktivitas"
    }

    getTrackingTime = event => {
        const time = event.created_at || event.tanggal || event.waktu || event.time
        return time ? formatDateApp(time) || time : ""
    }

    renderAttachmentPreview = data => {
        const file = this.getAttachmentValue(data)
        const fileUrl = this.getAttachmentUrl(file)
        const previewUrl = this.getPreviewUrl(file)
        const isPdf = this.isPdfFile(file)
        const isImage = this.isImageFile(file)
        const isGoogleDrive = this.isGoogleDriveUrl(fileUrl)

        return (
            <EofficeCard className="p-3 h-100 d-flex flex-column" style={{ minHeight: 0 }}>
                <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="font-semibold text-gray-900" style={{ fontSize: 14 }}>
                            <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: "middle" }}>attach_file</span>
                            Lampiran Surat
                        </div>
                        <div className="text-gray-500" style={{ fontSize: 11, overflowWrap: "anywhere" }}>{this.getFileName(file)}</div>
                    </div>
                    {isPdf ? (
                        <div className="d-flex align-items-center" style={{ gap: 4 }}>
                            <button type="button" className="btn btn-light btn-sm border" disabled={this.state.attachmentPage <= 1} onClick={() => this.changeAttachmentPage(-1)}>
                                <span className="material-icons" style={{ fontSize: 16 }}>chevron_left</span>
                            </button>
                            <span className="text-muted" style={{ fontSize: 12 }}>Hal. {this.state.attachmentPage}</span>
                            <button type="button" className="btn btn-light btn-sm border" onClick={() => this.changeAttachmentPage(1)}>
                                <span className="material-icons" style={{ fontSize: 16 }}>chevron_right</span>
                            </button>
                        </div>
                    ) : null}
                </div>

                {!fileUrl ? (
                    <div className="text-muted text-center py-5 border rounded-md bg-light flex-1 d-flex align-items-center justify-content-center">
                        <div>
                            <span className="material-icons text-gray-400" style={{ fontSize: 42 }}>description</span>
                            <div className="mt-2">Belum ada lampiran surat.</div>
                        </div>
                    </div>
                ) : isGoogleDrive || isPdf ? (
                    <iframe
                        key={`${fileUrl}-${this.state.attachmentPage}`}
                        title="Lampiran surat masuk pegawai"
                        src={previewUrl}
                        style={{ width: "100%", flex: 1, minHeight: 0, border: "1px solid #d9e2e7", borderRadius: 6, background: "#2f2f2f" }}
                    />
                ) : isImage ? (
                    <div className="d-flex align-items-center justify-content-center border rounded-md bg-dark flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
                        <img src={previewUrl} alt="Lampiran surat masuk" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                ) : (
                    <div className="text-center py-5 border rounded-md bg-light flex-1 d-flex align-items-center justify-content-center">
                        <div>
                            <span className="material-icons text-gray-500" style={{ fontSize: 42 }}>description</span>
                            <div className="font-semibold mt-2">Preview tidak tersedia</div>
                            <div className="text-muted mt-1">Gunakan tombol Buka untuk melihat.</div>
                        </div>
                    </div>
                )}

                <div className="d-flex align-items-center justify-content-end mt-2">
                    {fileUrl ? (
                        <Button type="button" className="btn-default-app btn-info btn-sm" onClick={() => window.open(fileUrl, "_blank")}>
                            <span className="material-icons mr-1" style={{ fontSize: 14 }}>open_in_new</span>
                            Buka
                        </Button>
                    ) : null}
                </div>
            </EofficeCard>
        )
    }

    renderInlineTracking = () => {
        const { inlineTracking, inlineTrackingLoading } = this.state

        return (
            <EofficeCard className="p-2 mb-2">
                <div className="d-flex align-items-center justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="font-semibold text-gray-900" style={{ fontSize: 13 }}>
                        <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: "middle" }}>timeline</span>
                        Tracking Surat
                    </div>
                    <Button type="button" className="btn-default-app btn-outline-info btn-sm" onClick={() => this.setState({ showTimelinePopup: true, selectedTimelineSurat: this.state.selectedDistribution })}>
                        <span className="material-icons" style={{ fontSize: 14 }}>open_in_full</span>
                    </Button>
                </div>

                {inlineTrackingLoading ? (
                    <div className="text-center py-3">
                        <span className="spinner-border spinner-border-sm text-muted"></span>
                        <div className="text-muted mt-1" style={{ fontSize: 11 }}>Memuat tracking...</div>
                    </div>
                ) : inlineTracking.length > 0 ? (
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {inlineTracking.slice(0, 6).map((event, idx) => (
                            <div key={idx} className="d-flex" style={{ gap: 8, padding: "7px 0", borderBottom: idx < Math.min(inlineTracking.length - 1, 5) ? "1px solid #eee" : "none" }}>
                                <span className={`badge ${this.getTrackingBadgeColor(event.type)} d-flex align-items-center justify-content-center`} style={{ width: 22, height: 22 }}>
                                    <span className="material-icons" style={{ fontSize: 13 }}>{this.getTrackingIcon(event.type)}</span>
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{this.getTrackingTitle(event)}</div>
                                    <div className="text-muted" style={{ fontSize: 10 }}>{this.getTrackingTime(event)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-muted text-center py-2" style={{ fontSize: 11 }}>Belum ada tracking.</div>
                )}
            </EofficeCard>
        )
    }

    renderDisposisiForm = data => (
        <EofficeCard className="p-2">
            <div className="font-semibold text-gray-900 mb-2">Disposisi</div>
            <div className="text-muted mb-2" style={{ fontSize: 12, lineHeight: 1.25 }}>
                Buat disposisi untuk surat {data.nomor_surat || data.nomor_agenda || "-"}. Pilih penerima dan tenggat, lalu klik Tambah Disposisi.
            </div>
            <div className="row g-2">
                <div className="col-md-7">
                    <label className="font-semibold" style={{ fontSize: 12 }}>Penerima Disposisi</label>
                    <select className="form-control" value={this.state.disposisiForm.id_penerima} onChange={event => this.handleDisposisiFormChange("id_penerima", event.target.value)}>
                        <option value="">Pilih pegawai penerima</option>
                        {this.state.userOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </div>
                <div className="col-md-5">
                    <label className="font-semibold" style={{ fontSize: 12 }}>Tenggat</label>
                    <input type="date" className="form-control" value={this.state.disposisiForm.tanggal_jatuh_tempo} onChange={event => this.handleDisposisiFormChange("tanggal_jatuh_tempo", event.target.value)} />
                </div>
            </div>
            <div className="d-flex justify-content-end mt-2">
                <Button type="button" className="btn-default-app btn-info" onClick={this.submitDisposisi} disabled={this.state.disposisiLoading}>
                    <span className="material-icons mr-1" style={{ fontSize: 16 }}>send</span>
                    {this.state.disposisiLoading ? "Mengirim..." : "Tambah Disposisi"}
                </Button>
            </div>
        </EofficeCard>
    )

    renderDetailContent = () => {
        const data = this.state.selectedSuratDetail || {}
        const infoItems = [
            { label: "Nomor Agenda", value: data.nomor_agenda },
            { label: "Nomor Surat", value: data.nomor_surat },
            { label: "Pengirim", value: data.asal_surat },
            { label: "Penerima/Tujuan", value: data.kepada_tujuan },
            { label: "Jenis", value: data.jenis },
            { label: "Sifat", value: data.sifat },
            { label: "Topik", value: data.topik },
            { label: "Tanggal Surat", value: data.tanggal_surat ? formatDateApp(data.tanggal_surat, "YYYY-MM-DD") : "" },
            { label: "Tanggal Terima", value: data.tanggal_terima ? formatDateApp(data.tanggal_terima, "YYYY-MM-DD") : "" },
        ]

        return (
            <div className="d-flex flex-column flex-xl-row" style={{ gap: 12, height: "100%", minHeight: 0, overflow: "hidden" }}>
                <div className="d-flex flex-column" style={{ flex: "0 0 28%", minWidth: 280, minHeight: 0, overflow: "auto", paddingRight: 2 }}>
                    <EofficeCard className="p-3 mb-2" style={{ flex: "0 0 auto" }}>
                        <div className="d-flex align-items-start justify-content-between mb-3" style={{ gap: 10 }}>
                            <div>
                                <div className="font-semibold text-gray-900" style={{ fontSize: 16 }}>{this.renderDetailValue(data.perihal)}</div>
                                <div className="text-gray-500 mt-1" style={{ fontSize: 12 }}>Detail surat masuk</div>
                            </div>
                            <EofficeStatusBadge value={this.state.selectedDistribution?.status || data.status || "read"} />
                        </div>
                        <EofficeInfoGrid items={infoItems} />
                        <div className="mt-2">
                            <div className="text-gray-500" style={{ fontSize: 11 }}>Isi/Ringkasan</div>
                            <div className="mt-1" style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.4, maxHeight: 120, overflowY: "auto" }}>{this.renderDetailValue(data.isi_ringkasan)}</div>
                        </div>
                        {data.catatan ? (
                            <div className="mt-2">
                                <div className="text-gray-500" style={{ fontSize: 11 }}>Catatan</div>
                                <div className="mt-1" style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.4 }}>{this.renderDetailValue(data.catatan)}</div>
                            </div>
                        ) : null}
                    </EofficeCard>
                </div>

                <div style={{ flex: "1 1 42%", minWidth: 300, minHeight: 0 }}>
                    {this.renderAttachmentPreview(data)}
                </div>

                <div className="d-flex flex-column" style={{ flex: "0 0 28%", minWidth: 280, minHeight: 0, overflow: "auto" }}>
                    {this.renderInlineTracking()}
                    {this.renderDisposisiForm(data)}
                </div>
            </div>
        )
    }

    render() {
        const list = this.getVisibleList()
        const summary = this.state.summary

        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={[]}
                    filterTabs={<div style={{ marginTop: 16, marginBottom: 0 }}>{[["semua", "Semua Surat"], ["internal", "Internal"], ["eksternal", "Eksternal"]].map(([value, label]) => <button key={value} type="button" className={`btn btn-sm ${this.state.jenisPengirimanTab === value ? "btn-info" : "btn-outline-secondary"}`} onClick={() => this.setState({ jenisPengirimanTab: value })}>{label}</button>)}</div>}
                />

                <div className="container pl-4 pr-4">
                    {this.state.scopeWarning ? (
                        <div className="alert alert-warning">{this.state.scopeWarning}</div>
                    ) : null}

                    <div className="row mb-2">
                        {this.renderSummaryCard("Total", summary.total, "move_to_inbox")}
                        {this.renderSummaryCard("Baru", summary.baru, "mark_email_unread")}
                        {this.renderSummaryCard("Distribusi", summary.distribusi, "pending_actions")}
                        {this.renderSummaryCard("Selesai", summary.selesai, "task_alt", "#22a06b")}
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
                            }, () => this.get())
                        }}
                    />
                </div>

                <EofficeTimelineModal
                    show={this.state.showTimelinePopup}
                    onHide={() => this.setState({ showTimelinePopup: false, selectedTimelineSurat: null })}
                    suratId={this.getSuratId(this.state.selectedTimelineSurat)}
                    surat={this.state.selectedTimelineSurat}
                />

                <Modal
                    show={this.state.showDetailPopup}
                    onHide={() => this.setState({
                        showDetailPopup: false,
                        selectedDistribution: null,
                        selectedSuratDetail: null,
                        inlineTracking: [],
                    })}
                    className="eoffice-modal eoffice-modal-detail"
                    dialogClassName="eoffice-modal-wide"
                    size="xl"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Detail Surat Masuk</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="eoffice-modal-body">
                        {this.state.detailLoading ? (
                            <div className="text-center py-4">Memuat detail surat...</div>
                        ) : this.renderDetailContent()}
                    </Modal.Body>
                </Modal>
            </>
        )
    }
}

export default SuratMasukPegawai
