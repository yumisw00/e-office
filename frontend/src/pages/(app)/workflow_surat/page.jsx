"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Modal } from "react-bootstrap"
import HeaderApp from "components/HeaderApp"
import Button from "components/Button"
import EofficeStatusBadge from "components/EofficeStatusBadge"
import EditDelete from "components/EditDelete"
import { api_services } from "hooks/api_services"
import { formatDateApp } from "pages/Utils"

const defaultSteps = [
    { nama_step: "Pembuat", role_jabatan: "Admin Konten", urutan: 1 },
    { nama_step: "Verifikator", role_jabatan: "Pimpinan Unit", urutan: 2 },
    { nama_step: "Penandatangan", role_jabatan: "Pimpinan", urutan: 3 },
]

const emptyForm = {
    nama_workflow: "",
    jenis_surat: "surat_keluar",
    deskripsi: "",
    steps: JSON.parse(JSON.stringify(defaultSteps)),
    is_active: true,
    status: "aktif",
}

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const normalizeSteps = value => {
    if (Array.isArray(value)) return value
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(defaultSteps))
        } catch (error) {
            return JSON.parse(JSON.stringify(defaultSteps))
        }
    }
    return JSON.parse(JSON.stringify(defaultSteps))
}

const getId = item => item?.id_workflow_surat || item?.id || item?.value

const getStepIcon = (nama, index) => {
    const lower = (nama || "").toLowerCase()
    if (lower.includes("buat") || lower.includes("pembuat")) return "edit"
    if (lower.includes("verif") || lower.includes("periksa") || lower.includes("pemeriksa")) return "rule"
    if (lower.includes("tanda") || lower.includes("penandatangan")) return "draw"
    const icons = ["edit", "rule", "draw", "verified", "policy", "manage_accounts"]
    return icons[index % icons.length]
}

