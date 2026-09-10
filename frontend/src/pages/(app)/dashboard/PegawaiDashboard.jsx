"use client"

import { Component } from "react"
import HeaderApp from "components/HeaderApp"
import Link from "components/Link"
import axios from "lib/axios"
import { initFilterUrl } from "pages/Utils"
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
// REUSABLE COMPONENTS
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
    proses: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Proses" },
    diproses: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", lbl: "Diproses" },
  }
  const key = normalizeStatusKey(status)
  const s = map[key] || { cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", lbl: status || "-" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {s.lbl}
    </span>
  )
}

const normalizeStatusKey = (status) => {
  if (!status) return "unknown"
  return String(status).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
}

// Stat Card
const StatCard = ({ icon, label, value, href, loading }) => (
  <Link
    href={href || "#"}
    className="group bg-white rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md hover:border-teal-300 transition-all duration-200 p-4 flex items-center gap-3 no-underline"
  >
    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
      <span className="material-icons text-teal-600 text-xl">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      {loading ? (
        <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
      ) : (
        <div className="text-xl font-bold text-slate-900">{value ?? 0}</div>
      )}
      <div className="text-xs text-slate-500 font-medium truncate">{label}</div>
    </div>
  </Link>
)

// Quick Action Card
const QuickActionCard = ({ icon, title, href }) => (
  <Link
    href={href}
    className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition-all text-center gap-1 no-underline"
  >
    <span className="material-icons text-teal-600 text-xl">{icon}</span>
    <span className="text-xs font-medium text-slate-700">{title}</span>
  </Link>
)

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

