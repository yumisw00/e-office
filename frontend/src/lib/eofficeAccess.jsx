const normalizeText = value => String(value || '').toLowerCase()

const eofficePageAliases = {
    hak_akses_role: 'group',
    sys_group_menu: 'group',
    manajemen_menu: 'sys_menu',
    manajemen_pengguna: 'sys_user',
    pengaturan_sistem: 'sys_setting',
    keamanan_sistem: 'sys_setting',
    log_sistem: 'sys_log',
    log_sistem_audit: 'sys_log',
    pegawai_surat_masuk: 'surat_masuk_pegawai',
    arsip_surat: 'surat_arsip',
    pengarsipan: 'surat_arsip',
    template_surat: 'surat_template',
    news_announcement: 'pengumuman',
    agenda_kegiatan: 'agenda',
    pelaporan_disposisi: 'disposisi',
}

export const resolveEofficePage = page => {
    const cleanPage = String(page || '').replace(/^\/+/, '').split(/[/?#]/)[0]
    return eofficePageAliases[cleanPage] || cleanPage
}

export const eofficeDevPages = [
    'surat_masuk',
    'surat_masuk_pegawai',
    'surat_keluar',
    'disposisi',
    'pelaporan disposisi',
    'surat_arsip',
    'backup_database',
    'surat_template',
    'tracking_surat',
    'notifikasi',
    'agenda',
    'agenda kegiatan',
    'pengumuman',
    'master_organisasi',
]

export const getStoredUserLogin = () => {
    try {
        return JSON.parse(localStorage.getItem('user_login') || '{}')
    } catch (error) {
        return {}
    }
}

// Check if user is an approver based on workflow
export const isUserApprover = (user = getStoredUserLogin()) => {
    // Check is_approver flag
    if (user?.is_approver === true || user?.is_approver === 1 || user?.is_approver === '1') {
        return true
    }

    // Check nested user object
    const nestedUser = user?.user || {}
    if (nestedUser?.is_approver === true || nestedUser?.is_approver === 1 || nestedUser?.is_approver === '1') {
        return true
    }

    // Check all groups for is_approver flag
    const userGroups = user?.groups || []
    for (const group of userGroups) {
        if (group?.is_approver === true || group?.is_approver === 1 || group?.is_approver === '1') {
            return true
        }
    }

    // Check if role contains approver-related keywords
    const allRoleValues = [
        user?.nama_group,
        user?.group_name,
        user?.group?.nama,
        user?.role,
        user?.nama_role,
        user?.nama_jabatan,
        user?.jabatan,
        nestedUser?.nama_group,
        nestedUser?.group_name,
        nestedUser?.group?.nama,
        nestedUser?.role,
        nestedUser?.nama_role,
        nestedUser?.nama_jabatan,
        nestedUser?.jabatan,
        nestedUser?.name,
        user?.name,
        ...(userGroups.map(g => g?.nama_group || g?.nama || g?.group_name || g?.role || g?.nama_role || g?.nama_jabatan || g?.jabatan || '')),
    ]

    const groupText = normalizeText(allRoleValues.filter(Boolean).join(' '))

    // Check for approver-related roles
    if (
        groupText.includes('pimpinan') ||
        groupText.includes('direktur') ||
        groupText.includes('direksi') ||
        groupText.includes('direkai') ||
        groupText.includes('pemeriksa') ||
        groupText.includes('approver') ||
        groupText.includes('verifikator') ||
        groupText.includes('penandatangan') ||
        groupText.includes('manager') ||
        groupText.includes('head') ||
        groupText.includes('supervisor')
    ) {
        return true
    }

    return false
}

export const getEofficeRole = (user = getStoredUserLogin()) => {
    const nestedUser = user?.user || {}
    const userGroups = user?.groups || []
    const activeGroup = userGroups.find(group => String(group?.id_group) === String(user?.id_group || nestedUser?.id_group)) || null

    // Build comprehensive group text from all possible sources
    const groupsFromUser = user?.groups?.map(g => g?.nama_group || g?.nama || g?.group_name || g?.role).join(' ') || ''

    const allGroupValues = [
        // Top level user fields
        user?.nama_group,
        user?.group_name,
        user?.group?.nama,
        user?.role,
        user?.nama_role,
        user?.nama_jabatan,  // <-- THIS IS THE KEY! Jabatan field
        user?.jabatan,       // Alternative jabatan field
        user?.role_name,
        user?.name,
        groupsFromUser,
        // Nested user fields
        nestedUser?.nama_group,
        nestedUser?.group_name,
        nestedUser?.group?.nama,
        nestedUser?.role,
        nestedUser?.nama_role,
        nestedUser?.nama_jabatan,
        nestedUser?.jabatan,
        nestedUser?.role_name,
        nestedUser?.name,
        // Active group
        activeGroup?.nama_group,
        activeGroup?.nama,
        activeGroup?.group_name,
        activeGroup?.role,
        activeGroup?.nama_role,
        activeGroup?.nama_jabatan,
        activeGroup?.jabatan,
        activeGroup?.role_name,
        // All user groups
        ...(userGroups.map(g => g?.nama_group || g?.nama || g?.group_name || g?.role || g?.nama_role || g?.nama_jabatan || g?.jabatan || g?.role_name || '')),
    ]

    const groupText = normalizeText(allGroupValues.filter(Boolean).join(' '))

    // Check each group individually for better matching
    const checkGroup = (val) => {
        const text = normalizeText(val || '')
        return text.includes('direksi') ||
               text.includes('pimpinan') ||
               text.includes('direktur')
    }

    const hasPimpinanGroup = allGroupValues.some(checkGroup)

    // Admin Sistem (highest priority)
    if (
        groupText.includes('admin sistem') ||
        groupText.includes('administrator') ||
        groupText.includes('admin system')
    ) {
        return 'admin_sistem'
    }

    // Admin Konten
    if (
        groupText.includes('admin konten') ||
        groupText.includes('konten') ||
        groupText.includes('content')
    ) {
        return 'admin_konten'
    }

    // Pimpinan/Direksi - check if any group contains these keywords
    if (hasPimpinanGroup) {
        return 'pimpinan'
    }

    // Pegawai SDM
    if (groupText.includes('sdm') || groupText.includes('hrd') || groupText.includes('human resource')) {
        return 'pegawai_sdm'
    }

    // Pegawai Keuangan
    if (groupText.includes('keuangan') || groupText.includes('finance') || groupText.includes('akuntansi')) {
        return 'pegawai_keuangan'
    }

    // Pegawai Pemasaran
    if (groupText.includes('pemasaran') || groupText.includes('marketing') || groupText.includes('sales')) {
        return 'pegawai_pemasaran'
    }

    // Pegawai Operasional
    if (groupText.includes('operasional') || groupText.includes('operations') || groupText.includes('operasi')) {
        return 'pegawai_operasional'
    }

    // Default to pegawai
    return 'pegawai'
}

// Get role display label
export const getEofficeRoleLabel = (role) => {
    const labels = {
        admin_sistem: 'Admin Sistem',
        admin_konten: 'Admin Konten',
        pimpinan: 'Pimpinan',
        pegawai_sdm: 'Pegawai SDM',
        pegawai_keuangan: 'Pegawai Keuangan',
        pegawai_pemasaran: 'Pegawai Pemasaran',
        pegawai_operasional: 'Pegawai Operasional & Produksi',
        pegawai: 'Pegawai',
    }
    return labels[role] || labels.pegawai
}

const fallbackAccess = {
    admin_sistem: {
        dashboard: { view: true },
        sys_user: { view: true, add: true, edit: true, delete: true },
        group: { view: true, add: true, edit: true, delete: true },
        sys_menu: { view: true, add: true, edit: true, delete: true },
        sys_log: { view: true },
        sys_setting: { view: true, add: true, edit: true, delete: true },
        backup_database: { view: true, add: true, download: true },
        notifikasi: { view: true, add: true, edit: true },
        audit_trail_immutable: { view: true },
        digital_signature: { view: true, add: true, edit: true, delete: true },
        ai_document_job: { view: true, add: true, edit: true, delete: true },
        sys_notification: { view: true, add: true, edit: true, delete: true },
        master_jenis_surat: { view: true, add: true, edit: true, delete: true },
        surat_masuk: { view: true, add: true, edit: true, delete: true, detail: true, distribusi: true, archive: true, disposisi: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, delete: true, detail: true, approve: true, reject: true, sign: true, send: true, archive: true },
        surat_distribusi: { view: true, add: true, edit: true, delete: true, detail: true },
        surat_approval: { view: true, approve: true, reject: true },
        disposisi: { view: true, add: true, edit: true, delete: true, detail: true },
        surat_arsip: { view: true, add: true, edit: true, delete: true, detail: true, archive: true },
        pengumuman: { view: true, add: true, edit: true, delete: true, detail: true },
        surat_template: { view: true, add: true, edit: true, delete: true, detail: true },
        master_organisasi: { view: true, add: true, edit: true, delete: true, detail: true },
        agenda: { view: true, add: true, edit: true, delete: true, detail: true },
    },
    admin_konten: {
        dashboard: { view: true },
        surat_masuk: { view: true, add: true, edit: true, delete: true, detail: true, distribusi: true },
        surat_keluar: { view: true, add: true, edit: true, delete: true, detail: true, sign: true, send: true, archive: true },
        surat_template: { view: true, add: true, edit: true, delete: true, detail: true },
        master_organisasi: { view: true, add: true, edit: true, delete: true, detail: true },
        master_jenis_surat: { view: true, add: true, edit: true, delete: true },
        disposisi: { view: true, add: true, edit: true, delete: true, detail: true },
        tracking_surat: { view: true, detail: true },
        surat_arsip: { view: true, add: true, edit: true, delete: true, detail: true },
        pengumuman: { view: true, add: true, edit: true, delete: true, detail: true },
        agenda: { view: true, add: true, edit: true, delete: true, detail: true },
    },
    pimpinan: {
        dashboard: { view: true },
        surat_approval: { view: true, approve: true, reject: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, detail: true },
        disposisi: { view: true, add: true, edit: true, detail: true },
        surat_arsip: { view: true, delete: true, detail: true },
        agenda: { view: true, detail: true },
    },
    pegawai_sdm: {
        dashboard: { view: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, detail: true },
        disposisi: { view: true, add: true, edit: true, detail: true },
        surat_arsip: { view: true, delete: true, detail: true },
        agenda: { view: true, detail: true },
        pengumuman: { view: true, detail: true },
    },
    pegawai_keuangan: {
        dashboard: { view: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, detail: true },
        disposisi: { view: true, add: true, edit: true, detail: true },
        surat_arsip: { view: true, delete: true, detail: true },
        agenda: { view: true, detail: true },
        pengumuman: { view: true, detail: true },
    },
    pegawai_pemasaran: {
        dashboard: { view: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, detail: true },
        disposisi: { view: true, add: true, edit: true, detail: true },
        surat_arsip: { view: true, delete: true, detail: true },
        agenda: { view: true, detail: true },
        pengumuman: { view: true, detail: true },
    },
    pegawai_operasional: {
        dashboard: { view: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_distribusi: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, detail: true },
        disposisi: { view: true, add: true, edit: true, detail: true },
        surat_arsip: { view: true, delete: true, detail: true },
        agenda: { view: true, detail: true },
        pengumuman: { view: true, detail: true },
    },
    pegawai: {
        dashboard: { view: true },
        surat_masuk_pegawai: { view: true, detail: true },
        surat_keluar: { view: true, add: true, edit: true, detail: true },
        disposisi: { view: true, add: true, edit: true, detail: true },
        surat_arsip: { view: true, delete: true, detail: true },
        agenda: { view: true, detail: true },
        pengumuman: { view: true, detail: true },
    },
}

export const getEofficeAccessForPage = (page, user = getStoredUserLogin()) => {
    const pageAccess = resolveEofficePage(page)
    const accessmethod = user?.accessmethod || {}
    const explicitAccess = accessmethod[pageAccess] || accessmethod[page]
    const role = getEofficeRole(user)
    const roleAccess = fallbackAccess[role]?.[pageAccess] || {}

    if (eofficeDevPages.includes(pageAccess)) {
        if (Object.keys(roleAccess).length === 0) {
            return {}
        }

        return {
            ...explicitAccess,
            ...roleAccess,
        }
    }

    if (explicitAccess && Object.keys(explicitAccess).length > 0) {
        return explicitAccess
    }

    return roleAccess
}

export const canUseEofficeAction = (page, action = 'view', user = getStoredUserLogin()) => {
    const access = getEofficeAccessForPage(page, user)

    if (action === 'view') {
        return Object.keys(access).length > 0
    }

    return access[action] === true
}

// Check if user can see approval menu
export const canSeeApprovalMenu = (user = getStoredUserLogin()) => {
    return isUserApprover(user)
}

const fallbackMenuByRole = {
    admin_sistem: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk', page: 'surat_masuk', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_surat_approval', page: 'surat_approval', label: 'Approval Surat', icon: 'thumb_up', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_master_jenis_surat', page: 'master_jenis_surat', label: 'Master Jenis Surat', icon: 'description', submenu: [] },
        { id_menu: 'eoffice_surat_template', page: 'surat_template', label: 'Template Surat', icon: 'description', submenu: [] },
        { id_menu: 'eoffice_master_organisasi', page: 'master_organisasi', label: 'Master Organisasi', icon: 'account_tree', submenu: [] },
        { id_menu: 'eoffice_sys_user', page: 'sys_user', label: 'Manajemen Pengguna', icon: 'people', submenu: [] },
        { id_menu: 'eoffice_group', page: 'group', label: 'Hak Akses Role', icon: 'verified_user', submenu: [] },
        { id_menu: 'eoffice_sys_menu', page: 'sys_menu', label: 'Menu', icon: 'menu_open', submenu: [] },
        { id_menu: 'eoffice_sys_setting', page: 'sys_setting', label: 'Konfigurasi', icon: 'settings', submenu: [] },
        { id_menu: 'eoffice_backup_database', page: 'backup_database', label: 'Backup Database', icon: 'cloud_upload', submenu: [] },
        { id_menu: 'eoffice_sys_log', page: 'sys_log', label: 'Log Sistem Audit', icon: 'history', submenu: [] },
    ],
    admin_konten: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk', page: 'surat_masuk', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_surat_distribusi', page: 'surat_distribusi', label: 'Distribusi Surat', icon: 'send', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_master_jenis_surat', page: 'master_jenis_surat', label: 'Master Jenis Surat', icon: 'description', submenu: [] },
        { id_menu: 'eoffice_master_organisasi', page: 'master_organisasi', label: 'Master Organisasi', icon: 'account_tree', submenu: [] },
        { id_menu: 'eoffice_surat_template', page: 'surat_template', label: 'Template Surat', icon: 'description', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
    ],
    pimpinan: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk', page: 'surat_masuk_pegawai', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_surat_approval', page: 'surat_approval', label: 'Approval Surat', icon: 'thumb_up', submenu: [], requiresApprover: true },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
    ],
    pegawai_sdm: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk_pegawai', page: 'surat_masuk_pegawai', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
    ],
    pegawai_keuangan: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk_pegawai', page: 'surat_masuk_pegawai', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
    ],
    pegawai_pemasaran: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk_pegawai', page: 'surat_masuk_pegawai', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
    ],
    pegawai_operasional: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk_pegawai', page: 'surat_masuk_pegawai', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
    ],
    pegawai: [
        { id_menu: 'eoffice_dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', submenu: [] },
        { id_menu: 'eoffice_surat_masuk_pegawai', page: 'surat_masuk_pegawai', label: 'Surat Masuk', icon: 'move_to_inbox', submenu: [] },
        { id_menu: 'eoffice_surat_keluar', page: 'surat_keluar', label: 'Surat Keluar', icon: 'outbox', submenu: [] },
        { id_menu: 'eoffice_disposisi', page: 'disposisi', label: 'Disposisi', icon: 'assignment_turned_in', submenu: [] },
        { id_menu: 'eoffice_surat_arsip', page: 'surat_arsip', label: 'Arsip Surat', icon: 'archive', submenu: [] },
        { id_menu: 'eoffice_agenda', page: 'agenda', label: 'Agenda', icon: 'event', submenu: [] },
        { id_menu: 'eoffice_pengumuman', page: 'pengumuman', label: 'Pengumuman', icon: 'campaign', submenu: [] },
    ],
}

