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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

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
  item?.perihal || item?.nomor_surat || item?.perihal_surat || item?.title || item?.nama || "-"

const normalizeApprovalStatus = status => {
  if (!status) return "pending"
  const s = String(status).toLowerCase()
  if (["pending", "waiting", "menunggu", "diajukan"].includes(s)) return "pending"
  if (["approved", "disetujui", "setuju", "acc"].includes(s)) return "approved"
  if (["rejected", "ditolak", "tolak", "revisi"].includes(s)) return "rejected"
  return "pending"
}

// ============================================================
// MAIN COMPONENT
// ============================================================

class PimpinanDashboard extends Component {
  state = {
    counts: {},
    approvalStats: { pending: 0, approved: 0, rejected: 0, rate: 0 },
    approvalStatsPeriod: {
      period: "daily",
      labels: buildDayBuckets().map(b => b.label),
      pending: Array(7).fill(0),
      approved: Array(7).fill(0),
      rejected: Array(7).fill(0),
    },
    approvalTerbaru: [],
    suratMasukTerbaru: [],
    disposisiList: [],
    agendaList: [],
    pengumumanList: [],
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
      const [
        apPending, apApproved, apRejected,
        smToday, da,
        apAll, smResp, dispResp, agenResp, pengResp,
      ] = await Promise.allSettled([
        // Counts
        axios.get(this.buildUrl("surat_approval", { status: "pending" })),
        axios.get(this.buildUrl("surat_approval", { status: "approved" })),
        axios.get(this.buildUrl("surat_approval", { status: "rejected" })),
        // Surat masuk yang didistribusikan kepada pimpinan yang sedang login.
        axios.get(this.buildUrl("surat_distribusi", { recipient_scope: "me" })),
        // Disposisi
        axios.get(this.buildUrl("surat_disposisi", { status: "proses" })),
        // Lists
        axios.get(this.buildUrl("surat_approval", {}, 5)),
        axios.get(this.buildUrl("surat_distribusi", { recipient_scope: "me" }, 5)),
        axios.get(this.buildUrl("surat_disposisi", { status: "proses" }, 5)),
        axios.get(this.buildUrl("agenda_kegiatan", {}, 5)),
        axios.get(this.buildUrl("pengumuman", {}, 5)),
      ])

      const g = res => res.status === "fulfilled" ? this.getCount(res.value) : 0
      const p = res => res.status === "fulfilled" ? this.getPayload(res.value) : []
      const hasDataSource = [apPending, apApproved, apRejected, smToday, da, apAll, smResp, dispResp, agenResp, pengResp]
        .some(result => result.status === "fulfilled")

      const pending = g(apPending)
      const approved = g(apApproved)
      const rejected = g(apRejected)
      const total = pending + approved + rejected
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0

      const counts = {
        approval_menunggu: pending,
        approval_disetujui: approved,
        approval_ditolak: rejected,
        surat_masuk_saya: g(smToday),
        disposisi_aktif: g(da),
      }

      const approvalStats = { pending, approved, rejected, rate }

      const approvalTerbaru = p(apAll).map(item => ({
        ...item,
        nomor_surat: item?.nomor_surat || item?.no_surat || "-",
        status: normalizeApprovalStatus(item?.status),
      }))

      const approvalStatsPeriod = await this.loadApprovalStats(this.state.approvalStatsPeriod.period)

      this.setState({
        counts,
        approvalStats,
        approvalStatsPeriod,
        approvalTerbaru,
        suratMasukTerbaru: p(smResp).map(item => ({
          ...item,
          nomor_surat: item?.surat_masuk?.nomor_surat || item?.suratMasuk?.nomor_surat || item?.nomor_surat || "-",
          pengirim: item?.surat_masuk?.pengirim || item?.suratMasuk?.pengirim || item?.surat_masuk?.asal_surat || item?.suratMasuk?.asal_surat || "-",
        })),
        disposisiList: p(dispResp),
        agendaList: p(agenResp),
        pengumumanList: p(pengResp),
        loadError: !hasDataSource,
        is_loading: false,
      })
    } catch (error) {
      this.setState({ is_loading: false, loadError: true })
    }
  }

  loadApprovalStats = async (period = "daily") => {
    let buckets
    if (period === "weekly") buckets = buildWeekBuckets()
    else if (period === "monthly") buckets = buildMonthBuckets()
    else buckets = buildDayBuckets()

    const stats = {
      labels: buckets.map(b => b.label),
      pending: buckets.map(() => 0),
      approved: buckets.map(() => 0),
      rejected: buckets.map(() => 0),
      period,
    }

    try {
      const resp = await axios.get(this.buildUrl("surat_approval", {}, 1000))
      const rows = this.getPayload(resp)

      const dateFn = period === "weekly" ? getWeekKey
        : period === "monthly" ? getMonthKey
        : d => d.toISOString().slice(0, 10)

      rows.forEach(row => {
        const rd = toDate(row?.tanggal_approval || row?.tanggal_surat || row?.created_at)
        if (!rd) return
        const bk = dateFn(rd)
        const idx = buckets.findIndex(b => b.key === bk)
        if (idx < 0) return
        const s = normalizeApprovalStatus(row?.status)
        if (s === "pending") stats.pending[idx]++
        else if (s === "approved") stats.approved[idx]++
        else if (s === "rejected") stats.rejected[idx]++
      })
    } catch (error) { /* ignore */ }

    return stats
  }

  handlePeriodChange = async period => {
    this.setState({ is_loading: true })
    const approvalStatsPeriod = await this.loadApprovalStats(period)
    this.setState({ approvalStatsPeriod, is_loading: false })
  }

  getApprovalChartData = () => ({
    labels: this.state.approvalStatsPeriod.labels,
    datasets: [
      { label: "Menunggu", data: this.state.approvalStatsPeriod.pending, backgroundColor: "#f59e0b", borderColor: "#f59e0b", borderRadius: 6, borderWidth: 0 },
      { label: "Disetujui", data: this.state.approvalStatsPeriod.approved, backgroundColor: "#16a34a", borderColor: "#16a34a", borderRadius: 6, borderWidth: 0 },
      { label: "Ditolak", data: this.state.approvalStatsPeriod.rejected, backgroundColor: "#ef4444", borderColor: "#ef4444", borderRadius: 6, borderWidth: 0 },
    ],
  })

  getBarOpts = () => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { weight: 600 } } },
      y: { beginAtZero: true, ticks: { precision: 0, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
    },
  })

  render() {
    const { counts, approvalStats, approvalStatsPeriod, approvalTerbaru, suratMasukTerbaru, disposisiList, agendaList, pengumumanList, loadError, is_loading } = this.state

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
                  <span className="material-icons text-white text-2xl">admin_panel_settings</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Selamat Datang, Pimpinan</h1>
                  <p className="text-teal-100 text-xs leading-relaxed max-w-xl">
                    Kelola approval surat, disposisi, monitoring surat, agenda, arsip, serta pantau aktivitas persuratan perusahaan secara real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Statistic Cards ── */}
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <StatCard icon="pending_actions" label="Approval Menunggu" value={counts.approval_menunggu} href="/surat_approval" loading={is_loading} />
            <StatCard icon="check_circle" label="Approval Disetujui" value={counts.approval_disetujui} href="/surat_approval" loading={is_loading} />
            <StatCard icon="cancel" label="Approval Ditolak" value={counts.approval_ditolak} href="/surat_approval" loading={is_loading} />
            <StatCard icon="move_to_inbox" label="Surat Masuk" value={counts.surat_masuk_saya} href="/surat_masuk_pegawai" loading={is_loading} />
            <StatCard icon="assignment" label="Disposisi Aktif" value={counts.disposisi_aktif} href="/disposisi" loading={is_loading} />
          </div>

          {/* Papan Pengumuman */}
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
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Chart: Grafik Approval */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">bar_chart</span>
                  Grafik Approval
                </h3>
                <div className="flex items-center gap-1.5">
                  {periodeButtons.map(btn => (
                    <button
                      key={btn.value}
                      className={`btn btn-sm ${approvalStatsPeriod.period === btn.value ? "btn-info" : "btn-light"}`}
                      onClick={() => this.handlePeriodChange(btn.value)}
                      style={{ borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "2px 10px" }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div style={{ height: 200 }}>
                  <Bar data={this.getApprovalChartData()} options={this.getBarOpts()} />
                </div>
                <div className="d-flex justify-content-center flex-wrap mt-2">
                  {["Menunggu", "Disetujui", "Ditolak"].map((lbl, i) => {
                    const vals = [approvalStats.pending, approvalStats.approved, approvalStats.rejected]
                    return (
                      <div key={lbl} className="mx-2 mb-1 text-xs font-semibold text-slate-500">
                        {lbl}: <span className="text-slate-700">{vals[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row Chart 2: Status Approval Doughnut ── */}
          {false && <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-4">
            {/* Chart: Status Approval Doughnut */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">donut_large</span>
                  Status Approval
                </h3>
              </div>
              <div className="p-4">
                <div style={{ height: 200 }}>
                  <Doughnut data={this.getStatusDoughnutData()} options={this.getDoughnutOpts()} />
                </div>
              </div>
            </div>
          </div>}

          {/* ── Ringkasan Approval ── */}
          {false && <div className="mb-4">
            <ApprovalSummaryCard
              pending={approvalStats.pending}
              disetujui={approvalStats.approved}
              ditolak={approvalStats.rejected}
              rate={approvalStats.rate}
            />
          </div>}

          {/* ── Widget Row 1 ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

            {/* Approval Terbaru */}
            <DashboardTableWidget
              title="Approval Terbaru"
              icon="thumb_up"
              href="/surat_approval"
              columns={["Nomor Surat", "Perihal", "Status", "Tanggal"]}
              data={approvalTerbaru.map(item => ({
                ...item,
                "Nomor Surat": item.nomor_surat || item.no_surat || "-",
                "Perihal": getItemTitle(item),
                "Status": item.status,
                "Tanggal": item.tanggal_approval || item.created_at,
              }))}
              emptyMessage="Belum ada approval"
              loading={is_loading}
              showAksi={false}
            />

            {/* Surat Masuk Terbaru */}
            <DashboardTableWidget
              title="Surat Masuk Terbaru"
              icon="mark_email_read"
              href="/surat_masuk_pegawai"
              columns={["Nomor Surat", "Asal Surat", "Status", "Tanggal"]}
              data={suratMasukTerbaru.map(item => ({
                ...item,
                "Nomor Surat": item.nomor_surat || "-",
                "Asal Surat": item.pengirim || item.asal_surat || item.perihal || "-",
                "Status": item.status,
                "Tanggal": item.tanggal_terima || item.created_at,
              }))}
              emptyMessage="Belum ada surat masuk"
              loading={is_loading}
              showAksi={false}
            />

            {/* Notifikasi */}
          </div>

          {/* ── Widget Row 2 ── */}
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

          {/* ── Bottom Quick Actions ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-icons text-teal-600 text-lg">apps</span>
              Menu Pimpinan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <QuickActionCard icon="thumb_up" title="Approval Surat" href="/surat_approval" />
              <QuickActionCard icon="move_to_inbox" title="Surat Masuk" href="/surat_masuk_pegawai" />
              <QuickActionCard icon="outbox" title="Surat Keluar" href="/surat_keluar" />
              <QuickActionCard icon="assignment" title="Disposisi" href="/disposisi" />
              <QuickActionCard icon="event" title="Agenda" href="/agenda" />
              <QuickActionCard icon="archive" title="Arsip Surat" href="/surat_arsip" />
              <QuickActionCard icon="campaign" title="Pengumuman" href="/pengumuman" />
            </div>
          </div>

        </div>
      </>
    )
  }
}

export default PimpinanDashboard
