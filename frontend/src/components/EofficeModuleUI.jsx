import React from 'react'
import { translateEofficeStatus } from 'lib/eofficeStatus'

const normalize = value => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim()

const statusStyles = {
    baru: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    masuk: 'bg-teal-50 text-teal-700 border-teal-200',
    diproses: 'bg-amber-50 text-amber-700 border-amber-200',
    proses: 'bg-amber-50 text-amber-700 border-amber-200',
    'menunggu disposisi': 'bg-violet-50 text-violet-700 border-violet-200',
    didistribusikan: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    didisposisikan: 'bg-violet-50 text-violet-700 border-violet-200',
    selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    aktif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    arsip: 'bg-slate-50 text-slate-700 border-slate-200',
    'ai gagal': 'bg-rose-50 text-rose-700 border-rose-200',
    'manual input': 'bg-slate-50 text-slate-700 border-slate-200',
    open: 'bg-blue-50 text-blue-700 border-blue-200',
    dikirim: 'bg-teal-50 text-teal-700 border-teal-200',
    dibaca: 'bg-teal-50 text-teal-700 border-teal-200',
}

const sourceStyles = {
    ai: 'bg-teal-50 text-teal-700 border-teal-200',
    'ai ocr': 'bg-teal-50 text-teal-700 border-teal-200',
    'ai generated': 'bg-teal-50 text-teal-700 border-teal-200',
    manual: 'bg-slate-50 text-slate-700 border-slate-200',
    'manual input': 'bg-slate-50 text-slate-700 border-slate-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    'perlu input manual': 'bg-rose-50 text-rose-700 border-rose-200',
}

const badgeBase = 'inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold leading-none whitespace-nowrap'

export const EofficeBadge = ({ children, tone = 'default', icon }) => {
    const toneClass = tone === 'default' ? 'bg-gray-50 text-gray-700 border-gray-200' : tone

    return (
        <span className={`${badgeBase} ${toneClass}`}>
            {icon ? <span className="material-icons mr-1" style={{ fontSize: 14 }}>{icon}</span> : null}
            {children || '-'}
        </span>
    )
}

export const EofficeStatusBadge = ({ value, label }) => {
    const key = normalize(label || value)
    const text = translateEofficeStatus(label || value || 'baru')
    return <EofficeBadge tone={statusStyles[key] || 'bg-gray-50 text-gray-700 border-gray-200'}>{text}</EofficeBadge>
}

export const EofficeSourceBadge = ({ value }) => {
    const key = normalize(value)
    const text = key.includes('gagal') || key.includes('failed')
        ? 'Perlu Input Manual'
        : key.includes('ai')
            ? 'AI Generated'
            : 'Manual Input'
    const toneKey = normalize(text)

    return (
        <EofficeBadge
            icon={text === 'AI Generated' ? 'auto_awesome' : text === 'Perlu Input Manual' ? 'error_outline' : 'edit_note'}
            tone={sourceStyles[toneKey] || sourceStyles.manual}
        >
            {text}
        </EofficeBadge>
    )
}

export const EofficeToolbar = ({ children }) => (
    <div className="d-flex flex-wrap align-items-center justify-content-end" style={{ gap: 8 }}>
        {children}
    </div>
)

