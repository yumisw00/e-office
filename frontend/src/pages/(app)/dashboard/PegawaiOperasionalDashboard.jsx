"use client"

import { Component } from "react"
import HeaderApp from "components/HeaderApp"
import Link from "components/Link"
import axios from "lib/axios"
import { initAccessMethod, initFilterUrl } from "pages/Utils"
import { getStoredUserLogin } from "lib/eofficeAccess"
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import DashboardTableWidget from "components/DashboardTableWidget"

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ============================================================
// REUSABLE COMPONENTS (sama persis dengan Admin Konten)
// ============================================================

// Status Badge
const StatusBadge = ({ status }) => {
  const map = {
    aktif: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Aktif" },
    online: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Online" },
    connected: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Terhubung" },
    sukses: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Sukses" },
    selesai: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Selesai" },
    approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Disetujui" },
    done: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Selesai" },
    didistribusikan: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Didistribusikan" },
    diarsipkan: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Diarsipkan" },
    offline: { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", lbl: "Offline" },
    error: { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", lbl: "Error" },
    rejected: { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", lbl: "Ditolak" },
    maintenance: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Maintenance" },
    pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Menunggu" },
    waiting: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Menunggu" },
    menunggu_review: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Menunggu Review" },
    distribusi: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Distribusi" },
    draft: { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", lbl: "Draf" },
    inactive: { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", lbl: "Tidak Aktif" },
    published: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", lbl: "Diterbitkan" },
    baru: { cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", lbl: "Baru" },
    diproses: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Diproses" },
    proses: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Diproses" },
  }
  const c = map[status] || map.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
      {c.lbl}
    </span>
  )
}

// Stat Card
const StatCard = ({ icon, label, value, href, loading }) => (
  <Link
    href={href || "#"}
    className="group bg-white rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md hover:border-teal-300 transition-all duration-200 p-5 flex items-center gap-4 no-underline"
  >
    <div className="w-12 h-12 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center flex-shrink-0 transition-colors">
      <span className="material-icons text-teal-600">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-slate-500 mb-0.5">{label}</div>
      <div className="text-xl font-bold text-slate-900">{loading ? "..." : (value ?? 0)}</div>
    </div>
  </Link>
)

// Quick Action Card
const QuickActionCard = ({ icon, title, href }) => (
  <Link
    href={href}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 transition-colors text-slate-700 hover:text-teal-700 no-underline group border border-transparent hover:border-teal-200"
  >
    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
      <span className="material-icons text-slate-500 group-hover:text-teal-600 text-lg">{icon}</span>
    </div>
    <span className="text-sm font-medium">{title}</span>
  </Link>
)

// Notification Panel
const NotificationPanel = ({ notifications }) => {
  const items = notifications || []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="material-icons text-teal-600 text-lg">notifications</span>
          Notifikasi Operasional
        </h3>
        <span className="text-xs text-teal-600 font-semibold cursor-pointer hover:text-teal-700">Lihat Semua</span>
      </div>
      <div className="divide-y divide-slate-50">
        {!items.length ? <EmptyState message="Belum ada notifikasi operasional" icon="notifications_none" /> : items.map((item, index) => (
          <div key={item.id || index} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg || "bg-slate-50"}`}>
              <span className={`material-icons text-base ${item.color || "text-slate-500"}`}>{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-800 truncate">{item.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.time || item.tanggal || ""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DisposisiSummaryCard = ({ aktif, selesai, draft, produktivitas }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
      <span className="material-icons text-teal-600 text-lg">assignment_turned_in</span>
      Ringkasan Disposisi
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
        <div className="text-xl font-bold text-amber-700">{aktif}</div>
        <div className="text-xs text-amber-600 font-medium">Disposisi Aktif</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="text-xl font-bold text-emerald-700">{selesai}</div>
        <div className="text-xs text-emerald-600 font-medium">Disposisi Selesai</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-slate-100 border border-slate-200">
        <div className="text-xl font-bold text-slate-600">{draft}</div>
        <div className="text-xs text-slate-500 font-medium">Draft Surat</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-teal-50 border border-teal-200">
        <div className="text-xl font-bold text-teal-700">{produktivitas}%</div>
        <div className="text-xs text-teal-600 font-medium">Produktivitas</div>
      </div>
    </div>
  </div>
)

// Table Widget - using shared DashboardTableWidget component
const TableWidget = () => null // placeholder, replaced by shared component

// Empty State
const EmptyState = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
    <span className="material-icons text-4xl mb-2">{icon || "inbox"}</span>
    <p className="text-sm">{message || "Belum ada data"}</p>
  </div>
)

// ============================================================
// HELPERS
// ============================================================

const today = () => new Date().toISOString().slice(0, 10)

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

const formatDate = value => {
  if (!value) return "-"
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) return String(value).slice(0, 16)
  return dateValue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

const getMonthKey = dateValue => {
  if (!dateValue) return ""
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

const getWeekKey = dateValue => {
  if (!dateValue) return ""
  const d = new Date(dateValue)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  const year = d.getFullYear()
  const weekNum = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, "0")}`
}

const buildMonthBuckets = (length = 6) => {
  const now = new Date()
  return Array.from({ length }, (_, i) => {
    const dv = new Date(now.getFullYear(), now.getMonth() - (length - 1 - i), 1)
    return { key: getMonthKey(dv), label: `${monthNames[dv.getMonth()]} ${String(dv.getFullYear()).slice(2)}` }
  })
}

const buildWeekBuckets = (length = 6) => {
  const now = new Date()
  const cw = new Date(now)
  cw.setDate(now.getDate() - now.getDay())
  const buckets = []
  for (let i = length - 1; i >= 0; i--) {
    const ws = new Date(cw)
    ws.setDate(cw.getDate() - i * 7)
    const we = new Date(ws)
    we.setDate(ws.getDate() + 6)
    buckets.push({
      key: getWeekKey(ws),
      label: `${ws.getDate()} ${monthNames[ws.getMonth()]} - ${we.getDate()} ${monthNames[we.getMonth()]}`,
    })
  }
  return buckets
}

const buildDayBuckets = (length = 7) => {
  const now = new Date()
  const buckets = []
  for (let i = length - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: dayNames[d.getDay()],
    })
  }
  return buckets
}

const toDate = value => {
  if (!value) return null
  const dv = new Date(value)
  return Number.isNaN(dv.getTime()) ? null : dv
}

const getItemTitle = item =>
  item?.perihal || item?.judul || item?.title || item?.nama_agenda ||
  item?.keterangan || item?.nomor_surat || item?.name || "-"

const normalizeDisposisiStatus = status => {
  if (!status) return "draft"
  const s = String(status).toLowerCase()
  if (["draft", "draf", "belum"].includes(s)) return "draft"
  if (["pending", "waiting", "diajukan", "menunggu", "menunggu_review", "proses", "diproses"].includes(s)) return "proses"
  if (["approved", "disetujui", "setuju", "selesai", "done", "approved", "approved"].includes(s)) return "selesai"
  if (["rejected", "ditolak", "revisi"].includes(s)) return "rejected"
  return "draft"
}

// ============================================================
// MAIN COMPONENT
// ============================================================

class PegawaiOperasionalDashboard extends Component {
  state = {
    user_login: {},
    counts: {},
    mailStats: {
      period: "daily",
      labels: buildDayBuckets().map(b => b.label),
      masuk: Array(7).fill(0),
      keluar: Array(7).fill(0),
    },
    disposisiStats: { draft: 0, proses: 0, selesai: 0 },
    disposisiSummary: { aktif: 0, selesai: 0, draft: 0, produktivitas: 0 },
    suratMasukList: [],
    suratKeluarList: [],
    disposisiList: [],
    agendaList: [],
    pengumumanList: [],
    agendaHariIni: [],
    aktivitasTerbaru: [],
    is_loading: true,
  }

  componentDidMount() { this.init() }

  init = async () => {
    const user_login = getStoredUserLogin()
    this.setState({ user_login }, () => this.loadDashboardData())
  }

  buildUrl = (endpoint, filter = {}, pagesize = 10) => {
    const req = { paginate: { page: 1, pagesize }, filter: Object.keys(filter).length > 0 ? filter : {} }
    return initFilterUrl({ url: `/api/${endpoint}`, filter: req })
  }

  getPayload = response => {
    const p = response?.data || {}
    if (Array.isArray(p.data?.data)) return p.data.data
    if (Array.isArray(p.data)) return p.data
    if (Array.isArray(p)) return p
    return []
  }

  getCount = response => {
    const p = response?.data || {}
    const d = p.data
    if (p.total_records !== undefined) return p.total_records
    if (p.total !== undefined) return p.total
    if (d?.total !== undefined) return d.total
    if (Array.isArray(d?.data)) return d.data.length
    if (Array.isArray(d)) return d.length
    return 0
  }

  loadDashboardData = async () => {
    const { user_login } = this.state
    const userId = user_login?.id_user || user_login?.user?.id_user || user_login?.id || user_login?.user?.id || ""

    this.setState({ is_loading: true })
    try {
      // Data untuk pegawai operasional - filter berdasarkan user login
      const [
        smListResp,      // Surat Masuk Saya (dari surat_distribusi / surat_masuk)
        skDraftResp,     // Draft Surat Saya
        dispAktifResp,   // Disposisi Aktif
        dispSelesaiResp, // Disposisi Selesai
        arsipResp,       // Arsip Saya
        smRawResp,       // Surat Masuk Terbaru
        skRawResp,       // Surat Keluar Terbaru
        dispListResp,    // Monitoring Disposisi
        agenResp,        // Agenda Terbaru
        agenHariResp,    // Agenda Hari Ini
        pengResp,        // Pengumuman
      ] = await Promise.allSettled([
        // Surat Masuk Saya - dari surat_distribusi (surat yang didistribusikan ke pegawai ini)
        axios.get(this.buildUrl("surat_distribusi", { id_user_tujuan: userId }, 5)),
        // Draft Surat Saya
        axios.get(this.buildUrl("surat_keluar", { created_by: userId, status: "draft" })),
        // Disposisi Aktif (status proses)
        axios.get(this.buildUrl("surat_disposisi", { id_penerima: userId, status: "diproses" })),
        // Disposisi Selesai
        axios.get(this.buildUrl("surat_disposisi", { id_penerima: userId, status: "selesai" })),
        // Arsip Saya
        axios.get(this.buildUrl("surat_arsip", { created_by: userId })),
        // Surat Masuk Terbaru
        axios.get(this.buildUrl("surat_distribusi", { id_user_tujuan: userId }, 5)),
        // Surat Keluar Terbaru
        axios.get(this.buildUrl("surat_keluar", { created_by: userId }, 5)),
        // Monitoring Disposisi
        axios.get(this.buildUrl("surat_disposisi", { id_penerima: userId }, 5)),
        // Agenda Terbaru
        axios.get(this.buildUrl("agenda_kegiatan", {}, 5)),
        // Agenda Hari Ini
        axios.get(this.buildUrl("agenda_kegiatan", { tanggal_mulai: today() })),
        // Pengumuman
        axios.get(this.buildUrl("pengumuman", {}, 5)),
      ])

      const g = res => res.status === "fulfilled" ? this.getCount(res.value) : 0
      const p = res => res.status === "fulfilled" ? this.getPayload(res.value) : []

      const counts = {
        surat_masuk_saya: g(smListResp),
        draft_surat_saya: g(skDraftResp),
        disposisi_saya: g(dispAktifResp),
        tugas_selesai: g(dispSelesaiResp),
        arsip_saya: g(arsipResp),
      }

      const disposisiSummary = {
        aktif: g(dispAktifResp),
        selesai: g(dispSelesaiResp),
        draft: g(skDraftResp),
        produktivitas: 0,
      }

      // Hitung produktivitas
      const totalDisposisi = disposisiSummary.aktif + disposisiSummary.selesai
      if (totalDisposisi > 0) {
        disposisiSummary.produktivitas = Math.round((disposisiSummary.selesai / totalDisposisi) * 100)
      }

      // Load mail stats
      const mailStats = await this.loadMailStats(this.state.mailStats.period, userId)

      // Disposisi stats dari monitoring
      const dispAll = p(dispListResp)
      const dispStats = { draft: 0, proses: 0, selesai: 0 }
      dispAll.forEach(item => {
        const s = normalizeDisposisiStatus(item?.status)
        if (s === "draft") dispStats.draft++
        else if (s === "proses") dispStats.proses++
        else if (s === "selesai") dispStats.selesai++
        else dispStats.proses++
      })

      // Aktivitas Terbaru
      const aktivitasTerbaru = this.buildAktivitasTerbaru(
        p(smRawResp),
        p(skRawResp),
        p(dispListResp),
        p(agenResp)
      )

      this.setState({
        counts,
        mailStats,
        disposisiStats: dispStats,
        disposisiSummary,
        suratMasukList: p(smRawResp),
        suratKeluarList: p(skRawResp),
        disposisiList: p(dispListResp),
        agendaList: p(agenResp),
        pengumumanList: p(pengResp),
        agendaHariIni: p(agenHariResp),
        aktivitasTerbaru,
        is_loading: false,
      })
    } catch (error) {
      this.setState({ is_loading: false })
    }
  }

  loadMailStats = async (period = "daily", userId = "") => {
    let buckets
    if (period === "weekly") buckets = buildWeekBuckets()
    else if (period === "monthly") buckets = buildMonthBuckets()
    else buckets = buildDayBuckets()

    const stats = { labels: buckets.map(b => b.label), masuk: buckets.map(() => 0), keluar: buckets.map(() => 0) }

    try {
      const [inResp, outResp] = await Promise.all([
        axios.get(this.buildUrl("surat_distribusi", { id_user_tujuan: userId }, 1000)),
        axios.get(this.buildUrl("surat_keluar", { created_by: userId }, 1000)),
      ])

      const add = (rows, key, fields, bucketFn) => {
        rows.forEach(row => {
          const rd = toDate(fields.map(f => row?.[f]).find(Boolean))
          if (!rd) return
          const bk = bucketFn(rd)
          const idx = buckets.findIndex(b => b.key === bk)
          if (idx >= 0) stats[key][idx]++
        })
      }

      const dateFn = period === "weekly" ? getWeekKey : period === "monthly" ? getMonthKey : d => d.toISOString().slice(0, 10)
      add(this.getPayload(inResp), "masuk", ["tanggal_distribusi", "tanggal_terima", "tanggal_terima_surat", "created_at"], dateFn)
      add(this.getPayload(outResp), "keluar", ["tanggal_surat", "created_at"], dateFn)
    } catch (error) { /* ignore */ }

    return { ...stats, period }
  }

  handlePeriodChange = async period => {
    this.setState({ is_loading: true })
    const { user_login } = this.state
    const userId = user_login?.id_pegawai || user_login?.user?.id_pegawai || user_login?.id_user || user_login?.user?.id_user || ""
    const mailStats = await this.loadMailStats(period, userId)
    this.setState({ mailStats, is_loading: false })
  }

  buildAktivitasTerbaru = (suratMasuk, suratKeluar, disposisi, agenda) => {
    const activities = []

    ;(suratMasuk || []).forEach(item => {
      activities.push({
        id: item.id_surat_distribusi || item.id,
        type: "surat_masuk",
        title: item.perihal || item.judul_surat || "Surat Masuk",
        description: "Surat masuk baru didistribusikan",
        icon: "mark_email_read",
        color: "text-blue-600",
        bg: "bg-blue-50",
        time: item.tanggal_distribusi || item.tanggal_terima || item.created_at,
        link: "/surat_masuk_pegawai",
      })
    })

    ;(suratKeluar || []).forEach(item => {
      activities.push({
        id: item.id_surat_keluar || item.id,
        type: "surat_keluar",
        title: item.perihal || item.judul_surat || "Surat Keluar",
        description: "Surat keluar dibuat",
        icon: "outbox",
        color: "text-teal-600",
        bg: "bg-teal-50",
        time: item.tanggal_surat || item.created_at,
        link: "/surat_keluar",
      })
    })

    ;(disposisi || []).forEach(item => {
      activities.push({
        id: item.id_disposisi || item.id,
        type: "disposisi",
        title: item.perihal || "Disposisi",
        description: `Disposisi ${item.status || "proses"}`,
        icon: "assignment",
        color: "text-amber-600",
        bg: "bg-amber-50",
        time: item.tanggal_disposisi || item.updated_at || item.created_at,
        link: "/disposisi",
      })
    })

    ;(agenda || []).forEach(item => {
      activities.push({
        id: item.id_agenda_kegiatan || item.id,
        type: "agenda",
        title: item.nama_agenda || item.judul || item.title || "Agenda",
        description: "Agenda kegiatan",
        icon: "event",
        color: "text-purple-600",
        bg: "bg-purple-50",
        time: item.tanggal_mulai || item.created_at,
        link: "/agenda",
      })
    })

    return activities
      .sort((a, b) => {
        const da = a?.time ? new Date(a.time) : new Date(0)
        const db = b?.time ? new Date(b.time) : new Date(0)
        return db - da
      })
      .slice(0, 8)
  }

  getMailChartData = () => ({
    labels: this.state.mailStats.labels,
    datasets: [
      { label: "Surat Masuk", data: this.state.mailStats.masuk, backgroundColor: "#118b9b", borderColor: "#118b9b", borderRadius: 6, borderWidth: 0 },
      { label: "Surat Keluar", data: this.state.mailStats.keluar, backgroundColor: "#f59e0b", borderColor: "#f59e0b", borderRadius: 6, borderWidth: 0 },
    ],
  })

  getDisposisiChartData = () => ({
    labels: ["Belum Diproses", "Sedang Diproses", "Selesai"],
    datasets: [{
      data: [this.state.disposisiStats.draft, this.state.disposisiStats.proses, this.state.disposisiStats.selesai],
      backgroundColor: ["#94a3b8", "#118b9b", "#16a34a"],
      borderWidth: 0,
    }],
  })

  getBarOpts = () => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { weight: 600 } } },
      y: { beginAtZero: true, ticks: { precision: 0, color: "#94a3b8" }, grid: { color: "#f1f5f9" } }
    },
  })

  getDoughnutOpts = () => ({
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: "#64748b", padding: 16 } } },
  })

  render() {
    const { counts, mailStats, disposisiStats, disposisiSummary, suratMasukList, suratKeluarList, disposisiList, agendaList, pengumumanList, agendaHariIni, aktivitasTerbaru, is_loading } = this.state

    const totalMasuk = mailStats.masuk.reduce((a, b) => a + b, 0)
    const totalKeluar = mailStats.keluar.reduce((a, b) => a + b, 0)

    const periodeButtons = [
      { label: "Hari", value: "daily" },
      { label: "Minggu", value: "weekly" },
      { label: "Bulan", value: "monthly" },
    ]

    return (
      <>
        <HeaderApp title="" is_loading={is_loading} data_btn={[]} />
        <div className="container pl-4 pr-4">

          {/* ── Welcome Banner ── */}
          <div className="bg-gradient-to-br from-[#118b9b] to-[#0d6e78] rounded-xl p-5 mb-4 text-white shadow-lg -mt-2">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-white text-2xl">engineering</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Selamat Datang, Pegawai Operasional &amp; Produksi</h1>
                  <p className="text-teal-100 text-xs leading-relaxed max-w-xl">
                    Pantau surat dan disposisi yang ditugaskan kepada unit Operasional &amp; Produksi secara terfokus.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Statistic Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <StatCard icon="move_to_inbox" label="Surat Masuk Saya" value={counts.surat_masuk_saya} href="/surat_masuk_pegawai" loading={is_loading} />
            <StatCard icon="edit_document" label="Draft Surat Saya" value={counts.draft_surat_saya} href="/surat_keluar" loading={is_loading} />
            <StatCard icon="assignment_turned_in" label="Disposisi Saya" value={counts.disposisi_saya} href="/disposisi" loading={is_loading} />
            <StatCard icon="task_alt" label="Tugas Selesai" value={counts.tugas_selesai} href="/disposisi" loading={is_loading} />
            <StatCard icon="archive" label="Arsip Saya" value={counts.arsip_saya} href="/surat_arsip" loading={is_loading} />
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Chart: Grafik Aktivitas Surat */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">bar_chart</span>
                  Grafik Aktivitas Surat
                </h3>
                <div className="flex items-center gap-1.5">
                  {periodeButtons.map(btn => (
                    <button
                      key={btn.value}
                      className={`btn btn-sm ${mailStats.period === btn.value ? "btn-info" : "btn-light"}`}
                      onClick={() => this.handlePeriodChange(btn.value)}
                      style={{ borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "2px 10px" }}
                    >
                      {btn.label}
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 font-semibold ml-1 hidden md:inline">
                    Total: <span className="text-teal-600">{totalMasuk}</span> / <span className="text-amber-600">{totalKeluar}</span>
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div style={{ height: 200 }}>
                  <Bar data={this.getMailChartData()} options={this.getBarOpts()} />
                </div>
              </div>
            </div>

            {/* Chart: Status Disposisi */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">donut_large</span>
                  Status Disposisi
                </h3>
              </div>
              <div className="p-4">
                <div style={{ height: 200 }}>
                  <Doughnut data={this.getDisposisiChartData()} options={this.getDoughnutOpts()} />
                </div>
                <div className="d-flex justify-content-center flex-wrap mt-2">
                  {[
                    { lbl: "Belum Diproses", val: disposisiStats.draft },
                    { lbl: "Sedang Diproses", val: disposisiStats.proses },
                    { lbl: "Selesai", val: disposisiStats.selesai },
                  ].map(item => (
                    <div key={item.lbl} className="mx-2 mb-1 text-xs font-semibold text-slate-500">
                      {item.lbl}: <span className="text-slate-700">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Ringkasan Disposisi ── */}
          <div className="mb-4">
            <DisposisiSummaryCard
              aktif={disposisiSummary.aktif}
              selesai={disposisiSummary.selesai}
              draft={disposisiSummary.draft}
              produktivitas={disposisiSummary.produktivitas}
            />
          </div>

          {/* ── Widget Row 1 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

            {/* Surat Terbaru */}
            <DashboardTableWidget
              title="Surat Terbaru"
              icon="mark_email_read"
              href="/surat_masuk_pegawai"
              columns={["Nomor Surat", "Perihal", "Status", "Tanggal"]}
              data={(suratMasukList || []).map(item => ({
                ...item,
                "Nomor Surat": item.nomor_surat || item.kode_surat || "-",
                "Perihal": getItemTitle(item),
                "Status": item.status || "baru",
                "Tanggal": item.tanggal_distribusi || item.tanggal_terima || item.created_at,
              }))}
              emptyMessage="Belum ada surat terbaru"
              loading={is_loading}
              showAksi={false}
            />

            {/* Agenda Terbaru */}
            <DashboardTableWidget
              title="Agenda Terbaru"
              icon="event"
              href="/agenda"
              columns={["Agenda", "Tanggal", "Status"]}
              data={(agendaList || []).map(item => ({
                ...item,
                "Agenda": getItemTitle(item),
                "Tanggal": item.tanggal_mulai || item.created_at,
                "Status": item.status || "draft",
              }))}
              emptyMessage="Belum ada agenda"
              loading={is_loading}
              showAksi={false}
            />

            {/* Notifikasi */}
            <NotificationPanel notifications={[]} />
          </div>

          {/* ── Widget Row 2 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

            {/* Monitoring Disposisi */}
            <DashboardTableWidget
              title="Monitoring Disposisi"
              icon="assignment"
              href="/disposisi"
              columns={["Perihal", "Tanggal", "Status"]}
              data={(disposisiList || []).map(item => ({
                ...item,
                "Perihal": getItemTitle(item),
                "Tanggal": item.tanggal_disposisi || item.tanggal_mulai || item.created_at,
                "Status": item.status || "proses",
              }))}
              emptyMessage="Belum ada disposisi aktif"
              loading={is_loading}
              showAksi={false}
            />

            {/* Agenda Hari Ini */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">today</span>
                  Agenda Hari Ini
                </h3>
                <Link href="/agenda" className="text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
              </div>
              <div className="p-4">
                {is_loading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400">
                    <span className="material-icons text-3xl animate-spin">sync</span>
                  </div>
                ) : (agendaHariIni || []).length === 0 ? (
                  <EmptyState message="Tidak ada agenda hari ini" icon="event" />
                ) : (
                  <div className="space-y-3">
                    {(agendaHariIni || []).map((item, i) => (
                      <div key={item.id_agenda_kegiatan || item.id || i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-teal-50 hover:border-teal-100 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="material-icons text-teal-600 text-lg">event</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{getItemTitle(item)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.lokasi || formatDate(item.tanggal_mulai)}</div>
                          <div className="text-xs text-slate-400">{item.waktu_mulai ? `${item.waktu_mulai} - ${item.waktu_selesai || ""}` : ""}</div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Aktivitas Terbaru ── */}
          <div className="mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">history</span>
                  Aktivitas Terbaru
                </h3>
              </div>
              <div className="divide-y divide-slate-50">
                {is_loading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <span className="material-icons text-3xl animate-spin">sync</span>
                  </div>
                ) : aktivitasTerbaru.length === 0 ? (
                  <EmptyState message="Belum ada aktivitas terbaru" icon="history" />
                ) : (
                  aktivitasTerbaru.map((item, i) => (
                    <div key={item.id || i} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                        <span className={`material-icons text-base ${item.color}`}>{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate">{item.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">{formatDate(item.time)}</div>
                      <Link href={item.link} className="text-teal-600 hover:text-teal-700">
                        <span className="material-icons text-base">visibility</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Papan Pengumuman ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-icons text-teal-600 text-lg">campaign</span>
              Papan Pengumuman
              <Link href="/pengumuman" className="ml-auto text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
            </h3>
            {is_loading ? (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <span className="material-icons text-2xl animate-spin">sync</span>
              </div>
            ) : pengumumanList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">Belum ada pengumuman.</div>
            ) : (
              <div className="space-y-3">
                {pengumumanList.map((item, idx) => (
                  <div key={item.id_pengumuman || item.id || idx} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">{item.judul || item.title || item.perihal || "-"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.target_role || "semua"} {item.tanggal || item.created_at ? `- ${(item.tanggal || item.created_at) ? new Date(item.tanggal || item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : ""}` : ""}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 line-clamp-2">{item.isi || item.content || item.perihal || "-"}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-teal-50 text-teal-700 px-2 py-0.5 text-xs font-semibold">
                        {item.status || "draft"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bottom Quick Actions: Menu Lainnya ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-icons text-teal-600 text-lg">apps</span>
              Menu Lainnya
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <QuickActionCard icon="move_to_inbox" title="Surat Masuk" href="/surat_masuk_pegawai" />
              <QuickActionCard icon="outbox" title="Surat Keluar" href="/surat_keluar" />
              <QuickActionCard icon="assignment_turned_in" title="Disposisi" href="/disposisi" />
              <QuickActionCard icon="archive" title="Arsip Surat" href="/surat_arsip" />
              <QuickActionCard icon="event" title="Agenda" href="/agenda" />
              <QuickActionCard icon="campaign" title="Pengumuman" href="/pengumuman" />
            </div>
          </div>

        </div>
      </>
    )
  }
}

export default PegawaiOperasionalDashboard
