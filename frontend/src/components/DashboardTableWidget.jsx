"use client"

import { useState } from "react"
import Link from "components/Link"
import EofficeStatusBadge from "components/EofficeStatusBadge"

// Shared TableWidget for all dashboards
// Props:
//   title        - card title
//   icon         - material icon name
//   href         - "Lihat Semua" link
//   columns      - array of column header strings
//   data         - array of row objects
//   emptyMessage - text shown when data is empty
//   loading      - boolean, shows spinner
//   showAksi     - boolean (default true), shows/hides aksi column
//   showFilter   - boolean (default false), shows inline filter row
//   renderCell   - optional function (item, col, raw) => ReactNode for custom cell rendering

const DashboardTableWidget = ({
  title,
  icon,
  href = "#",
  columns = [],
  data = [],
  emptyMessage = "Belum ada data",
  loading = false,
  showAksi = true,
  showFilter = false,
  renderCell = null,
}) => {
  const [filterValues, setFilterValues] = useState({})

  // Filter data based on filter values
  const filteredData = Object.values(filterValues).some(v => v && v.trim() !== '')
    ? data.filter(item => {
        return columns.every(col => {
          const filterVal = (filterValues[col] || '').toLowerCase().trim()
          if (!filterVal) return true

          const raw = item[col] || item[col.replace(/ /g, "_")] || item[col.replace(/ /g, "")] || ''
          const val = String(raw).toLowerCase()

          return val.includes(filterVal)
        })
      })
    : data

  const handleFilterChange = (col, value) => {
    setFilterValues(prev => ({ ...prev, [col]: value }))
  }

  const clearFilters = () => {
    setFilterValues({})
  }

  const hasActiveFilters = Object.values(filterValues).some(v => v && v.trim() !== '')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="material-icons text-teal-600 text-lg">{icon}</span>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {showFilter && hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear Filter
            </button>
          )}
          <Link href={href} className="text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <span className="material-icons text-3xl animate-spin">sync</span>
          </div>
        ) : filteredData.length === 0 && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <span className="material-icons text-4xl mb-2">{icon}</span>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : filteredData.length === 0 && hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <span className="material-icons text-4xl mb-2">search_off</span>
            <p className="text-sm">Tidak ada data yang cocok dengan filter</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              {/* Header Row */}
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
                {showAksi && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                )}
              </tr>

              {/* Filter Row */}
              {showFilter && (
                <tr style={{ background: '#f1f5f9' }}>
                  {columns.map(col => (
                    <td key={`filter-${col}`} className="px-2 py-1.5 border-t border-slate-100" style={{ background: '#f1f5f9' }}>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filterValues[col] || ''}
                        onChange={e => handleFilterChange(col, e.target.value)}
                        style={{
                          width: '100%',
                          border: '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '3px 6px',
                          fontSize: 11,
                          background: '#fff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      />
                    </td>
                  ))}
                  {showAksi && (
                    <td className="px-2 py-1.5 border-t border-slate-100" style={{ background: '#f1f5f9' }}></td>
                  )}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.slice(0, 5).map((item, i) => (
                <tr key={item.id || item.id_surat_masuk || item.id_disposisi || item.id_agenda || i} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => {
                    const raw = item[col] || item[col.replace(/ /g, "_")] || item[col.replace(/ /g, "")] || "-"
                    const dateFields = ["tanggal", "tanggal_terima", "tanggal_surat", "tanggal_disposisi", "tanggal_mulai", "created_at", "updated_at", "tanggal_approval"]
                    const isDate = dateFields.some(f => col.toLowerCase().includes(f))
                    let displayVal = raw
                    if (isDate && raw !== "-") displayVal = formatDate(raw)
                    const isStatus = col.toLowerCase() === "status"
                    const cellContent = renderCell
                      ? renderCell(item, col, raw)
                      : isStatus
                        ? <EofficeStatusBadge value={raw} />
                        : displayVal
                    return (
                      <td key={col} className="px-3 py-2.5 text-xs text-slate-700 whitespace-nowrap max-w-[150px] truncate">
                        {cellContent}
                      </td>
                    )
                  })}
                  {showAksi && (
                    <td className="px-3 py-2.5 text-xs">
                      <Link href={href} className="text-teal-600 hover:text-teal-700">
                        <span className="material-icons text-base">visibility</span>
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const formatDate = value => {
  if (!value) return "-"
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) return String(value).slice(0, 16)
  return dateValue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

export default DashboardTableWidget