export const EofficeCard = ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-md shadow-sm ${className}`}>
        {children}
    </div>
)

export const EofficeEmptyState = ({ title, description, icon = 'inbox' }) => (
    <div className="text-center py-5">
        <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-md bg-gray-50 border border-gray-200" style={{ width: 52, height: 52 }}>
            <span className="material-icons text-gray-500">{icon}</span>
        </div>
        <div className="font-semibold text-gray-800">{title}</div>
        <div className="text-gray-500 mt-1">{description}</div>
    </div>
)

export const EofficeFilterBadge = ({ label, value, onRemove }) => {
    if (!value) return null

    return (
        <span className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
            {label}: {value}
            {onRemove ? (
                <button type="button" className="ml-1 text-teal-700" onClick={onRemove}>
                    <span className="material-icons" style={{ fontSize: 14 }}>close</span>
                </button>
            ) : null}
        </span>
    )
}

export const EofficeFormSection = ({ title, subtitle, icon, children }) => (
    <section className="border border-gray-200 rounded-md bg-white p-3 mb-3">
        <div className="d-flex align-items-start mb-3">
            {icon ? (
                <div className="d-flex align-items-center justify-content-center rounded-md mr-2 bg-teal-50 text-teal-700" style={{ width: 34, height: 34 }}>
                    <span className="material-icons" style={{ fontSize: 19 }}>{icon}</span>
                </div>
            ) : null}
            <div>
                <div className="font-semibold text-gray-900">{title}</div>
                {subtitle ? <div className="text-gray-500" style={{ fontSize: 13 }}>{subtitle}</div> : null}
            </div>
        </div>
        {children}
    </section>
)

export const EofficeInfoGrid = ({ items }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map(item => (
            <div key={item.label} className="rounded-md bg-gray-50 border border-gray-200 p-2">
                <div className="text-gray-500" style={{ fontSize: 12 }}>{item.label}</div>
                <div className="font-semibold text-gray-800 mt-1" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{item.value || '-'}</div>
            </div>
        ))}
    </div>
)

// Standardized table — matches the surat_template reference: dark-teal header,
// consistent padding, and clean borders. Use this for every data table.
export const EofficeTable = ({
    headers = [],
    colgroup = [],
    children,
    minWidth = 1040,
    className = '',
    align = 'start',
}) => {
    const isActionHeader = header => typeof header !== 'string'
        && ['aksi', 'action'].includes(String(header.name || header.label || '').trim().toLowerCase())
    const resolveColumnWidth = (header, fallbackWidth) => isActionHeader(header) ? 60 : fallbackWidth

    return (
    <EofficeCard className={className}>
        <div className={`d-flex justify-content-${align}`}>
            <table
                className="w-full table table-fixed mb-0"
                style={{ minWidth }}
            >
                {colgroup.length ? (
                    <colgroup>
                        {colgroup.map((width, idx) => (
                            <col
                                key={`col-${idx}`}
                                className={isActionHeader(headers[idx]) ? 'eoffice-action-column' : ''}
                                style={{ width: resolveColumnWidth(headers[idx], width) }}
                            />
                        ))}
                    </colgroup>
                ) : null}
                <thead>
                    <tr>
                        {headers.map((header, idx) => {
                            const label = typeof header === 'string' ? header : header.label
                            const width = resolveColumnWidth(header, typeof header === 'string' ? null : header.width)
                            const align = typeof header === 'string' ? 'center' : (header.align || 'center')
                            return (
                                <th
                                    key={`${label || idx}-${idx}`}
                                    className={`border border-bottom px-3 py-3 font-semibold ${isActionHeader(header) ? 'eoffice-action-column' : ''}`}
                                    style={{
                                        background: '#138a98',
                                        color: '#fff',
                                        borderColor: '#0f7480',
                                        textAlign: align,
                                        fontSize: 13,
                                        width: width || undefined,
                                    }}
                                >
                                    {label}
                                </th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    </EofficeCard>
    )
}

// Reusable empty-row for when a table has no data
export const EofficeTableEmpty = ({ colSpan, message = 'Belum ada data.' }) => (
    <tr>
        <td className="px-3 py-3 text-center text-muted" colSpan={colSpan} style={{ padding: 28 }}>
            {message}
        </td>
    </tr>
)

// Reusable styled cell. `align` controls text alignment, `wrap` controls wrapping.
export const EofficeTableCell = ({
    children,
    width,
    align = 'center',
    wrap = false,
    className = '',
    style = {},
}) => {
    const resolvedAlign = align === 'start' ? 'left' : align
    return (
    <td
        className={`border align-middle ${className}`}
        style={{
            width: width || undefined,
            textAlign: resolvedAlign,
            paddingLeft: 0,
            paddingRight: 8,
            paddingTop: 6,
            paddingBottom: 6,
            overflowWrap: wrap ? 'anywhere' : 'normal',
            ...style,
        }}
    >
        {children}
    </td>
    )
}

// ─────────────────────────────────────────────────────────
// EofficeTableWithFilter
// Table with an inline filter row directly below the header.
// Inspired by the table design in the RCM Process reference image.
// ─────────────────────────────────────────────────────────
export const EofficeTableWithFilter = ({
    headers = [],       // [{ label, width, align, filterType, filterOptions }]
    colgroup = [],
    filterValues = {},  // { colName: value }
    onFilterChange,     // (colName, value) => void
    children,
    minWidth = 1040,
    className = '',
    align = 'start',
}) => {
    const isActionHeader = header => typeof header !== 'string'
        && ['aksi', 'action'].includes(String(header.name || header.label || '').trim().toLowerCase())
    const resolveColumnWidth = (header, fallbackWidth) => isActionHeader(header) ? 60 : fallbackWidth

    // Render a single filter input based on type
    const renderFilterInput = (header, value, onChange) => {
        const filterType = header.filterType || 'text'
        const placeholder = 'Filter...'
        const filterStyle = {
            width: '100%',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            background: '#f8fafc',
            color: '#334155',
            outline: 'none',
        }

        if (filterType === 'select') {
            return (
                <select
                    style={filterStyle}
                    value={value || ''}
                    onChange={e => onChange(header.name, e.target.value)}
                >
                    <option value="">Semua</option>
                    {(header.filterOptions || []).map(opt => {
                        const optVal = typeof opt === 'string' ? opt : opt.value
                        const optLabel = typeof opt === 'string' ? opt : (opt.label || opt.value)
                        return <option key={optVal} value={optVal}>{optLabel}</option>
                    })}
                </select>
            )
        }

        if (filterType === 'date') {
            return (
                <input
                    type="date"
                    style={filterStyle}
                    value={value || ''}
                    onChange={e => onChange(header.name, e.target.value)}
                />
            )
        }

        if (filterType === 'none') {
            return null
        }

        // Default: text input
        return (
            <input
                type="text"
                style={filterStyle}
                placeholder={placeholder}
                value={value || ''}
                onChange={e => onChange(header.name, e.target.value)}
            />
        )
    }

    return (
        <EofficeCard className={className}>
            <div className={`d-flex justify-content-${align}`}>
                <table
                    className="w-full table table-fixed mb-0"
                    style={{ minWidth }}
                >
                    {colgroup.length ? (
                        <colgroup>
                            {colgroup.map((width, idx) => (
                                <col
                                    key={`col-${idx}`}
                                    className={isActionHeader(headers[idx]) ? 'eoffice-action-column' : ''}
                                    style={{ width: resolveColumnWidth(headers[idx], width) }}
                                />
                            ))}
                        </colgroup>
                    ) : null}
                    <thead>
                        {/* ── Header Row ── */}
                        <tr>
                            {headers.map((header, idx) => {
                                const label = typeof header === 'string' ? header : header.label
                                const width = resolveColumnWidth(header, typeof header === 'string' ? null : header.width)
                                const align = typeof header === 'string' ? 'center' : (header.align || 'center')
                                return (
                                    <th
                                        key={`header-${idx}`}
                                        className={`border px-3 py-3 font-semibold ${isActionHeader(header) ? 'eoffice-action-column' : ''}`}
                                        style={{
                                            background: '#138a98',
                                            color: '#fff',
                                            borderColor: '#0f7480',
                                            textAlign: align,
                                            fontSize: 13,
                                            width: width || undefined,
                                        }}
                                    >
                                        {label}
                                    </th>
                                )
                            })}
                        </tr>

                        {/* ── Filter Row ── */}
                        <tr style={{ background: '#f1f5f9' }}>
                            {headers.map((header, idx) => {
                                const name = typeof header === 'string' ? header : header.name || header.label
                                const width = resolveColumnWidth(header, typeof header === 'string' ? null : header.width)
                                const align = typeof header === 'string' ? 'center' : (header.align || 'center')
                                return (
                                    <td
                                        key={`filter-${idx}`}
                                        className={`border px-2 py-2 ${isActionHeader(header) ? 'eoffice-action-column' : ''}`}
                                        style={{
                                            background: '#f1f5f9',
                                            borderColor: '#e2e8f0',
                                            textAlign: align,
                                            width: width || undefined,
                                        }}
                                    >
                                        {renderFilterInput(
                                            typeof header === 'string' ? { label: header } : header,
                                            filterValues[name],
                                            onFilterChange
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {children}
                    </tbody>
                </table>
            </div>
        </EofficeCard>
    )
}
