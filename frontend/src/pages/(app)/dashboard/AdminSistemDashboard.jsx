"use client"

import { Component } from "react"
import HeaderApp from "components/HeaderApp"
import Link from "components/Link"
import axios from "lib/axios"
import { initAccessMethod, initFilterUrl } from "pages/Utils"
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

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const today = () => new Date().toISOString().slice(0, 10)

const formatDate = value => {
  if (!value) return "-"
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) return String(value).slice(0, 16)
  return dateValue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

const formatDateTime = value => {
  if (!value) return "-"
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) return String(value).slice(0, 16)
  return dateValue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    online: { color: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Online" },
    connected: { color: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Terhubung" },
    offline: { color: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-500", label: "Offline" },
    maintenance: { color: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-500", label: "Maintenance" },
    error: { color: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-500", label: "Error" },
    success: { color: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Berhasil" },
    pending: { color: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-500", label: "Menunggu" },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  )
}

// Chart Card Component
const ChartCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
      <span className="material-icons text-teal-600 text-lg">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

// Server Status Card Component
const ServerStatusItem = ({ label, status }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-600">{label}</span>
    <StatusBadge status={status} />
  </div>
)

// Empty State Component
const EmptyState = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
    <span className="material-icons text-4xl mb-2">{icon || 'inbox'}</span>
    <p className="text-sm">{message || 'Belum ada data'}</p>
  </div>
)

// Quick Action Card Component
const QuickAction = ({ icon, title, href }) => (
  <Link
    href={href}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 transition-colors text-slate-700 hover:text-teal-700 no-underline group"
  >
    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
      <span className="material-icons text-slate-500 group-hover:text-teal-600 text-lg">{icon}</span>
    </div>
    <span className="text-sm font-medium">{title}</span>
  </Link>
)

class AdminSistemDashboard extends Component {
  state = {
    is_loading: true,
    counts: {},
    auditTrail: [],
    backupHistory: [],
    serverStatus: {
      api: 'online',
      database: 'connected',
      storage: 'online',
      mail: 'online',
      cache: 'online',
      queue: 'online',
    },
    systemStats: {
      cpu: 32,
      ram: 58,
      storage: 45,
      db_size: '2.4 GB',
      backup_status: 'success',
      uptime: '99.9%',
    },
    loginStats: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      data: [12, 45, 23, 67, 34, 8, 5],
    },
    activityStats: {
      labels: ['Create', 'Update', 'Delete', 'View'],
      data: [125, 89, 12, 456],
    },
  }

  componentDidMount() {
    this.loadData()
  }

  buildUrl = (endpoint, filter = {}, pagesize = 10) => {
    const requestFilter = {
      paginate: { page: 1, pagesize },
      filter: Object.keys(filter).length > 0 ? filter : {},
    }
    return initFilterUrl({ url: `/api/${endpoint}`, filter: requestFilter })
  }

  getPayloadData = (response) => {
    const payload = response?.data || {}
    if (Array.isArray(payload.data?.data)) return payload.data.data
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload)) return payload
    return []
  }

  loadData = async () => {
    this.setState({ is_loading: true })
    try {
      const [
        userResponse,
        roleResponse,
        auditResponse,
        backupResponse,
      ] = await Promise.allSettled([
        axios.get(this.buildUrl('sys_user', {}, 100)),
        axios.get(this.buildUrl('sys_group', {}, 100)),
        axios.get(this.buildUrl('sys_log', {}, 10)),
        axios.get(this.buildUrl('backup_database', {}, 10)),
      ])

      const getCount = (response) => {
        const payload = response?.data || {}
        const data = payload.data
        if (payload.total_records !== undefined) return payload.total_records
        if (payload.total !== undefined) return payload.total
        if (data?.total !== undefined) return data.total
        if (Array.isArray(data?.data)) return data.data.length
        if (Array.isArray(data)) return data.length
        return 0
      }

      const counts = {
        total_user: userResponse.status === 'fulfilled' ? getCount(userResponse.value) : '-',
        total_role: roleResponse.status === 'fulfilled' ? getCount(roleResponse.value) : '-',
        audit_trail: auditResponse.status === 'fulfilled' ? getCount(auditResponse.value) : '-',
      }

      const auditTrail = auditResponse.status === 'fulfilled' ? this.getPayloadData(auditResponse.value) : []
      const backupHistory = backupResponse.status === 'fulfilled' ? this.getPayloadData(backupResponse.value) : []

      this.setState({
        counts,
        auditTrail,
        backupHistory,
        is_loading: false,
      })
    } catch (error) {
      this.setState({ is_loading: false })
    }
  }

  getLoginChartData = () => ({
    labels: this.state.loginStats.labels,
    datasets: [{
      label: 'Login',
      data: this.state.loginStats.data,
      backgroundColor: '#0d9488',
      borderColor: '#0d9488',
      borderRadius: 6,
      borderWidth: 0,
    }],
  })

  getActivityChartData = () => ({
    labels: this.state.activityStats.labels,
    datasets: [{
      data: this.state.activityStats.data,
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
      borderWidth: 0,
    }],
  })

  getBarOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 600 } } },
      y: { beginAtZero: true, ticks: { precision: 0, color: '#94a3b8' }, grid: { color: '#f1f5f9' } },
    },
  })

  getDoughnutOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, color: '#64748b', padding: 16 } },
    },
  })

  render() {
    const { counts, auditTrail, backupHistory, serverStatus, systemStats, is_loading } = this.state

    return (
      <>
        <HeaderApp title="" is_loading={is_loading} data_btn={[]} />
        <div className="container pl-4 pr-4">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-[#118b9b] to-[#0d6e78] rounded-xl p-5 mb-4 text-white shadow-lg -mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-white text-2xl">admin_panel_settings</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Selamat Datang, Admin Sistem</h1>
                  <p className="text-teal-100 text-xs leading-relaxed max-w-lg">
                    Kelola seluruh konfigurasi sistem, pengguna, keamanan, hak akses, dan monitoring aplikasi E-Office.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">bar_chart</span>
                  Aktivitas Login 7 Hari Terakhir
                </h3>
              </div>
              <div className="p-4">
                <div style={{ height: 200 }}>
                  <Bar data={this.getLoginChartData()} options={this.getBarOptions()} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">donut_large</span>
                  Aktivitas Sistem
                </h3>
              </div>
              <div className="p-4">
                <div style={{ height: 200 }}>
                  <Doughnut data={this.getActivityChartData()} options={this.getDoughnutOptions()} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Server Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">dns</span>
                  Status Server
                </h3>
                <span className="text-xs text-slate-500">Uptime: <span className="text-emerald-600 font-semibold">{systemStats.uptime}</span></span>
              </div>
              <div className="px-4 py-2">
                <ServerStatusItem label="API" status={serverStatus.api} />
                <ServerStatusItem label="Database" status={serverStatus.database} />
                <ServerStatusItem label="Storage" status={serverStatus.storage} />
                <ServerStatusItem label="Mail Server" status={serverStatus.mail} />
                <ServerStatusItem label="Cache" status={serverStatus.cache} />
                <ServerStatusItem label="Queue" status={serverStatus.queue} />
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Database Size</span>
                  <span className="font-semibold">{systemStats.db_size}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">receipt_long</span>
                  Audit Trail Terbaru
                </h3>
                <Link href="/sys_log" className="text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
              </div>
              <div className="overflow-x-auto max-h-56">
                {auditTrail.length === 0 ? (
                  <EmptyState message="Belum ada data" icon="history" />
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Aktivitas</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {auditTrail.slice(0, 5).map((item, index) => (
                        <tr key={item.id_log || item.id || index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-xs text-slate-900">{item.name || item.user?.name || '-'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 truncate max-w-[120px]">{item.activity || item.aksi || item.action || '-'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Backup History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-icons text-teal-600 text-lg">cloud_upload</span>
                  Backup History
                </h3>
                <Link href="/backup_database" className="text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
              </div>
              <div className="overflow-x-auto max-h-56">
                {backupHistory.length === 0 ? (
                  <EmptyState message="Belum ada data" icon="cloud_upload" />
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {backupHistory.slice(0, 5).map((item, index) => (
                        <tr key={item.id_backup || item.id || index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-xs text-slate-600">{formatDate(item.tanggal_backup || item.created_at)}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <StatusBadge status={item.status === 'completed' || item.status === 'success' ? 'success' : 'pending'} />
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            <a href={item.download_url || '#'} className="text-teal-600 hover:text-teal-700">
                              <span className="material-icons text-base">download</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </>
    )
  }
}

export default AdminSistemDashboard
