"use client"

import Input from 'components/Input';
import InputSelect from 'components/InputSelect';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import surat_arsipModel from "hooks/models/surat_arsipModel";
import { formatDateApp, showToastr, urlPreview } from 'pages/Utils';
import { canUseEofficeAction } from 'lib/eofficeAccess';
import { EofficeCard, EofficeInfoGrid, EofficeStatusBadge } from 'components/EofficeModuleUI';

const jenisOptions = [
    { label: 'Surat Masuk', value: 'surat_masuk' },
    { label: 'Surat Keluar', value: 'surat_keluar' },
]

class SuratArsipEdit extends EditPage {
    model = new surat_arsipModel()

    create = async () => {
        const body = {
            ...this.state.datainsert,
            tanggal_arsip: this.state.datainsert.tanggal_arsip || this.getTodayDate(),
        }

        this.setState({ btn_loading: true })
        const response = await this.model.create({ setErrors: this.setErrors, disabledAlert: true, ...body })
        this.setState({ btn_loading: false })

        if (response?.error || response?.code) return

        showToastr('success', 'Arsip surat berhasil disimpan.')
        if (this.props.onLoad) this.props.onLoad()
    }

    getTodayDate = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
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
        if (this.id) return canUseEofficeAction('surat_arsip', 'edit')
        return canUseEofficeAction('surat_arsip', 'add')
    }

    closeDetailTab = () => {
        window.close()
        window.setTimeout(() => {
            if (!window.closed) this.props.router.push('/surat_arsip')
        }, 120)
    }

    renderDetailMode = () => {
        const data = this.state.datainsert || {}
        const rawFile = String(data.file_path || '')
        const fileUrl = rawFile
            ? (rawFile.startsWith('http') || rawFile.startsWith('data:') ? rawFile : urlPreview(rawFile.startsWith('/') ? rawFile : `/${rawFile}`))
            : ''
        const isImage = /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(rawFile)
        const infoItems = [
            { label: 'Jenis Surat', value: jenisOptions.find(item => item.value === data.jenis_surat)?.label || data.jenis_surat || '-' },
            { label: 'Nomor Surat', value: data.nomor_surat || '-' },
            { label: 'Tanggal Arsip', value: data.tanggal_arsip ? formatDateApp(data.tanggal_arsip, 'YYYY-MM-DD') : '-' },
            { label: 'Lokasi Arsip Fisik', value: data.lokasi_fisik || 'Arsip Digital' },
            { label: 'Hash File', value: data.hash_file || '-' },
        ]

        return (
            <div className="eoffice-full-detail-page">
                <div className="eoffice-full-detail-toolbar">
                    <div className="d-flex align-items-center gap-2"><span className="material-icons">archive</span><strong>Detail Arsip Surat</strong></div>
                    <button type="button" className="eoffice-detail-close" aria-label="Tutup" onClick={this.closeDetailTab}><span className="material-icons">close</span></button>
                </div>
                <div className="eoffice-full-detail-content">
                    <div className="eoffice-archive-detail-grid">
                        <EofficeCard className="p-3 eoffice-archive-detail-info">
                            <div className="d-flex align-items-start justify-content-between mb-3"><div><div className="font-semibold text-gray-900" style={{ fontSize: 16 }}>{data.perihal || 'Arsip Surat'}</div><div className="text-gray-500 mt-1" style={{ fontSize: 12 }}>Detail surat yang sudah diarsipkan</div></div><EofficeStatusBadge value="diarsipkan" label="Diarsipkan" /></div>
                            <EofficeInfoGrid items={infoItems} />
                            <div className="mt-3"><div className="text-gray-500" style={{ fontSize: 11 }}>Perihal</div><div className="mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{data.perihal || '-'}</div></div>
                        </EofficeCard>
                        <EofficeCard className="p-3 h-100 d-flex flex-column eoffice-archive-detail-document">
                            <div className="font-semibold text-gray-900 mb-2">Lampiran Surat</div>
                            {!fileUrl ? <div className="flex-1 d-flex align-items-center justify-content-center border rounded bg-light text-muted">Belum ada lampiran.</div> : isImage ? <div className="flex-1 d-flex align-items-center justify-content-center border rounded bg-dark" style={{ minHeight: 0 }}><img src={fileUrl} alt="Lampiran arsip" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div> : <iframe title="Lampiran arsip surat" src={fileUrl} style={{ width: '100%', flex: 1, minHeight: 0, border: '1px solid #d9e2e7', borderRadius: 6 }} />}
                        </EofficeCard>
                        <EofficeCard className="p-3 eoffice-archive-detail-status">
                            <div className="font-semibold text-gray-900 mb-2"><span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>verified</span>Status Arsip</div>
                            <EofficeInfoGrid items={[{ label: 'Status', value: 'Sudah Diarsipkan' }, { label: 'Tanggal Arsip', value: data.tanggal_arsip ? formatDateApp(data.tanggal_arsip, 'YYYY-MM-DD') : '-' }, { label: 'Lokasi Fisik', value: data.lokasi_fisik || 'Arsip Digital' }]} />
                        </EofficeCard>
                    </div>
                </div>
            </div>
        )
    }

    renderTextInput = ({ column, label, type = 'text', placeholder = label }) => (
        <FormGroup
            label={label}
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
                    value={column === 'lokasi_fisik'
                        ? (this.state.datainsert[column] || 'Arsip Digital')
                        : this.state.datainsert[column]}
                    className="block mt-1 w-full"
                    onChange={(value) => this.handleChange(column, value)}
                    message_error={this.state.errors[column]}
                    onError={this.handleErrors}
                    disabled={this.state.is_disabled}
                />
            </div>
        </FormGroup>
    )

    renderJenis = () => (
        <FormGroup
            label="Jenis Surat"
            message_error={this.state.errors.jenis_surat}
            disabled={this.state.is_disabled}
            formCol
            noMb
        >
            <div className="mt-1">
                <InputSelect
                    id="jenis_surat"
                    type="select"
                    placeholder="Pilih..."
                    value={this.state.datainsert.jenis_surat}
                    className="block mt-1 w-full"
                    data={jenisOptions}
                    onChange={(value) => this.handleChange('jenis_surat', value)}
                    isClearable
                    isMulti={false}
                    message_error={this.state.errors.jenis_surat}
                    onError={this.handleErrors}
                    disabled={this.state.is_disabled}
                />
            </div>
        </FormGroup>
    )

    render() {
        if (this.state.path === 'detail') return this.renderDetailMode()

        const isSuratKeluar = this.state.datainsert.jenis_surat === 'surat_keluar'
        const sourceIdColumn = isSuratKeluar ? 'id_surat_keluar' : 'id_surat_masuk'
        const sourceIdLabel = isSuratKeluar ? 'ID Surat Keluar' : 'ID Surat Masuk'

        return (
            <>
                {!this.id && this.state.path !== 'detail' ? (
                    <div className="alert alert-info py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                        Nomor surat, perihal, file, dan tanggal arsip akan terisi otomatis dari surat yang dipilih.
                    </div>
                ) : null}
                <div className="row g-3">
                    <div className="col-lg-6 col-md-12">
                        {this.renderJenis()}
                    </div>

                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: 'tanggal_arsip',
                            label: 'Tanggal Arsip',
                            type: 'date'
                        })}
                    </div>

                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: sourceIdColumn,
                            label: `${sourceIdLabel} *`,
                            placeholder: `Masukkan ${sourceIdLabel}`
                        })}
                    </div>

                    <div className="col-12">
                        {this.renderTextInput({
                            column: 'lokasi_fisik',
                            label: 'Lokasi Arsip Fisik',
                            placeholder: 'Contoh: Ruang Arsip, Rak No. 10, Box A-03'
                        })}
                    </div>

                    {(this.id || this.state.path === 'detail') ? (
                        <>
                            <div className="col-lg-6 col-md-12">
                                {this.renderTextInput({ column: 'nomor_surat', label: 'Nomor Surat' })}
                            </div>
                            <div className="col-lg-6 col-md-12">
                                {this.renderTextInput({ column: 'file_path', label: 'Path File' })}
                            </div>
                            <div className="col-12">
                                {this.renderTextInput({ column: 'perihal', label: 'Perihal', type: 'textarea' })}
                            </div>
                        </>
                    ) : null}

                </div>

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
                                        archive
                                    </span>
                                    {this.id ? 'Simpan Arsip' : 'Tambah Arsip'}
                                </>
                            )}
                        </button>
                    </div>
                ) : null}
            </>
        )
    }
}

export default SuratArsipEdit