const buildMonthBuckets = (length = 6) => {
  const now = new Date()
  return Array.from({ length }, (_, i) => {
    const dv = new Date(now.getFullYear(), now.getMonth() - (length - 1 - i), 1)
    return { key: getMonthKey(dv), label: `${monthNames[dv.getMonth()]} ${String(dv.getFullYear()).slice(2)}` }
  })
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

const getItemTitle = item =>
  item?.perihal || item?.judul || item?.title || item?.nama_agenda ||
  item?.keterangan || item?.nomor_surat || item?.name || "-"

const normalizeDisposisiStatus = status => {
  if (!status) return "draft"
  const s = String(status).toLowerCase()
  if (["draft", "draf", "belum"].includes(s)) return "draft"
  if (["pending", "waiting", "diajukan", "menunggu", "menunggu_review", "proses", "diproses"].includes(s)) return "proses"
  if (["approved", "disetujui", "setuju", "selesai", "done"].includes(s)) return "selesai"
  if (["rejected", "ditolak", "revisi"].includes(s)) return "rejected"
  return "draft"
}

// ============================================================
// DEFAULT ROLE CONFIGURATIONS
// ============================================================

const roleConfigs = {
  pegawai_sdm: {
    title: "Pegawai SDM",
    description: "Pantau surat dan disposisi yang ditugaskan kepada unit SDM secara terfokus.",
    icon: "manage_accounts",
  },
  pegawai_keuangan: {
    title: "Pegawai Keuangan & Akuntansi",
    description: "Pantau surat dan disposisi yang ditugaskan kepada unit Keuangan & Akuntansi secara terfokus.",
    icon: "account_balance",
  },
  pegawai_pemasaran: {
    title: "Pegawai Pemasaran",
    description: "Pantau surat dan disposisi yang ditugaskan kepada unit Pemasaran secara terfokus.",
    icon: "campaign",
  },
  pegawai_operasional: {
    title: "Pegawai Operasional & Produksi",
    description: "Pantau surat dan disposisi yang ditugaskan kepada unit Operasional & Produksi secara terfokus.",
    icon: "engineering",
  },
  pegawai: {
    title: "Pegawai",
    description: "Pantau surat dan disposisi Anda secara terfokus.",
    icon: "person",
  },
}

// ============================================================
// MAIN COMPONENT
// ============================================================

class PegawaiDashboard extends Component {
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

  init = () => {
    const userLogin = getStoredUserLogin() || {}
    // Muat dashboard setelah state pengguna tersimpan. Jika dipanggil
    // langsung, `user_login` masih kosong sehingga filter id_user_tujuan
    // tidak terkirim dan total surat menjadi total seluruh distribusi.
    this.setState({ user_login: userLogin }, () => this.loadDashboardData())
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
      // Data untuk pegawai - filter berdasarkan user login
      const [
        smListResp, skDraftResp, dispAktifResp, dispSelesaiResp, arsipResp,
        smRawResp, skRawResp, dispListResp, agenResp, agenHariResp, pengResp,
      ] = await Promise.allSettled([
        axios.get(this.buildUrl("surat_distribusi", { id_user_tujuan: userId }, 5)),
        axios.get(this.buildUrl("surat_keluar", { created_by: userId, status: "draft" })),
        axios.get(this.buildUrl("surat_disposisi", { id_penerima: userId, status: "diproses" })),
        axios.get(this.buildUrl("surat_disposisi", { id_penerima: userId, status: "selesai" })),
        axios.get(this.buildUrl("surat_arsip", { created_by: userId })),
        axios.get(this.buildUrl("surat_distribusi", { id_user_tujuan: userId }, 5)),
        axios.get(this.buildUrl("surat_keluar", { created_by: userId }, 5)),
        axios.get(this.buildUrl("surat_disposisi", { id_penerima: userId }, 5)),
        axios.get(this.buildUrl("agenda_kegiatan", {}, 5)),
        axios.get(this.buildUrl("agenda_kegiatan", { tanggal_mulai: today() })),
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
        p(smRawResp), p(skRawResp), p(dispListResp), p(agenResp)
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
    if (period === "monthly") buckets = buildMonthBuckets()
    else buckets = buildDayBuckets()

    const stats = { labels: buckets.map(b => b.label), masuk: buckets.map(() => 0), keluar: buckets.map(() => 0) }

    try {
      const [inResp, outResp] = await Promise.all([
        axios.get(this.buildUrl("surat_distribusi", { id_user_tujuan: userId }, 1000)),
        axios.get(this.buildUrl("surat_keluar", { created_by: userId }, 1000)),
      ])

      const addToStats = (rows, key, dateFields) => {
        rows.forEach(row => {
          const recordDate = dateFields.map(f => row?.[f]).find(Boolean)
          if (!recordDate) return
          const d = new Date(recordDate)
          if (Number.isNaN(d.getTime())) return
          const monthKey = getMonthKey(d)
          const dayKey = d.toISOString().slice(0, 10)
          let bucketIndex = buckets.findIndex(b => b.key === monthKey)
          if (period === "daily") bucketIndex = buckets.findIndex(b => b.key === dayKey)
          if (bucketIndex >= 0) stats[key][bucketIndex]++
        })
      }

      addToStats(this.getPayload(inResp), "masuk", ["tanggal_terima", "created_at"])
      addToStats(this.getPayload(outResp), "keluar", ["tanggal_surat", "created_at"])
    } catch (error) { /* ignore */ }

    return { ...stats, period }
  }

  handlePeriodChange = async (period) => {
    const { user_login } = this.state
    const userId = user_login?.id_user || user_login?.user?.id_user || ""
    const mailStats = await this.loadMailStats(period, userId)
    this.setState({ mailStats })
  }

  buildAktivitasTerbaru = (suratMasuk, suratKeluar, disposisi, agenda) => {
    const items = []

    ;(suratMasuk || []).forEach(item => {
      items.push({
        id: item.id_distribusi || item.id,
        title: item.perihal || item.nomor_surat || "Surat Masuk",
        description: `${item.asal_surat || "Pengirim tidak diketahui"} - ${formatDate(item.tanggal_terima || item.created_at)}`,
        time: item.tanggal_terima || item.created_at,
        icon: "mail",
        bg: "bg-blue-50",
        color: "text-blue-600",
        link: "/surat_masuk_pegawai",
      })
    })

    ;(suratKeluar || []).forEach(item => {
      items.push({
        id: item.id_surat_keluar || item.id,
        title: item.perihal || item.nomor_surat || "Surat Keluar",
        description: `Status: ${item.status || "draft"} - ${formatDate(item.tanggal_surat || item.created_at)}`,
        time: item.tanggal_surat || item.created_at,
        icon: "outbox",
        bg: "bg-orange-50",
        color: "text-orange-600",
        link: "/surat_keluar",
      })
    })

    ;(disposisi || []).forEach(item => {
      items.push({
        id: item.id_disposisi || item.id,
        title: item.instruksi || item.perihal || "Disposisi",
        description: `Status: ${item.status || "draft"} - ${formatDate(item.tanggal_disposisi || item.created_at)}`,
        time: item.tanggal_disposisi || item.created_at,
        icon: "assignment",
        bg: "bg-amber-50",
        color: "text-amber-600",
        link: "/disposisi",
      })
    })

    ;(agenda || []).forEach(item => {
      items.push({
        id: item.id_agenda_kegiatan || item.id,
        title: item.judul || item.title || "Agenda",
        description: `${item.lokasi || "-"} - ${formatDate(item.tanggal_mulai || item.created_at)}`,
        time: item.tanggal_mulai || item.created_at,
        icon: "event",
        bg: "bg-purple-50",
        color: "text-purple-600",
        link: "/agenda",
      })
    })

    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)
  }

  getBarChartData = () => {
    const { mailStats } = this.state
    return {
      labels: mailStats.labels,
      datasets: [
        {
          label: "Surat Masuk",
          data: mailStats.masuk,
          backgroundColor: "#138a98",
          borderRadius: 6,
        },
        {
          label: "Surat Keluar",
          data: mailStats.keluar,
          backgroundColor: "#f59e0b",
          borderRadius: 6,
        },
      ],
    }
  }

  getBarOpts = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, color: "#64748b", padding: 16 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
    },
  })

  getDisposisiChartData = () => {
    const { disposisiStats } = this.state
    return {
      labels: ["Disposisi", "Selesai"],
      datasets: [
        {
          data: [disposisiStats.proses || 0, disposisiStats.selesai || 0],
          backgroundColor: ["#138a98", "#10b981"],
          borderRadius: 6,
        },
      ],
    }
  }

  getBarOptsSmall = () => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      y: { ticks: { color: "#64748b" }, grid: { display: false } },
    },
  })

  getDoughnutOpts = () => ({
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: "#64748b", padding: 16 } } },
  })

  getRoleConfig = () => {
    const { roleName } = this.props
    return roleConfigs[roleName] || roleConfigs.pegawai
  }

  render() {
    const { counts, mailStats, disposisiStats, disposisiSummary, suratMasukList, suratKeluarList, disposisiList, agendaList, pengumumanList, agendaHariIni, aktivitasTerbaru, is_loading } = this.state
    const roleConfig = this.getRoleConfig()

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
                  <span className="material-icons text-white text-2xl">{roleConfig.icon}</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Selamat Datang, {roleConfig.title}</h1>
                  <p className="text-teal-100 text-xs leading-relaxed max-w-xl">
                    {roleConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Statistic Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <StatCard icon="move_to_inbox" label="Surat Masuk Saya" value={counts.surat_masuk_saya} href="/surat_masuk_pegawai" loading={is_loading} />
            <StatCard icon="edit_document" label="Draft Surat Saya" value={counts.draft_surat_saya} href="/surat_keluar" loading={is_loading} />
            <StatCard icon="assignment_turned_in" label="Disposisi Saya" value={counts.disposisi_saya} href="/disposisi" loading={is_loading} />
            <StatCard icon="task_alt" label="Tugas Selesai" value={counts.tugas_selesai} href="/disposisi" loading={is_loading} />
            <StatCard icon="archive" label="Arsip Saya" value={counts.arsip_saya} href="/surat_arsip" loading={is_loading} />
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
                </div>
              </div>
              <div className="p-4" style={{ height: 220 }}>
                <Bar data={this.getBarChartData()} options={this.getBarOpts()} />
              </div>
              <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#138a98]"></span>
                  Masuk: {totalMasuk}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#f59e0b]"></span>
                  Keluar: {totalKeluar}
                </span>
              </div>
            </div>

            {/* Chart: Progress Disposisi */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">assignment_turned_in</span>
                  Progress Disposisi
                </h3>
              </div>
              <div className="p-4" style={{ height: 220 }}>
                <Bar data={this.getDisposisiChartData()} options={this.getBarOptsSmall()} />
              </div>
              <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#138a98]"></span>
                  Disposisi: {disposisiStats.proses || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#10b981]"></span>
                  Selesai: {disposisiStats.selesai || 0}
                </span>
              </div>
            </div>
          </div>

          {/* ── Tables Row ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

            {/* Surat Masuk Terbaru */}
            <DashboardTableWidget
              title="Surat Masuk Terbaru"
              icon="mail"
              href="/surat_masuk_pegawai"
              columns={["Perihal", "Pengirim", "Tanggal"]}
              data={suratMasukList.map(item => ({
                ...item,
                "Perihal": item.perihal || "-",
                "Pengirim": item.asal_surat || "-",
                "Tanggal": item.tanggal_terima || item.created_at,
              }))}
              emptyMessage="Belum ada surat masuk"
              loading={is_loading}
              showAksi={false}
            />

            {/* Surat Keluar Terbaru */}
            <DashboardTableWidget
              title="Surat Keluar Terbaru"
              icon="outbox"
              href="/surat_keluar"
              columns={["Perihal", "Status", "Tanggal"]}
              data={suratKeluarList.map(item => ({
                ...item,
                "Perihal": getItemTitle(item),
                "Status": item.status || "-",
                "Tanggal": item.tanggal_surat || item.created_at,
              }))}
              emptyMessage="Belum ada surat keluar"
              loading={is_loading}
              showAksi={false}
            />

          </div>

          {/* ── Disposisi & Agenda Row ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

            {/* Monitoring Disposisi */}
            <DashboardTableWidget
              title="Monitoring Disposisi"
              icon="assignment"
              href="/disposisi"
              columns={["Perihal", "Status", "Tanggal"]}
              data={disposisiList.map(item => ({
                ...item,
                "Perihal": getItemTitle(item),
                "Status": item.status,
                "Tanggal": item.tanggal_disposisi || item.created_at,
              }))}
              emptyMessage="Belum ada disposisi aktif"
              loading={is_loading}
              showAksi={false}
            />

            {/* Agenda Terbaru */}
            <DashboardTableWidget
              title="Agenda Terbaru"
              icon="event"
              href="/agenda"
              columns={["Agenda", "Status", "Tanggal"]}
              data={agendaList.map(item => ({
                ...item,
                "Agenda": item.judul || item.nama_agenda || item.title || "-",
                "Status": item.status,
                "Tanggal": item.tanggal_mulai || item.created_at,
              }))}
              emptyMessage="Belum ada agenda"
              loading={is_loading}
              showAksi={false}
            />
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

        </div>
      </>
    )
  }
}

export default PegawaiDashboard
