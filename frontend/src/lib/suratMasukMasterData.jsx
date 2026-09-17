export const fallbackSuratMasukMasterData = {
    // Jenis surat selalu dimuat dari Master Jenis Surat. Jangan gunakan
    // daftar statis karena dapat berbeda atau menampilkan data duplikat.
    jenis: [],
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
        { label: 'Draf', value: 'draft' },
        { label: 'Dikirim', value: 'dikirim' },
        { label: 'Disposisi', value: 'disposisi' },
        { label: 'Selesai', value: 'selesai' },
        { label: 'Diarsipkan', value: 'diarsipkan' },
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
