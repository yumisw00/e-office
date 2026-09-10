"use client"

import { Component } from "react"
import HeaderApp from "components/HeaderApp"
import Link from "components/Link"
import axios from "lib/axios"
import { initFilterUrl } from "pages/Utils"
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import DashboardTableWidget from "components/DashboardTableWidget"

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

const today = () => new Date().toISOString().slice(0, 10)
const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

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

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

const toDate = value => {
  if (!value) return null
  const dv = new Date(value)
  return Number.isNaN(dv.getTime()) ? null : dv
}

const getItemTitle = item =>
  item?.perihal || item?.judul || item?.title || item?.nama_agenda ||
  item?.keterangan || item?.nomor_surat || item?.name || "-"

// ============================================================
// MAIN COMPONENT
// ============================================================

class AdminKontenDashboard extends Component {
  state = {
    counts: {},
    mailStats: {
      period: "daily",
      labels: buildDayBuckets().map(b => b.label),
      masuk: Array(7).fill(0),
      keluar: Array(7).fill(0),
    },
    suratMasukList: [],
    distribusiList: [],
    disposisiList: [],
    agendaList: [],
    loadError: false,
    is_loading: true,
  }

  componentDidMount() { this.loadDashboardData() }

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
    this.setState({ is_loading: true, loadError: false })
    try {
      const [sm1, sk1, smd, da, ta, smRaw, distRaw, dispRaw, agenRaw] = await Promise.allSettled([
        axios.get(this.buildUrl("surat_masuk", { tanggal_terima: today() })),
        axios.get(this.buildUrl("surat_keluar", { tanggal_surat: today() })),
        axios.get(this.buildUrl("surat_masuk", { status: "pending" })),
        axios.get(this.buildUrl("surat_disposisi", { status: "proses" })),
        axios.get(this.buildUrl("surat_arsip", {})),
        axios.get(this.buildUrl("surat_masuk", {}, 5)),
        axios.get(this.buildUrl("surat_distribusi", {}, 5)),
        axios.get(this.buildUrl("surat_disposisi", { status: "proses" }, 5)),
        axios.get(this.buildUrl("agenda_kegiatan", {}, 5)),
      ])
      const g = res => res.status === "fulfilled" ? this.getCount(res.value) : 0
      const p = res => res.status === "fulfilled" ? this.getPayload(res.value) : []
      const hasDataSource = [sm1, sk1, smd, da, ta, smRaw, distRaw, dispRaw, agenRaw]
        .some(result => result.status === "fulfilled")

      const counts = {
        surat_masuk_hari_ini: g(sm1),
        surat_keluar_hari_ini: g(sk1),
        menunggu_distribusi: g(smd),
        disposisi_aktif: g(da),
        total_arsip: g(ta),
      }

      const mailStats = await this.loadMailStats(this.state.mailStats.period)

      this.setState({
        counts,
        mailStats,
        suratMasukList: p(smRaw),
        distribusiList: p(distRaw),
        disposisiList: p(dispRaw),
        agendaList: p(agenRaw),
        loadError: !hasDataSource,
        is_loading: false,
      })
    } catch (error) {
      this.setState({ is_loading: false, loadError: true })
    }
  }

  loadMailStats = async (period = "daily") => {
    let buckets
    if (period === "weekly") buckets = buildWeekBuckets()
    else if (period === "monthly") buckets = buildMonthBuckets()
    else buckets = buildDayBuckets()

    const stats = { labels: buckets.map(b => b.label), masuk: buckets.map(() => 0), keluar: buckets.map(() => 0) }

    try {
      const [inResp, outResp] = await Promise.all([
        axios.get(this.buildUrl("surat_masuk", {}, 1000)),
        axios.get(this.buildUrl("surat_keluar", {}, 1000)),
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
      add(this.getPayload(inResp), "masuk", ["tanggal_terima", "tanggal_surat", "created_at"], dateFn)
      add(this.getPayload(outResp), "keluar", ["tanggal_surat", "created_at"], dateFn)
    } catch (error) { /* ignore */ }

    return { ...stats, period }
  }

  handlePeriodChange = async period => {
    this.setState({ is_loading: true })
    const mailStats = await this.loadMailStats(period)
    this.setState({ mailStats, is_loading: false })
  }

  getMailChartData = () => ({
    labels: this.state.mailStats.labels,
    datasets: [
      { label: "Surat Masuk", data: this.state.mailStats.masuk, backgroundColor: "#118b9b", borderColor: "#118b9b", borderRadius: 6, borderWidth: 0 },
      { label: "Surat Keluar", data: this.state.mailStats.keluar, backgroundColor: "#f59e0b", borderColor: "#f59e0b", borderRadius: 6, borderWidth: 0 },
    ],
  })

  getBarOpts = () => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: "#64748b", font: { weight: 600 } } }, y: { beginAtZero: true, ticks: { precision: 0, color: "#94a3b8" }, grid: { color: "#f1f5f9" } } },
  })

  render() {
    const { counts, mailStats, suratMasukList, distribusiList, disposisiList, agendaList, loadError, is_loading } = this.state

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
                  <span className="material-icons text-white text-2xl">content_paste</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Selamat Datang, Admin Konten</h1>
                  <p className="text-teal-100 text-xs leading-relaxed max-w-xl">
                    Kelola persuratan, distribusi surat, disposisi, arsip, pengumuman, dan agenda kegiatan E-Office.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
              <div className="flex items-center gap-2">
                <span className="material-icons text-amber-600">cloud_off</span>
                Data dashboard belum dapat dimuat. Periksa koneksi lalu coba lagi.
              </div>
              <button type="button" className="btn btn-sm btn-outline-warning" onClick={this.loadDashboardData}>
                Coba lagi
              </button>
            </div>
          )}

          {/* ── Statistic Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <StatCard icon="move_to_inbox" label="Surat Masuk Hari Ini" value={counts.surat_masuk_hari_ini} href="/surat_masuk" loading={is_loading} />
            <StatCard icon="outbox" label="Surat Keluar Hari Ini" value={counts.surat_keluar_hari_ini} href="/surat_keluar" loading={is_loading} />
            <StatCard icon="send" label="Menunggu Distribusi" value={counts.menunggu_distribusi} href="/surat_masuk" loading={is_loading} />
            <StatCard icon="assignment_turned_in" label="Disposisi Aktif" value={counts.disposisi_aktif} href="/disposisi" loading={is_loading} />
            <StatCard icon="archive" label="Total Arsip" value={counts.total_arsip} href="/surat_arsip" loading={is_loading} />
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Chart: Surat Masuk vs Surat Keluar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">bar_chart</span>
                  Grafik Surat Masuk vs Surat Keluar
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
          </div>

          {/* ── Widget Row 1 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

            {/* Surat Masuk Terbaru */}
            <DashboardTableWidget
              title="Surat Masuk Terbaru"
              icon="mark_email_read"
              href="/surat_masuk"
              columns={["Perihal", "Tanggal", "Status"]}
              data={suratMasukList.map(item => ({
                ...item,
                "Perihal": getItemTitle(item),
                "Tanggal": item.tanggal_terima || item.tanggal_surat || item.created_at,
                "Status": item.status,
              }))}
              emptyMessage="Belum ada surat masuk"
              loading={is_loading}
              showAksi={true}
            />

            {/* Distribusi Surat Terbaru */}
            <DashboardTableWidget
              title="Distribusi Surat Terbaru"
              icon="send"
              href="/surat_masuk"
              columns={["Nomor Surat", "Tujuan", "Status", "Tanggal"]}
              data={distribusiList.map(item => ({
                ...item,
                "Nomor Surat": item.nomor_surat || item.kode_surat || "-",
                "Tujuan": item.tujuan_nama || item.kepada || item.tujuan || "-",
                "Status": item.status_distribusi || item.status || "pending",
                "Tanggal": item.tanggal_distribusi || item.created_at,
              }))}
              emptyMessage="Belum ada distribusi"
              loading={is_loading}
              showAksi={true}
            />
          </div>

          {/* ── Widget Row 2 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

            {/* Monitoring Disposisi */}
            <DashboardTableWidget
              title="Monitoring Disposisi"
              icon="assignment"
              href="/disposisi"
              columns={["Perihal", "Tanggal", "Status"]}
              data={disposisiList.map(item => ({
                ...item,
                "Perihal": getItemTitle(item),
                "Tanggal": item.tanggal_disposisi || item.tanggal_mulai || item.created_at,
                "Status": item.status,
              }))}
              emptyMessage="Belum ada disposisi aktif"
              loading={is_loading}
              showAksi={true}
            />

            {/* Agenda Terbaru */}
            <DashboardTableWidget
              title="Agenda Terbaru"
              icon="event"
              href="/agenda"
              columns={["Agenda", "Tanggal", "Status"]}
              data={agendaList.map(item => ({
                ...item,
                "Agenda": getItemTitle(item),
                "Tanggal": item.tanggal_mulai || item.created_at,
                "Status": item.status,
              }))}
              emptyMessage="Belum ada agenda"
              loading={is_loading}
              showAksi={true}
            />
          </div>

          {/* ── Bottom Quick Actions ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-icons text-teal-600 text-lg">apps</span>
              Pengelolaan Konten
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <QuickActionCard icon="account_tree" title="Master Organisasi" href="/master_organisasi" />
              <QuickActionCard icon="description" title="Template Surat" href="/surat_template" />
              <QuickActionCard icon="timeline" title="Tracking Surat" href="/tracking_surat" />
              <QuickActionCard icon="archive" title="Arsip Surat" href="/surat_arsip" />
              <QuickActionCard icon="campaign" title="Pengumuman" href="/pengumuman" />
              <QuickActionCard icon="event" title="Agenda" href="/agenda" />
            </div>
          </div>

        </div>
      </>
    )
  }
}

export default AdminKontenDashboard
