"use client"

import { useEffect, useMemo, useState } from "react"
import { Modal } from "react-bootstrap"
import Button from "components/Button"
import EofficeStatusBadge from "components/EofficeStatusBadge"
import { api_services } from "hooks/api_services"
import { formatDateApp } from "pages/Utils"
import EditDelete from "components/EditDelete"

const emptyForm = {
    judul: "",
    isi: "",
    kategori: "informasi",
    target_role: "semua",
    tanggal_publish: "",
    lampiran: "",
    status: "draft",
}

const emptyFilters = {
    keyword: "",
    kategori: "",
    status: "",
    target_role: "",
    tanggal_dari: "",
    tanggal_sampai: "",
}

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const getId = item => item?.id_pengumuman || item?.id || item?.value

const kategoriOptions = [
    { value: "semua", label: "Semua", icon: "apps", color: "#334155" },
    { value: "informasi", label: "Informasi", icon: "info", color: "#118b9b" },
    { value: "penting", label: "Penting", icon: "priority_high", color: "#dc2626" },
    { value: "acara", label: "Acara", icon: "event", color: "#7c3aed" },
    { value: "pengumuman_layanan", label: "Layanan", icon: "support_agent", color: "#eab308" },
    { value: "edukasi", label: "Edukasi", icon: "school", color: "#16a34a" },
]

const isiPengumumanTemplates = [
    {
        value: "informasi_umum",
        label: "Informasi Umum",
        isi: "Dengan ini disampaikan informasi kepada seluruh pegawai agar memperhatikan ketentuan dan informasi terbaru yang berlaku.",
    },
    {
        value: "pemberitahuan_penting",
        label: "Pemberitahuan Penting",
        isi: "Diberitahukan kepada seluruh pegawai bahwa terdapat informasi penting yang perlu segera diperhatikan dan ditindaklanjuti sesuai ketentuan.",
    },
    {
        value: "undangan_kegiatan",
        label: "Undangan Kegiatan",
        isi: "Diharapkan kehadiran pihak yang dituju pada kegiatan sesuai jadwal, tempat, dan ketentuan yang telah ditetapkan.",
    },
    {
        value: "layanan_sistem",
        label: "Informasi Layanan Sistem",
        isi: "Layanan sistem akan mengalami penyesuaian. Mohon pengguna memperhatikan informasi terbaru dan melakukan tindakan yang diperlukan.",
    },
]

const getKategori = value => kategoriOptions.find(k => k.value === value) || kategoriOptions[0]

const formatDateShort = value => {
    if (!value) return "-"
    return formatDateApp(value, "DD MMM YYYY")
}