const hiddenMenuPages = ['tracking_surat', 'workflow_surat']
const adminContentRestrictedPages = ['sys_user', 'group', 'sys_menu', 'sys_setting', 'backup_database', 'sys_log']
const employeeRestrictedPages = ['surat_approval', 'surat_distribusi', 'master_jenis_surat', 'master_organisasi', 'surat_template', 'sys_user', 'group', 'sys_menu', 'sys_setting', 'backup_database', 'sys_log']
const employeeRoles = ['pegawai', 'pegawai_sdm', 'pegawai_keuangan', 'pegawai_pemasaran', 'pegawai_operasional']
const employeeMenuPages = ['dashboard', 'surat_masuk_pegawai', 'surat_keluar', 'surat_arsip', 'disposisi', 'agenda', 'pengumuman']
const pimpinanMenuPages = ['dashboard', 'surat_masuk_pegawai', 'surat_keluar', 'surat_approval', 'surat_arsip', 'disposisi', 'agenda', 'pengumuman']

const eofficeMenuLabelKeys = [
    'dashboard',
    'hak akses role',
    'role & hak akses',
    'backup database',
    'manajemen menu',
    'menu',
    'manajemen pengguna',
    'manajemen user',
    'pengaturan sistem',
    'keamanan sistem',
    'konfigurasi sistem',
    'log sistem',
    'log sistem audit',
    'audit trail',
    'surat masuk pegawai',
    'surat masuk',
    'surat keluar',
    'template surat',
    'tracking surat',
    'notifikasi',
    'agenda',
    'pengumuman',
    'news announcement',
    'disposisi',
    'arsip surat',
    'pengarsipan',
    'approval surat',
]

