"use client"

import { useEffect, useMemo, useState } from "react"
import { Modal } from "react-bootstrap"
import HeaderApp from "components/HeaderApp"
import Button from "components/Button"
import { api_services } from "hooks/api_services"
import { formatDateApp } from "pages/Utils"
import EofficeStatusBadge from "components/EofficeStatusBadge"
import EditDelete from "components/EditDelete"
import Link from "components/Link"

const emptyForm = {
    judul: "",
    deskripsi: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    lokasi: "",
    waktu_mulai: "",
    waktu_selesai: "",
    pengingat: "15",
    status: "aktif",
}

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const getId = item => item?.id_agenda_kegiatan || item?.id || item?.value

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

const toDate = value => {
    if (!value) return null
    const dv = new Date(value)
    return Number.isNaN(dv.getTime()) ? null : dv
}

const formatDateShort = value => {
    if (!value) return "-"
    const dateValue = new Date(value)
    if (Number.isNaN(dateValue.getTime())) return "-"
    return dateValue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

const Agenda = () => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [activeTab, setActiveTab] = useState("calendar")
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)

    const service = useMemo(() => api_services({ api_path: "/agenda_kegiatan" }), [])

    const loadData = async () => {
        setIsLoading(true)
        const response = await service.getapi_services({ filter: { paginate: { page: 1, pagesize: 1000 } } })
        setIsLoading(false)

        if (response?.error || response?.code) {
            setList([])
            return
        }

        setList(normalizeList(response))
    }

    useEffect(() => { loadData() }, [])

    const openForm = item => {
        setSelectedId(getId(item))
        setForm({ ...emptyForm, ...item })
        setShowModal(true)
    }

    const saveData = async event => {
        event?.preventDefault()
        const startTime = form.waktu_mulai || "00:00"
        const endTime = form.waktu_selesai || ""
        const body = {
            judul: form.judul,
            deskripsi: form.deskripsi,
            lokasi: form.lokasi,
            tanggal_mulai: form.tanggal_mulai ? `${form.tanggal_mulai} ${startTime}:00` : "",
            tanggal_selesai: form.tanggal_mulai && endTime ? `${form.tanggal_mulai} ${endTime}:00` : null,
        }
        const response = selectedId
            ? await service.putapi_services({ id: selectedId, ...body })
            : await service.postapi_services(body)

        if (response?.success === false || response?.error || response?.code || !response?.data) return

        setShowModal(false)
        setSelectedId(null)
        setForm(emptyForm)
        loadData()
    }

    const deleteData = async item => {
        const id = getId(item)
        if (!id) return
        const response = await service.deleteapi_services({ id })
        if (response?.error || response?.code) return
        loadData()
    }

    // Calendar helpers
    const getCalendarDays = dateValue => {
        const year = dateValue.getFullYear()
        const month = dateValue.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const days = []
        for (let i = 0; i < firstDay.getDay(); i += 1) days.push(null)
        for (let day = 1; day <= lastDay.getDate(); day += 1) days.push(new Date(year, month, day))
        while (days.length % 7 !== 0) days.push(null)
        return days
    }

    const getDateKey = dateValue => {
        if (!dateValue) return ""
        const year = dateValue.getFullYear()
        const month = String(dateValue.getMonth() + 1).padStart(2, "0")
        const day = String(dateValue.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = getDateKey(today)

    const eventsByDate = list.reduce((result, item) => {
        const startDate = toDate(item?.tanggal_mulai)
        if (!startDate) return result
        const key = getDateKey(startDate)
        return { ...result, [key]: [...(result[key] || []), item] }
    }, {})

    const agendaHariIni = list.filter(item => {
        const d = toDate(item?.tanggal_mulai)
        if (!d) return false
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
    })

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const agendaMingguIni = list.filter(item => {
        const d = toDate(item?.tanggal_mulai)
        if (!d) return false
        d.setHours(0, 0, 0, 0)
        return d >= weekStart && d <= weekEnd
    })

    const selectedDateEvents = selectedDate ? eventsByDate[getDateKey(selectedDate)] || [] : []

    const prevMonth = () => {
        const m = new Date(currentMonth)
        m.setMonth(m.getMonth() - 1)
        setCurrentMonth(m)
    }

    const nextMonth = () => {
        const m = new Date(currentMonth)
        m.setMonth(m.getMonth() + 1)
        setCurrentMonth(m)
    }

    return (
        <>
            <HeaderApp
                title="Agenda"
                hideTitle
                is_loading={isLoading}
                data_btn={[]}
                filterTabs={
                    <div className="d-flex flex-wrap" style={{ gap: 8, marginTop: 16, marginBottom: 0, marginLeft: 16 }}>
                        <Button className={`btn-default-app ${activeTab === "calendar" ? "btn-info" : "btn-light"}`} onClick={() => setActiveTab("calendar")}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>calendar_month</span>
                            Kalender
                        </Button>
                        <Button className={`btn-default-app ${activeTab === "today" ? "btn-info" : "btn-light"}`} onClick={() => setActiveTab("today")}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>today</span>
                            Agenda Hari Ini {agendaHariIni.length > 0 && `(${agendaHariIni.length})`}
                        </Button>
                        <Button className={`btn-default-app ${activeTab === "week" ? "btn-info" : "btn-light"}`} onClick={() => setActiveTab("week")}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>date_range</span>
                            Agenda Minggu Ini {agendaMingguIni.length > 0 && `(${agendaMingguIni.length})`}
                        </Button>
                    </div>
                }
                btnCustom={
                    <div style={{ marginTop: 16, marginBottom: 0 }}><Button className="ml-2 btn-default-app btn-info" onClick={() => openForm({})}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>event</span>
                        Tambah Agenda
                    </Button></div>
                }
            />

            <div className="container pl-4 pr-4">
                {/* Calendar View */}
                {activeTab === "calendar" && (
                    <div className="row">
                        <div className="col-lg-8 mb-3">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="d-flex align-items-center justify-content-between px-4 py-3 border-b border-slate-100">
                                    <button className="btn btn-sm btn-light" onClick={prevMonth}>
                                        <span className="material-icons">chevron_left</span>
                                    </button>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-0">
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </h3>
                                    <button className="btn btn-sm btn-light" onClick={nextMonth}>
                                        <span className="material-icons">chevron_right</span>
                                    </button>
                                </div>
                                <div className="p-3">
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
                                        {dayNames.map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">{day}</div>
                                        ))}
                                        {getCalendarDays(currentMonth).map((dateValue, index) => {
                                            const key = getDateKey(dateValue)
                                            const hasEvent = Boolean(eventsByDate[key]?.length)
                                            const isToday = key === todayKey
                                            const isSelected = key === getDateKey(selectedDate)
                                            return (
                                                <div
                                                    key={key || `empty-${index}`}
                                                    onClick={() => dateValue && setSelectedDate(dateValue)}
                                                    className="d-flex align-items-center justify-content-center"
                                                    style={{
                                                        minHeight: 40,
                                                        borderRadius: 8,
                                                        cursor: dateValue ? "pointer" : "default",
                                                        background: isToday ? "#118b9b" : isSelected ? "#e7f7fa" : hasEvent ? "#f0fdf4" : "#f8fafc",
                                                        color: isToday ? "#fff" : hasEvent ? "#0f766e" : "#334155",
                                                        fontWeight: (hasEvent || isToday || isSelected) ? 700 : 500,
                                                        border: hasEvent && !isToday ? "1px solid #a7e3e8" : isSelected && !isToday ? "2px solid #118b9b" : "1px solid transparent",
                                                        fontSize: 13,
                                                        transition: "all 0.2s",
                                                    }}
                                                    title={hasEvent ? eventsByDate[key].map(e => e?.judul).join(", ") : ""}
                                                >
                                                    {dateValue ? dateValue.getDate() : ""}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selected Date Detail */}
                        <div className="col-lg-4 mb-3">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        {selectedDate
                                            ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                                            : `Hari Ini - ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`
                                        }
                                    </h3>
                                </div>
                                <div className="p-3">
                                    {(selectedDate ? selectedDateEvents : agendaHariIni.length > 0 ? agendaHariIni : []).length === 0 ? (
                                        <div className="text-center text-slate-400 py-6">
                                            <span className="material-icons text-4xl mb-2">event</span>
                                            <p className="text-sm">Tidak ada agenda</p>
                                        </div>
                                    ) : (
                                        (selectedDate ? selectedDateEvents : agendaHariIni).map(item => (
                                            <div key={getId(item)} className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-teal-50 transition-colors">
                                                <div className="d-flex align-items-start justify-content-between">
                                                    <div className="font-semibold text-sm text-slate-800">{item?.judul || "-"}</div>
                                                    <EofficeStatusBadge value={item?.status || "aktif"} />
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    <span className="material-icons" style={{ fontSize: 12, verticalAlign: "middle" }}>schedule</span>
                                                    {item?.waktu_mulai ? item.waktu_mulai : ""} {item?.waktu_selesai ? `- ${item.waktu_selesai}` : ""}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    <span className="material-icons" style={{ fontSize: 12, verticalAlign: "middle" }}>place</span>
                                                    {item?.lokasi || "-"}
                                                </div>
                                                <div className="d-flex justify-content-end mt-2" style={{ gap: 4 }}>
                                                    <Button className="btn-default-app btn-light btn-sm" onClick={() => openForm(item)}>
                                                        <span className="material-icons" style={{ fontSize: 14 }}>edit</span>
                                                    </Button>
                                                    <Button className="btn-default-app btn-danger btn-sm" onClick={() => deleteData(item)}>
                                                        <span className="material-icons" style={{ fontSize: 14 }}>delete</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agenda Hari Ini */}
                {activeTab === "today" && (
                    <div className="row">
                        {agendaHariIni.length === 0 ? (
                            <div className="col-12">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 text-center text-slate-400">
                                    <span className="material-icons text-5xl mb-3">event_available</span>
                                    <h3 className="text-lg font-semibold text-slate-600 mb-1">Tidak Ada Agenda Hari Ini</h3>
                                    <p className="text-sm">Silakan tambah agenda baru atau lihat agenda lain.</p>
                                </div>
                            </div>
                        ) : (
                            agendaHariIni.map((item, index) => (
                                <div className="col-lg-6 mb-3" key={getId(item) || index}>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 h-100">
                                        <div className="d-flex align-items-start justify-content-between mb-2">
                                            <div>
                                                <div className="text-xs font-semibold text-teal-600 mb-1">Hari Ini</div>
                                                <h5 className="font-bold text-slate-900">{item?.judul || "-"}</h5>
                                            </div>
                                            <EofficeStatusBadge value={item?.status || "aktif"} />
                                        </div>
                                        <div className="text-sm text-slate-500 mb-2">
                                            <span className="material-icons mr-1" style={{ fontSize: 15, verticalAlign: "middle" }}>schedule</span>
                                            {item?.waktu_mulai || formatDateApp(item?.tanggal_mulai, "HH:mm") || "-"}
                                            {item?.waktu_selesai ? ` - ${item.waktu_selesai}` : ""}
                                        </div>
                                        <div className="text-sm text-slate-500 mb-2">
                                            <span className="material-icons mr-1" style={{ fontSize: 15, verticalAlign: "middle" }}>place</span>
                                            {item?.lokasi || "Lokasi belum diisi"}
                                        </div>
                                        <div className="text-sm text-slate-600 mb-3" style={{ whiteSpace: "pre-wrap" }}>
                                            {item?.deskripsi || ""}
                                        </div>
                                        <div className="d-flex justify-content-end" style={{ gap: 6 }}>
                                            <Button className="btn-default-app btn-info btn-sm" onClick={() => openForm(item)}>Edit</Button>
                                            <Button className="btn-default-app btn-danger btn-sm" onClick={() => deleteData(item)}>Hapus</Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Agenda Minggu Ini */}
                {activeTab === "week" && (
                    <div>
                        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 mb-3 d-flex align-items-center justify-content-between">
                            <span className="text-sm font-semibold text-teal-800">
                                {weekStart.getDate()} - {weekEnd.getDate()} {monthNames[weekStart.getMonth()]} {weekStart.getFullYear()}
                            </span>
                            <span className="text-xs text-teal-600">{agendaMingguIni.length} agenda</span>
                        </div>
                        {agendaMingguIni.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 text-center text-slate-400">
                                <span className="material-icons text-5xl mb-3">event_busy</span>
                                <h3 className="text-lg font-semibold text-slate-600 mb-1">Tidak Ada Agenda Minggu Ini</h3>
                                <p className="text-sm">Silakan tambah agenda baru.</p>
                            </div>
                        ) : (
                            <div className="row">
                                {agendaMingguIni.map((item, index) => {
                                    const d = toDate(item?.tanggal_mulai)
                                    return (
                                        <div className="col-lg-6 mb-3" key={getId(item) || index}>
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 h-100">
                                                <div className="d-flex align-items-start justify-content-between mb-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="text-center rounded-lg bg-teal-50 border border-teal-200 px-2 py-1" style={{ minWidth: 44 }}>
                                                            <div className="text-xs font-bold text-teal-600">{d ? dayNames[d.getDay()] : "-"}</div>
                                                            <div className="text-sm font-bold text-teal-700">{d ? d.getDate() : "-"}</div>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-slate-900">{item?.judul || "-"}</h5>
                                                            <div className="text-xs text-slate-500">
                                                                {item?.waktu_mulai || "-"} {item?.waktu_selesai ? `- ${item.waktu_selesai}` : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <EofficeStatusBadge value={item?.status || "aktif"} />
                                                </div>
                                                <div className="text-sm text-slate-500 mb-2">
                                                    <span className="material-icons mr-1" style={{ fontSize: 15, verticalAlign: "middle" }}>place</span>
                                                    {item?.lokasi || "-"}
                                                </div>
                                                <div className="d-flex justify-content-end" style={{ gap: 6 }}>
                                                    <Button className="btn-default-app btn-info btn-sm" onClick={() => openForm(item)}>Edit</Button>
                                                    <Button className="btn-default-app btn-danger btn-sm" onClick={() => deleteData(item)}>Hapus</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedId ? "Edit Agenda" : "Tambah Agenda"}</Modal.Title>
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-8">
                                <label className="font-semibold">Judul Agenda <span className="text-danger">*</span></label>
                                <input className="form-control" value={form.judul || ""} onChange={e => setForm({ ...form, judul: e.target.value })} required />
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Lokasi</label>
                                <input className="form-control" value={form.lokasi || ""} onChange={e => setForm({ ...form, lokasi: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Tanggal Mulai <span className="text-danger">*</span></label>
                                <input className="form-control" type="date" value={form.tanggal_mulai || ""} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} required />
                            </div>
                            <div className="col-md-3">
                                <label className="font-semibold">Waktu Mulai</label>
                                <input className="form-control" type="time" value={form.waktu_mulai || ""} onChange={e => setForm({ ...form, waktu_mulai: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <label className="font-semibold">Waktu Selesai</label>
                                <input className="form-control" type="time" value={form.waktu_selesai || ""} onChange={e => setForm({ ...form, waktu_selesai: e.target.value })} />
                            </div>
                            <div className="col-md-2">
                                <label className="font-semibold">Pengingat</label>
                                <select className="form-control" value={form.pengingat || "15"} onChange={e => setForm({ ...form, pengingat: e.target.value })}>
                                    <option value="0">Nonaktif</option>
                                    <option value="15">15 menit</option>
                                    <option value="30">30 menit</option>
                                    <option value="60">1 jam</option>
                                    <option value="1440">1 hari</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="font-semibold">Deskripsi</label>
                                <textarea className="form-control" rows={4} value={form.deskripsi || ""} onChange={e => setForm({ ...form, deskripsi: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="font-semibold">Status</label>
                                <select className="form-control" value={form.status || "aktif"} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="aktif">Aktif</option>
                                    <option value="selesai">Selesai</option>
                                    <option value="batal">Batal</option>
                                </select>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-default-app btn-light" type="button" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button className="btn-default-app btn-info" type="submit">Simpan Agenda</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    )
}

export default Agenda
