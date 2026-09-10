"use client"

import { Component } from "react"
import HeaderApp from "components/HeaderApp"
import Link from "components/Link"
import axios from "lib/axios"
import { getEofficeRole, getEofficeRoleLabel, getStoredUserLogin } from "lib/eofficeAccess"
import { initAccessMethod, initFilterUrl } from "pages/Utils"
import AdminSistemDashboard from "./AdminSistemDashboard"
import AdminKontenDashboard from "./AdminKontenDashboard"
import PimpinanDashboard from "./PimpinanDashboard"
import PegawaiDashboard from "./PegawaiDashboard"
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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

const toDate = value => {
  if (!value) return null
  const dateValue = new Date(value)
  return Number.isNaN(dateValue.getTime()) ? null : dateValue
}

const getDateKey = dateValue => {
  if (!dateValue) return ""
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, "0")
  const day = String(dateValue.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getMonthKey = dateValue => {
  if (!dateValue) return ""
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

const buildMonthBuckets = (length = 6) => {
  const now = new Date()
  return Array.from({ length }, (_, index) => {
    const dateValue = new Date(now.getFullYear(), now.getMonth() - (length - 1 - index), 1)
    return {
      key: getMonthKey(dateValue),
      label: `${monthNames[dateValue.getMonth()]} ${String(dateValue.getFullYear()).slice(2)}`,
    }
  })
}

const getCalendarDays = dateValue => {
  const year = dateValue.getFullYear()
  const month = dateValue.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  return days
}

// Dashboard configurations for each role
const dashboardByRole = {
  admin_sistem: {
    metrics: [
      { key: "total_user", label: "Total User", endpoint: "sys_user", href: "/sys_user", icon: "people" },
      { key: "total_role", label: "Total Role", endpoint: "sys_group", href: "/group", icon: "admin_panel_settings" },
      { key: "user_aktif", label: "User Aktif", endpoint: "sys_user", href: "/sys_user", icon: "verified_user", filter: { status: "active" } },
      { key: "login_hari_ini", label: "Login Hari Ini", endpoint: "sys_log", href: "/sys_log", icon: "login", filter: { tanggal: today(), action: "login" } },
    ],
    statsCards: [
      { key: "audit_trail", label: "Audit Trail", endpoint: "sys_log", href: "/sys_log", icon: "history" },
      { key: "backup_database_terakhir", label: "Backup Terakhir", endpoint: "backup_database", href: "/backup_database", icon: "backup", mode: "latestDate" },
      { key: "status_server", label: "Status Server", icon: "dns", mode: "status", okText: "Online" },
      { key: "status_database", label: "Status Database", icon: "storage", mode: "status", okText: "Terhubung" },
    ],
    charts: [
      { title: "Grafik Aktivitas Login", icon: "bar_chart", type: "bar", bars: ["Sen", "Sel", "Rab", "Kam", "Jum"], sourceKeys: ["login_hari_ini", "audit_trail"] },
      { title: "Grafik Aktivitas Sistem", icon: "donut_large", type: "doughnut", bars: ["Create", "Update", "Delete", "View"], sourceKeys: ["audit_trail", "total_user", "total_role"] },
    ],
    lists: [
      { key: "audit_trail_terbaru", title: "Audit Trail Terbaru", endpoint: "sys_log", href: "/sys_log", icon: "receipt_long" },
    ],
    quickActions: [
      { title: "Kelola User", icon: "people", href: "/sys_user" },
      { title: "Hak Akses (RBAC)", icon: "verified_user", href: "/group" },
      { title: "Audit Trail", icon: "history", href: "/sys_log" },
      { title: "Backup Database", icon: "backup", href: "/backup_database" },
    ],
  },
  admin_konten: {
    metrics: [
      { key: "surat_masuk_hari_ini", label: "Surat Masuk Hari Ini", endpoint: "surat_masuk", href: "/surat_masuk", icon: "move_to_inbox", filter: { tanggal_terima: today() } },
      { key: "surat_keluar_hari_ini", label: "Surat Keluar Hari Ini", endpoint: "surat_keluar", href: "/surat_keluar", icon: "outbox", filter: { tanggal_surat: today() } },
      { key: "surat_menunggu_distribusi", label: "Menunggu Distribusi", endpoint: "surat_masuk", href: "/surat_masuk", icon: "send", filter: { status: "pending" } },
      { key: "disposisi_aktif", label: "Disposisi Aktif", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment_turned_in", filter: { status: "proses" } },
      { key: "total_arsip", label: "Total Arsip", endpoint: "surat_arsip", href: "/surat_arsip", icon: "archive" },
    ],
    charts: [
      { title: "Grafik Surat Masuk vs Surat Keluar", icon: "bar_chart", type: "bar", bars: ["Masuk", "Keluar"], sourceKeys: ["surat_masuk_hari_ini", "surat_keluar_hari_ini"] },
      { title: "Status Workflow", icon: "donut_large", type: "doughnut", bars: ["Distribusi", "Approval", "Arsip"], sourceKeys: ["surat_menunggu_distribusi", "disposisi_aktif", "total_arsip"] },
    ],
    lists: [
      { key: "surat_masuk_terbaru", title: "Surat Masuk Terbaru", endpoint: "surat_masuk", href: "/surat_masuk", icon: "mark_email_read" },
      { key: "monitoring_disposisi", title: "Monitoring Disposisi", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
      { key: "berita_pengumuman", title: "Pengumuman Internal", endpoint: "pengumuman", href: "/pengumuman", icon: "campaign", variant: "announcement", pagesize: 5 },
    ],
    quickActions: [
      { title: "Input Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk/add" },
      { title: "Buat Surat Keluar", icon: "outbox", href: "/surat_keluar/add" },
      { title: "Distribusi Surat", icon: "send", href: "/surat_masuk" },
      { title: "Template Surat", icon: "description", href: "/surat_template" },
    ],
  },
  pimpinan: {
    metrics: [
      { key: "menunggu_approval", label: "Menunggu Approval", endpoint: "surat_approval", href: "/surat_approval", icon: "pending_actions", filter: { status: "pending" } },
      { key: "disetujui", label: "Disetujui", endpoint: "surat_approval", href: "/surat_approval", icon: "check_circle", filter: { status: "approved" } },
      { key: "ditolak", label: "Ditolak", endpoint: "surat_approval", href: "/surat_approval", icon: "cancel", filter: { status: "rejected" } },
      { key: "surat_masuk", label: "Surat Masuk", endpoint: "surat_masuk", href: "/surat_masuk", icon: "move_to_inbox" },
    ],
    charts: [
      { title: "Progress Approval", icon: "bar_chart", type: "bar", bars: ["Menunggu", "Disetujui", "Ditolak"], sourceKeys: ["menunggu_approval", "disetujui", "ditolak"] },
    ],
    lists: [
      { key: "approval_terbaru", title: "Daftar Approval Terbaru", endpoint: "surat_approval", href: "/surat_approval", icon: "thumb_up" },
      { key: "surat_masuk_terbaru", title: "Surat Masuk Terbaru", endpoint: "surat_masuk", href: "/surat_masuk", icon: "mark_email_read" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
    ],
    quickActions: [
      { title: "Approval Surat", icon: "thumb_up", href: "/surat_approval" },
      { title: "Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk" },
      { title: "Surat Keluar", icon: "outbox", href: "/surat_keluar" },
      { title: "Disposisi", icon: "assignment_turned_in", href: "/disposisi" },
      { title: "Pengumuman", icon: "campaign", href: "/pengumuman" },
    ],
  },
  // All pegawai roles use the same dashboard configuration
  pegawai_sdm: {
    metrics: [
      { key: "surat_masuk_saya", label: "Surat Masuk Saya", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "move_to_inbox" },
      { key: "draft_surat_saya", label: "Draft Surat Saya", endpoint: "surat_keluar", href: "/surat_keluar", icon: "edit_document", filter: { status: "draft" } },
      { key: "disposisi_saya", label: "Disposisi Saya", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment_turned_in" },
      { key: "arsip_saya", label: "Arsip Saya", endpoint: "surat_arsip", href: "/surat_arsip", icon: "archive" },
      { key: "tugas_selesai", label: "Tugas Selesai", endpoint: "surat_disposisi", href: "/disposisi", icon: "task_alt", filter: { status: "selesai" } },
    ],
    charts: [
      { title: "Progress Disposisi", icon: "bar_chart", type: "bar", bars: ["Disposisi", "Selesai"], sourceKeys: ["disposisi_saya", "tugas_selesai"] },
    ],
    lists: [
      { key: "surat_terbaru", title: "Surat Terbaru", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "mark_email_read" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
      { key: "berita_pengumuman", title: "Pengumuman Internal", endpoint: "pengumuman", href: "/pengumuman", icon: "campaign", variant: "announcement", pagesize: 5 },
    ],
    quickActions: [
      { title: "Buat Surat", icon: "edit_document", href: "/surat_keluar/add" },
      { title: "Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk_pegawai" },
      { title: "Surat Keluar", icon: "outbox", href: "/surat_keluar" },
      { title: "Disposisi", icon: "assignment_turned_in", href: "/disposisi" },
      { title: "Arsip", icon: "archive", href: "/surat_arsip" },
      { title: "Pengumuman", icon: "campaign", href: "/pengumuman" },
    ],
  },
  pegawai_keuangan: {
    metrics: [
      { key: "surat_masuk_saya", label: "Surat Masuk Saya", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "move_to_inbox" },
      { key: "draft_surat_saya", label: "Draft Surat Saya", endpoint: "surat_keluar", href: "/surat_keluar", icon: "edit_document", filter: { status: "draft" } },
      { key: "disposisi_saya", label: "Disposisi Saya", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment_turned_in" },
      { key: "arsip_saya", label: "Arsip Saya", endpoint: "surat_arsip", href: "/surat_arsip", icon: "archive" },
      { key: "tugas_selesai", label: "Tugas Selesai", endpoint: "surat_disposisi", href: "/disposisi", icon: "task_alt", filter: { status: "selesai" } },
    ],
    charts: [
      { title: "Progress Disposisi", icon: "bar_chart", type: "bar", bars: ["Disposisi", "Selesai"], sourceKeys: ["disposisi_saya", "tugas_selesai"] },
    ],
    lists: [
      { key: "surat_terbaru", title: "Surat Terbaru", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "mark_email_read" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
      { key: "berita_pengumuman", title: "Pengumuman Internal", endpoint: "pengumuman", href: "/pengumuman", icon: "campaign", variant: "announcement", pagesize: 5 },
    ],
    quickActions: [
      { title: "Buat Surat", icon: "edit_document", href: "/surat_keluar/add" },
      { title: "Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk_pegawai" },
      { title: "Surat Keluar", icon: "outbox", href: "/surat_keluar" },
      { title: "Disposisi", icon: "assignment_turned_in", href: "/disposisi" },
      { title: "Arsip", icon: "archive", href: "/surat_arsip" },
      { title: "Pengumuman", icon: "campaign", href: "/pengumuman" },
    ],
  },
  pegawai_pemasaran: {
    metrics: [
      { key: "surat_masuk_saya", label: "Surat Masuk Saya", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "move_to_inbox" },
      { key: "draft_surat_saya", label: "Draft Surat Saya", endpoint: "surat_keluar", href: "/surat_keluar", icon: "edit_document", filter: { status: "draft" } },
      { key: "disposisi_saya", label: "Disposisi Saya", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment_turned_in" },
      { key: "arsip_saya", label: "Arsip Saya", endpoint: "surat_arsip", href: "/surat_arsip", icon: "archive" },
      { key: "tugas_selesai", label: "Tugas Selesai", endpoint: "surat_disposisi", href: "/disposisi", icon: "task_alt", filter: { status: "selesai" } },
    ],
    charts: [
      { title: "Progress Disposisi", icon: "bar_chart", type: "bar", bars: ["Disposisi", "Selesai"], sourceKeys: ["disposisi_saya", "tugas_selesai"] },
    ],
    lists: [
      { key: "surat_terbaru", title: "Surat Terbaru", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "mark_email_read" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
      { key: "berita_pengumuman", title: "Pengumuman Internal", endpoint: "pengumuman", href: "/pengumuman", icon: "campaign", variant: "announcement", pagesize: 5 },
    ],
    quickActions: [
      { title: "Buat Surat", icon: "edit_document", href: "/surat_keluar/add" },
      { title: "Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk_pegawai" },
      { title: "Surat Keluar", icon: "outbox", href: "/surat_keluar" },
      { title: "Disposisi", icon: "assignment_turned_in", href: "/disposisi" },
      { title: "Arsip", icon: "archive", href: "/surat_arsip" },
      { title: "Pengumuman", icon: "campaign", href: "/pengumuman" },
    ],
  },
  pegawai_operasional: {
    metrics: [
      { key: "surat_masuk_saya", label: "Surat Masuk Saya", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "move_to_inbox" },
      { key: "draft_surat_saya", label: "Draft Surat Saya", endpoint: "surat_keluar", href: "/surat_keluar", icon: "edit_document", filter: { status: "draft" } },
      { key: "disposisi_saya", label: "Disposisi Saya", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment_turned_in" },
      { key: "arsip_saya", label: "Arsip Saya", endpoint: "surat_arsip", href: "/surat_arsip", icon: "archive" },
      { key: "tugas_selesai", label: "Tugas Selesai", endpoint: "surat_disposisi", href: "/disposisi", icon: "task_alt", filter: { status: "selesai" } },
    ],
    charts: [
      { title: "Progress Disposisi", icon: "bar_chart", type: "bar", bars: ["Disposisi", "Selesai"], sourceKeys: ["disposisi_saya", "tugas_selesai"] },
    ],
    lists: [
      { key: "surat_terbaru", title: "Surat Terbaru", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "mark_email_read" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
      { key: "berita_pengumuman", title: "Pengumuman Internal", endpoint: "pengumuman", href: "/pengumuman", icon: "campaign", variant: "announcement", pagesize: 5 },
    ],
    quickActions: [
      { title: "Buat Surat", icon: "edit_document", href: "/surat_keluar/add" },
      { title: "Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk_pegawai" },
      { title: "Surat Keluar", icon: "outbox", href: "/surat_keluar" },
      { title: "Disposisi", icon: "assignment_turned_in", href: "/disposisi" },
      { title: "Arsip", icon: "archive", href: "/surat_arsip" },
      { title: "Pengumuman", icon: "campaign", href: "/pengumuman" },
    ],
  },
  pegawai: {
    metrics: [
      { key: "surat_masuk_saya", label: "Surat Masuk Saya", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "move_to_inbox" },
      { key: "draft_surat_saya", label: "Draft Surat Saya", endpoint: "surat_keluar", href: "/surat_keluar", icon: "edit_document", filter: { status: "draft" } },
      { key: "disposisi_saya", label: "Disposisi Saya", endpoint: "surat_disposisi", href: "/disposisi", icon: "assignment_turned_in" },
      { key: "arsip_saya", label: "Arsip Saya", endpoint: "surat_arsip", href: "/surat_arsip", icon: "archive" },
      { key: "tugas_selesai", label: "Tugas Selesai", endpoint: "surat_disposisi", href: "/disposisi", icon: "task_alt", filter: { status: "selesai" } },
    ],
    charts: [
      { title: "Progress Disposisi", icon: "bar_chart", type: "bar", bars: ["Disposisi", "Selesai"], sourceKeys: ["disposisi_saya", "tugas_selesai"] },
    ],
    lists: [
      { key: "surat_terbaru", title: "Surat Terbaru", endpoint: "surat_distribusi", href: "/surat_masuk_pegawai", icon: "mark_email_read" },
      { key: "kalender_agenda", title: "Kalender Agenda", endpoint: "agenda_kegiatan", href: "/agenda", icon: "event", variant: "calendar", pagesize: 30 },
      { key: "berita_pengumuman", title: "Pengumuman Internal", endpoint: "pengumuman", href: "/pengumuman", icon: "campaign", variant: "announcement", pagesize: 5 },
    ],
    quickActions: [
      { title: "Buat Surat", icon: "edit_document", href: "/surat_keluar/add" },
      { title: "Surat Masuk", icon: "move_to_inbox", href: "/surat_masuk_pegawai" },
      { title: "Surat Keluar", icon: "outbox", href: "/surat_keluar" },
      { title: "Disposisi", icon: "assignment_turned_in", href: "/disposisi" },
      { title: "Arsip", icon: "archive", href: "/surat_arsip" },
      { title: "Pengumuman", icon: "campaign", href: "/pengumuman" },
    ],
  },
}

const getPayloadData = response => {
  const payload = response?.data || {}
  if (Array.isArray(payload.data?.data)) return payload.data.data
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

const getCount = response => {
  const payload = response?.data || {}
  const data = payload.data

  if (payload.total_records !== undefined) return payload.total_records
  if (payload.total !== undefined) return payload.total
  if (data?.total !== undefined) return data.total
  if (Array.isArray(data?.data)) return data.data.length
  if (Array.isArray(data)) return data.length

  return 0
}

const formatDate = value => {
  if (!value) return "-"
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) return String(value).slice(0, 16)
  return dateValue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

const getItemTitle = item =>
  item?.perihal ||
  item?.judul ||
  item?.title ||
  item?.nama_agenda ||
  item?.aksi ||
  item?.action ||
  item?.keterangan ||
  item?.nomor_surat ||
  item?.filename ||
  item?.name ||
  "-"

const getItemMeta = item =>
  item?.status ||
  item?.tanggal_terima ||
  item?.tanggal_surat ||
  item?.tanggal_mulai ||
  item?.tanggal_publish ||
  item?.published_at ||
  item?.created_at ||
  item?.updated_at ||
  item?.email ||
  ""

const getItemDate = item =>
  toDate(
    item?.tanggal_mulai ||
    item?.tanggal_terima ||
    item?.tanggal_surat ||
    item?.published_at ||
    item?.tanggal_publish ||
    item?.created_at ||
    item?.updated_at
  )

const getAnnouncementBody = item =>
  item?.konten ||
  item?.isi ||
  item?.deskripsi ||
  item?.summary ||
  ""

const getAnnouncementDate = item =>
  item?.published_at ||
  item?.tanggal_publish ||
  item?.created_at ||
  item?.updated_at ||
  ""

class Dashboard extends Component {
  titlePage = "Dashboard"

  state = {
    access_method: {},
    counts: {},
    lists: {},
    mailStats: {
      labels: buildMonthBuckets().map(item => item.label),
      masuk: Array(6).fill(0),
      keluar: Array(6).fill(0),
    },
    is_loading: false,
    user_login: {},
  }

  componentDidMount() {
    this.init()
  }

  init = async () => {
    const user_login = getStoredUserLogin()
    const { access_method } = await initAccessMethod(this.props.pathaccess || "dashboard")

    this.setState({ access_method, user_login }, () => {
      this.loadDashboardData()
    })
  }

  // Override render untuk Admin Sistem dan Admin Konten
  render() {
    const role = getEofficeRole(this.state.user_login)

    // Jika role adalah admin_sistem, tampilkan Admin Sistem Dashboard
    if (role === 'admin_sistem') {
      return <AdminSistemDashboard />
    }

    // Jika role adalah admin_konten, tampilkan Admin Konten Dashboard
    if (role === 'admin_konten') {
      return <AdminKontenDashboard />
    }

    // Jika role adalah pimpinan, tampilkan Pimpinan Dashboard
    if (role === 'pimpinan') {
      return <PimpinanDashboard />
    }

    // Jika role adalah pegawai, tampilkan unified Pegawai Dashboard
    if (['pegawai_operasional', 'pegawai', 'pegawai_sdm', 'pegawai_keuangan', 'pegawai_pemasaran'].includes(role)) {
      return <PegawaiDashboard roleName={role} />
    }

    // Render dashboard biasa untuk role lain
    return this.renderDashboard()
  }

  buildUrl = (endpoint, filter = {}, pagesize = 1, order = "") => {
    const requestFilter = {
      paginate: {
        page: 1,
        pagesize,
      },
    }

    if (filter && Object.keys(filter).length > 0) {
      requestFilter.filter = filter
    }

    if (order) {
      requestFilter.order = order
    }

    return initFilterUrl({
      url: `/api/${endpoint}`,
      filter: requestFilter,
    })
  }

  loadMetric = async item => {
    if (item.mode === "status") {
      return [item.key, item.okText || "Aktif"]
    }

    if (!item.endpoint) {
      return [item.key, "-"]
    }

    const url = this.buildUrl(item.endpoint, item.filter)

    try {
      const response = await axios.get(url)
      const data = getPayloadData(response)

      if (item.mode === "latestDate") {
        const latest = data[0] || {}
        return [item.key, formatDate(latest.created_at || latest.updated_at || latest.tanggal_backup || latest.filename)]
      }

      return [item.key, getCount(response)]
    } catch (error) {
      return [item.key, "-"]
    }
  }

  loadList = async item => {
    try {
      const response = await axios.get(this.buildUrl(item.endpoint, item.filter, item.pagesize || 5))
      return [item.key, getPayloadData(response).slice(0, item.pagesize || 5)]
    } catch (error) {
      return [item.key, []]
    }
  }

  loadMailStats = async () => {
    const buckets = buildMonthBuckets()
    const stats = {
      labels: buckets.map(item => item.label),
      masuk: buckets.map(() => 0),
      keluar: buckets.map(() => 0),
    }

    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        axios.get(this.buildUrl("surat_masuk", {}, 1000)),
        axios.get(this.buildUrl("surat_keluar", {}, 1000)),
      ])

      const addToStats = (rows, key, dateFields) => {
        rows.forEach(row => {
          const recordDate = toDate(dateFields.map(field => row?.[field]).find(Boolean))
          const monthKey = getMonthKey(recordDate)
          const bucketIndex = buckets.findIndex(item => item.key === monthKey)

          if (bucketIndex >= 0) {
            stats[key][bucketIndex] += 1
          }
        })
      }

      addToStats(getPayloadData(incomingResponse), "masuk", ["tanggal_terima", "tanggal_surat", "created_at"])
      addToStats(getPayloadData(outgoingResponse), "keluar", ["tanggal_surat", "created_at"])

      return stats
    } catch (error) {
      return stats
    }
  }

  loadDashboardData = async () => {
    const role = getEofficeRole(this.state.user_login)
    const config = dashboardByRole[role] || dashboardByRole.pegawai

    this.setState({ is_loading: true })

    const [metrics, lists, mailStats] = await Promise.all([
      Promise.all(config.metrics.map(this.loadMetric)),
      Promise.all(config.lists.map(this.loadList)),
      this.loadMailStats(),
    ])

    // Load stats cards if available
    let statsData = []
    if (config.statsCards) {
      statsData = await Promise.all(config.statsCards.map(this.loadMetric))
    }

    this.setState({
      counts: {
        ...Object.fromEntries(metrics),
        ...Object.fromEntries(statsData)
      },
      lists: Object.fromEntries(lists),
      mailStats,
      is_loading: false,
    })
  }

  getChartValues = chart => {
    return chart.bars.map((_, index) => {
      const sourceKey = chart.sourceKeys[index] || chart.sourceKeys[index % chart.sourceKeys.length]
      const rawValue = this.state.counts[sourceKey]
      const numericValue = Number(rawValue)
      return Number.isFinite(numericValue) ? numericValue : 0
    })
  }

  getChartData = chart => {
    const values = this.getChartValues(chart)
    const fallbackValues = values.every(value => value === 0) ? values.map(() => 1) : values
    const colors = ["#118b9b", "#16a34a", "#f59e0b", "#64748b", "#8b5cf6"]

    return {
      labels: chart.bars,
      datasets: [
        {
          label: chart.title,
          data: fallbackValues,
          backgroundColor: colors.slice(0, chart.bars.length),
          borderColor: colors.slice(0, chart.bars.length),
          borderRadius: chart.type === "bar" ? 8 : 0,
          borderWidth: chart.type === "bar" ? 0 : 2,
        },
      ],
    }
  }

  getBarOptions = chart => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => `${context.label}: ${this.getChartValues(chart)[context.dataIndex] || 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#5f6b7a", font: { weight: 600 } },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: "#7b8794" },
        grid: { color: "#edf2f7" },
      },
    },
  })

  getDoughnutOptions = chart => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, color: "#42526e", padding: 14 },
      },
      tooltip: {
        callbacks: {
          label: context => `${context.label}: ${this.getChartValues(chart)[context.dataIndex] || 0}`,
        },
      },
    },
  })

  renderChartLegend = chart => {
    const values = this.getChartValues(chart)

    return (
      <div className="d-flex justify-content-center flex-wrap mt-2">
        {chart.bars.map((label, index) => (
          <div key={label} className="mx-2 mb-1" style={{ fontSize: 12, color: "#5f6b7a", fontWeight: 600 }}>
            {label}: {values[index]}
          </div>
        ))}
      </div>
    )
  }

  renderMetricCard = item => (
    <Link
      key={item.key}
      href={item.href || '#'}
      className="card card-dashboard text-decoration-none h-100"
      style={{ display: "block", color: "inherit", borderRadius: 12, overflow: "hidden" }}
    >
      <div className="card-body d-flex align-items-center">
        <div
          className="d-flex align-items-center justify-content-center mr-3"
          style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #e7f7fa 0%, #d4f1f4 100%)", color: "#118b9b", flex: "0 0 46px" }}
        >
          <span className="material-icons">{item.icon}</span>
        </div>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#5f6b7a", fontWeight: 600 }}>{item.label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, wordBreak: "break-word" }}>
            {this.state.counts[item.key] ?? 0}
          </div>
        </div>
      </div>
    </Link>
  )

  renderStatsCard = item => (
    <div
      key={item.key}
      className="card card-dashboard h-100"
      style={{ borderRadius: 12, overflow: "hidden" }}
    >
      <div className="card-body d-flex align-items-center">
        <div
          className="d-flex align-items-center justify-content-center mr-3"
          style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #e7f7fa 0%, #d4f1f4 100%)", color: "#118b9b", flex: "0 0 46px" }}
        >
          <span className="material-icons">{item.icon}</span>
        </div>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#5f6b7a", fontWeight: 600 }}>{item.label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, wordBreak: "break-word" }}>
            {this.state.counts[item.key] ?? "-"}
          </div>
        </div>
      </div>
    </div>
  )

  renderChartCard = chart => {
    const chartData = this.getChartData(chart)

    return (
      <div key={chart.title} className="card card-dashboard h-100" style={{ borderRadius: 12 }}>
        <div className="card-header bold d-flex align-items-center">
          <span className="material-icons mr-2" style={{ color: "#118b9b" }}>{chart.icon}</span>
          {chart.title}
        </div>
        <div className="card-body">
          <div style={{ height: 230, position: "relative" }}>
            {chart.type === "doughnut" ? (
              <Doughnut data={chartData} options={this.getDoughnutOptions(chart)} />
            ) : (
              <Bar data={chartData} options={this.getBarOptions(chart)} />
            )}
          </div>
          {this.renderChartLegend(chart)}
        </div>
      </div>
    )
  }

  getMailStatsChartData = () => ({
    labels: this.state.mailStats.labels,
    datasets: [
      {
        label: "Surat Masuk",
        data: this.state.mailStats.masuk,
        backgroundColor: "#118b9b",
        borderColor: "#118b9b",
        borderRadius: 8,
        borderWidth: 0,
      },
      {
        label: "Surat Keluar",
        data: this.state.mailStats.keluar,
        backgroundColor: "#f59e0b",
        borderColor: "#f59e0b",
        borderRadius: 8,
        borderWidth: 0,
      },
    ],
  })

  getMailStatsOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, color: "#42526e", padding: 14 },
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${context.raw || 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#5f6b7a", font: { weight: 600 } },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: "#7b8794" },
        grid: { color: "#edf2f7" },
      },
    },
  })

  renderMailStatsCard = () => {
    const totalMasuk = this.state.mailStats.masuk.reduce((total, value) => total + value, 0)
    const totalKeluar = this.state.mailStats.keluar.reduce((total, value) => total + value, 0)

    return (
      <div className="card card-dashboard h-100" style={{ borderRadius: 12 }}>
        <div className="card-header bold d-flex align-items-center justify-content-between flex-wrap">
          <div className="d-flex align-items-center">
            <span className="material-icons mr-2" style={{ color: "#118b9b" }}>stacked_bar_chart</span>
            Statistik Surat Masuk & Surat Keluar
          </div>
          <div className="d-flex align-items-center mt-2 mt-md-0" style={{ gap: 12, fontSize: 12, color: "#5f6b7a", fontWeight: 700 }}>
            <span>Masuk: {totalMasuk}</span>
            <span>Keluar: {totalKeluar}</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ height: 280, position: "relative" }}>
            <Bar data={this.getMailStatsChartData()} options={this.getMailStatsOptions()} />
          </div>
        </div>
      </div>
    )
  }

  renderCalendarCard = item => {
    const data = this.state.lists[item.key] || []
    const currentMonth = new Date()
    const calendarDays = getCalendarDays(currentMonth)
    const todayKey = getDateKey(new Date())
    const eventsByDate = data.reduce((result, row) => {
      const dateValue = getItemDate(row)
      const key = getDateKey(dateValue)

      if (!key) return result

      return {
        ...result,
        [key]: [...(result[key] || []), row],
      }
    }, {})
    const upcoming = data
      .map(row => ({ row, dateValue: getItemDate(row) }))
      .filter(itemData => itemData.dateValue)
      .sort((a, b) => a.dateValue - b.dateValue)
      .slice(0, 4)

    return (
      <div key={item.key} className="card card-dashboard h-100" style={{ borderRadius: 12 }}>
        <div className="card-header bold d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <span className="material-icons mr-2" style={{ color: "#118b9b" }}>{item.icon}</span>
            {item.title}
          </div>
          <Link href={item.href} style={{ fontSize: 12, color: "#118b9b", fontWeight: 700 }}>Kelola</Link>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div style={{ fontWeight: 800, color: "#263238" }}>
              {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              {data.length} agenda
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            {dayNames.map(day => (
              <div key={day} className="text-center" style={{ fontSize: 11, color: "#7b8794", fontWeight: 800 }}>
                {day}
              </div>
            ))}
            {calendarDays.map((dateValue, index) => {
              const key = getDateKey(dateValue)
              const hasEvent = Boolean(eventsByDate[key]?.length)
              const isToday = key === todayKey

              return (
                <div
                  key={key || `empty-${index}`}
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    minHeight: 34,
                    borderRadius: 8,
                    background: !dateValue ? "transparent" : isToday ? "#118b9b" : hasEvent ? "#e7f7fa" : "#f8fafc",
                    color: isToday ? "#fff" : hasEvent ? "#0f766e" : "#334155",
                    fontWeight: hasEvent || isToday ? 800 : 600,
                    border: hasEvent && !isToday ? "1px solid #a7e3e8" : "1px solid transparent",
                    position: "relative",
                  }}
                  title={hasEvent ? eventsByDate[key].map(row => getItemTitle(row)).join(", ") : ""}
                >
                  {dateValue ? dateValue.getDate() : ""}
                  {hasEvent ? (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        background: isToday ? "#fff" : "#118b9b",
                        position: "absolute",
                        bottom: 5,
                      }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
          <div className="mt-3">
            {upcoming.length ? upcoming.map(({ row, dateValue }, index) => (
              <div key={row.id_agenda_kegiatan || row.id || index} className="d-flex align-items-start mb-2">
                <div
                  className="text-center mr-3"
                  style={{ width: 42, borderRadius: 8, background: "#f1f5f9", color: "#118b9b", overflow: "hidden", flex: "0 0 42px" }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, background: "#dff5f8", padding: "2px 0" }}>
                    {monthNames[dateValue.getMonth()]}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, lineHeight: "24px" }}>
                    {dateValue.getDate()}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "#263238", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {getItemTitle(row)}
                  </div>
                  <div style={{ fontSize: 12, color: "#7b8794" }}>{row?.lokasi || formatDate(row?.tanggal_mulai)}</div>
                </div>
              </div>
            )) : (
              <div style={{ color: "#7b8794", fontSize: 13 }}>Belum ada agenda bulan ini.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  renderAnnouncementCard = item => {
    const data = this.state.lists[item.key] || []

    return (
      <div key={item.key} className="card card-dashboard h-100" style={{ borderRadius: 12 }}>
        <div className="card-header bold d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <span className="material-icons mr-2" style={{ color: "#118b9b" }}>{item.icon}</span>
            {item.title}
          </div>
          <Link href={item.href} style={{ fontSize: 12, color: "#118b9b", fontWeight: 700 }}>Kelola</Link>
        </div>
        <div className="card-body">
          {data.length === 0 ? (
            <div style={{ color: "#7b8794", fontSize: 13 }}>Belum ada pengumuman.</div>
          ) : (
            data.map((row, index) => (
              <div key={row.id_pengumuman || row.id || index} className="mb-3 pb-3" style={{ borderBottom: index === data.length - 1 ? "none" : "1px solid #edf2f7" }}>
                <div className="d-flex align-items-start justify-content-between" style={{ gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: "#263238", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getItemTitle(row)}
                    </div>
                    <div style={{ color: "#7b8794", fontSize: 12 }}>
                      {row?.target_role || "semua"} {getAnnouncementDate(row) ? `- ${formatDate(getAnnouncementDate(row))}` : ""}
                    </div>
                  </div>
                  <span style={{ borderRadius: 999, background: "#e7f7fa", color: "#118b9b", padding: "3px 8px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                    {row?.status || "draft"}
                  </span>
                </div>
                <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
                  {getAnnouncementBody(row).slice(0, 140) || "-"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  renderListCard = item => {
    if (item.variant === "calendar") return this.renderCalendarCard(item)
    if (item.variant === "announcement") return this.renderAnnouncementCard(item)

    const data = this.state.lists[item.key] || []

    return (
      <div key={item.key} className="card card-dashboard h-100" style={{ borderRadius: 12 }}>
        <div className="card-header bold d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <span className="material-icons mr-2" style={{ color: "#118b9b" }}>{item.icon}</span>
            {item.title}
          </div>
          <Link href={item.href} style={{ fontSize: 12, color: "#118b9b", fontWeight: 700 }}>Lihat</Link>
        </div>
        <div className="card-body">
          {data.length === 0 ? (
            <div style={{ color: "#7b8794", fontSize: 13 }}>Belum ada data.</div>
          ) : (
            data.map((row, index) => (
              <div key={row.id || row.id_log || row.id_surat || row.id_agenda || index} className="d-flex align-items-start mb-3">
                <div
                  className="d-flex align-items-center justify-content-center mr-3"
                  style={{ width: 30, height: 30, borderRadius: 8, background: "#f1f5f9", color: "#118b9b", flex: "0 0 30px", fontWeight: 700 }}
                >
                  {index + 1}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#263238", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {getItemTitle(row)}
                  </div>
                  <div style={{ color: "#7b8794", fontSize: 12 }}>{getItemMeta(row) || "-"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  renderActionCard = item => (
    <Link
      key={item.title}
      href={item.href}
      className="card card-dashboard text-decoration-none mb-3"
      style={{ borderRadius: 12, color: "inherit", display: "block" }}
    >
      <div className="card-body d-flex align-items-center">
        <span className="material-icons mr-3" style={{ color: "#118b9b" }}>{item.icon}</span>
        <div className="flex-1" style={{ fontWeight: 700 }}>{item.title}</div>
        <span className="material-icons" style={{ color: "#9aa4b2", fontSize: 20 }}>arrow_forward</span>
      </div>
    </Link>
  )

  renderInformationManagementPanel = () => (
    <div className="card card-dashboard mb-3" style={{ borderRadius: 12 }}>
      <div className="card-header bold d-flex align-items-center">
        <span className="material-icons mr-2" style={{ color: "#118b9b" }}>dashboard_customize</span>
        Pengelolaan Informasi Internal
      </div>
      <div className="card-body">
        {[
          { title: "Pengumuman Internal", subtitle: "Kelola informasi untuk user aplikasi", icon: "campaign", href: "/pengumuman" },
          { title: "Kalender Agenda", subtitle: "Kelola agenda kegiatan internal", icon: "event", href: "/agenda" },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="d-flex align-items-center text-decoration-none mb-3"
            style={{ color: "inherit", minHeight: 52 }}
          >
            <div
              className="d-flex align-items-center justify-content-center mr-3"
              style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #e7f7fa 0%, #d4f1f4 100%)", color: "#118b9b", flex: "0 0 42px" }}
            >
              <span className="material-icons">{item.icon}</span>
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: "#263238" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#7b8794", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.subtitle}</div>
            </div>
            <span className="material-icons" style={{ color: "#9aa4b2", fontSize: 20 }}>arrow_forward</span>
          </Link>
        ))}
      </div>
    </div>
  )

  renderDashboard() {
    const role = getEofficeRole(this.state.user_login)
    const roleLabel = getEofficeRoleLabel(role)
    const config = dashboardByRole[role] || dashboardByRole.pegawai

    return (
      <>
        <HeaderApp title={this.titlePage} is_loading={this.state.is_loading} data_btn={[]} />
        <div className="container pl-4 pr-4">
          {/* Welcome Card */}
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="card card-dashboard" style={{ borderRadius: 12 }}>
                <div className="card-body d-flex align-items-center justify-content-between flex-wrap">
                  <div>
                    <div style={{ fontSize: 13, color: "#118b9b", fontWeight: 700 }}>{roleLabel}</div>
                    <h4 className="mb-0" style={{ fontWeight: 700 }}>Dashboard {roleLabel}</h4>
                  </div>
                  <div
                    className="d-flex align-items-center justify-content-center mt-3 mt-md-0"
                    style={{ width: 58, height: 58, borderRadius: 12, background: "linear-gradient(135deg, #118b9b 0%, #0d6e78 100%)", color: "#fff" }}
                  >
                    <span className="material-icons" style={{ fontSize: 34 }}>dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Metrics Cards */}
          <div className="row mb-3">
            {config.metrics.map(item => (
              <div className="col-xl-3 col-lg-4 col-md-6 mb-3" key={item.key}>
                {this.renderMetricCard(item)}
              </div>
            ))}
          </div>

          {/* Stats Cards for Admin Sistem */}
          {config.statsCards && config.statsCards.length > 0 && (
            <div className="row mb-3">
              {config.statsCards.map(item => (
                <div className="col-xl-3 col-lg-4 col-md-6 mb-3" key={item.key}>
                  {this.renderStatsCard(item)}
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="row mb-3">
            {config.charts.map(chart => (
              <div className="col-lg-6 mb-3" key={chart.title}>
                {this.renderChartCard(chart)}
              </div>
            ))}
          </div>

          {/* Mail Statistics */}
          <div className="row mb-3">
            <div className="col-md-12">
              {this.renderMailStatsCard()}
            </div>
          </div>

          {/* Lists and Quick Actions */}
          <div className="row">
            <div className="col-lg-8">
              <div className="row">
                {config.lists.map(item => (
                  <div className="col-md-6 mb-3" key={item.key}>
                    {this.renderListCard(item)}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-4 mb-3">
              {this.renderInformationManagementPanel()}
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default Dashboard
