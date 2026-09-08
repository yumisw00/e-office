import { useEffect, useMemo, useState } from "react"
import { Modal } from "react-bootstrap"
import Button from "components/Button"
import EditDelete from "components/EditDelete"
import EofficeStatusBadge from "components/EofficeStatusBadge"
import { EofficeTableWithFilter, EofficeTableCell } from "components/EofficeModuleUI"
import { api_services } from "hooks/api_services"
import { showToastr } from "pages/Utils"

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const getUnitName = item => item?.nama_unit || item?.nama || item?.unit || "-"
const getJabatanName = item => item?.nama_jabatan || item?.nama || item?.jabatan || "-"
const getPegawaiName = item => item?.nama_pegawai || item?.nama || item?.name || "-"
const getUnitId = item => item?.id_unit || item?.id || item?.value
const getJabatanId = item => item?.id_jabatan || item?.id || item?.value
const getPegawaiId = item => item?.id_pegawai || item?.id || item?.value
const getRelasiId = item => item?.id_relasi || item?.id || item?.value

const emptyUnit = { kode_unit: "", nama_unit: "", id_parent: "", status: "aktif" }
const emptyJabatan = { kode_jabatan: "", nama_jabatan: "", id_unit: "", level_jabatan: "", status: "aktif" }
const emptyPegawai = { nip: "", nama_pegawai: "", id_unit: "", id_jabatan: "", email: "", telepon: "", status: "aktif" }
const emptyRelasi = { id_pegawai: "", id_atasan: "", relasi: "atasan", status: "aktif" }

const statusFilterOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' },
]

const TABLE_TEAL = "#138a98"

// Tab definitions with user-friendly descriptions
const TABS = [
    { key: "unit", label: "Unit Kerja", icon: "corporate_fare", description: "Struktur organisasi tingkat atas seperti Direktorat, Divisi Utama", color: TABLE_TEAL },
    { key: "divisi", label: "Divisi", icon: "business", description: "Divisi di bawah Unit Kerja", color: TABLE_TEAL },
    { key: "departemen", label: "Departemen", icon: "account_balance", description: "Departemen di bawah Divisi", color: TABLE_TEAL },
    { key: "jabatan", label: "Jabatan", icon: "badge", description: "Daftar jabatan dalam organisasi", color: TABLE_TEAL },
    { key: "pegawai", label: "Pegawai", icon: "people", description: "Data tenaga kerja organisasi", color: TABLE_TEAL },
    { key: "relasi", label: "Relasi Atasan", icon: "account_tree", description: "Pengaturan hubungan atasan-bawahan", color: TABLE_TEAL },
]

// Order guidance for users
const TAB_ORDER_GUIDANCE = {
    unit: { step: 1, text: "Tambahkan Unit Kerja terlebih dahulu (contoh: Direktorat Utama)" },
    divisi: { step: 2, text: "Tambahkan Divisi di bawah Unit Kerja" },
    departemen: { step: 3, text: "Tambahkan Departemen di bawah Divisi" },
    jabatan: { step: 4, text: "Tambahkan Jabatan (contoh: Kepala Bagian, Staff)" },
    pegawai: { step: 5, text: "Tambahkan data Pegawai dan kaitkan dengan Jabatan" },
    relasi: { step: 6, text: "Hubungkan Pegawai dengan Atasan/Bawahannya" },
}

