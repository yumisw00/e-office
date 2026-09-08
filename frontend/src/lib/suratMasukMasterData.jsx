export const fallbackSuratMasukMasterData = {
    jenis: [
        { label: 'Surat Undangan', value: 'Surat Undangan' },
        { label: 'Surat Undangan Rapat', value: 'Surat Undangan Rapat' },
        { label: 'Surat Rapat/Notulen', value: 'Surat Rapat/Notulen' },
        { label: 'Surat Pemberitahuan', value: 'Surat Pemberitahuan' },
        { label: 'Surat Pengumuman', value: 'Surat Pengumuman' },
        { label: 'Surat Permohonan', value: 'Surat Permohonan' },
        { label: 'Surat Tugas', value: 'Surat Tugas' },
        { label: 'Surat Edaran', value: 'Surat Edaran' },
        { label: 'Surat Keputusan', value: 'Surat Keputusan' },
        { label: 'Surat Perintah Kerja', value: 'Surat Perintah Kerja' },
        { label: 'Surat Pengantar', value: 'Surat Pengantar' },
        { label: 'Surat Keterangan', value: 'Surat Keterangan' },
        { label: 'Surat Perjanjian/Kontrak', value: 'Surat Perjanjian/Kontrak' },
        { label: 'Surat Penawaran', value: 'Surat Penawaran' },
        { label: 'Surat Tagihan/Invoice', value: 'Surat Tagihan/Invoice' },
        { label: 'Surat Klaim/Komplain', value: 'Surat Klaim/Komplain' },
        { label: 'Nota Dinas', value: 'Nota Dinas' },
        { label: 'Memo Internal', value: 'Memo Internal' },
        { label: 'Berita Acara', value: 'Berita Acara' },
        { label: 'Laporan', value: 'Laporan' },
    ],
    sifat: [
        { label: 'Biasa', value: 'Biasa' },
        { label: 'Penting', value: 'Penting' },
        { label: 'Rahasia', value: 'Rahasia' },
        { label: 'Segera', value: 'Segera' },
        { label: 'Sangat Segera', value: 'Sangat Segera' },
    ],
    topik: [
        { label: 'Kelembagaan', value: 'Kelembagaan' },
        { label: 'Akademik', value: 'Akademik' },
        { label: 'Keuangan', value: 'Keuangan' },
        { label: 'Umum', value: 'Umum' },
        { label: 'SDM', value: 'SDM' },
    ],
    status: [
        { label: 'Baru', value: 'baru' },
        { label: 'Distribusikan', value: 'diproses' },
        { label: 'Menunggu Disposisi', value: 'menunggu_disposisi' },
        { label: 'Selesai', value: 'selesai' },
    ],
}

const fieldAliases = {
    jenis: ['jenis', 'jenis_surat', 'tipe_surat'],
    sifat: ['sifat', 'sifat_surat', 'prioritas'],
    topik: ['topik', 'topik_surat', 'kategori'],
    status: ['status', 'status_surat'],
}

const getOptionValue = item => item?.value ?? item?.kode ?? item?.id ?? item?.nama ?? item?.label ?? item?.name
const getOptionLabel = item => item?.label ?? item?.nama ?? item?.name ?? item?.value ?? item?.kode ?? item?.id

const normalizeOptionList = (items, fallback) => {
    if (!items) return fallback

    const source = Array.isArray(items) ? items : Object.values(items)
    const normalized = source
        .map(item => {
            if (typeof item === 'string' || typeof item === 'number') {
                const value = String(item)
                return { label: value, value }
            }

            const value = getOptionValue(item)
            const label = getOptionLabel(item) ?? value

            if (value === undefined || value === null || value === '') return null

            return {
                ...item,
                label: String(label),
                value: String(value),
            }
        })
        .filter(Boolean)

    return normalized.length > 0 ? normalized : fallback
}

const getGroupedArray = (items, key) => {
    if (!Array.isArray(items)) return null

    const aliases = fieldAliases[key] || [key]

    return items.filter(item => {
        const group = item?.group ?? item?.type ?? item?.tipe ?? item?.kategori ?? item?.key ?? item?.field
        return aliases.includes(String(group || '').toLowerCase())
    })
}

const pickMasterItems = (data, key) => {
    const aliases = fieldAliases[key] || [key]

    for (const alias of aliases) {
        if (data?.[alias]) return data[alias]
    }

    const grouped = getGroupedArray(data, key)
    if (grouped?.length) return grouped

    return null
}

export const normalizeSuratMasukMasterData = response => {
    const data = response?.data ?? response ?? {}

    return Object.keys(fallbackSuratMasukMasterData).reduce((result, key) => {
        result[key] = normalizeOptionList(
            pickMasterItems(data, key),
            fallbackSuratMasukMasterData[key]
        )
        return result
    }, {})
}

export const optionsToIndex = options => (options || []).reduce((result, item) => {
    result[item.value] = item.label
    return result
}, {})