const menuPageByLabel = {
    'master jenis surat': 'master_jenis_surat',
    'role & hak akses': 'group',
    'hak akses role': 'group',
    'manajemen menu': 'sys_menu',
    'menu': 'sys_menu',
    'manajemen pengguna': 'sys_user',
    'manajemen user': 'sys_user',
    'pengaturan sistem': 'sys_setting',
    'keamanan sistem': 'sys_setting',
    'konfigurasi sistem': 'sys_setting',
    'log sistem': 'sys_log',
    'log sistem audit': 'sys_log',
    'audit trail': 'sys_log',
    'backup database': 'backup_database',
    'surat masuk pegawai': 'surat_masuk_pegawai',
    'surat masuk': 'surat_masuk',
    'surat keluar': 'surat_keluar',
    'template surat': 'surat_template',
    'tracking surat': 'tracking_surat',
    'notifikasi': 'notifikasi',
    'agenda': 'agenda',
    'agenda kegiatan': 'agenda',
    'pengumuman': 'pengumuman',
    'news announcement': 'pengumuman',
    'disposisi': 'disposisi',
    'pelaporan disposisi': 'disposisi',
    'arsip surat': 'surat_arsip',
    'pengarsipan': 'surat_arsip',
    'surat approval': 'surat_approval',
    'approval surat': 'surat_approval',
    'surat distribusi': 'surat_distribusi',
}