const WorkflowSurat = () => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewItem, setPreviewItem] = useState(null)
    const [selectedId, setSelectedId] = useState(null)
    const [form, setForm] = useState(JSON.parse(JSON.stringify(emptyForm)))
    const [dragIndex, setDragIndex] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    const service = useMemo(() => api_services({ api_path: "/workflow_surat" }), [])

    const loadData = async () => {
        setIsLoading(true)
        const response = await service.getapi_services({ filter: { paginate: { page: 1, pagesize: 1000 } } })
        setIsLoading(false)
        if (response?.error || response?.code) { setList([]); return }
        setList(normalizeList(response))
    }

    useEffect(() => { loadData() }, [])

    const openForm = item => {
        setSelectedId(getId(item))
        setForm({
            ...JSON.parse(JSON.stringify(emptyForm)),
            ...item,
            steps: item ? normalizeSteps(item?.steps) : JSON.parse(JSON.stringify(defaultSteps)),
            is_active: item?.is_active === undefined ? true : [true, 1, "1", "aktif", "active"].includes(item.is_active),
        })
        setShowModal(true)
    }

    const openPreview = item => {
        setPreviewItem(item)
        setShowPreview(true)
    }

    const updateStep = (index, field, value) => {
        setForm(current => ({
            ...current,
            steps: current.steps.map((step, stepIndex) => stepIndex === index ? { ...step, [field]: value } : step),
        }))
    }

    const addStep = () => {
        setForm(current => ({
            ...current,
            steps: [
                ...current.steps,
                { nama_step: "Step Baru", role_jabatan: "", urutan: current.steps.length + 1 },
            ],
        }))
    }

    const removeStep = index => {
        setForm(current => ({
            ...current,
            steps: current.steps
                .filter((_, stepIndex) => stepIndex !== index)
                .map((step, stepIndex) => ({ ...step, urutan: stepIndex + 1 })),
        }))
    }

    // Drag & Drop handlers
    const handleDragStart = index => { setDragIndex(index) }
    const handleDragOver = index => { index !== dragIndex && setDragOverIndex(index) }
    const handleDrop = index => {
        if (dragIndex === null || dragIndex === index) return
        setForm(current => {
            const newSteps = [...current.steps]
            const [removed] = newSteps.splice(dragIndex, 1)
            newSteps.splice(index, 0, removed)
            return { ...current, steps: newSteps.map((s, i) => ({ ...s, urutan: i + 1 })) }
        })
        setDragIndex(null)
        setDragOverIndex(null)
    }
    const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null) }

    const saveData = async event => {
        event?.preventDefault()
        const body = {
            ...form,
            steps: JSON.stringify(form.steps),
            is_active: form.is_active ? 1 : 0,
            status: form.is_active ? "aktif" : "inactive",
        }
        const response = selectedId
            ? await service.putapi_services({ id: selectedId, ...body })
            : await service.postapi_services(body)
        if (response?.error || response?.code) return
        setShowModal(false)
        setSelectedId(null)
        setForm(JSON.parse(JSON.stringify(emptyForm)))
        loadData()
    }

    const deleteData = async item => {
        const id = getId(item)
        if (!id) return
        const response = await service.deleteapi_services({ id })
        if (response?.error || response?.code) return
        loadData()
    }

    const toggleActive = async item => {
        const id = getId(item)
        if (!id) return
        const nextActive = ![true, 1, "1", "aktif", "active"].includes(item?.is_active)
        const response = await service.putapi_services({
            id, ...item,
            steps: typeof item?.steps === "string" ? item.steps : JSON.stringify(normalizeSteps(item?.steps)),
            is_active: nextActive ? 1 : 0,
            status: nextActive ? "aktif" : "inactive",
        })
        if (response?.error || response?.code) return
        loadData()
    }

    const aktifCount = list.filter(w => [true, 1, "1", "aktif", "active"].includes(w?.is_active) || w?.status === "aktif").length
    const nonaktifCount = list.length - aktifCount

    const stepRoleOptions = [
        "Admin Konten", "Pimpinan", "Pimpinan Unit", "Verifikator",
        "Penandatangan", "Sekretaris", "Kabag", "Manager", "Staf",
    ]

    return (
        <>
            <HeaderApp
                title="Workflow Approval"
                is_loading={isLoading}
                data_btn={[]}
                btnCustom={
                    <Button className="ml-2 btn-default-app btn-info" onClick={() => openForm(null)}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>add</span>
                        Tambah Workflow
                    </Button>
                }
            />

            <div className="container pl-4 pr-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                        { label: "Total Workflow", value: list.length, icon: "schema", color: "#118b9b" },
                        { label: "Aktif", value: aktifCount, icon: "check_circle", color: "#16a34a" },
                        { label: "Nonaktif", value: nonaktifCount, icon: "cancel", color: "#64748b" },
                        { label: "Jenis Surat", value: [...new Set(list.map(l => l?.jenis_surat).filter(Boolean))].length || "-", icon: "description", color: "#7c3aed" },
                    ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                                <span className="material-icons" style={{ color: item.color }}>{item.icon}</span>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{item.value}</div>
                                <div className="text-xs text-slate-500">{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Workflow Cards */}
                <div className="row">
                    {list.map((item, index) => {
                        const steps = normalizeSteps(item?.steps)
                        const isActive = [true, 1, "1", "aktif", "active"].includes(item?.is_active) || item?.status === "aktif"
                        return (
                            <div className="col-lg-6 mb-3" key={getId(item) || index}>
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                                    {/* Card Header */}
                                    <div className="p-4 pb-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h5 className="font-bold text-slate-900 mb-0.5">{item?.nama_workflow || "Workflow Surat"}</h5>
                                                <div className="text-xs text-slate-500">
                                                    <span className="material-icons" style={{ fontSize: 13, verticalAlign: "middle" }}>description</span>
                                                    {" "}{item?.jenis_surat || "surat_keluar"} {item?.deskripsi ? `• ${item.deskripsi}` : ""}
                                                </div>
                                            </div>
                                            <EofficeStatusBadge value={isActive ? "aktif" : "inactive"} />
                                        </div>

                                        {/* Step Flow */}
                                        <div className="d-flex align-items-center flex-wrap mt-3" style={{ gap: 0 }}>
                                            {steps.map((step, stepIndex) => (
                                                <div key={stepIndex} className="d-flex align-items-center">
                                                    <div
                                                        className="border rounded-lg px-3 py-2 text-center"
                                                        style={{ background: "#f8fafc", minWidth: 110, borderColor: "#e2e8f0" }}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-1">
                                                            <span className="material-icons text-teal-600" style={{ fontSize: 14 }}>{getStepIcon(step?.nama_step, stepIndex)}</span>
                                                        </div>
                                                        <div className="font-semibold text-xs text-slate-800">{step?.nama_step}</div>
                                                        <div className="text-xs text-slate-500">{step?.role_jabatan || "-"}</div>
                                                    </div>
                                                    {stepIndex < steps.length - 1 ? (
                                                        <div className="d-flex align-items-center px-1">
                                                            <span className="material-icons text-slate-300" style={{ fontSize: 18 }}>chevron_right</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 6 }}>
                                        <div className="d-flex" style={{ gap: 6 }}>
                                            <EditDelete
                                                data={[
                                                    { label: "Preview", icon: "visibility" },
                                                    { label: isActive ? "Nonaktifkan" : "Aktifkan", icon: isActive ? "toggle_off" : "toggle_on" },
                                                    { label: "Edit", icon: "edit" },
                                                    { label: "Hapus", icon: "delete" },
                                                ]}
                                                onEdit={() => openForm(item)}
                                                onDelete={() => deleteData(item)}
                                            />
                                        </div>
                                        <Button
                                            className={`btn-default-app btn-sm ${isActive ? "btn-light" : "btn-success"}`}
                                            onClick={() => toggleActive(item)}
                                        >
                                            <span className="material-icons" style={{ fontSize: 14 }}>{isActive ? "toggle_off" : "toggle_on"}</span>
                                            {isActive ? "Nonaktif" : "Aktif"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {!list.length ? (
                        <div className="col-12">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 text-center text-slate-400">
                                <span className="material-icons text-5xl mb-3">schema</span>
                                <h3 className="text-lg font-semibold text-slate-600 mb-1">Belum Ada Workflow</h3>
                                <p className="text-sm">Klik tombol di atas untuk membuat workflow baru.</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <span className="material-icons mr-2 text-teal-600" style={{ fontSize: 20, verticalAlign: "middle" }}>schema</span>
                        {selectedId ? "Edit Workflow Surat" : "Tambah Workflow Surat"}
                    </Modal.Title>
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="font-semibold">Nama Workflow <span className="text-danger">*</span></label>
                                <input className="form-control" value={form.nama_workflow || ""} onChange={e => setForm({ ...form, nama_workflow: e.target.value })} required placeholder="Contoh: Workflow Surat Undangan" />
                            </div>
                            <div className="col-md-6">
                                <label className="font-semibold">Jenis Surat</label>
                                <select className="form-control" value={form.jenis_surat || "surat_keluar"} onChange={e => setForm({ ...form, jenis_surat: e.target.value })}>
                                    <option value="surat_keluar">Surat Keluar</option>
                                    <option value="surat_masuk">Surat Masuk</option>
                                    <option value="disposisi">Disposisi</option>
                                    <option value="template">Template</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="font-semibold">Deskripsi</label>
                                <textarea className="form-control" rows={2} value={form.deskripsi || ""} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi workflow..." />
                            </div>

                            {/* Steps Editor */}
                            <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <label className="font-semibold mb-0">Tahapan Approval</label>
                                        <div className="text-xs text-slate-500">Drag &amp; drop untuk mengatur urutan</div>
                                    </div>
                                    <Button className="btn-default-app btn-light btn-sm" type="button" onClick={addStep}>
                                        <span className="material-icons" style={{ fontSize: 14 }}>add</span>
                                        Tambah Tahap
                                    </Button>
                                </div>

                                <div className="mb-2">
                                    {form.steps.map((step, index) => (
                                        <div
                                            key={index}
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={e => { e.preventDefault(); handleDragOver(index) }}
                                            onDrop={() => handleDrop(index)}
                                            onDragEnd={handleDragEnd}
                                            className={`d-flex align-items-center gap-2 p-2 mb-2 rounded-lg border transition-all ${dragIndex === index ? "opacity-50" : ""} ${dragOverIndex === index ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"}`}
                                            style={{ cursor: "grab" }}
                                        >
                                            <span className="material-icons text-slate-300" style={{ fontSize: 18, cursor: "grab" }}>drag_indicator</span>
                                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-teal-700">{index + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="row g-2">
                                                    <div className="col-md-4">
                                                        <input
                                                            className="form-control form-control-sm"
                                                            value={step.nama_step || ""}
                                                            onChange={e => updateStep(index, "nama_step", e.target.value)}
                                                            placeholder="Nama Tahap"
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <select
                                                            className="form-control form-control-sm"
                                                            value={step.role_jabatan || ""}
                                                            onChange={e => updateStep(index, "role_jabatan", e.target.value)}
                                                        >
                                                            <option value="">-- Pilih Role/Jabatan --</option>
                                                            {stepRoleOptions.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                            <option value="custom">Lainnya...</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <input
                                                            className="form-control form-control-sm"
                                                            type="number"
                                                            value={step.urutan || index + 1}
                                                            onChange={e => updateStep(index, "urutan", e.target.value)}
                                                            min={1}
                                                            max={20}
                                                            title="Urutan"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                className="btn-default-app btn-danger btn-sm p-1"
                                                type="button"
                                                onClick={() => removeStep(index)}
                                                title="Hapus Tahap"
                                            >
                                                <span className="material-icons" style={{ fontSize: 16 }}>delete</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <label className="d-flex align-items-center mb-0 cursor-pointer">
                                        <input type="checkbox" className="mr-2" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                        <span className="font-semibold text-sm">Workflow Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-default-app btn-light" type="button" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button className="btn-default-app btn-info" type="submit">
                            <span className="material-icons" style={{ fontSize: 16 }}>save</span>
                            Simpan Workflow
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Preview Modal */}
            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="md" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <span className="material-icons mr-2 text-teal-600" style={{ fontSize: 20, verticalAlign: "middle" }}>visibility</span>
                        Preview Workflow
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {previewItem && (() => {
                        const steps = normalizeSteps(previewItem?.steps)
                        const isActive = [true, 1, "1", "aktif", "active"].includes(previewItem?.is_active) || previewItem?.status === "aktif"
                        return (
                            <div>
                                <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-0.5">{previewItem?.nama_workflow || "Workflow"}</h4>
                                            <div className="text-sm text-slate-500">{previewItem?.jenis_surat || "-"}</div>
                                            {previewItem?.deskripsi && <div className="text-xs text-slate-400 mt-1">{previewItem.deskripsi}</div>}
                                        </div>
                                        <EofficeStatusBadge value={isActive ? "aktif" : "inactive"} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Alur Approval</div>
                                    <div className="d-flex align-items-center flex-wrap" style={{ gap: 0 }}>
                                        {steps.map((step, stepIndex) => (
                                            <div key={stepIndex} className="d-flex align-items-center">
                                                <div
                                                    className="border rounded-xl px-4 py-3 text-center"
                                                    style={{ background: "#f8fafc", borderColor: "#118b9b", minWidth: 130 }}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2">
                                                        <span className="material-icons text-teal-600 text-lg">{getStepIcon(step?.nama_step, stepIndex)}</span>
                                                    </div>
                                                    <div className="font-bold text-sm text-slate-800">{step?.nama_step}</div>
                                                    <div className="text-xs text-slate-500">{step?.role_jabatan || "-"}</div>
                                                    <div className="text-xs text-teal-600 mt-1 font-semibold">Tahap {stepIndex + 1}</div>
                                                </div>
                                                {stepIndex < steps.length - 1 ? (
                                                    <div className="d-flex align-items-center px-2">
                                                        <span className="material-icons text-teal-400" style={{ fontSize: 24 }}>arrow_forward</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="d-flex gap-2 flex-wrap">
                                    <div className="text-xs text-slate-500">
                                        <span className="material-icons" style={{ fontSize: 13, verticalAlign: "middle" }}>layers</span>
                                        {" "}{steps.length} Tahapan
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        <span className="material-icons" style={{ fontSize: 13, verticalAlign: "middle" }}>schedule</span>
                                        {" "}Diperbarui: {previewItem?.updated_at ? formatDateApp(previewItem.updated_at, "DD MMM YYYY HH:mm") : "-"}
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-default-app btn-light" onClick={() => setShowPreview(false)}>Tutup</Button>
                    <Button className="btn-default-app btn-info" onClick={() => { setShowPreview(false); openForm(previewItem) }}>
                        <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
                        Edit Workflow
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default WorkflowSurat
