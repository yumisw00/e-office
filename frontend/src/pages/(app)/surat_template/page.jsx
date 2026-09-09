"use client"

import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import Button from "components/Button";
import EditDelete from "components/EditDelete";
import { api_services } from "hooks/api_services";
import axios from "lib/axios";
import { showToastr } from "pages/Utils";
import {
    EofficeStatusBadge,
    EofficeTableWithFilter,
    EofficeTableCell,
} from "components/EofficeModuleUI";

const emptyForm = {
    nama_template: "",
    jenis_surat: "",
    file_template: "",
    file_path: "",
    drive_document_url: "",
}

/* const jenisTemplateOptions = [
    // Kategori: Surat Undangan
    { value: "surat_undangan", label: "Surat Undangan" },
    { value: "surat_undangan_rapat", label: "Surat Undangan Rapat" },
    { value: "surat_undangan_seminar", label: "Surat Undangan Seminar" },
    { value: "surat_undangan_pelatihan", label: "Surat Undangan Pelatihan" },
    { value: "surat_undangan_rapat_urgent", label: "Surat Undangan Rapat Urgent" },
    { value: "surat_undangan_peresmian", label: "Surat Undangan Peresmian" },

    // Kategori: Surat Permohonan
    { value: "surat_permohonan", label: "Surat Permohonan" },
    { value: "surat_permohonan_cuti", label: "Surat Permohonan Cuti" },
    { value: "surat_permohonan_ijin", label: "Surat Permohonan Ijin" },
    { value: "surat_permohonan_resign", label: "Surat Permohonan Resign" },
    { value: "surat_permohonan_uang", label: "Surat Permohonan Dana" },
    { value: "surat_permohonan_keterangan", label: "Surat Permohonan Keterangan" },

    // Kategori: Surat Keterangan
    { value: "surat_keterangan", label: "Surat Keterangan" },
    { value: "surat_keterangan_kerja", label: "Surat Keterangan Kerja" },
    { value: "surat_keterangan_domisili", label: "Surat Keterangan Domisili" },
    { value: "surat_keterangan_gaji", label: "Surat Keterangan Gaji" },
    { value: "surat_keterangan_lulus", label: "Surat Keterangan Lulus" },

    // Kategori: Surat Perjanjian/Kontrak
    { value: "surat_perjanjian_kontrak", label: "Surat Perjanjian/Kontrak" },
    { value: "surat_perjanjian_kerjasama", label: "Surat Perjanjian Kerjasama" },
    { value: "surat_perjanjian_mou", label: "Surat MOU / MoU" },

    // Kategori: Surat Administrasi
    { value: "surat_pemberitahuan", label: "Surat Pemberitahuan" },
    { value: "surat_pengumuman", label: "Surat Pengumuman" },
    { value: "surat_edaran", label: "Surat Edaran" },
    { value: "surat_keputusan", label: "Surat Keputusan" },
    { value: "surat_tugas", label: "Surat Tugas" },
    { value: "surat_pengantar", label: "Surat Pengantar" },

    // Kategori: Surat Komersial
    { value: "surat_penawaran", label: "Surat Penawaran" },
    { value: "surat_penawaran_harga", label: "Surat Penawaran Harga" },
    { value: "surat_tagihan_invoice", label: "Surat Tagihan/Invoice" },
    { value: "surat_klaim_komplain", label: "Surat Klaim/Komplain" },
    { value: "surat_pengadaan_barang", label: "Surat Pengadaan Barang" },
    { value: "surat_pengadaan_jasa", label: "Surat Pengadaan Jasa" },

    // Kategori: Internal
    { value: "surat_perintah_kerja", label: "Surat Perintah Kerja" },
    { value: "nota_dinas", label: "Nota Dinas" },
    { value: "memo_internal", label: "Memo Internal" },

    // Kategori: Dokumen Rapat
    { value: "surat_rapat", label: "Surat Rapat/Notulen" },
    { value: "surat_daftar_hadir", label: "Daftar Hadir Rapat" },
    { value: "surat_absensi", label: "Daftar Absensi" },
    { value: "berita_acara", label: "Berita Acara" },

    // Kategori: Lainnya
    { value: "surat_serah_terima", label: "Surat Serah Terima" },
    { value: "surat_pernyataan", label: "Surat Pernyataan" },
    { value: "surat_kuasa", label: "Surat Kuasa" },
    { value: "surat_rekomendasi", label: "Surat Rekomendasi" },
    { value: "surat_peringatan", label: "Surat Peringatan" },
    { value: "laporan", label: "Laporan" },
]
*/