const menuDisplayByPage = {
    master_jenis_surat: { icon: 'description' },
    dashboard: { icon: 'dashboard' },
    group: { icon: 'admin_panel_settings' },
    backup_database: { icon: 'cloud_upload' },
    sys_menu: { icon: 'menu_open' },
    sys_setting: { icon: 'settings' },
    sys_user: { icon: 'people' },
    sys_log: { icon: 'history' },
    surat_masuk_pegawai: { icon: 'move_to_inbox' },
    surat_masuk: { icon: 'move_to_inbox' },
    surat_keluar: { icon: 'outbox' },
    surat_distribusi: { icon: 'send' },
    surat_template: { icon: 'description' },
    tracking_surat: { icon: 'timeline' },
    notifikasi: { icon: 'notifications' },
    agenda: { icon: 'event' },
    pengumuman: { icon: 'campaign' },
    disposisi: { icon: 'assignment_turned_in' },
    surat_arsip: { icon: 'archive' },
    master_organisasi: { icon: 'account_tree' },
    surat_approval: { icon: 'thumb_up' },
    workflow_surat: { icon: 'design_services' },
}

const getMenuPageKey = page => {
    return resolveEofficePage(page)
}

const getMenuLabelKey = label => normalizeText(label).trim()

// Urutan kerja yang sama untuk setiap role. Halaman yang tidak menjadi tugas
// sebuah role tetap tersaring oleh hak aksesnya, sedangkan yang tersedia
// selalu muncul dalam urutan yang mudah diikuti.
const eofficeMenuOrder = [
    'dashboard',
    'surat_approval',
    'surat_masuk',
    'surat_masuk_pegawai',
    'surat_keluar',
    'surat_distribusi',
    'disposisi',
    'surat_arsip',
    'surat_template',
    'master_jenis_surat',
    'master_organisasi',
    'pengumuman',
    'agenda',
    'sys_user',
    'group',
    'sys_menu',
    'sys_setting',
    'backup_database',
    'sys_log',
]

