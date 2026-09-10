const labels = {
    new: 'Baru', baru: 'Baru', open: 'Terbuka', pending: 'Menunggu', waiting: 'Menunggu Persetujuan',
    review: 'Dalam Pemeriksaan', 'in review': 'Dalam Pemeriksaan', 'in progress': 'Sedang Diproses',
    process: 'Diproses', processing: 'Diproses', diproses: 'Diproses', draft: 'Draf', submitted: 'Diajukan',
    diajukan: 'Diajukan', approved: 'Disetujui', disetujui: 'Disetujui', rejected: 'Ditolak', ditolak: 'Ditolak',
    revision: 'Revisi', revisi: 'Revisi', signed: 'Ditandatangani', ditandatangani: 'Ditandatangani', sent: 'Dikirim',
    dikirim: 'Dikirim', distributed: 'Didistribusikan', didistribusikan: 'Didistribusikan', disposed: 'Didisposisikan',
    didisposisikan: 'Didisposisikan', read: 'Dibaca', dibaca: 'Dibaca', completed: 'Selesai', complete: 'Selesai',
    done: 'Selesai', selesai: 'Selesai', cancelled: 'Dibatalkan', canceled: 'Dibatalkan', dibatalkan: 'Dibatalkan',
    archived: 'Diarsipkan', archive: 'Diarsipkan', arsip: 'Diarsipkan', published: 'Diterbitkan', publish: 'Diterbitkan',
    unpublished: 'Belum Diterbitkan', active: 'Aktif', aktif: 'Aktif', inactive: 'Tidak Aktif', failed: 'Gagal',
    'ai failed': 'AI Gagal', 'ai gagal': 'AI Gagal', 'manual input': 'Input Manual', 'menunggu disposisi': 'Menunggu Disposisi',
}

export const translateEofficeStatus = value => {
    const key = String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!key) return '-'
    return labels[key] || key.replace(/\b\w/g, char => char.toUpperCase())
}
