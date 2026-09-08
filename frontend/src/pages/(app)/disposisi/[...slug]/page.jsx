"use client"

import Input from 'components/Input';
import InputSelect from 'components/InputSelect';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import surat_disposisiModel from "hooks/models/surat_disposisiModel";
import axios from 'lib/axios';
import { formatDateApp, showToastr, urlPreview } from 'pages/Utils';
import { canUseEofficeAction } from 'lib/eofficeAccess';
import {
    EofficeCard,
    EofficeFormSection,
    EofficeInfoGrid,
    EofficeStatusBadge,
} from 'components/EofficeModuleUI';

const statusOptions = [
    { label: 'Terbuka', value: 'open' },
    { label: 'Dikirim', value: 'dikirim' },
    { label: 'Dibaca', value: 'dibaca' },
    { label: 'Proses', value: 'proses' },
    { label: 'Selesai', value: 'selesai' },
    { label: 'Arsip', value: 'arsip' },
]

const capitalizeFirst = str => {
    if (!str) return ''
    return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

const normalizeStatus = value => {
    if (!value) return 'Menunggu'
    const raw = statusOptions.find(s => String(s.value).toLowerCase() === String(value).toLowerCase())?.label || value
    return capitalizeFirst(raw)
}

class Disposisi_edit extends EditPage {
    model = new surat_disposisiModel()
    state = {
        ...this.state,
        detailData: {},
        inlineTracking: [],
        inlineTrackingLoading: false,
        attachments: [],
        showTimeline: false,
    }

    getInitialData = () => this.props.initialData || {}

    closeDetailTab = () => {
        window.close()
        window.setTimeout(() => {
            if (!window.closed) this.props.router.push('/disposisi')
        }, 120)
    }

    getDetailData = () => ({
        ...this.getInitialData(),
        ...this.state.detailData,
        ...this.state.datainsert,
    })

    getid = async () => {
        if (!this.id) {
            const initialData = this.getInitialData()
            if (Object.keys(initialData).length) {
                this.setState({ detailData: initialData })
            }
            return
        }

        const { datainsert } = this.state
        const initialData = this.getInitialData()

        if (Object.keys(initialData).length) {
            const initialInsert = {}
            Object.entries(initialData).forEach(([key, value]) => {
                if (this.model.allowedFields.includes(key)) initialInsert[key] = value
            })
            this.setState({ detailData: initialData, datainsert: { ...datainsert, ...initialInsert } })
        }

        this.setState({ is_loading: true })
        const rawResponse = await this.model.getId(this.id)
        this.setState({ is_loading: false })

        if (rawResponse?.error || rawResponse?.code || rawResponse?.success === false) return

        // The detail endpoint wraps the record in { success, data } while
        // older model endpoints returned the record directly.
        const response = rawResponse?.data || rawResponse

        let data = {}
        for (let m in response) {
            if (this.model.allowedFields.includes(m)) {
                data[m] = response[m]
            }
        }

        this.setState({ detailData: { ...initialData, ...response }, datainsert: { ...datainsert, ...data } })
        this.handlegetInlineTracking()
        this.handlegetAttachments()
    }

    handlegetAttachments = async () => {
        const data = this.getDetailData()
        const surat = data.surat_masuk || data.surat || {}
        const attachments = []

        // Check surat_masuk attachments
        const fileFields = ['file_surat', 'lampiran', 'lampiran_2', 'lampiran_3', 'file_path']
        fileFields.forEach((field, idx) => {
            const value = surat?.[field] || data?.[field]
            if (value) {
                attachments.push({
                    file: value,
                    name: surat?.[`${field}_name`] || data?.[`${field}_name`] || `Lampiran ${idx + 1}`,
                    type: idx === 0 ? 'primary' : 'attachment',
                })
            }
        })

        this.setState({ attachments })
    }

    handlegetInlineTracking = async () => {
        const currentId = this.id || this.props.params?.slug?.[1]
        if (!currentId) return

        this.setState({ inlineTrackingLoading: true })
        try {
            const response = await axios.get(`/api/surat_disposisi/${currentId}/timeline`)
            const events = response.data?.data || response.data || []
            this.setState({ inlineTracking: events, inlineTrackingLoading: false })
        } catch (error) {
            this.setState({ inlineTracking: [], inlineTrackingLoading: false })
        }
    }

    getTrackingBadgeColor = (type) => {
        const colors = {
            'created': 'bg-success',
            'updated': 'bg-info',
            'sent': 'bg-primary',
            'read': 'bg-secondary',
            'completed': 'bg-success',
            'archived': 'bg-dark',
        }
        return colors[type] || 'bg-secondary'
    }

    getTrackingIcon = (type) => {
        const icons = {
            'created': '✓',
            'updated': '✎',
            'sent': '→',
            'read': '◎',
            'completed': '✓✓',
            'archived': '▣',
        }
        return icons[type] || '•'
    }

    getTrackingTitle = (event) => {
        const titles = {
            'created': 'Disposisi dibuat',
            'updated': 'Diperbarui',
            'sent': 'Dikirim',
            'read': 'Dibaca',
            'completed': 'Selesai',
            'archived': 'Diarsipkan',
        }
        return titles[event.type] || event.description || event.title || event.type
    }

    create = async () => {
        const body = {
            ...this.state.datainsert,
            status: this.state.datainsert.status || 'dikirim'
        }

        this.setState({ btn_loading: true })

        try {
            const response = await this.model.create({ setErrors: this.setErrors, disabledAlert: true, ...body })
            this.setState({ btn_loading: false })

            if (response?.error || response?.code) return

            const responseData = response?.data || response
            const insertedId = responseData?.id || responseData?.id_surat_disposisi

            if (!insertedId) {
                showToastr('error', 'Backend belum mengembalikan ID disposisi. Data kemungkinan belum tersimpan.')
                return
            }

            showToastr('success', 'Disposisi berhasil disimpan!')
            if (this.props.onLoad) this.props.onLoad()
        } catch (error) {
            this.setState({ btn_loading: false })
        }
    }

    handleSubmit = event => {
        event?.preventDefault()
        if (this.state.btn_loading) return

        if (this.id) {
            this.update()
            return
        }

        this.create()
    }

    canSave = () => {
        if (this.state.path === 'detail') return false
        if (this.id) return canUseEofficeAction('disposisi', 'edit')
        return canUseEofficeAction('disposisi', 'add')
    }

    renderTextInput = ({ column, label, type = 'text', required = false, placeholder = label }) => (
        <FormGroup
            label={label}
            required={required}
            message_error={this.state.errors[column]}
            disabled={this.state.is_disabled}
            formCol
            noMb
        >
            <div className="mt-1">
                <Input
                    id={column}
                    type={type}
                    placeholder={placeholder}
                    value={this.state.datainsert[column]}
                    className="block mt-1 w-full"
                    onChange={(value) => this.handleChange(column, value)}
                    required={required}
                    message_error={this.state.errors[column]}
                    onError={this.handleErrors}
                    disabled={this.state.is_disabled}
                />
            </div>
        </FormGroup>
    )

    renderStatus = () => (
        <FormGroup
            label="Status"
            message_error={this.state.errors.status}
            disabled={this.state.is_disabled}
            formCol
            noMb
        >
            <div className="mt-1">
                <InputSelect
                    id="status"
                    type="select"
                    placeholder="Pilih..."
                    value={this.state.datainsert.status}
                    className="block mt-1 w-full"
                    data={statusOptions}
                    onChange={(value) => this.handleChange('status', value)}
                    isClearable
                    isMulti={false}
                    message_error={this.state.errors.status}
                    onError={this.handleErrors}
                    disabled={this.state.is_disabled}
                />
            </div>
        </FormGroup>
    )

    getFileUrl = value => {
        if (!value || typeof value !== 'string') return ''
        if (/^https?:\/\//i.test(value)) return value
        return urlPreview(value.startsWith('/') ? value : `/${value}`)
    }

    isPdfFile = value => /\.pdf$/i.test(String(value || '').split('?')[0])
    isImageFile = value => /\.(png|jpe?g|gif|webp)$/i.test(String(value || '').split('?')[0])

    renderAttachmentPreview = data => {
        const { attachments } = this.state
        const current = attachments[0]
        const fileUrl = this.getFileUrl(current?.file)
        const isPdf = this.isPdfFile(current?.file)
        const isImage = this.isImageFile(current?.file)

        return (
            <EofficeCard className="p-3 h-100 d-flex flex-column" style={{ minHeight: 0 }}>
                <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="font-semibold text-gray-900">Lampiran Surat</div>
                        <div className="text-gray-500" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{current?.name || '-'}</div>
                    </div>
                    {fileUrl ? (
                        <button className="btn-default-app btn-info btn-sm" onClick={() => window.open(fileUrl, '_blank')}>
                            <span className="material-icons mr-1" style={{ fontSize: 14 }}>open_in_new</span>
                            Buka
                        </button>
                    ) : null}
                </div>
                {!fileUrl ? (
                    <div className="text-muted text-center py-5 border rounded-md bg-light flex-1 d-flex align-items-center justify-content-center">
                        <div>
                            <span className="material-icons text-gray-400" style={{ fontSize: 42 }}>description</span>
                            <div className="mt-2">Belum ada lampiran.</div>
                        </div>
                    </div>
                ) : isPdf ? (
                    <iframe
                        src={fileUrl}
                        title="Lampiran"
                        style={{ width: '100%', flex: 1, minHeight: 0, border: '1px solid #d9e2e7', borderRadius: 6, background: '#2f2f2f' }}
                    />
                ) : isImage ? (
                    <div className="d-flex align-items-center justify-content-center border rounded-md bg-dark flex-1" style={{ minHeight: 0 }}>
                        <img src={fileUrl} alt="Lampiran" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                ) : (
                    <div className="text-center py-5 border rounded-md bg-light flex-1 d-flex align-items-center justify-content-center">
                        <div>
                            <span className="material-icons text-gray-500" style={{ fontSize: 42 }}>description</span>
                            <div className="mt-2">Preview tidak tersedia.</div>
                        </div>
                    </div>
                )}
            </EofficeCard>
        )
    }

    renderInlineTracking = () => {
        const { inlineTracking, inlineTrackingLoading } = this.state

        return (
            <EofficeCard className="p-2 mb-2">
                <div className="d-flex align-items-center justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="font-semibold text-gray-900" style={{ fontSize: 13 }}>
                        <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>timeline</span>
                        Tracking Disposisi
                    </div>
                </div>

                {inlineTrackingLoading ? (
                    <div className="text-center py-3">
                        <span className="spinner-border spinner-border-sm text-muted"></span>
                        <div className="text-muted mt-1" style={{ fontSize: 11 }}>Memuat tracking...</div>
                    </div>
                ) : inlineTracking.length > 0 ? (
                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                        {inlineTracking.slice(0, 5).map((event, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: idx < Math.min(inlineTracking.length - 1, 4) ? '1px solid #eee' : 'none' }}>
                                <div style={{ flex: '0 0 auto' }}>
                                    <span className={`badge ${this.getTrackingBadgeColor(event.type)}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                        {this.getTrackingIcon(event.type)}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {this.getTrackingTitle(event)}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#666' }}>
                                        {formatDateApp(event.created_at) || event.created_at}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-muted text-center py-2" style={{ fontSize: 11 }}>
                        Belum ada tracking.
                    </div>
                )}
            </EofficeCard>
        )
    }

    renderDetailMode = () => {
        const data = this.getDetailData()
        const surat = data.surat_masuk || data.surat || {}
        const pemberi = data.pemberi?.name || data.nama_pemberi || data.created_by_desc || data.id_pemberi || data.created_by || '-'
        const penerima = data.penerima?.name || data.nama_penerima || data.id_penerima || '-'
        const statusLabel = normalizeStatus(data.status)

        // Info items for surat related info
        const suratItems = [
            { label: 'Nomor Surat', value: surat.nomor_surat || data.nomor_surat || data.id_surat_masuk || '-' },
            { label: 'Nomor Agenda', value: surat.nomor_agenda || data.nomor_agenda || '-' },
            { label: 'Pengirim', value: surat.asal_surat || data.asal_surat || '-' },
            { label: 'Jenis', value: capitalizeFirst(surat.jenis || '-') },
            { label: 'Sifat', value: capitalizeFirst(surat.sifat || '-') },
            { label: 'Perihal', value: surat.perihal || data.perihal || '-' },
            { label: 'Tanggal Surat', value: surat.tanggal_surat ? formatDateApp(surat.tanggal_surat, 'YYYY-MM-DD') : '-' },
            { label: 'Tanggal Terima', value: surat.tanggal_terima ? formatDateApp(surat.tanggal_terima, 'YYYY-MM-DD') : '-' },
        ]

        // Info items for disposisi
        const disposisiItems = [
            { label: 'Pemberi Disposisi', value: pemberi },
            { label: 'Penerima', value: penerima },
            { label: 'Tenggat Waktu', value: data.tanggal_jatuh_tempo ? formatDateApp(data.tanggal_jatuh_tempo, 'YYYY-MM-DD') : '-' },
            { label: 'Tanggal Selesai', value: data.tanggal_selesai ? formatDateApp(data.tanggal_selesai, 'YYYY-MM-DD') : 'Belum selesai' },
            { label: 'Status', value: statusLabel },
        ]

        return (
            <>
                {/* 3 Column Layout: Disposisi Info | Lampiran | Tracking + Instruksi */}
                <div className="d-flex flex-column flex-xl-row eoffice-disposisi-detail-grid" style={{ gap: 12, height: '100%', minHeight: 0, overflow: 'hidden' }}>
                    {/* KIRI: Detail Info */}
                    <div className="d-flex flex-column" style={{ flex: '0 0 32%', minWidth: 300, minHeight: 0, height: '100%', overflow: 'auto', paddingRight: 2 }}>
                        <EofficeCard className="p-3 mb-2" style={{ flex: '1 1 auto' }}>
                            <div className="d-flex align-items-start justify-content-between mb-3" style={{ gap: 10 }}>
                                <div>
                                    <div className="font-semibold text-gray-900" style={{ fontSize: 16 }}>
                                        {surat.perihal || data.perihal || 'Disposisi Surat Masuk'}
                                    </div>
                                    <div className="text-gray-500 mt-1" style={{ fontSize: 12 }}>Detail disposisi surat</div>
                                </div>
                                <EofficeStatusBadge value={data.status || 'dikirim'} />
                            </div>
                            <EofficeInfoGrid items={disposisiItems} />
                            <div className="mt-3">
                                <div className="text-gray-500" style={{ fontSize: 11 }}>Instruksi</div>
                                <div className="mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.4, maxHeight: 100, overflowY: 'auto' }}>
                                    {data.instruksi || '-'}
                                </div>
                            </div>
                            {data.catatan_penyelesaian ? (
                                <div className="mt-3">
                                    <div className="text-gray-500" style={{ fontSize: 11 }}>Laporan Penyelesaian</div>
                                    <div className="mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.4 }}>
                                        {data.catatan_penyelesaian}
                                    </div>
                                </div>
                            ) : null}
                        </EofficeCard>
                    </div>

                    {/* TENGAH: Lampiran */}
                    <div style={{ flex: '1 1 36%', minWidth: 300, minHeight: 0, height: '100%' }}>
                        {this.renderAttachmentPreview(data)}
                    </div>

                    {/* KANAN: Tracking + Info Surat */}
                    <div className="d-flex flex-column" style={{ flex: '0 0 30%', minWidth: 280, minHeight: 0, height: '100%', overflow: 'auto' }}>
                        {this.renderInlineTracking()}
                        <EofficeCard className="p-3 mb-2" style={{ flex: '0 0 auto' }}>
                            <div className="font-semibold text-gray-900 mb-2" style={{ fontSize: 13 }}>
                                <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>mail</span>
                                Info Surat Masuk
                            </div>
                            <EofficeInfoGrid items={suratItems} />
                            {(surat.isi_ringkasan || data.isi_ringkasan) ? (
                                <div className="mt-2">
                                    <div className="text-gray-500" style={{ fontSize: 11 }}>Isi/Ringkasan</div>
                                    <div className="mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.4 }}>
                                        {surat.isi_ringkasan || data.isi_ringkasan}
                                    </div>
                                </div>
                            ) : null}
                        </EofficeCard>
                    </div>
                </div>
            </>
        )
    }

    render() {
        if (this.state.path === 'detail') {
            return (
                <div className="eoffice-full-detail-page">
                    <div className="eoffice-full-detail-toolbar">
                        <div className="d-flex align-items-center gap-2">
                            <span className="material-icons">assignment_turned_in</span>
                            <strong>Detail Disposisi</strong>
                        </div>
                        <button type="button" className="eoffice-detail-close" aria-label="Tutup" onClick={this.closeDetailTab}>
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                    <div className="eoffice-full-detail-content">
                        {this.renderDetailMode()}
                    </div>
                </div>
            )
        }

        return (
            <>
                <EofficeFormSection
                    title="Buat Disposisi"
                    subtitle="Pilih surat, penerima, lalu isi instruksi tindak lanjut."
                    icon="send"
                >
                    <div className="row g-3">
                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'id_surat_masuk',
                                label: 'Pilih Surat',
                                required: true,
                                placeholder: 'Masukkan ID atau nomor surat'
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'id_penerima',
                                label: 'Penerima/Tujuan',
                                required: true,
                                placeholder: 'Masukkan penerima disposisi'
                            })}
                        </div>

                        <div className="col-12">
                            {this.renderTextInput({
                                column: 'instruksi',
                                label: 'Instruksi',
                                type: 'textarea',
                                required: true,
                                placeholder: 'Tuliskan instruksi disposisi secara singkat dan jelas'
                            })}
                        </div>

                        {this.id ? (
                            <div className="col-lg-6 col-md-12">
                                {this.renderStatus()}
                            </div>
                        ) : null}
                    </div>
                </EofficeFormSection>

                {this.id ? (
                    <EofficeFormSection
                        title="Tracking Penyelesaian"
                        subtitle="Diisi saat disposisi sudah ditindaklanjuti."
                        icon="task_alt"
                    >
                        <div className="row g-3">
                            <div className="col-12">
                                {this.renderTextInput({
                                    column: 'catatan_penyelesaian',
                                    label: 'Laporan',
                                    type: 'textarea',
                                    placeholder: 'Isi laporan penyelesaian disposisi'
                                })}
                            </div>

                            <div className="col-lg-6 col-md-12">
                                {this.renderTextInput({
                                    column: 'file_bukti_path',
                                    label: 'Bukti/Lampiran',
                                    placeholder: 'Nama/path file bukti penyelesaian'
                                })}
                            </div>

                            <div className="col-lg-6 col-md-12">
                                {this.renderTextInput({
                                    column: 'tanggal_selesai',
                                    label: 'Tanggal Selesai',
                                    type: 'date'
                                })}
                            </div>
                        </div>
                    </EofficeFormSection>
                ) : null}

                {this.canSave() ? (
                    <div className="d-flex justify-content-center mt-4">
                        <button
                            type="button"
                            className="btn-default-app inline-flex items-center py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                            disabled={this.state.btn_loading}
                            onClick={this.handleSubmit}
                        >
                            {this.state.btn_loading ? (
                                "Loading..."
                            ) : (
                                <>
                                    <span className="material-icons icon-btn-left mr-1">
                                        send
                                    </span>
                                    {this.id ? 'Simpan Disposisi' : 'Tambah Disposisi'}
                                </>
                            )}
                        </button>
                    </div>
                ) : null}
            </>
        )
    }
}

export default Disposisi_edit