// Admin Sistem melihat seluruh modul E-Office. Urutannya dipisahkan dari
// urutan role lain agar sidebar mengikuti alur kerja administrasi sistem.
const adminSystemMenuOrder = [
    'dashboard',
    'surat_masuk',
    'surat_keluar',
    'surat_approval',
    'disposisi',
    'surat_arsip',
    'agenda',
    'pengumuman',
    'master_jenis_surat',
    'master_organisasi',
    'surat_template',
    'sys_user',
    'group',
    'sys_menu',
    'sys_setting',
    'backup_database',
    'sys_log',
]

const adminContentMenuOrder = [
    'dashboard',
    'surat_masuk',
    'surat_keluar',
    'surat_distribusi',
    'surat_arsip',
    'disposisi',
    'master_jenis_surat',
    'master_organisasi',
    'surat_template',
    'pengumuman',
    'agenda',
]

const pimpinanMenuOrder = [
    'dashboard',
    'surat_masuk_pegawai',
    'surat_keluar',
    'surat_approval',
    'surat_arsip',
    'disposisi',
    'agenda',
    'pengumuman',
]

const sortEofficeMenu = menu => [...(menu || [])].sort((a, b) => {
    const aIndex = eofficeMenuOrder.indexOf(getMenuPageKey(a?.page))
    const bIndex = eofficeMenuOrder.indexOf(getMenuPageKey(b?.page))
    const aKnown = aIndex >= 0
    const bKnown = bIndex >= 0

    if (aKnown && bKnown) return aIndex - bIndex
    if (aKnown) return -1
    if (bKnown) return 1
    return 0
})