const MasterOrganisasi = () => {
    const [units, setUnits] = useState([])
    const [divisis, setDivisis] = useState([])
    const [departemens, setDepartemens] = useState([])
    const [jabatans, setJabatans] = useState([])
    const [pegawais, setPegawais] = useState([])
    const [rels, setRels] = useState([])
    const [activeTab, setActiveTab] = useState("unit")
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [unitForm, setUnitForm] = useState(emptyUnit)
    const [jabatanForm, setJabatanForm] = useState(emptyJabatan)
    const [pegawaiForm, setPegawaiForm] = useState(emptyPegawai)
    const [relasiForm, setRelasiForm] = useState(emptyRelasi)
    const [globalSearch, setGlobalSearch] = useState("")
    const [showGuide, setShowGuide] = useState(false)

    // Services
    const unitService = useMemo(() => api_services({ api_path: "/mt_sdm_unit" }), [])
    const divisiService = useMemo(() => api_services({ api_path: "/mt_sdm_divisi" }), [])
    const departemenService = useMemo(() => api_services({ api_path: "/mt_sdm_departemen" }), [])
    const jabatanService = useMemo(() => api_services({ api_path: "/mt_sdm_jabatan" }), [])
    const pegawaiService = useMemo(() => api_services({ api_path: "/mt_sdm_pegawai" }), [])
    const relasiService = useMemo(() => api_services({ api_path: "/mt_sdm_relasi" }), [])

    // Service mappings
    const getCurrentService = () => {
        const map = { unit: unitService, divisi: divisiService, departemen: departemenService, jabatan: jabatanService, pegawai: pegawaiService, relasi: relasiService }
        return map[activeTab]
    }

    const getCurrentForm = () => {
        const map = { unit: unitForm, divisi: unitForm, departemen: unitForm, jabatan: jabatanForm, pegawai: pegawaiForm, relasi: relasiForm }
        return map[activeTab]
    }

    const setCurrentFormFn = () => {
        const map = { unit: setUnitForm, divisi: setUnitForm, departemen: setUnitForm, jabatan: setJabatanForm, pegawai: setPegawaiForm, relasi: setRelasiForm }
        return map[activeTab]
    }

    const getEmptyForm = () => {
        const map = { unit: emptyUnit, divisi: emptyUnit, departemen: emptyUnit, jabatan: emptyJabatan, pegawai: emptyPegawai, relasi: emptyRelasi }
        return map[activeTab]
    }

    const getIdByTab = item => {
        const map = { unit: getUnitId, divisi: getUnitId, departemen: getUnitId, jabatan: getJabatanId, pegawai: getPegawaiId, relasi: getRelasiId }
        return map[activeTab](item)
    }

    const getListByTab = () => {
        const map = { unit: units, divisi: divisis, departemen: departemens, jabatan: jabatans, pegawai: pegawais, relasi: rels }
        return map[activeTab]
    }

    // Load only the active tab and its immediate form dependencies. Previously
    // this requested all six master datasets (up to 6,000 rows) on every visit.
    const loadData = async (tab = activeTab) => {
        const request = { filter: { paginate: { page: 1, pagesize: 1000 } } }
        const loaders = {
            unit: () => unitService.getapi_services(request),
            divisi: () => divisiService.getapi_services(request),
            departemen: () => departemenService.getapi_services(request),
            jabatan: () => jabatanService.getapi_services(request),
            pegawai: () => pegawaiService.getapi_services(request),
            relasi: () => relasiService.getapi_services(request),
        }
        const setters = {
            unit: setUnits,
            divisi: setDivisis,
            departemen: setDepartemens,
            jabatan: setJabatans,
            pegawai: setPegawais,
            relasi: setRels,
        }
        const dependencies = {
            unit: [],
            divisi: ['unit'],
            departemen: ['divisi'],
            jabatan: ['unit'],
            pegawai: ['unit', 'jabatan'],
            relasi: ['pegawai'],
        }
        const tabsToLoad = [...new Set([tab, ...(dependencies[tab] || [])])]

        setIsLoading(true)
        try {
            const responses = await Promise.all(tabsToLoad.map(key => loaders[key]()))
            responses.forEach((response, index) => {
                if (!response?.error && !response?.code) {
                    setters[tabsToLoad[index]](normalizeList(response))
                }
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { loadData(activeTab) }, [activeTab])

    // Open form modal
    const openForm = item => {
        setSelectedId(getIdByTab(item))
        if (activeTab === "unit" || activeTab === "divisi" || activeTab === "departemen") {
            setUnitForm({
                ...emptyUnit,
                ...item,
                kode_unit: item?.kode_unit || item?.id_unit || "",
                nama_unit: item?.nama_unit || item?.nama || "",
            })
        } else if (activeTab === "jabatan") {
            setJabatanForm({ ...emptyJabatan, ...item, nama_jabatan: item?.nama_jabatan || item?.nama || "" })
        } else if (activeTab === "pegawai") {
            setPegawaiForm({ ...emptyPegawai, ...item, nama_pegawai: item?.nama_pegawai || item?.nama || "" })
        } else {
            setRelasiForm({ ...emptyRelasi, ...item })
        }
        setShowModal(true)
    }

    // New data handler
    const openNewForm = () => {
        setSelectedId(null)
        if (activeTab === "unit" || activeTab === "divisi" || activeTab === "departemen") {
            setUnitForm(emptyUnit)
        } else if (activeTab === "jabatan") {
            setJabatanForm(emptyJabatan)
        } else if (activeTab === "pegawai") {
            setPegawaiForm(emptyPegawai)
        } else {
            setRelasiForm(emptyRelasi)
        }
        setShowModal(true)
    }

    // Save data
    const saveData = async event => {
        event?.preventDefault()
        const service = getCurrentService()
        const body = getCurrentForm()

        if (activeTab === "unit" && (!body.kode_unit?.trim() || !body.nama_unit?.trim())) {
            showToastr("error", "Kode dan nama Unit Kerja wajib diisi")
            return
        }

        const id = selectedId
        const response = id
            ? await service.putapi_services({ id, ...body })
            : await service.postapi_services(body)
        if (response?.error || response?.code || response?.success === false) {
            showToastr("error", response?.message || "Gagal menyimpan data")
            return
        }
        setShowModal(false)
        setSelectedId(null)
        loadData()
    }

    // Delete data directly without a confirmation modal.
    const deleteData = async item => {
        if (!item) return
        const service = getCurrentService()
        const id = getIdByTab(item)
        if (!id) return
        const response = await service.deleteapi_services({ id })
        if (response?.error || response?.code) {
            showToastr("error", response?.message || "Gagal menghapus data")
        } else {
            loadData()
        }
    }

    // Table headers
    const unitHeaders = [
        { name: 'kode_unit', label: 'Kode Unit', width: 100, align: 'center', filterType: 'text', filterPlaceholder: 'Cari kode...' },
        { name: 'nama_unit', label: 'Nama Unit', width: 220, align: 'center', filterType: 'text', filterPlaceholder: 'Cari nama unit...' },
        { name: 'id_parent', label: 'Induk Unit (Parent)', width: 180, align: 'center', filterType: 'text', filterPlaceholder: 'Cari parent...' },
        { name: 'status', label: 'Status', width: 100, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: statusFilterOptions },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]
    const divisiHeaders = [
        { name: 'kode_unit', label: 'Kode Divisi', width: 100, align: 'left', filterType: 'text', filterPlaceholder: 'Cari kode...' },
        { name: 'nama_unit', label: 'Nama Divisi', width: 200, align: 'left', filterType: 'text', filterPlaceholder: 'Cari nama divisi...' },
        { name: 'unit', label: 'Unit Kerja Induk', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari unit...' },
        { name: 'status', label: 'Status', width: 100, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: statusFilterOptions },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]
    const departemenHeaders = [
        { name: 'kode_unit', label: 'Kode Dept', width: 100, align: 'left', filterType: 'text', filterPlaceholder: 'Cari kode...' },
        { name: 'nama_unit', label: 'Nama Departemen', width: 200, align: 'left', filterType: 'text', filterPlaceholder: 'Cari nama...' },
        { name: 'divisi', label: 'Divisi Induk', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari divisi...' },
        { name: 'status', label: 'Status', width: 100, align: 'left', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: statusFilterOptions },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'left', filterType: 'none' },
    ]
    const jabatanHeaders = [
        { name: 'kode_jabatan', label: 'Kode Jabatan', width: 110, align: 'center', filterType: 'text', filterPlaceholder: 'Cari kode...' },
        { name: 'nama_jabatan', label: 'Nama Jabatan', width: 200, align: 'left', filterType: 'text', filterPlaceholder: 'Cari nama jabatan...' },
        { name: 'unit', label: 'Unit Kerja', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari unit...' },
        { name: 'level_jabatan', label: 'Level', width: 100, align: 'center', filterType: 'text', filterPlaceholder: 'Cari level...' },
        { name: 'status', label: 'Status', width: 100, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: statusFilterOptions },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]
    const pegawaiHeaders = [
        { name: 'nip', label: 'NIP', width: 120, align: 'center', filterType: 'text', filterPlaceholder: 'Cari NIP...' },
        { name: 'nama_pegawai', label: 'Nama Pegawai', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari nama...' },
        { name: 'jabatan', label: 'Jabatan', width: 150, align: 'left', filterType: 'text', filterPlaceholder: 'Cari jabatan...' },
        { name: 'unit', label: 'Unit Kerja', width: 150, align: 'left', filterType: 'text', filterPlaceholder: 'Cari unit...' },
        { name: 'email', label: 'Email', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari email...' },
        { name: 'status', label: 'Status', width: 100, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: statusFilterOptions },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]
    const relasiHeaders = [
        { name: 'pegawai', label: 'Pegawai', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari nama...' },
        { name: 'atasan', label: 'Atasan', width: 180, align: 'left', filterType: 'text', filterPlaceholder: 'Cari nama atasan...' },
        { name: 'relasi', label: 'Jenis Relasi', width: 120, align: 'center', filterType: 'text', filterPlaceholder: 'Cari relasi...' },
        { name: 'status', label: 'Status', width: 100, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: statusFilterOptions },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]

    const getTableHeaders = () => {
        const map = {
            unit: unitHeaders, divisi: divisiHeaders, departemen: departemenHeaders,
            jabatan: jabatanHeaders, pegawai: pegawaiHeaders, relasi: relasiHeaders,
        }
        return [
            { name: 'no', label: 'No', width: 50, align: 'center', filterType: 'none' },
            ...(map[activeTab] || unitHeaders),
        ]
    }

    const getTableColgroup = () => {
        return getTableHeaders().map(h => h.width)
    }

    // Get parent name for display
    const getParentName = item => {
        if (!item?.id_parent) return "-"
        const parent = units.find(u => String(getUnitId(u)) === String(item.id_parent))
        return parent ? getUnitName(parent) : item.id_parent
    }

    // Get divisi name for departemen
    const getDivisiName = item => {
        if (!item?.id_divisi && !item?.id_unit) return "-"
        const div = divisis.find(dv => String(getUnitId(dv)) === String(item.id_divisi || item.id_unit))
        return div ? getUnitName(div) : "-"
    }

    // Filtered list with global search
    const getFilteredList = () => {
        const list = getListByTab()
        const search = globalSearch.toLowerCase().trim()

        return list.filter(item => {
            if (search) {
                const unit = units.find(u => String(getUnitId(u)) === String(item?.id_unit))
                const divisi = divisis.find(dv => String(getUnitId(dv)) === String(item?.id_divisi || item?.id_unit))
                const jabatan = jabatans.find(jb => String(getJabatanId(jb)) === String(item?.id_jabatan))
                const pegawai = pegawais.find(pg => String(getPegawaiId(pg)) === String(item?.id_pegawai))
                const atasan = pegawais.find(pg => String(getPegawaiId(pg)) === String(item?.id_atasan))

                const searchable = [
                    item?.kode_unit, item?.id_unit, item?.nama_unit, item?.nama,
                    item?.kode_jabatan, item?.nama_jabatan, item?.level_jabatan,
                    item?.nip, item?.nama_pegawai, item?.email, item?.telepon,
                    item?.relasi, item?.status,
                    unit ? getUnitName(unit) : "",
                    divisi ? getUnitName(divisi) : "",
                    jabatan ? getJabatanName(jabatan) : "",
                    pegawai ? getPegawaiName(pegawai) : "",
                    atasan ? getPegawaiName(atasan) : "",
                    getParentName(item),
                ].map(v => (v || "").toString().toLowerCase()).join(" ")

                if (!searchable.includes(search)) return false
            }
            return true
        })
    }

    const [inlineFilterValues, setInlineFilterValues] = useState({})

    const handleInlineFilterChange = (colName, value) => {
        setInlineFilterValues(prev => ({ ...prev, [colName]: value }))
    }

    // Get cell value
    const getCellValue = (item, name) => {
        const unit = units.find(u => String(getUnitId(u)) === String(item?.id_unit))
        const divisi = divisis.find(dv => String(getUnitId(dv)) === String(item?.id_divisi || item?.id_unit))
        const jabatan = jabatans.find(jb => String(getJabatanId(jb)) === String(item?.id_jabatan))
        const pegawai = pegawais.find(pg => String(getPegawaiId(pg)) === String(item?.id_pegawai))
        const atasan = pegawais.find(pg => String(getPegawaiId(pg)) === String(item?.id_atasan))

        const map = {
            kode_unit: item?.kode_unit || item?.id_unit || '-',
            nama_unit: item?.nama || item?.nama_unit || '-',
            id_parent: getParentName(item),
            unit: unit ? getUnitName(unit) : '-',
            divisi: divisi ? getUnitName(divisi) : getDivisiName(item),
            kode_jabatan: item?.kode_jabatan || '-',
            nama_jabatan: item?.nama_jabatan || '-',
            level_jabatan: item?.level_jabatan || '-',
            nip: item?.nip || '-',
            nama_pegawai: item?.nama_pegawai || '-',
            jabatan: jabatan ? getJabatanName(jabatan) : '-',
            email: item?.email || '-',
            telepon: item?.telepon || '-',
            pegawai: pegawai ? getPegawaiName(pegawai) : '-',
            atasan: atasan ? getPegawaiName(atasan) : '-',
            relasi: item?.relasi === 'atasan' ? 'Atasan' : item?.relasi === 'bawahan' ? 'Bawahan' : item?.relasi === 'koordinator' ? 'Koordinator' : item?.relasi || 'atasan',
        }
        return map[name] || '-'
    }

    const currentTab = TABS.find(t => t.key === activeTab)
    const currentForm = getCurrentForm()
    const setCurrentForm = setCurrentFormFn()
    const counts = { unit: units.length, divisi: divisis.length, departemen: departemens.length, jabatan: jabatans.length, pegawai: pegawais.length, relasi: rels.length }

    return (
        <>
            <div className="container pl-4 pr-4 pb-4">
                {/* User Guide Panel */}
                {showGuide && (
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 p-4 mb-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h4 className="mb-0 d-flex align-items-center gap-2 text-teal-800 font-semibold">
                                <span className="material-icons text-teal-600">lightbulb</span>
                                Panduan Penggunaan Master Organisasi
                            </h4>
                            <button
                                className="btn btn-sm btn-light d-flex align-items-center gap-1"
                                onClick={() => setShowGuide(false)}
                            >
                                <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                                Tutup
                            </button>
                        </div>

                        <div className="row">
                            <div className="col-md-8">
                                <p className="text-sm text-teal-700 mb-3">
                                    <strong>Urutan pengisian data organisasi yang benar:</strong>
                                </p>
                                <div className="d-flex flex-column gap-2">
                                    {TABS.map(tab => {
                                        const guidance = TAB_ORDER_GUIDANCE[tab.key]
                                        const isActive = activeTab === tab.key
                                        return (
                                            <div
                                                key={tab.key}
                                                className={`d-flex align-items-center gap-3 p-2 rounded-lg ${isActive ? "bg-white shadow-sm border border-teal-300" : "bg-white/60"}`}
                                            >
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center font-bold text-white flex-shrink-0"
                                                    style={{ width: 28, height: 28, background: tab.color, fontSize: 12 }}
                                                >
                                                    {guidance.step}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-800">{tab.label}</div>
                                                    <div className="text-xs text-slate-500">{guidance.text}</div>
                                                </div>
                                                {counts[tab.key] > 0 && (
                                                    <span className="badge bg-success ml-auto text-xs">{counts[tab.key]} data</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="bg-white rounded-lg p-3 border border-teal-200">
                                    <h6 className="font-semibold text-sm text-teal-800 mb-2 d-flex align-items-center gap-1">
                                        <span className="material-icons" style={{ fontSize: 16 }}>tips_and_updates</span>
                                        Tips
                                    </h6>
                                    <ul className="text-xs text-slate-600 ps-3 mb-0 d-flex flex-column gap-1">
                                        <li>Isi data <strong>berurutan</strong> dari atas ke bawah</li>
                                        <li>Setiap Unit bisa memiliki beberapa Divisi</li>
                                        <li>Setiap Divisi bisa memiliki beberapa Departemen</li>
                                        <li>Jabatan harus dikaitkan dengan Unit Kerja</li>
                                        <li>Pegawai harus memiliki Jabatan</li>
                                        <li>Relasi atasan perlu diatur setelah ada Pegawai</li>
                                        <li>Gunakan <strong>Tombol Hapus</strong> untuk menonaktifkan data</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="d-flex justify-content-end mb-3">
                    <Button className="btn-default-app btn-info" onClick={openNewForm}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>add</span>
                        Tambah {currentTab?.label}
                    </Button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                    {getFilteredList().length === 0 && !isLoading ? (
                        <div className="text-center py-12">
                            <span className="material-icons text-5xl text-slate-300 mb-3">{currentTab?.icon}</span>
                            <h5 className="text-slate-500 font-medium mb-1">
                                {globalSearch ? "Tidak ada hasil pencarian" : `Belum ada data ${currentTab?.label}`}
                            </h5>
                            <p className="text-sm text-slate-400 mb-3">
                                {globalSearch
                                    ? `Tidak ditemukan "${globalSearch}"`
                                    : `Klik tombol "Tambah ${currentTab?.label}" untuk mulai menambahkan data`
                                }
                            </p>
                        </div>
                    ) : (
                        <EofficeTableWithFilter
                            className="master-organisasi-table"
                            headers={getTableHeaders()}
                            colgroup={getTableColgroup()}
                            filterValues={inlineFilterValues}
                            onFilterChange={handleInlineFilterChange}
                            align="start"
                            minWidth={900}
                        >
                            {getFilteredList().map((item, index) => (
                                <tr key={getIdByTab(item) || index} className="align-top">
                                    <EofficeTableCell width={50} align="center">
                                        <span className="text-xs text-slate-400">{index + 1}</span>
                                    </EofficeTableCell>
                                    {getTableHeaders().slice(1).map(header => {
                                        if (header.name === 'status') {
                                            return (
                                                <EofficeTableCell key={header.name} width={header.width} align={header.align}>
                                                    <EofficeStatusBadge value={item?.status || "aktif"} />
                                                </EofficeTableCell>
                                            )
                                        }
                                        if (header.name === 'aksi') {
                                            return (
                                                <EofficeTableCell key={header.name} width={header.width} align={header.align}>
                                                    <div className="d-flex align-items-center justify-content-center td-action">
                                                        <EditDelete
                                                            data={[
                                                                { label: "Edit", icon: "edit" },
                                                                { label: "Hapus", icon: "delete" }
                                                            ]}
                                                            onEdit={() => openForm(item)}
                                                            onDelete={() => deleteData(item)}
                                                        />
                                                    </div>
                                                </EofficeTableCell>
                                            )
                                        }
                                        const isDivisiTextColumn = activeTab === 'divisi'
                                            && ['kode_unit', 'nama_unit'].includes(header.name)
                                        const isDeptTextColumn = activeTab === 'departement'
                                            && ['kode_unit', 'nama_unit', 'divisi', 'status'].includes(header.name)
                                        const isUnitTextColumn = activeTab === 'unit'
                                            && ['kode_unit', 'nama_unit', 'id_parent', 'status'].includes(header.name)
                                        const isTextColumn = isDivisiTextColumn || isDeptTextColumn || isUnitTextColumn

                                        return (
                                            <EofficeTableCell
                                                key={header.name}
                                                width={header.width}
                                                align={isTextColumn ? 'left' : header.align}
                                                wrap
                                                style={isTextColumn ? { paddingLeft: 0, paddingRight: 8, paddingTop: 6, paddingBottom: 6 } : {}}
                                            >
                                                {getCellValue(item, header.name)}
                                            </EofficeTableCell>
                                        )
                                    })}
                                </tr>
                            ))}
                        </EofficeTableWithFilter>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                show={showModal}
                onHide={() => {}}
                centered
                size="lg"
                className="master-organisasi-modal"
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header
                    closeButton={false}
                    className="d-flex justify-content-between align-items-center border-0 px-4 py-3"
                    style={{ background: currentTab?.color || '#138a98', color: "#fff" }}
                >
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <span className="material-icons">{selectedId ? "edit" : "add_circle"}</span>
                        {selectedId ? "Edit" : "Tambah"} {currentTab?.label}
                    </Modal.Title>
                    <button
                        type="button"
                        className="d-flex align-items-center justify-content-center border-0 rounded-2"
                        aria-label="Tutup"
                        onClick={() => setShowModal(false)}
                        style={{ width: 32, height: 32, background: '#fca5a5', color: '#991b1b' }}
                    >
                        <span className="material-icons" style={{ fontSize: 22 }}>close</span>
                    </button>
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body className="px-4 py-3">
                        {/* Unit / Divisi / Departemen Form */}
                        {(activeTab === "unit" || activeTab === "divisi" || activeTab === "departemen") && (
                            <>
                                <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2" style={{ fontSize: 12, borderRadius: 8 }}>
                                    <span className="material-icons text-info mt-0" style={{ fontSize: 16 }}>info</span>
                                    <span>
                                        {activeTab === "unit" && "Kelola data Unit Kerja sesuai struktur induk yang ditampilkan pada tabel."}
                                        {activeTab === "divisi" && "Divisi adalah bagian di bawah Unit Kerja. Pilih Unit Kerja induk terlebih dahulu."}
                                        {activeTab === "departemen" && "Departemen adalah unit terkecil dalam struktur organisasi."}
                                    </span>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Kode {activeTab === "unit" ? "Unit" : activeTab === "divisi" ? "Divisi" : "Departemen"}
                                                <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={unitForm.kode_unit || ""}
                                                onChange={e => setUnitForm({ ...unitForm, kode_unit: e.target.value })}
                                                placeholder={activeTab === "unit" ? "Contoh: UNT-001" : activeTab === "divisi" ? "Contoh: DIV-001" : "Contoh: DEPT-001"}
                                                required
                                            />
                                            <small className="text-muted">Kode unik untuk mengidentifikasi data ini</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Nama {activeTab === "unit" ? "Unit" : activeTab === "divisi" ? "Divisi" : "Departemen"}
                                                <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={unitForm.nama_unit || ""}
                                                onChange={e => setUnitForm({ ...unitForm, nama_unit: e.target.value, nama: e.target.value })}
                                                placeholder={activeTab === "unit" ? "Contoh: Direktorat Utama" : activeTab === "divisi" ? "Contoh: Divisi Keuangan" : "Contoh: Departemen Akuntansi"}
                                                required
                                            />
                                            <small className="text-muted">Nama lengkap {activeTab === "unit" ? "Unit Kerja" : activeTab === "divisi" ? "Divisi" : "Departemen"}</small>
                                        </div>
                                    </div>
                                </div>

                                {activeTab === "unit" && (
                                    <div className="form-group">
                                        <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                            Induk Unit (Parent)
                                            <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Opsional</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={unitForm.id_parent || ""}
                                            onChange={e => setUnitForm({ ...unitForm, id_parent: e.target.value })}
                                        >
                                            <option value="">-- Tidak Ada / Unit Utama --</option>
                                            {units.filter(u => String(getUnitId(u)) !== String(selectedId)).map(u => (
                                                <option key={getUnitId(u)} value={getUnitId(u)}>{getUnitName(u)}</option>
                                            ))}
                                        </select>
                                        <small className="text-muted">Nilai ini ditampilkan pada kolom Induk Unit (Parent) di tabel.</small>
                                    </div>
                                )}

                                {activeTab === "divisi" && (
                                    <div className="form-group">
                                        <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                            Unit Kerja Induk
                                            <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Opsional</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={unitForm.id_parent || ""}
                                            onChange={e => setUnitForm({ ...unitForm, id_parent: e.target.value })}
                                        >
                                            <option value="">-- Pilih Unit Kerja --</option>
                                            {units.map(u => (
                                                <option key={getUnitId(u)} value={getUnitId(u)}>{getUnitName(u)}</option>
                                            ))}
                                        </select>
                                        <small className="text-muted">Pilih Unit Kerja tempat divisi ini berada</small>
                                    </div>
                                )}

                                {activeTab === "departemen" && (
                                    <div className="form-group">
                                        <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                            Divisi Induk
                                            <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Opsional</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={unitForm.id_parent || ""}
                                            onChange={e => setUnitForm({ ...unitForm, id_parent: e.target.value })}
                                        >
                                            <option value="">-- Pilih Divisi --</option>
                                            {divisis.map(dv => (
                                                <option key={getUnitId(dv)} value={getUnitId(dv)}>{getUnitName(dv)}</option>
                                            ))}
                                        </select>
                                        <small className="text-muted">Pilih Divisi tempat departemen ini berada</small>
                                    </div>
                                )}

                                <div className="form-group mb-0">
                                    <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                        Status
                                    </label>
                                    <select
                                        className="form-control"
                                        value={unitForm.status || "aktif"}
                                        onChange={e => setUnitForm({ ...unitForm, status: e.target.value })}
                                    >
                                        <option value="aktif">Aktif - Data ini masih digunakan</option>
                                        <option value="inactive">Tidak Aktif - Data tidak lagi digunakan</option>
                                    </select>
                                    <small className="text-muted">Pilih "Tidak Aktif" untuk menonaktifkan tanpa menghapus data</small>
                                </div>
                            </>
                        )}

                        {/* Jabatan Form */}
                        {activeTab === "jabatan" && (
                            <>
                                <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2" style={{ fontSize: 12, borderRadius: 8 }}>
                                    <span className="material-icons text-info mt-0" style={{ fontSize: 16 }}>info</span>
                                    <span>Jabatan adalah posisi dalam organisasi, contoh: Kepala Bagian, Staff, Manager, Supervisor. Jabatan harus dikaitkan dengan Unit Kerja.</span>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Kode Jabatan <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={jabatanForm.kode_jabatan || ""}
                                                onChange={e => setJabatanForm({ ...jabatanForm, kode_jabatan: e.target.value })}
                                                placeholder="Contoh: JAB-001"
                                                required
                                            />
                                            <small className="text-muted">Kode unik untuk jabatan ini</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Nama Jabatan <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={jabatanForm.nama_jabatan || ""}
                                                onChange={e => setJabatanForm({ ...jabatanForm, nama_jabatan: e.target.value, nama: e.target.value })}
                                                placeholder="Contoh: Kepala Bagian Keuangan"
                                                required
                                            />
                                            <small className="text-muted">Nama lengkap jabatan</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                                Unit Kerja <span className="text-danger ms-1">*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                value={jabatanForm.id_unit || ""}
                                                onChange={e => setJabatanForm({ ...jabatanForm, id_unit: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Pilih Unit Kerja --</option>
                                                {units.map(u => <option key={getUnitId(u)} value={getUnitId(u)}>{getUnitName(u)}</option>)}
                                            </select>
                                            <small className="text-muted">Pilih Unit Kerja tempat jabatan ini berada</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                                Level Jabatan
                                                <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Opsional</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                value={jabatanForm.level_jabatan || ""}
                                                onChange={e => setJabatanForm({ ...jabatanForm, level_jabatan: e.target.value })}
                                            >
                                                <option value="">-- Pilih Level --</option>
                                                <option value="1">Level 1 - Direktur / Tinggi</option>
                                                <option value="2">Level 2 - Kepala Divisi / Menengah Atas</option>
                                                <option value="3">Level 3 - Kepala Bagian / Menengah</option>
                                                <option value="4">Level 4 - Supervisor / Pelaksana</option>
                                                <option value="5">Level 5 - Staff / Operasional</option>
                                                <option value="6">Level 6 - Magang / Pelatihan</option>
                                            </select>
                                            <small className="text-muted">Tingkat hierarki jabatan (1=tertinggi)</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group mb-0">
                                    <label className="font-weight-600 text-sm">Status</label>
                                    <select
                                        className="form-control"
                                        value={jabatanForm.status || "aktif"}
                                        onChange={e => setJabatanForm({ ...jabatanForm, status: e.target.value })}
                                    >
                                        <option value="aktif">Aktif - Jabatan masih ada</option>
                                        <option value="inactive">Tidak Aktif - Jabatan sudah tidak ada</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Pegawai Form */}
                        {activeTab === "pegawai" && (
                            <>
                                <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2" style={{ fontSize: 12, borderRadius: 8 }}>
                                    <span className="material-icons text-info mt-0" style={{ fontSize: 16 }}>info</span>
                                    <span>Tambahkan data pegawai dan kaitkan dengan Jabatan dan Unit Kerja. NIP adalah Nomor Induk Pegawai yang unik.</span>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                NIP (Nomor Induk Pegawai) <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={pegawaiForm.nip || ""}
                                                onChange={e => setPegawaiForm({ ...pegawaiForm, nip: e.target.value })}
                                                placeholder="Contoh: 199001012020001"
                                                required
                                            />
                                            <small className="text-muted">Nomor induk pegawai yang tertera di KTP/Kartu Pegawai</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Nama Lengkap <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={pegawaiForm.nama_pegawai || ""}
                                                onChange={e => setPegawaiForm({ ...pegawaiForm, nama_pegawai: e.target.value, nama: e.target.value })}
                                                placeholder="Contoh: Budi Santoso"
                                                required
                                            />
                                            <small className="text-muted">Nama lengkap sesuai KTP</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                                Unit Kerja <span className="text-danger ms-1">*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                value={pegawaiForm.id_unit || ""}
                                                onChange={e => setPegawaiForm({ ...pegawaiForm, id_unit: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Pilih Unit Kerja --</option>
                                                {units.map(u => <option key={getUnitId(u)} value={getUnitId(u)}>{getUnitName(u)}</option>)}
                                            </select>
                                            <small className="text-muted">Unit kerja tempat pegawai ditugaskan</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm d-flex align-items-center gap-1">
                                                Jabatan <span className="text-danger ms-1">*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                value={pegawaiForm.id_jabatan || ""}
                                                onChange={e => setPegawaiForm({ ...pegawaiForm, id_jabatan: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Pilih Jabatan --</option>
                                                {jabatans.filter(j => j.status === "aktif" || !j.status).map(j => <option key={getJabatanId(j)} value={getJabatanId(j)}>{getJabatanName(j)}</option>)}
                                            </select>
                                            <small className="text-muted">Jabatan yang dipegang oleh pegawai ini</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Email <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Opsional</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                type="email"
                                                value={pegawaiForm.email || ""}
                                                onChange={e => setPegawaiForm({ ...pegawaiForm, email: e.target.value })}
                                                placeholder="Contoh: budi@email.com"
                                            />
                                            <small className="text-muted">Alamat email aktif pegawai</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="font-weight-600 text-sm">
                                                No. Telepon <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Opsional</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                value={pegawaiForm.telepon || ""}
                                                onChange={e => setPegawaiForm({ ...pegawaiForm, telepon: e.target.value })}
                                                placeholder="Contoh: 081234567890"
                                            />
                                            <small className="text-muted">Nomor HP/telepon yang bisa dihubungi</small>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Relasi Atasan Form */}
                        {activeTab === "relasi" && (
                            <>
                                <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2" style={{ fontSize: 12, borderRadius: 8 }}>
                                    <span className="material-icons text-info mt-0" style={{ fontSize: 16 }}>info</span>
                                    <span>Hubungan atasan-bawahan diperlukan untuk alur disposisi surat. Setiap pegawai bisa memiliki lebih dari satu atasan.</span>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="font-weight-600 text-sm">
                                                Pilih Pegawai <span className="text-danger ms-1">*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                value={relasiForm.id_pegawai || ""}
                                                onChange={e => setRelasiForm({ ...relasiForm, id_pegawai: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Pilih Pegawai --</option>
                                                {pegawais.map(p => <option key={getPegawaiId(p)} value={getPegawaiId(p)}>{getPegawaiName(p)} ({p?.nip || "-"})</option>)}
                                            </select>
                                            <small className="text-muted">Pilih pegawai yang ingin diatur hubungannya</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="font-weight-600 text-sm">
                                                Pilih Atasan <span className="text-danger ms-1">*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                value={relasiForm.id_atasan || ""}
                                                onChange={e => setRelasiForm({ ...relasiForm, id_atasan: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Pilih Atasan --</option>
                                                {pegawais.filter(p => String(getPegawaiId(p)) !== String(relasiForm.id_pegawai)).map(p => (
                                                    <option key={getPegawaiId(p)} value={getPegawaiId(p)}>{getPegawaiName(p)} ({p?.nip || "-"})</option>
                                                ))}
                                            </select>
                                            <small className="text-muted">Pilih siapa atasan dari pegawai yang dipilih</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group mb-0">
                                    <label className="font-weight-600 text-sm">Jenis Relasi</label>
                                    <div className="d-flex gap-3 flex-wrap">
                                        {[
                                            { value: "atasan", label: "Atasan Langsung", icon: "supervisor_account", desc: "Atasan langsung dalam hierarki" },
                                            { value: "koordinator", label: "Koordinator", icon: "group", desc: "Koordinator tim/proyek" },
                                            { value: "bawahan", label: "Bawahan", icon: "person", desc: "Hubungan bawahan" },
                                        ].map(opt => (
                                            <label
                                                key={opt.value}
                                                className={`d-flex align-items-start gap-2 p-3 rounded-lg border cursor-pointer flex-1 ${relasiForm.relasi === opt.value ? "border-primary bg-primary/5" : "border-slate-200"}`}
                                                style={{ minWidth: 140 }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="relasiType"
                                                    value={opt.value}
                                                    checked={relasiForm.relasi === opt.value}
                                                    onChange={e => setRelasiForm({ ...relasiForm, relasi: e.target.value })}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="material-icons" style={{ fontSize: 14, color: relasiForm.relasi === opt.value ? "#118b9b" : "#64748b" }}>{opt.icon}</span>
                                                        <span className="font-semibold text-sm">{opt.label}</span>
                                                    </div>
                                                    <small className="text-muted">{opt.desc}</small>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                        <Button className="btn-default-app btn-info" type="submit" style={{ background: currentTab?.color, borderColor: currentTab?.color }}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>{selectedId ? "save" : "add_circle"}</span>
                            {selectedId ? "Simpan Perubahan" : `Tambah ${currentTab?.label}`}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            <style>{`
                .master-organisasi-modal .modal-content {
                    overflow: hidden;
                    border: 0;
                    border-radius: 10px;
                    box-shadow: 0 18px 50px rgba(15, 23, 42, .24);
                }
                .master-organisasi-modal .modal-title {
                    font-size: 20px;
                    font-weight: 700;
                }
                .master-organisasi-modal .modal-footer .btn {
                    min-height: 38px;
                    padding: 8px 16px;
                }
                .font-weight-600 { font-weight: 600; }
                .text-sm { font-size: 14px; }
                .z-2000 { z-index: 2000; }
            `}</style>
        </>
    )
}

export default MasterOrganisasi
