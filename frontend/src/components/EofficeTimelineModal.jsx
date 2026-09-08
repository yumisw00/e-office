import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import Button from 'components/Button'
import { api_services } from 'hooks/api_services'
import { formatDateApp } from 'pages/Utils'

const getFirstValue = (item, keys) => {
    for (const key of keys) {
        const value = item?.[key]
        if (value !== undefined && value !== null && value !== '') return value
    }

    return ''
}

const normalizeTimelineResponse = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.timeline)) return response.data.timeline
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.timeline)) return response.timeline
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response

    return []
}

const humanize = value => {
    if (!value) return '-'

    return String(value)
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase())
}

const formatTime = value => {
    if (!value) return ''

    try {
        return formatDateApp(value, 'DD MMM YYYY HH:mm')
    } catch (error) {
        return value
    }
}

const getTimelineTitle = item => (
    getFirstValue(item, ['title', 'judul', 'aksi', 'action', 'status', 'tipe', 'type']) || 'Aktivitas Surat'
)

const getTimelineDescription = item => (
    getFirstValue(item, ['description', 'keterangan', 'catatan', 'note', 'message', 'msg', 'instruksi'])
)

const getTimelineActor = item => (
    getFirstValue(item, ['aktor', 'actor', 'nama_user', 'user_name', 'created_by_name', 'created_by_desc', 'pemberi'])
)

const getTimelineTarget = item => (
    getFirstValue(item, ['tujuan', 'penerima', 'unit_tujuan', 'nama_unit_tujuan', 'user_tujuan', 'penerima_desc'])
)

const getTimelineTime = item => (
    getFirstValue(item, ['created_at', 'tanggal', 'tanggal_distribusi', 'tanggal_dibaca', 'tanggal_selesai', 'updated_at', 'time', 'waktu'])
)

const getSuratLabel = surat => (
    surat?.nomor_surat ||
    surat?.surat_masuk?.nomor_surat ||
    surat?.suratMasuk?.nomor_surat ||
    surat?.perihal ||
    surat?.surat_masuk?.perihal ||
    surat?.suratMasuk?.perihal ||
    '-'
)

const EofficeTimelineModal = ({ show, onHide, suratId, surat, timelinePath }) => {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const fetchTimeline = async () => {
            const path = timelinePath || (suratId ? `/surat_masuk/${suratId}/timeline` : '')

            if (!show || !path) return

            setLoading(true)
            setErrorMessage('')

            const { getapi_services } = api_services({ api_path: path })
            const response = await getapi_services({})

            setLoading(false)

            if (response?.error || response?.code) {
                setItems([])
                setErrorMessage('Timeline belum bisa dimuat dari backend.')
                return
            }

            setItems(normalizeTimelineResponse(response))
        }

        fetchTimeline()
    }, [show, suratId, timelinePath])

    const latestItem = useMemo(() => {
        if (!items.length) return null
        return items[items.length - 1]
    }, [items])

    const currentStatus = getFirstValue(latestItem || {}, ['status', 'aksi', 'action']) || surat?.status

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Lihat Riwayat</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="rounded-md border border-gray-200 p-3 mb-3">
                    <div className="text-muted" style={{ fontSize: 13 }}>Dokumen</div>
                    <div className="font-semibold" style={{ overflowWrap: 'anywhere' }}>
                        {getSuratLabel(surat)}
                    </div>
                    <div className="mt-2 d-flex align-items-center">
                        <span className="text-muted mr-2" style={{ fontSize: 13 }}>Posisi/status terakhir:</span>
                        <span
                            className="px-2 py-1 rounded"
                            style={{
                                backgroundColor: '#e6f6f8',
                                color: '#138a98',
                                fontWeight: 700,
                                fontSize: 12,
                            }}
                        >
                            {humanize(currentStatus)}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-muted">Memuat timeline...</div>
                ) : null}

                {!loading && errorMessage ? (
                    <div className="alert alert-warning mb-0">{errorMessage}</div>
                ) : null}

                {!loading && !errorMessage && items.length === 0 ? (
                    <div className="text-muted">Belum ada riwayat perjalanan untuk surat ini.</div>
                ) : null}

                {!loading && !errorMessage && items.length > 0 ? (
                    <div>
                        {items.map((item, index) => {
                            const title = humanize(getTimelineTitle(item))
                            const description = getTimelineDescription(item)
                            const actor = getTimelineActor(item)
                            const target = getTimelineTarget(item)
                            const time = formatTime(getTimelineTime(item))
                            const isLast = index === items.length - 1

                            return (
                                <div key={index} className="d-flex align-items-start">
                                    <div className="d-flex flex-column align-items-center mr-3">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                            style={{
                                                width: 30,
                                                height: 30,
                                                backgroundColor: isLast ? '#138a98' : '#6b9aa3',
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: 16 }}>
                                                {isLast ? 'place' : 'timeline'}
                                            </span>
                                        </div>
                                        {!isLast ? (
                                            <div style={{ width: 2, minHeight: 42, backgroundColor: '#d6e7ea' }} />
                                        ) : null}
                                    </div>

                                    <div className="flex-1 pb-3">
                                        <div className="font-semibold">{title}</div>
                                        {description ? (
                                            <div className="text-muted" style={{ fontSize: 13 }}>
                                                {description}
                                            </div>
                                        ) : null}
                                        {(actor || target) ? (
                                            <div className="mt-1" style={{ fontSize: 13 }}>
                                                {actor ? <span className="mr-3">Oleh: {actor}</span> : null}
                                                {target ? <span>Tujuan: {target}</span> : null}
                                            </div>
                                        ) : null}
                                        {time ? (
                                            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                                                {time}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : null}
            </Modal.Body>
            <Modal.Footer>
                <Button className="btn-default-app btn-light" onClick={onHide}>
                    Tutup
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default EofficeTimelineModal