const sortAdminSystemMenu = menu => [...(menu || [])].sort((a, b) => {
    const aIndex = adminSystemMenuOrder.indexOf(getMenuPageKey(a?.page))
    const bIndex = adminSystemMenuOrder.indexOf(getMenuPageKey(b?.page))
    const aKnown = aIndex >= 0
    const bKnown = bIndex >= 0

    if (aKnown && bKnown) return aIndex - bIndex
    if (aKnown) return -1
    if (bKnown) return 1
    return 0
})

const sortAdminContentMenu = menu => [...(menu || [])].sort((a, b) => {
    const aIndex = adminContentMenuOrder.indexOf(getMenuPageKey(a?.page))
    const bIndex = adminContentMenuOrder.indexOf(getMenuPageKey(b?.page))
    const aKnown = aIndex >= 0
    const bKnown = bIndex >= 0

    if (aKnown && bKnown) return aIndex - bIndex
    if (aKnown) return -1
    if (bKnown) return 1
    return 0
})

const sortPimpinanMenu = menu => [...(menu || [])].sort((a, b) => {
    const aIndex = pimpinanMenuOrder.indexOf(getMenuPageKey(a?.page))
    const bIndex = pimpinanMenuOrder.indexOf(getMenuPageKey(b?.page))
    const aKnown = aIndex >= 0
    const bKnown = bIndex >= 0

    if (aKnown && bKnown) return aIndex - bIndex
    if (aKnown) return -1
    if (bKnown) return 1
    return 0
})