const Pengumuman = () => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [previewItem, setPreviewItem] = useState(null)
    const [showPreview, setShowPreview] = useState(false)
    const [filters, setFilters] = useState(emptyFilters)
    const [draftFilters, setDraftFilters] = useState(emptyFilters)
    const [pagination, setPagination] = useState({ page: 1, pagesize: 12, total_records: 0, total_page: 1 })
    const [loadError, setLoadError] = useState("")
    const [roleOptions, setRoleOptions] = useState([])
    const [isiTemplate, setIsiTemplate] = useState("")
    const [activeKategori, setActiveKategori] = useState("semua")

    const service = useMemo(() => api_services({ api_path: "/pengumuman" }), [])
    const roleService = useMemo(() => api_services({ api_path: "/pengumuman/roles" }), [])

    const loadData = async (activeFilters = filters, page = pagination.page) => {
        setIsLoading(true)
        setLoadError("")
        const activeFilterValues = Object.fromEntries(
            Object.entries(activeFilters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
        )
        const response = await service.getapi_services({
            filter: {
                paginate: { page, pagesize: pagination.pagesize },
                filter: activeFilterValues,
                order: "published_at desc, id_pengumuman desc",
            },
        })
        setIsLoading(false)
        if (response?.error || response?.code || response?.success === false) {
            setList([])
            setLoadError(response?.message || "Data pengumuman tidak dapat dimuat.")
            return
        }
        setList(normalizeList(response))
        setPagination(current => ({
            ...current,
            page: response?.page || page,
            total_records: response?.total_records || 0,
            total_page: response?.total_page || 1,
        }))
    }

    useEffect(() => { loadData() }, [filters, pagination.page])

    useEffect(() => {
        const loadRoles = async () => {
            const response = await roleService.getapi_services({})
            setRoleOptions(normalizeList(response)
                .map(item => ({
                    value: `group:${item.id_group || item.id}`,
                    label: item.nama || item.nama_group || item.name,
                }))
                .filter(item => item.value !== 'group:undefined' && item.label))
        }
        loadRoles().catch(() => setRoleOptions([]))
    }, [roleService])

    const getTargetRoleLabel = value => {
        if (value === 'semua') return 'Semua'
        const legacyLabels = {
            admin_sistem: 'Admin Sistem',
            admin_konten: 'Admin Konten',
            pegawai: 'Pegawai / Pimpinan',
        }
        return roleOptions.find(option => option.value === value)?.label || legacyLabels[value] || value || 'Semua'
    }

    const openForm = item => {
        setSelectedId(getId(item))
        setIsiTemplate(isiPengumumanTemplates.find(template => template.isi === item?.isi)?.value || "")
        setForm({
            ...emptyForm,
            ...item,
            tanggal_publish: item?.tanggal_publish ? String(item.tanggal_publish).slice(0, 10) : '',
        })
        setShowModal(true)
    }

    const handleIsiTemplateChange = templateId => {
        const template = isiPengumumanTemplates.find(item => item.value === templateId)
        setIsiTemplate(templateId)
        setForm(current => ({ ...current, isi: template?.isi || "" }))
    }

    const saveData = async event => {
        event?.preventDefault()
        const body = { ...form }
        const response = selectedId
            ? await service.putapi_services({ id: selectedId, ...body })
            : await service.postapi_services(body)
        if (response?.success === false || response?.error || response?.code || !response?.data) return
        setShowModal(false)
        setSelectedId(null)
        setIsiTemplate("")
        setForm(emptyForm)
        loadData()
    }

    const publishData = async item => {
        const id = getId(item)
        if (!id) return
        const nextStatus = item?.status === "publish" || item?.status === "published" ? "draft" : "publish"
        const response = await service.putapi_services({
            id, ...item, status: nextStatus,
            tanggal_publish: nextStatus === "publish" ? (item?.tanggal_publish || new Date().toISOString().slice(0, 10)) : item?.tanggal_publish,
        })
        if (response?.error || response?.code) return
        loadData()
    }

    const deleteData = async item => {
        const id = getId(item)
        if (!id) return
        const response = await service.deleteapi_services({ id })
        if (response?.error || response?.code) return
        loadData()
    }

    const applyFilters = event => {
        event?.preventDefault()
        setFilters(draftFilters)
        setPagination(current => ({ ...current, page: 1 }))
    }

    const resetFilters = () => {
        setDraftFilters(emptyFilters)
        setFilters(emptyFilters)
        setPagination(current => ({ ...current, page: 1 }))
    }

    const changePage = nextPage => {
        if (nextPage < 1 || nextPage > pagination.total_page || nextPage === pagination.page) return
        setPagination(current => ({ ...current, page: nextPage }))
    }

    const handleKategoriChange = kategori => {
        setActiveKategori(kategori)
        const kategoriFilter = kategori === "semua" ? "" : kategori
        setFilters(current => ({ ...current, kategori: kategoriFilter }))
        setDraftFilters(current => ({ ...current, kategori: kategoriFilter }))
        setPagination(current => ({ ...current, page: 1 }))
    }

    const visibleList = activeKategori === "semua"
        ? list
        : list.filter(item => item?.kategori === activeKategori)
    const publishedList = visibleList.filter(item => item?.status === "publish" || item?.status === "published")
    const draftList = visibleList.filter(item => item?.status === "draft")

    return (
        <>
            <div className="container pl-4 pr-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div className="d-flex flex-wrap gap-2" role="tablist" aria-label="Filter kategori pengumuman">
                        {kategoriOptions.map(kategori => {
                            const isActive = activeKategori === kategori.value
                            return <button
                                key={kategori.value}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => handleKategoriChange(kategori.value)}
                                className={`btn btn-sm d-inline-flex align-items-center gap-1 ${isActive ? "text-white shadow-sm" : "bg-white border text-slate-600"}`}
                                style={isActive ? { backgroundColor: kategori.color, borderColor: kategori.color, fontWeight: 600 } : { borderColor: "#cbd5e1" }}
                            >
                                <span className="material-icons" style={{ fontSize: 16 }}>{kategori.icon}</span>
                                {kategori.label}
                            </button>
                        })}
                    </div>
                    <Button className="btn-default-app btn-info" onClick={() => openForm({})}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>campaign</span>
                        Tambah Pengumuman
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                        { label: "Total Pengumuman", value: list.length, icon: "campaign", color: "teal" },
                        { label: "Diterbitkan", value: publishedList.length, icon: "publish", color: "emerald" },
                        { label: "Draf", value: draftList.length, icon: "edit_note", color: "slate" },
                        { label: "Penting", value: list.filter(l => l?.kategori === "penting").length, icon: "priority_high", color: "red" },
                    ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                item.color === "teal" ? "bg-teal-50" :
                                item.color === "emerald" ? "bg-emerald-50" :
                                item.color === "slate" ? "bg-slate-100" : "bg-red-50"
                            }`}>
                                <span className={`material-icons text-lg ${
                                    item.color === "teal" ? "text-teal-600" :
                                    item.color === "emerald" ? "text-emerald-600" :
                                    item.color === "slate" ? "text-slate-500" : "text-red-500"
                                }`}>{item.icon}</span>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{item.value}</div>
                                <div className="text-xs text-slate-500">{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pengumuman List */}
                <div className="row">
                    {visibleList.map((item, index) => {
                        const kat = getKategori(item?.kategori)
                        const isPublished = item?.status === "publish" || item?.status === "published"
                        return (
                            <div className="col-lg-6 mb-3" key={getId(item) || index}>
                                <div className={`bg-white rounded-xl shadow-sm border ${isPublished ? "border-teal-200" : "border-slate-200/80"} h-100`}>
                                    {/* Card Header */}
                                    <div className="p-4 pb-3">
                                        <div className="d-flex align-items-start justify-content-between mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="d-flex align-items-center justify-content-center rounded-lg p-1.5" style={{ background: `${kat.color}15` }}>
                                                    <span className="material-icons" style={{ fontSize: 18, color: kat.color }}>{kat.icon}</span>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold" style={{ color: kat.color }}>{kat.label}</div>
                                                </div>
                                            </div>
                                            <EofficeStatusBadge value={item?.status || "draft"} />
                                        </div>
                                        <h5 className="font-bold text-slate-900 mb-1">{item?.judul || "-"}</h5>
                                        <div className="text-xs text-slate-500">
                                            <span className="material-icons" style={{ fontSize: 13, verticalAlign: "middle" }}>group</span>
                                            {" "}{getTargetRoleLabel(item?.target_role)}
                                            {item?.tanggal_publish ? ` • ${formatDateShort(item.tanggal_publish)}` : ""}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="px-4 pb-3">
                                        <div className="text-sm text-slate-600 mb-3" style={{ lineHeight: 1.6, maxHeight: 80, overflow: "hidden", position: "relative" }}>
                                            {item?.isi || "-"}
                                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "linear-gradient(transparent, white)" }}></div>
                                        </div>

                                        {/* Lampiran */}
                                        {item?.lampiran && (
                                            <div className="mb-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="text-xs text-slate-500 font-semibold mb-1">
                                                    <span className="material-icons" style={{ fontSize: 13, verticalAlign: "middle" }}>attach_file</span>
                                                    {" "}Lampiran
                                                </div>
                                                <div className="text-xs text-teal-600">{item.lampiran}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-4 pb-4 pt-2 d-flex justify-content-between align-items-center">
                                        <div className="d-flex" style={{ gap: 6 }}>
                                            <Button className="btn-default-app btn-light btn-sm" onClick={() => { setPreviewItem(item); setShowPreview(true) }}>
                                                <span className="material-icons" style={{ fontSize: 14 }}>visibility</span>
                                            </Button>
                                            <EditDelete
                                                data={[
                                                    { label: "Edit", icon: "edit" },
                                                    { label: "Hapus", icon: "delete" },
                                                ]}
                                                onEdit={() => openForm(item)}
                                                onDelete={() => deleteData(item)}
                                            />
                                        </div>
                                        <Button
                                            className={`btn-default-app btn-sm ${isPublished ? "btn-warning" : "btn-success"}`}
                                            onClick={() => publishData(item)}
                                        >
                                            <span className="material-icons" style={{ fontSize: 14 }}>{isPublished ? "unpublished" : "publish"}</span>
                                            {isPublished ? "Batalkan Terbit" : "Terbitkan"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {!visibleList.length ? (
                        <div className="col-12">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 text-center text-slate-400">
                                <span className="material-icons text-5xl mb-3">campaign</span>
                                <h3 className="text-lg font-semibold text-slate-600 mb-1">Belum Ada Pengumuman</h3>
                                <p className="text-sm mb-3">{loadError || "Ubah filter atau klik tombol di atas untuk membuat pengumuman baru."}</p>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="d-flex justify-content-between align-items-center mt-2 mb-4">
                    <div className="text-xs text-slate-500">Menampilkan {visibleList.length} dari {pagination.total_records} pengumuman</div>
                    <div className="d-flex align-items-center" style={{ gap: 8 }}>
                        <Button className="btn-default-app btn-light btn-sm" type="button" disabled={pagination.page <= 1 || isLoading} onClick={() => changePage(pagination.page - 1)}>Sebelumnya</Button>
                        <span className="text-xs text-slate-600">Halaman {pagination.page} / {pagination.total_page}</span>
                        <Button className="btn-default-app btn-light btn-sm" type="button" disabled={pagination.page >= pagination.total_page || isLoading} onClick={() => changePage(pagination.page + 1)}>Berikutnya</Button>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedId ? "Edit Pengumuman" : "Tambah Pengumuman"}</Modal.Title>
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-8">
                                <label className="font-semibold">Judul Pengumuman <span className="text-danger">*</span></label>
                                <input className="form-control" value={form.judul || ""} onChange={e => setForm({ ...form, judul: e.target.value })} required />
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Kategori</label>
                                <select className="form-control" value={form.kategori || "informasi"} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                                    {kategoriOptions.filter(k => k.value !== "semua").map(k => (
                                        <option key={k.value} value={k.value}>{k.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Target Role</label>
                                <select className="form-control" value={form.target_role || "semua"} onChange={e => setForm({ ...form, target_role: e.target.value })}>
                                    <option value="semua">Semua</option>
                                    {form.target_role && form.target_role !== 'semua' && !roleOptions.some(option => option.value === form.target_role)
                                        ? <option value={form.target_role}>{getTargetRoleLabel(form.target_role)}</option>
                                        : null}
                                    {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Tanggal Publish</label>
                                <input className="form-control" type="date" value={form.tanggal_publish || ""} onChange={e => setForm({ ...form, tanggal_publish: e.target.value })} required={form.status === 'publish'} />
                                <small className="text-muted">Pengumuman mulai tampil pada tanggal ini.</small>
                            </div>
                            <div className="col-12">
                                <label className="font-semibold">Isi Pengumuman <span className="text-danger">*</span></label>
                                <select className="form-control" value={isiTemplate} onChange={e => handleIsiTemplateChange(e.target.value)} required>
                                    <option value="">-- Pilih format isi pengumuman --</option>
                                    {isiPengumumanTemplates.map(template => (
                                        <option key={template.value} value={template.value}>{template.label}</option>
                                    ))}
                                </select>
                                {form.isi ? (
                                    <div className="form-control mt-2 bg-light" style={{ minHeight: 110, whiteSpace: "pre-wrap" }}>
                                        {form.isi}
                                    </div>
                                ) : null}
                                <small className="text-muted">Isi pengumuman mengikuti format yang dipilih dan tidak dapat diketik bebas.</small>
                            </div>
                            <div className="col-12">
                                <label className="font-semibold">Lampiran</label>
                                <input className="form-control" placeholder="URL atau nama file lampiran" value={form.lampiran || ""} onChange={e => setForm({ ...form, lampiran: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Status</label>
                                <select className="form-control" value={form.status || "draft"} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="draft">Draf</option>
                                    <option value="publish">Publish</option>
                                </select>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-default-app btn-light" type="button" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button className="btn-default-app btn-info" type="submit">Simpan Pengumuman</Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Preview Modal */}
            <Modal show={showPreview} onHide={() => setShowPreview(false)} backdrop="static" keyboard={false} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Preview Pengumuman</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {previewItem && (
                        <div className="p-4">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="d-flex align-items-center justify-content-center rounded-lg p-2" style={{ background: `${getKategori(previewItem?.kategori).color}15` }}>
                                    <span className="material-icons text-2xl" style={{ color: getKategori(previewItem?.kategori).color }}>
                                        {getKategori(previewItem?.kategori).icon}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-0">{previewItem?.judul || "-"}</h3>
                                    <div className="text-sm text-slate-500">
                                        {getTargetRoleLabel(previewItem?.target_role)}
                                        {previewItem?.tanggal_publish ? ` • ${formatDateShort(previewItem.tanggal_publish)}` : ""}
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="text-slate-700 mt-3" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                                {previewItem?.isi || "-"}
                            </div>
                            {previewItem?.lampiran && (
                                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">
                                        <span className="material-icons" style={{ fontSize: 14, verticalAlign: "middle" }}>attach_file</span>
                                        {" "}Lampiran
                                    </div>
                                    <div className="text-sm text-teal-600">{previewItem.lampiran}</div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-default-app btn-light" onClick={() => setShowPreview(false)}>Tutup</Button>
                    <Button className="btn-default-app btn-info" onClick={() => { setShowPreview(false); openForm(previewItem) }}>
                        <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
                        Edit
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default Pengumuman