const jenisTemplateLabel = (value, options = []) => {
    const option = options.find(item => item.value === value || item.label === value)
    if (option) return option.label
    return String(value || "-").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase())
}

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const getId = item => item?.id_surat_template || item?.id || item?.value

const SuratTemplate = () => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [selectedId, setSelectedId] = useState(null)
    const [showDriveModal, setShowDriveModal] = useState(false)
    const [driveUrlInput, setDriveUrlInput] = useState("")
    const [connectingDrive, setConnectingDrive] = useState(false)
    const [jenisTemplateOptions, setJenisTemplateOptions] = useState([])

    const service = useMemo(() => api_services({ api_path: "/surat_template" }), [])

    const loadData = async () => {
        setIsLoading(true)
        const response = await service.getapi_services({
            filter: {
                paginate: { page: 1, pagesize: 1000 },
            },
        })
        setIsLoading(false)

        if (response?.error || response?.code) {
            setList([])
            return
        }

        setList(normalizeList(response))
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        axios.get('/api/master_jenis_surat/options', { withCredentials: true })
            .then(response => setJenisTemplateOptions(normalizeList(response.data)))
            .catch(() => {
                setJenisTemplateOptions([])
                showToastr('error', 'Data Master Jenis Surat gagal dimuat.')
            })
    }, [])

    const [inlineFilterValues, setInlineFilterValues] = useState({})

    const tableHeaders = [
        { name: 'nomor', label: 'No', width: 46, align: 'center', filterType: 'none' },
        { name: 'nama_template', label: 'Nama Template', width: 180, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'jenis_surat', label: 'Jenis', width: 150, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'dokumen', label: 'Dokumen', width: 200, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
        { name: 'status', label: 'Status', width: 100, align: 'center', filterType: 'select', filterPlaceholder: 'Filter...', filterOptions: [{ value: 'aktif', label: 'Aktif' }, { value: 'tidak aktif', label: 'Tidak Aktif' }] },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]
    const tableColgroup = tableHeaders.map(h => h.width)

    const getCellValue = (item, name) => {
        if (name === 'jenis_surat') return jenisTemplateLabel(item?.jenis_surat, jenisTemplateOptions) || '-'
        return item?.[name] || '-'
    }

    const filteredList = list.filter(item => {
        const filters = inlineFilterValues
        if (filters.nama_template && !String(item?.nama_template || '').toLowerCase().includes(String(filters.nama_template).toLowerCase())) return false
        if (filters.jenis_surat && !String(jenisTemplateLabel(item?.jenis_surat, jenisTemplateOptions) || '').toLowerCase().includes(String(filters.jenis_surat).toLowerCase())) return false
        if (filters.dokumen) {
            const doc = item?.drive_document_url || item?.file_path || ''
            if (!String(doc).toLowerCase().includes(String(filters.dokumen).toLowerCase())) return false
        }
        if (filters.status && String(item?.status || '').toLowerCase() !== String(filters.status).toLowerCase()) return false
        return true
    })

    const handleInlineFilterChange = (colName, value) => {
        setInlineFilterValues(prev => ({ ...prev, [colName]: value }))
    }

    const openForm = item => {
        const isEdit = Boolean(getId(item))
        setSelectedId(getId(item))
        setForm({
            ...emptyForm,
            ...item,
            // Auto-fill nama_template from jenis_surat when creating new
            nama_template: isEdit ? (item?.nama_template || '') : '',
        })
        setShowModal(true)
    }

    const handleOpenDriveConnect = () => {
        setDriveUrlInput(form.drive_document_url || "")
        setShowDriveModal(true)
    }

    const handleSaveDriveUrl = async () => {
        if (!driveUrlInput.trim()) {
            showToastr('error', 'URL Google Drive tidak boleh kosong.')
            return
        }
        setConnectingDrive(true)
        try {
            await axios.get('/sanctum/csrf-cookie')
            const payload = { drive_document_url: driveUrlInput.trim() }
            if (selectedId) payload.template_id = selectedId
            const response = await axios.post('/api/surat_template/create-google-drive-link', payload)
            if (response.data?.success) {
                const normalizedUrl = response.data.drive_document_url || driveUrlInput.trim()
                setForm(current => ({ ...current, drive_document_url: normalizedUrl }))
                showToastr('success', response.data.message || 'Link Google Drive berhasil disimpan.')
                setShowDriveModal(false)
            } else {
                showToastr('error', response.data?.message || 'Gagal menyimpan link Google Drive.')
            }
        } catch (error) {
            const msg = error?.response?.data?.message || 'Gagal terhubung ke Google Drive.'
            showToastr('error', msg)
        } finally {
            setConnectingDrive(false)
        }
    }

    const handleCreateGoogleDoc = () => {
        window.open('https://docs.google.com/document/create', '_blank')
    }

    const saveData = async event => {
        event?.preventDefault()
        if (!form.jenis_surat) {
            showToastr('error', 'Jenis surat wajib dipilih dari Master Jenis Surat.')
            return
        }
        try {
            const body = {
                nama: form.nama_template,
                nama_template: form.nama_template,
                jenis_surat: form.jenis_surat,
                drive_document_url: form.drive_document_url || '',
                status: 'aktif',
            }

            const response = selectedId
                ? await service.putapi_services({ id: selectedId, ...body })
                : await service.postapi_services(body);

            // Check for error
            if (response?.error || response?.code) {
                const errorMsg = response?.messages?.error || response?.messages?.errors || 'Gagal menyimpan template surat';
                showToastr('error', errorMsg);
                return;
            }

            showToastr('success', 'Template surat berhasil disimpan!');
            setShowModal(false);
            setSelectedId(null);
            setForm(emptyForm);
            loadData();
        } catch (error) {
            console.error('Save error:', error);
            const errorMsg = error?.response?.data?.messages?.error || error?.response?.data?.messages?.errors || error?.message || 'Gagal menyimpan template surat';
            showToastr('error', errorMsg);
        }
    }

    const deleteData = async item => {
        const id = getId(item)
        if (!id) return
        const response = await service.deleteapi_services({ id })
        if (response?.error || response?.code) return
        loadData()
    }


    return (
        <>
            <div className="container pl-4 pr-4">
                <div className="d-flex justify-content-end mb-3">
                    <Button className="btn-default-app btn-info" onClick={() => openForm({})}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>upload_file</span>
                        Tambah Template
                    </Button>
                </div>
                <div className="table-responsive table-responsive-x">
                    <EofficeTableWithFilter
                        className="surat-template-table"
                        headers={tableHeaders}
                        colgroup={tableColgroup}
                        filterValues={inlineFilterValues}
                        onFilterChange={handleInlineFilterChange}
                        align="start"
                        minWidth={700}
                    >
                        {filteredList.map((item, index) => {
                            return (
                                <tr key={getId(item) || index} className="align-top">
                                    <EofficeTableCell width={50} align="start">{index + 1}</EofficeTableCell>
                                    {tableHeaders.slice(1).map(header => {
                                        if (header.name === 'nama_template') {
                                            return (
                                                <EofficeTableCell key={header.name} width={header.width} align="start" wrap>
                                                    <div className="font-semibold text-gray-900">{item?.nama_template || "-"}</div>
                                                </EofficeTableCell>
                                            )
                                        }
                                        if (header.name === 'jenis_surat') {
                                            return (
                                                <EofficeTableCell key={header.name} width={header.width} align="start" wrap>
                                                    <div className="text-gray-900">{jenisTemplateLabel(item?.jenis_surat, jenisTemplateOptions) || "-"}</div>
                                                </EofficeTableCell>
                                            )
                                        }
                                        if (header.name === 'dokumen') {
                                            const driveUrl = item?.drive_document_url
                                            return (
                                                <EofficeTableCell key={header.name} width={header.width} align="center" wrap>
                                                    {driveUrl ? (
                                                        <div className="d-flex justify-content-center">
                                                            <a
                                                                href={driveUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm d-flex align-items-center gap-1"
                                                                style={{ background: '#2563eb', color: '#fff', border: 'none', fontSize: 12, width: 'fit-content' }}
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
                                                                    <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#fff"/>
                                                                    <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#fff"/>
                                                                    <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#fff"/>
                                                                    <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#fff"/>
                                                                </svg>
                                                                Buka & Edit di Google Docs
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted" style={{ fontSize: 12 }}>Belum terhubung</span>
                                                    )}
                                                </EofficeTableCell>
                                            )
                                        }
                                        if (header.name === 'status') {
                                            return (
                                                <EofficeTableCell key={header.name} width={84} align={header.align} style={{ paddingLeft: 4, paddingRight: 4 }}>
                                                    <EofficeStatusBadge value={item?.status || "aktif"} />
                                                </EofficeTableCell>
                                            )
                                        }
                                        if (header.name === 'aksi') {
                                            const driveUrl = item?.drive_document_url
                                            return (
                                                <EofficeTableCell key={header.name} width={header.width} align={header.align}>
                                                    <div className="d-flex align-items-center justify-content-center td-action">
                                                        <EditDelete
                                                            id={getId(item)}
                                                            data={[
                                                                { label: 'Hapus', icon: 'delete' },
                                                            ]}
                                                            onEdit={() => openForm(item)}
                                                            onDelete={() => deleteData(item)}
                                                        />
                                                    </div>
                                                </EofficeTableCell>
                                            )
                                        }
                                        return (
                                            <EofficeTableCell key={header.name} width={header.width} align={header.align} wrap>
                                                {getCellValue(item, header.name)}
                                            </EofficeTableCell>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </EofficeTableWithFilter>
                </div>
            </div>

            <Modal
                show={showModal && !showDriveModal}
                onHide={() => {}}
                size="lg"
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton={false} className="d-flex justify-content-between align-items-center border-0 pb-0">
                    <Modal.Title className="mb-0">{selectedId ? "Edit Template Surat" : "Upload Template Surat"}</Modal.Title>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)} />
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="font-semibold">Jenis Surat</label>
                                <select className="form-control" value={form.jenis_surat || ""} required onChange={e => {
                                    const selectedJenis = e.target.value
                                    const label = jenisTemplateLabel(selectedJenis, jenisTemplateOptions)
                                    setForm(prev => ({
                                        ...prev,
                                        jenis_surat: selectedJenis,
                                        nama_template: label,
                                    }))
                                }}>
                                    <option value="">Pilih jenis surat</option>
                                    {jenisTemplateOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="font-semibold">Nama Template</label>
                                <input className="form-control" value={form.nama_template || ""} onChange={e => setForm({ ...form, nama_template: e.target.value })} required />
                            </div>
                            <div className="col-md-6">
                                <label className="font-semibold">Status</label>
                                <div className="mt-2">
                                    <EofficeStatusBadge value="aktif" />
                                </div>
                            </div>
                            <div className="col-12">
                                <label className="font-semibold">Google Drive</label>
                                {form.drive_document_url ? (
                                    <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                        <a
                                            href={form.drive_document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary d-flex align-items-center gap-1"
                                            style={{ fontSize: 13 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                                                <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#fff"/>
                                                <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#fff"/>
                                                <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#fff"/>
                                                <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#fff"/>
                                            </svg>
                                            Buka & Edit di Google Docs
                                        </a>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={handleOpenDriveConnect}
                                            title="Ganti dokumen Google Drive"
                                        >
                                            <span className="material-icons" style={{ fontSize: 16 }}>swap_horiz</span>
                                            Ganti
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setForm(c => ({ ...c, drive_document_url: '' }))}
                                            title="Lepas Google Drive"
                                        >
                                            <span className="material-icons" style={{ fontSize: 16 }}>link_off</span>
                                            Lepas
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        <button
                                            type="button"
                                            className="btn btn-primary d-flex align-items-center gap-2"
                                            onClick={handleOpenDriveConnect}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                                                <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#fff"/>
                                                <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#fff"/>
                                                <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#fff"/>
                                                <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#fff"/>
                                            </svg>
                                            Buat / Pilih dari Google Drive
                                        </button>
                                        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                                            <strong>Cara pakai:</strong> Klik tombol di atas → buat dokumen baru di Google Docs → salin tautan → tempelkan di sini. Dokumen bisa diedit langsung secara kolaboratif.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-default-app btn-info" type="submit">
                            Simpan Template
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Google Drive Connect Modal */}
            <Modal
                show={showDriveModal}
                onHide={() => {}}
                size="lg"
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton={false} className="d-flex justify-content-between align-items-center border-0 pb-0">
                    <Modal.Title className="mb-0">Hubungkan Google Drive</Modal.Title>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowDriveModal(false)} />
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        {/* Left: Form */}
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="font-semibold mb-2 d-block">Nama Template</label>
                                <input className="form-control" value={form.nama_template || ""} onChange={e => setForm({ ...form, nama_template: e.target.value })} placeholder="Masukkan nama template" />
                            </div>
                            <div className="mb-3">
                                <label className="font-semibold mb-2 d-block">Status</label>
                                <EofficeStatusBadge value="aktif" />
                            </div>
                            <div className="mb-3">
                                <label className="font-semibold mb-2 d-block">Google Drive</label>
                                {form.drive_document_url ? (
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <a
                                            href={form.drive_document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary d-flex align-items-center gap-1"
                                            style={{ fontSize: 13 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                                                <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#fff"/>
                                                <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#fff"/>
                                                <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#fff"/>
                                                <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#fff"/>
                                            </svg>
                                            Buka & Edit di Google Docs
                                        </a>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={handleOpenDriveConnect}
                                            title="Ganti dokumen Google Drive"
                                        >
                                            <span className="material-icons" style={{ fontSize: 16 }}>swap_horiz</span>
                                            Ganti
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setForm(c => ({ ...c, drive_document_url: '' }))}
                                            title="Lepas Google Drive"
                                        >
                                            <span className="material-icons" style={{ fontSize: 16 }}>link_off</span>
                                            Lepas
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            type="button"
                                            className="btn btn-primary d-flex align-items-center gap-2"
                                            onClick={handleOpenDriveConnect}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                                                <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#fff"/>
                                                <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#fff"/>
                                                <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#fff"/>
                                                <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#fff"/>
                                            </svg>
                                            Buat / Pilih dari Google Drive
                                        </button>
                                        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                                            <strong>Cara pakai:</strong> Klik tombol di atas → buat dokumen baru di Google Docs → salin tautan → tempelkan di sini. Dokumen bisa diedit langsung secara kolaboratif.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Right: Instructions */}
                        <div className="col-md-6">
                            <div className="mb-3 p-3 rounded" style={{ background: '#f0f4ff', border: '1px solid #c7d9f5' }}>
                                <div className="mb-2" style={{ fontSize: 13, fontWeight: 600, color: '#1a4cc7' }}>Langkah-langkah:</div>
                                <ol className="mb-0 ps-3" style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                                    <li>Klik tombol <strong>"Buka Google Docs (tab baru)"</strong> di bawah</li>
                                    <li>Di tab baru, buat dokumen baru atau buka dokumen yang sudah ada</li>
                                    <li>Salin URL dari address bar browser</li>
                                    <li>Kembali ke sini, tempelkan URL di kolom tautan</li>
                                    <li>Klik <strong>"Simpan & Hubungkan"</strong></li>
                                </ol>
                            </div>
                            <div className="mb-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                                    onClick={handleCreateGoogleDoc}
                                >
                                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                                        <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#0066DA"/>
                                        <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#00AC47"/>
                                        <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#EA4335"/>
                                        <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#00832D"/>
                                        <path d="M9.8 28.8L18.3 28.8L18.3 39.8C18.3 39.8 8.8 33.9 9.8 28.8Z" fill="#2684FC"/>
                                        <path d="M29.8 28.8L38.3 28.8C37.3 33.9 47.8 39.8 47.8 39.8L47.8 28.8H29.8Z" fill="#FFBA00"/>
                                    </svg>
                                    Buka Google Docs (tab baru)
                                </button>
                            </div>
                            <div className="mb-2">
                                <label className="font-semibold mb-1 d-block" style={{ fontSize: 13 }}>Tempelkan Tautan Dokumen</label>
                                <input
                                    className="form-control"
                                    type="url"
                                    placeholder="https://docs.google.com/document/d/..."
                                    value={driveUrlInput}
                                    onChange={e => setDriveUrlInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveDriveUrl()}
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        className="btn-default-app btn-info"
                        type="button"
                        onClick={handleSaveDriveUrl}
                        disabled={connectingDrive}
                    >
                        {connectingDrive ? "Menyimpan..." : "Simpan & Hubungkan"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default SuratTemplate