export const getAdminSystemMenuSection = page => {
    const pageKey = getMenuPageKey(page)

    if (pageKey === 'dashboard') return 'dashboard'
    if (['surat_masuk', 'surat_keluar', 'surat_approval', 'disposisi', 'surat_arsip'].includes(pageKey)) return 'persuratan'
    if (['agenda', 'pengumuman'].includes(pageKey)) return 'aktivitas'
    if (['master_jenis_surat', 'master_organisasi', 'surat_template'].includes(pageKey)) return 'master_data'
    if (['sys_user', 'group', 'sys_menu', 'sys_setting'].includes(pageKey)) return 'manajemen_sistem'
    if (['backup_database', 'sys_log'].includes(pageKey)) return 'sistem_pemeliharaan'

    return 'lainnya'
}

export const getAdminContentMenuSection = page => {
    const pageKey = getMenuPageKey(page)

    if (pageKey === 'dashboard') return 'dashboard'
    if (['surat_masuk', 'surat_keluar', 'surat_distribusi', 'surat_arsip'].includes(pageKey)) return 'persuratan'
    if (pageKey === 'disposisi') return 'disposisi'
    if (['master_jenis_surat', 'master_organisasi', 'surat_template'].includes(pageKey)) return 'master_data'
    if (['pengumuman', 'agenda'].includes(pageKey)) return 'informasi'

    return 'lainnya'
}

export const getPegawaiMenuSection = page => {
    const pageKey = getMenuPageKey(page)

    if (pageKey === 'dashboard') return 'dashboard'
    if (['surat_masuk_pegawai', 'surat_keluar', 'surat_arsip'].includes(pageKey)) return 'persuratan'
    if (pageKey === 'disposisi') return 'disposisi'
    if (['agenda', 'pengumuman'].includes(pageKey)) return 'aktivitas'

    return 'lainnya'
}

export const getPimpinanMenuSection = page => {
    const pageKey = getMenuPageKey(page)

    if (pageKey === 'dashboard') return 'dashboard'
    if (['surat_masuk_pegawai', 'surat_keluar', 'surat_approval', 'surat_arsip'].includes(pageKey)) return 'persuratan'
    if (pageKey === 'disposisi') return 'disposisi'
    if (['agenda', 'pengumuman'].includes(pageKey)) return 'monitoring'

    return 'lainnya'
}

const getMenuPageFromItem = item => {
    const page = getMenuPageKey(item?.page)
    if (page) return page

    return menuPageByLabel[getMenuLabelKey(item?.label)] || ''
}

const hasMenuPage = (menu, page) => {
    const pageKey = getMenuPageKey(page)

    for (const item of menu || []) {
        if (getMenuPageKey(item?.page) === pageKey) return true
        if (hasMenuPage(item?.submenu || [], page)) return true
    }

    return false
}

