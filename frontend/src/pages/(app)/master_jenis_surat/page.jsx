import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import axios from 'lib/axios'
import HeaderApp from 'components/HeaderApp'
import Button from 'components/Button'
import EditDelete from 'components/EditDelete'
import EofficeStatusBadge from 'components/EofficeStatusBadge'
import { EofficeEmptyState, EofficeTableCell, EofficeTableWithFilter } from 'components/EofficeModuleUI'

const emptyForm = { kode: '', nama: '', deskripsi: '', is_active: true }

export default function MasterJenisSuratPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState({ kode: '', nama: '', status: '' })
  const [showFormModal, setShowFormModal] = useState(false)

  const load = async () => {
    // Resource API defaults to 10 rows. Request the complete master list so
    // the management page matches the options used by Surat Masuk/Keluar.
    const response = await axios.get('/api/master_jenis_surat?pagesize=1000', { withCredentials: true })
    setItems(response.data?.data || response.data?.result || [])
    setLoadError('')
  }

  useEffect(() => {
    load().catch(() => setLoadError('Data jenis surat gagal dimuat. Silakan muat ulang halaman.'))
  }, [])

  const submit = async event => {
    event.preventDefault()
    setLoading(true)
    try {
      const url = editingId ? `/api/master_jenis_surat/${editingId}` : '/api/master_jenis_surat'
      await axios({ method: editingId ? 'put' : 'post', url, data: form, withCredentials: true })
      setForm(emptyForm)
      setEditingId(null)
      setShowFormModal(false)
      await load()
    } finally {
      setLoading(false)
    }
  }

  const edit = item => {
    setEditingId(item.id_jenis_surat)
    setForm({ kode: item.kode || '', nama: item.nama || '', deskripsi: item.deskripsi || '', is_active: item.is_active !== false })
    setShowFormModal(true)
  }

  const remove = async item => {
    if (!window.confirm(`Hapus jenis surat ${item.nama}?`)) return
    await axios.delete(`/api/master_jenis_surat/${item.id_jenis_surat}`, { withCredentials: true })
    await load()
  }

  const visibleItems = useMemo(() => items.filter(item => {
    if (filters.kode && !String(item.kode || '').toLowerCase().includes(filters.kode.toLowerCase())) return false
    if (filters.nama && !`${item.nama || ''} ${item.deskripsi || ''}`.toLowerCase().includes(filters.nama.toLowerCase())) return false
    if (filters.status && String(Boolean(item.is_active)) !== filters.status) return false
    return true
  }), [items, filters])

  const tableHeaders = [
    { name: 'nomor', label: 'No', width: 52, align: 'center', filterType: 'none' },
    { name: 'kode', label: 'Kode', width: 150, align: 'center', filterType: 'text' },
    { name: 'nama', label: 'Jenis Surat', width: 260, align: 'center', filterType: 'text' },
    { name: 'deskripsi', label: 'Deskripsi', width: 'auto', align: 'center', filterType: 'none' },
    { name: 'status', label: 'Status', width: 115, align: 'center', filterType: 'select', filterOptions: [{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Tidak Aktif' }] },
    { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
  ]

  return <>
    <HeaderApp
      title="Master Jenis Surat"
      hideTitle
      is_loading={loading}
      data_btn={[]}
      btnCustom={<div style={{ marginTop: 16, marginBottom: 0 }}><Button className="btn-default-app btn-info" onClick={() => { setEditingId(null); setForm(emptyForm); setShowFormModal(true) }}><span className="material-icons mr-1" style={{ fontSize: 16 }}>add</span>Tambah Jenis Surat</Button></div>}
    />
    <div className="container pl-4 pr-4">
    {visibleItems.length ? <EofficeTableWithFilter headers={tableHeaders} colgroup={tableHeaders.map(header => header.width)} filterValues={filters} onFilterChange={(name, value) => setFilters(current => ({ ...current, [name]: value }))} minWidth={880}>
      {visibleItems.map((item, index) => <tr key={item.id_jenis_surat}>
        <EofficeTableCell width={52} align="center">{index + 1}</EofficeTableCell>
        <EofficeTableCell width={150} align="start"><span className="font-semibold text-slate-700">{item.kode}</span></EofficeTableCell>
        <EofficeTableCell width={260} align="start" wrap><span className="font-semibold text-slate-800">{item.nama}</span></EofficeTableCell>
        <EofficeTableCell align="start" wrap><span className="text-slate-600">{item.deskripsi || '-'}</span></EofficeTableCell>
        <EofficeTableCell width={115} align="center"><EofficeStatusBadge value={item.is_active ? 'aktif' : 'inactive'} label={item.is_active ? 'Aktif' : 'Tidak Aktif'} /></EofficeTableCell>
        <EofficeTableCell width={60} align="center"><EditDelete data={[{ label: 'Edit', icon: 'edit' }, { label: 'Hapus', icon: 'delete' }]} onEdit={() => edit(item)} onDelete={() => remove(item)} /></EofficeTableCell>
      </tr>)}
    </EofficeTableWithFilter> : <div className="bg-white border border-gray-200 rounded-md shadow-sm"><EofficeEmptyState icon="description" title={loadError || 'Belum ada jenis surat'} description="Tambahkan jenis surat baru atau ubah filter pencarian." /></div>}
  </div>
  <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
    <form onSubmit={submit}>
      <Modal.Header closeButton><Modal.Title>{editingId ? 'Ubah Jenis Surat' : 'Tambah Jenis Surat'}</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="mb-3"><label className="form-label">Kode <span className="text-danger">*</span></label><input className="form-control" placeholder="Contoh: JS-UND" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} required /></div>
        <div className="mb-3"><label className="form-label">Nama jenis surat <span className="text-danger">*</span></label><input className="form-control" placeholder="Contoh: Surat Undangan" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required /></div>
        <div className="mb-3"><label className="form-label">Deskripsi</label><textarea className="form-control" rows={3} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div>
        <div className="form-check"><input id="jenis-surat-active" className="form-check-input" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /><label className="form-check-label" htmlFor="jenis-surat-active">Aktif</label></div>
      </Modal.Body>
      <Modal.Footer><Button className="btn-default-app btn-light" type="button" onClick={() => setShowFormModal(false)} disabled={loading}>Batal</Button><Button className="btn-default-app btn-info" type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button></Modal.Footer>
    </form>
  </Modal>
  </>
}
