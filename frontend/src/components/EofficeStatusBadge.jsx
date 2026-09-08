const statusColorMap = {
    baru: { bg: '#e0f2fe', text: '#075985' },
    new: { bg: '#e0f2fe', text: '#075985' },
    pending: { bg: '#fef3c7', text: '#92400e' },
    draft: { bg: '#f1f5f9', text: '#334155' },
    diajukan: { bg: '#dbeafe', text: '#1d4ed8' },
    submitted: { bg: '#dbeafe', text: '#1d4ed8' },
    review: { bg: '#ede9fe', text: '#6d28d9' },
    revisi: { bg: '#fee2e2', text: '#b91c1c' },
    rejected: { bg: '#fee2e2', text: '#b91c1c' },
    disetujui: { bg: '#dcfce7', text: '#15803d' },
    approved: { bg: '#dcfce7', text: '#15803d' },
    ditandatangani: { bg: '#ccfbf1', text: '#0f766e' },
    signed: { bg: '#ccfbf1', text: '#0f766e' },
    dikirim: { bg: '#e0e7ff', text: '#3730a3' },
    sent: { bg: '#e0e7ff', text: '#3730a3' },
    didistribusikan: { bg: '#cffafe', text: '#0e7490' },
    distributed: { bg: '#cffafe', text: '#0e7490' },
    dibaca: { bg: '#dbeafe', text: '#1e40af' },
    read: { bg: '#dbeafe', text: '#1e40af' },
    didisposisikan: { bg: '#fef9c3', text: '#854d0e' },
    disposed: { bg: '#fef9c3', text: '#854d0e' },
    selesai: { bg: '#dcfce7', text: '#166534' },
    done: { bg: '#dcfce7', text: '#166534' },
    arsip: { bg: '#e2e8f0', text: '#334155' },
    archived: { bg: '#e2e8f0', text: '#334155' },
    publish: { bg: '#dcfce7', text: '#166534' },
    published: { bg: '#dcfce7', text: '#166534' },
    aktif: { bg: '#dcfce7', text: '#166534' },
    active: { bg: '#dcfce7', text: '#166534' },
    inactive: { bg: '#f1f5f9', text: '#475569' },
}

import { translateEofficeStatus } from 'lib/eofficeStatus'

const humanize = value => String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())

const EofficeStatusBadge = ({ value, label }) => {
    const key = String(value || label || '').toLowerCase()
    const color = statusColorMap[key] || { bg: '#eef2f7', text: '#334155' }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 999,
                padding: '4px 10px',
                backgroundColor: color.bg,
                color: color.text,
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
            }}
        >
            {translateEofficeStatus(label || value)}
        </span>
    )
}

export default EofficeStatusBadge