const filterMenuByRole = (menu = [], user = getStoredUserLogin()) => {
    const role = getEofficeRole(user)
    const isApprover = canSeeApprovalMenu(user)

    return (menu || []).reduce((items, item) => {
        // Skip menu items that require approver status but user is not an approver
        if (item.requiresApprover === true && !isApprover) {
            return items
        }

        const submenu = filterMenuByRole(item?.submenu || [], user)
        const page = getMenuPageFromItem(item)
        const labelKey = getMenuLabelKey(item?.label)
        const isEofficePage = eofficeDevPages.includes(page)
        const isAllowed = !isEofficePage || canUseEofficeAction(page, 'view', user)

        if (
            hiddenMenuPages.includes(page) ||
            (role === 'admin_konten' && adminContentRestrictedPages.includes(page)) ||
            (employeeRoles.includes(role) && (!employeeMenuPages.includes(page) || employeeRestrictedPages.includes(page))) ||
            (role === 'pimpinan' && !pimpinanMenuPages.includes(page)) ||
            page === 'tracking_surat' ||
            page === 'notifikasi'
        ) {
            return items
        }

        if (!isAllowed && submenu.length === 0) {
            return items
        }

        const isDuplicate = items.some(menuItem => {
            const samePage = page && getMenuPageKey(menuItem?.page) === page
            const sameEofficeLabel = eofficeMenuLabelKeys.includes(labelKey) && getMenuLabelKey(menuItem?.label) === labelKey

            return samePage || sameEofficeLabel
        })

        if (isDuplicate) {
            return items
        }

        items.push({
            ...item,
            icon: menuDisplayByPage[page]?.icon || item?.icon,
            label: page === 'surat_masuk_pegawai' ? 'Surat Masuk' : item?.label,
            page: page || item?.page,
            submenu,
        })

        return items
    }, [])
}

export const mergeEofficeMenuByRole = (menu = [], user = getStoredUserLogin()) => {
    const role = getEofficeRole(user)
    const fallbackMenu = fallbackMenuByRole[role] || fallbackMenuByRole.pegawai
    const isApprover = canSeeApprovalMenu(user)

    // If no database menu, use fallback menu directly
    if (!menu || menu.length === 0) {
        const roleMenu = fallbackMenu
            .filter(item => {
                // Filter out approver-only menus for non-approvers
                if (item.requiresApprover === true && !isApprover) {
                    return false
                }
                return true
            })
            .map(item => ({ ...item, collapsed: true, active: false }))

        if (role === 'admin_sistem') return sortAdminSystemMenu(roleMenu)
        if (role === 'admin_konten') return sortAdminContentMenu(roleMenu)
        if (role === 'pimpinan') return sortPimpinanMenu(roleMenu)
        return sortEofficeMenu(roleMenu)
    }

    const mergedMenu = filterMenuByRole(Array.isArray(menu) ? menu : [], user)

    fallbackMenu.forEach(item => {
        // Skip approver-only menus for non-approvers
        if (item.requiresApprover === true && !isApprover) {
            return
        }

        if (hiddenMenuPages.includes(getMenuPageKey(item.page))) {
            return
        }

        if (role === 'admin_konten' && adminContentRestrictedPages.includes(getMenuPageKey(item.page))) {
            return
        }

        if (employeeRoles.includes(role) && !employeeMenuPages.includes(getMenuPageKey(item.page))) {
            return
        }

        if (role === 'pimpinan' && !pimpinanMenuPages.includes(getMenuPageKey(item.page))) {
            return
        }

        if (!hasMenuPage(mergedMenu, item.page) && canUseEofficeAction(item.page, 'view', user)) {
            mergedMenu.push({ ...item, collapsed: true, active: false })
        }
    })

    if (role === 'admin_sistem') return sortAdminSystemMenu(mergedMenu)
    if (role === 'admin_konten') return sortAdminContentMenu(mergedMenu)
    if (role === 'pimpinan') return sortPimpinanMenu(mergedMenu)
    return sortEofficeMenu(mergedMenu)
}
