"use client"

import Input from 'components/Input';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import AsyncSelect from 'react-select/async';
import surat_keluarModel from "hooks/models/surat_keluarModel";
import { showToastr } from 'pages/Utils';
import { canUseEofficeAction } from 'lib/eofficeAccess';
import { api_services } from "hooks/api_services";
import { urlPreview } from "pages/Utils";
import axios from 'lib/axios';

const normalizeList = response => {
    // Handle various API response formats
    if (Array.isArray(response)) return response
    if (response == null) return []
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    // Laravel paginator format: { data: [...], links: {...}, meta: {...} }
    if (Array.isArray(response?.data?.data?.data)) return response['data']['data']['data']
    return []
}

const kualifikasiOptions = [
    { label: 'Surat Dinas', value: 'dinas' },
    { label: 'Surat Resmi', value: 'resmi' },
    { label: 'Surat Penting', value: 'penting' },
    { label: 'Surat Rahasia', value: 'rahasia' },
    { label: 'Surat Biasa', value: 'biasa' },
]

class Surat_keluar_edit extends EditPage {
    model = new surat_keluarModel()

    state = {
        ...this.state,
        templates: [],
        signerOptions: [],
        reviewerOptions: [],
        userOptions: [],
        selectedPenerimaInternal: [],
        selectedTembusanInternal: [],
        nomorAgendaLoading: false,
        nomorAgendaGenerated: false,
        nomorSuratGenerated: false,
        selectedKualifikasi: [],
        selectedSifatMulti: [],
        jenisSuratOptions: [
            { label: 'Surat Undangan', value: 'Surat Undangan' },
            { label: 'Surat Tugas', value: 'Surat Tugas' },
            { label: 'Surat Keputusan', value: 'Surat Keputusan' },
            { label: 'Surat Edaran', value: 'Surat Edaran' },
            { label: 'Surat Pemberitahuan', value: 'Surat Pemberitahuan' },
            { label: 'Surat Permohonan', value: 'Surat Permohonan' },
            { label: 'Nota Dinas', value: 'Nota Dinas' },
            { label: 'Memo Internal', value: 'Memo Internal' },
            { label: 'Surat Pengantar', value: 'Surat Pengantar' },
            { label: 'Surat Keterangan', value: 'Surat Keterangan' },
        ],
    }

    componentDidMount() {
        super.componentDidMount()
        this.loadTemplates()
        this.loadSignerOptions()
        this.loadReviewerOptions()
        this.loadJenisSuratOptions()
        this.loadUserOptions()
    }

    getreferensi_other = async () => {
        await this.loadNomorAgendaPreview()
    }

    getid = async () => {
        this.id = this.props.params?.slug?.[1] || this.props.params?.id || this.id
        if (!this.id || this.state.path !== 'detail') return

        this.setState({ is_loading: true })
        const response = await this.model.getId(this.id)
        this.setState({ is_loading: false })
        if (!response || response.error || response.code) return

        const record = response?.data?.data ?? response?.data ?? response
        const data = {}
        Object.entries(record || {}).forEach(([key, value]) => {
            if (this.model.allowedFields.includes(key)) data[key] = value
        })
        this.setState(state => ({ datainsert: { ...state.datainsert, ...data } }))

        // Populate selected recipients for react-select from loaded data
        const selectedPenerima = (record.penerima_internal || []).map(item => ({
            value: item.id_user || item.id || item.value,
            label: item.nama || item.name || item.label || `User ${item.id_user || item.id}`,
            email: item.email || '',
        }))
        const selectedTembusan = (record.tembusan_internal || []).map(item => ({
            value: item.id_user || item.id || item.value,
            label: item.nama || item.name || item.label || `User ${item.id_user || item.id}`,
            email: item.email || '',
        }))
        this.setState({
            selectedPenerimaInternal: selectedPenerima,
            selectedTembusanInternal: selectedTembusan,
        })
    }

    loadNomorAgendaPreview = async () => {
        if (this.id || this.state.path !== 'add' || this.state.nomorAgendaLoading) return
        if (this.state.nomorAgendaGenerated || this.state.datainsert.kode_draft) return

        this.setState({ nomorAgendaLoading: true })

        try {
            const { getapi_services } = api_services({ api_path: '/surat_keluar/nomor-agenda-preview' })
            const response = await getapi_services({})
            const nomorAgenda = response?.nomor_agenda || response?.data?.nomor_agenda || response?.kode_draft || response?.data?.kode_draft || ''
            const nomorSurat = response?.nomor_surat || response?.data?.nomor_surat || ''

            this.setState(state => ({
                nomorAgendaLoading: false,
                nomorAgendaGenerated: true,
                nomorSuratGenerated: true,
                datainsert: {
                    ...state.datainsert,
                    nomor_agenda: state.datainsert.nomor_agenda || nomorAgenda,
                    nomor_surat: state.datainsert.nomor_surat || nomorSurat,
                },
            }))
        } catch (error) {
            this.setState({ nomorAgendaLoading: false })
        }
    }

    loadUserOptions = async () => {
        try {
            const { getapi_services } = api_services({ api_path: '/surat_keluar/recipients' })
            const response = await getapi_services({})
            if (response?.error || response?.code) return
            const rows = Array.isArray(response?.data) ? response.data : []
            const userOptions = rows.map(item => ({
                value: item.id_user || item.id,
                label: item.nama || item.name || item.email || `User ${item.id_user || item.id}`,
                email: item.email || '',
            }))
            this.setState({ userOptions })
        } catch (error) {
            console.error('[loadUserOptions] error:', error)
        }
    }

    loadTemplates = async () => {
        // Use dedicated endpoint — no menu permission needed
        try {
            const response = await axios.get('/api/surat-template/list', {
                withCredentials: true,
            })

            console.log('[loadTemplates] Response status:', response.status)
            console.log('[loadTemplates] Response data:', response.data)

            const list = Array.isArray(response.data?.data) ? response.data.data : []
            console.log('[loadTemplates] List length:', list.length)
            if (list.length > 0) {
                console.log('[loadTemplates] First item:', list[0])
            }

            const defaults = this.getDefaultTemplates()
            this.setState({ templates: list.length > 0 ? list : defaults })
        } catch (error) {
            console.error('[loadTemplates] Error:', error?.response?.status, error?.response?.data || error?.message)
            // Fallback to defaults on error
            this.setState({ templates: this.getDefaultTemplates() })
        }
    }

    getDefaultTemplates = () => [
        { id_surat_template: '1', nama: 'Surat Permohonan',           nama_template: 'Surat Permohonan' },
        { id_surat_template: '2', nama: 'Surat Undangan',             nama_template: 'Surat Undangan' },
        { id_surat_template: '3', nama: 'Surat Undangan Rapat',        nama_template: 'Surat Undangan Rapat' },
        { id_surat_template: '4', nama: 'Surat Undangan Pelatihan',     nama_template: 'Surat Undangan Pelatihan' },
        { id_surat_template: '5', nama: 'Surat MOU / MoU',             nama_template: 'Surat MOU / MoU' },
        { id_surat_template: '6', nama: 'Surat Tugas',                 nama_template: 'Surat Tugas' },
        { id_surat_template: '7', nama: 'Surat Keputusan',              nama_template: 'Surat Keputusan' },
        { id_surat_template: '8', nama: 'Surat Edaran',                nama_template: 'Surat Edaran' },
        { id_surat_template: '9', nama: 'Surat Pemberitahuan',          nama_template: 'Surat Pemberitahuan' },
        { id_surat_template: '10', nama: 'Nota Dinas',                  nama_template: 'Nota Dinas' },
        { id_surat_template: '11', nama: 'Memo Internal',               nama_template: 'Memo Internal' },
        { id_surat_template: '12', nama: 'Surat Pengantar',            nama_template: 'Surat Pengantar' },
        { id_surat_template: '13', nama: 'Surat Keterangan',           nama_template: 'Surat Keterangan' },
    ]

    loadJenisSuratOptions = async () => {
        const defaultOptions = [
            { label: 'Surat Undangan', value: 'Surat Undangan' },
            { label: 'Surat Tugas', value: 'Surat Tugas' },
            { label: 'Surat Keputusan', value: 'Surat Keputusan' },
            { label: 'Surat Edaran', value: 'Surat Edaran' },
            { label: 'Surat Pemberitahuan', value: 'Surat Pemberitahuan' },
            { label: 'Surat Permohonan', value: 'Surat Permohonan' },
            { label: 'Nota Dinas', value: 'Nota Dinas' },
            { label: 'Memo Internal', value: 'Memo Internal' },
            { label: 'Surat Pengantar', value: 'Surat Pengantar' },
            { label: 'Surat Keterangan', value: 'Surat Keterangan' },
        ]
        try {
            const { getapi_services } = api_services({ api_path: '/surat_template/jenis-options' })
            const response = await getapi_services({})
            if (response?.error || response?.code) {
                this.setState({ jenisSuratOptions: defaultOptions })
                return
            }
            const rows = Array.isArray(response?.data) ? response.data : []
            // If API returns no data, keep defaults
            if (rows.length === 0) {
                this.setState({ jenisSuratOptions: defaultOptions })
                return
            }
            // Merge API results with defaults, avoiding duplicates
            const apiOptions = rows.map(item => ({
                value: item.value || item.nama || item,
                label: item.label || item.nama || item,
            }))
            const existingValues = new Set(defaultOptions.map(o => o.value))
            for (const opt of apiOptions) {
                if (!existingValues.has(opt.value)) {
                    defaultOptions.push(opt)
                }
            }
            this.setState({ jenisSuratOptions: defaultOptions })
        } catch (error) {
            this.setState({ jenisSuratOptions: defaultOptions })
        }
    }

    handleChange = (column, value) => {
        // Clear recipient fields when switching between internal/eksternal
        if (column === 'jenis_pengiriman') {
            this.setState(state => ({
                datainsert: {
                    ...state.datainsert,
                    jenis_pengiriman: value,
                    // clear internal-specific
                    // clear eksternal-specific
                    tujuan_nama: '',
                    tujuan_email: '',
                    tujuan_alamat: '',
                    tujuan_kontak: '',
                    tujuan_jabatan: '',
                    kirim_email_otomatis: value === 'eksternal' ? state.datainsert.kirim_email_otomatis : false,
                }
            }))
            return
        }
        // Call parent handler (now a regular method, not arrow fn)
        super.handleChange(column, value)
    }

    loadSignerOptions = async () => {
        try {
            const { getapi_services } = api_services({ api_path: '/sys_user_group/signers' })
            const response = await getapi_services({})
            console.log('[loadSignerOptions] response:', response)

            if (response?.error || response?.code) return

            const rows = Array.isArray(response?.data) ? response.data : normalizeList(response)
            console.log('[loadSignerOptions] rows:', rows)
            const signerOptions = rows.map(item => ({
                value: item.id_user || item.id,
                label: item.label || `${item.nama} - ${item.jabatan || 'Jabatan belum ditentukan'}`,
                nama: item.nama,
                jabatan: item.jabatan,
                nama_group: item.nama_group,
            }))

            this.setState({ signerOptions })
        } catch (error) {
            console.error('[loadSignerOptions] error:', error)
        }
    }

    loadReviewerOptions = async () => {
        try {
            const { getapi_services } = api_services({ api_path: '/sys_user/reviewers' })
            const response = await getapi_services({})

            if (response?.error || response?.code) return

            const rows = Array.isArray(response?.data) ? response.data : []
            const reviewerOptions = rows.map(item => ({
                value: item.id_user || item.id,
                label: item.label || `${item.nama} - ${item.jabatan || 'Jabatan belum ditentukan'}`,
                nama: item.nama,
                jabatan: item.jabatan,
            }))

            this.setState({ reviewerOptions })
        } catch (error) {
            console.error('Failed to load reviewers:', error)
        }
    }

    handleSignerChange = (e) => {
        const signerId = e.target.value
        const signer = this.state.signerOptions.find(s => String(s.value) === String(signerId))

        if (signer) {
            this.setState(state => ({
                datainsert: {
                    ...state.datainsert,
                    id_penandatangan: signer.value,
                    nama_penandatangan: signer.nama || signer.label.split(' - ')[0],
                    jabatan_penandatangan: signer.jabatan || signer.label.split(' - ')[1] || '',
                }
            }))
        } else {
            // Clear all signer fields when no signer selected
            this.setState(state => ({
                datainsert: {
                    ...state.datainsert,
                    id_penandatangan: '',
                    nama_penandatangan: '',
                    jabatan_penandatangan: '',
                }
            }))
        }
    }

    handleReviewerChange = (e) => {
        const reviewerId = e.target.value
        const reviewer = this.state.reviewerOptions.find(r => String(r.value) === String(reviewerId))

        if (reviewer) {
            this.setState(state => ({
                datainsert: {
                    ...state.datainsert,
                    id_pemeriksa: reviewer.value,
                    nama_pemeriksa: reviewer.nama || reviewer.label.split(' - ')[0],
                    jabatan_pemeriksa: reviewer.jabatan || reviewer.label.split(' - ')[1] || '',
                }
            }))
        } else {
            this.setState(state => ({
                datainsert: {
                    ...state.datainsert,
                    id_pemeriksa: '',
                    nama_pemeriksa: '',
                    jabatan_pemeriksa: '',
                }
            }))
        }
    }

    handleCheckboxChange = (field) => {
        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                [field]: this.isFeatureEnabled(state.datainsert[field]) ? 0 : 1
            }
        }))
    }

    isFeatureEnabled = value => [true, 1, '1', 't', 'true', 'on', 'yes'].includes(value)

    handleFileUpload = async (event, field) => {
        const file = event.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            showToastr('info', 'Mengunggah lampiran...')
            const response = (await axios.post('/api/surat_keluar/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })).data

            if (!response?.success || !response?.path) {
                showToastr('error', 'Gagal mengunggah lampiran')
                return
            }

            const filePath = response.path
            this.setState(state => ({
                datainsert: {
                    ...state.datainsert,
                    [field]: filePath,
                    [`${field}_name`]: file.name
                }
            }))
            showToastr('success', 'Lampiran berhasil diunggah')
        } catch (error) {
            console.error('Upload failed:', error)
            showToastr('error', 'Gagal mengunggah lampiran')
        }
    }

    handleTembusanChange = (e) => {
        const value = e.target.value
        // Parse comma-separated emails
        const emails = value.split(',').map(email => email.trim()).filter(email => email.includes('@'))
        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                tembusan: value,
                tembusan_email: emails.join(',')
            }
        }))
    }

    create = async () => {
        const body = {
            ...this.state.datainsert,
            status: this.state.datainsert.status || 'draft'
        }

        this.setState({ btn_loading: true })

        try {
            const response = await this.model.create({ setErrors: this.setErrors, disabledAlert: true, ...body })
            this.setState({ btn_loading: false })

            if (response?.success === false || response?.error || response?.code || !response?.data) return

            const responseData = response?.data || response
            const insertedId = responseData?.id || responseData?.id_surat_keluar

            if (!insertedId) {
                showToastr('error', 'Backend belum mengembalikan ID surat keluar. Data kemungkinan belum tersimpan.')
                return
            }

            showToastr('success', 'Tambah data berhasil!')
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
        if (this.id) return canUseEofficeAction('surat_keluar', 'edit')
        return canUseEofficeAction('surat_keluar', 'add')
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

    applyTemplate = templateId => {
        const template = this.state.templates.find(item => String(item?.id_surat_template || item?.id) === String(templateId))
        if (!template) return

        // Parse multi-value kualifikasi from template
        const templateKualifikasi = template?.kualifikasi || template?.kualifikasi_surat || ''
        const kualifikasiList = templateKualifikasi ? templateKualifikasi.split(',').map(k => k.trim()).filter(Boolean) : []

        // Parse multi-value sifat from template
        const templateSifat = template?.sifat || template?.sifat_surat || ''
        const sifatList = templateSifat ? templateSifat.split(',').map(s => s.trim()).filter(Boolean) : []

        // Extract google_drive_url from template
        const templateName = template?.nama_template || template?.nama || ''
        const templateGoogleDriveUrl = template?.drive_document_url || template?.google_drive_url || template?.drive_url || template?.google_drive_link || template?.office365_document_url || ''

        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                id_surat_template: templateId,
                template_nama: templateName,
                isi_surat: template?.isi_template || template?.content || state.datainsert.isi_surat || '',
                ringkasan: template?.deskripsi || state.datainsert.ringkasan || '',
                jenis: templateName,
                template_file_path: template?.file_path || template?.file_draft_path || '',
                template_google_drive_url: templateGoogleDriveUrl,
                klasifikasi: kualifikasiList.length ? kualifikasiList.join(', ') : state.datainsert.klasifikasi,
            },
            selectedKualifikasi: kualifikasiList.length ? kualifikasiList : state.selectedKualifikasi,
            selectedSifatMulti: sifatList.length ? sifatList : state.selectedSifatMulti,
        }))
    }

    handleKualifikasiToggle = (value) => {
        this.setState(state => {
            const current = state.selectedKualifikasi
            const newSelected = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value]
            return {
                selectedKualifikasi: newSelected,
                datainsert: {
                    ...state.datainsert,
                    klasifikasi: newSelected.join(', '),
                }
            }
        })
    }

    handleSifatToggle = (value) => {
        this.setState(state => {
            const current = state.selectedSifatMulti
            const newSelected = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value]
            return {
                selectedSifatMulti: newSelected,
                datainsert: {
                    ...state.datainsert,
                    sifat: newSelected.join(', '),
                }
            }
        })
    }

    isGoogleDriveUrl = (url) => {
        if (!url) return false
        return /drive\.google\.com/i.test(url) || /docs\.google\.com/i.test(url)
    }

    openGoogleDrivePreview = (url) => {
        if (!url) return
        // If it's already a full URL, open it
        if (url.startsWith('http')) {
            window.open(url, '_blank')
            return
        }
        // If it's a relative path, check if it's a Google Drive link stored
        const fullUrl = url.startsWith('/') ? url : `/${url}`
        window.open(urlPreview(fullUrl), '_blank')
    }

    getTemplateGoogleDriveUrl = () => {
        const templateDriveUrl = this.state.datainsert?.template_google_drive_url
        const templateFilePath = this.state.datainsert?.template_file_path
        if (templateDriveUrl) return templateDriveUrl
        if (templateFilePath && this.isGoogleDriveUrl(templateFilePath)) return templateFilePath
        return null
    }

    getPreviewUrl = () => {
        const data = this.state.datainsert || {}
        const googleUrl = data.google_drive_document_url || data.drive_document_url
        if (googleUrl) {
            const documentMatch = String(googleUrl).match(/docs\.google\.com\/document\/d\/([^/]+)/i)
            if (documentMatch) return `https://docs.google.com/document/d/${documentMatch[1]}/preview`
            return googleUrl
        }

        const filePath = data.file_pdf_path || data.file_draft_path || data.lampiran_path
        if (!filePath) return ''
        const path = String(filePath).startsWith('/') ? filePath : `/${filePath}`
        return urlPreview(path)
    }

    renderDetailValue = value => {
        if (value === undefined || value === null || value === '') {
            return <span className="text-muted font-italic">Tidak ada data.</span>
        }

        return value
    }

    renderDetailItem = (label, value) => (
        <div className="border rounded p-2 bg-light h-100">
            <div className="text-muted" style={{ fontSize: 11 }}>{label}</div>
            <div className="font-semibold text-gray-900 mt-1" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>
                {this.renderDetailValue(value)}
            </div>
        </div>
    )

    renderDetailMode = () => {
        const data = this.state.datainsert || {}
        const previewUrl = this.getPreviewUrl()
        const recipientNames = (data.penerima_internal || []).map(item => item.name).filter(Boolean)
        const ccNames = (data.tembusan_internal || []).map(item => item.name).filter(Boolean)
        const closePage = () => { window.close(); window.setTimeout(() => { if (!window.closed) this.props.router.push('/surat_keluar') }, 120) }

        return (
            <div style={{ minHeight: 'calc(100vh - 92px)', background: '#fff', border: '1px solid #d6dce1', borderRadius: 6, overflow: 'hidden' }}>
                <div className="d-flex align-items-center justify-content-between" style={{ minHeight: 52, padding: '0 14px', borderBottom: '1px solid #d6dce1' }}>
                    <h1 className="mb-0" style={{ fontSize: 22, fontWeight: 500 }}>Detail Surat Keluar</h1>
                    <button type="button" aria-label="Tutup detail" onClick={closePage} style={{ border: 0, borderRadius: 6, width: 30, height: 30, background: '#f28b8b', color: '#fff', fontSize: 22 }}>×</button>
                </div>
                <div className="d-flex flex-column flex-xl-row" style={{ gap: 12, padding: 12, minHeight: 'calc(100vh - 145px)' }}>
                    <div style={{ flex: '0 0 30%', minWidth: 280 }}>
                        <div className="border rounded p-3 h-100" style={{ background: '#fff' }}>
                    <div className="d-flex align-items-start justify-content-between flex-wrap" style={{ gap: 10 }}>
                        <div>
                            <div className="font-semibold text-gray-900" style={{ fontSize: 16 }}>
                                {this.renderDetailValue(data.perihal || data.nomor_surat || data.kode_draft)}
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                                Detail surat keluar
                            </div>
                        </div>
                        <span className="badge bg-info text-uppercase" style={{ fontSize: 11 }}>
                            {data.status || 'draft'}
                        </span>
                    </div>
                    <div className="row g-2 mt-2">
                    <div className="col-md-4">{this.renderDetailItem('Template Surat', data.template_nama)}</div>
                    <div className="col-md-4">{this.renderDetailItem('Jenis Surat', data.jenis || data.template_nama)}</div>
                    <div className="col-md-4">{this.renderDetailItem('Kualifikasi Surat', data.klasifikasi)}</div>
                    <div className="col-md-4">{this.renderDetailItem('Jenis Pengiriman', data.jenis_pengiriman ? (data.jenis_pengiriman.charAt(0).toUpperCase() + data.jenis_pengiriman.slice(1)) : '-')}</div>
                    <div className="col-md-4">{this.renderDetailItem('Nomor Agenda', data.kode_draft)}</div>
                    <div className="col-md-4">{this.renderDetailItem('Nomor Surat', data.nomor_surat)}</div>
                    <div className="col-md-4">{this.renderDetailItem('Tanggal Surat', data.tanggal_surat)}</div>
                    {data.jenis_pengiriman === 'internal' ? (
                        <div className="col-12">{this.renderDetailItem('Penerima Internal', recipientNames.join(', ') || data.tujuan_nama)}</div>
                    ) : (
                        <>
                            <div className="col-md-4">{this.renderDetailItem('Nama Penerima / Perusahaan', data.tujuan_nama)}</div>
                            <div className="col-md-4">{this.renderDetailItem('Email Tujuan', data.tujuan_email)}</div>
                            <div className="col-md-4">{this.renderDetailItem('Alamat / Institusi', data.tujuan_alamat)}</div>
                            <div className="col-md-4">{this.renderDetailItem('Kontak', data.tujuan_kontak)}</div>
                            <div className="col-md-4">{this.renderDetailItem('Jabatan Penerima', data.tujuan_jabatan)}</div>
                        </>
                    )}
                    <div className="col-md-6">{this.renderDetailItem('Penandatangan', data.nama_penandatangan)}</div>
                    <div className="col-12">{this.renderDetailItem('Tembusan', ccNames.join(', ') || data.tembusan)}</div>
                    <div className="col-md-6">{this.renderDetailItem('Jabatan Penandatangan', data.jabatan_penandatangan)}</div>
                    <div className="col-md-6">{this.renderDetailItem('Ringkasan', data.ringkasan || 'Ringkasan belum diisi. Lihat dokumen surat pada panel lampiran.')}</div>
                    <div className="col-12">{this.renderDetailItem('Isi Surat', data.isi_surat || 'Isi surat tersedia pada dokumen di panel lampiran.')}</div>
                </div>
                        </div>
                    </div>
                    <div style={{ flex: '1 1 42%', minWidth: 300 }}>
                        <div className="border rounded p-3 h-100" style={{ background: '#fff' }}>
                            <div className="font-semibold mb-2"><span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle' }}>attach_file</span> Lampiran Surat</div>
                            {previewUrl ? <iframe title="Pratinjau surat keluar" src={previewUrl} style={{ width: '100%', height: 'calc(100vh - 230px)', minHeight: 480, border: '1px solid #d6dce1', borderRadius: 4 }} /> : <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 480 }}>Belum ada lampiran surat.</div>}
                        </div>
                    </div>
                    <div style={{ flex: '0 0 28%', minWidth: 280 }}>
                        <div className="border rounded p-3 mb-2" style={{ background: '#fff' }}>
                            <div className="font-semibold mb-2"><span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle' }}>timeline</span> Tracking Surat</div>
                            {(data.approval || []).length ? data.approval.map(item => {
                                const statusLabel = ({ waiting: 'Menunggu', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' })[String(item.status || '').toLowerCase()] || item.status || 'Menunggu'
                                return <div key={item.id_surat_approval} className="border-bottom py-2" style={{ fontSize: 12 }}><strong>{item.nama_approver || 'Pemberi Persetujuan'}</strong><div>{statusLabel} {item.tanggal_aksi ? `• ${item.tanggal_aksi}` : ''}</div></div>
                            }) : <div className="text-muted" style={{ fontSize: 12 }}>Belum ada tracking persetujuan.</div>}
                        </div>
                        <div className="border rounded p-3" style={{ background: '#fff' }}>
                            <div className="font-semibold mb-2">Status Arsip</div>
                            <div className={data.sudah_diarsipkan ? 'text-success' : 'text-warning'} style={{ fontSize: 13 }}>{data.sudah_diarsipkan ? 'Surat ini sudah diarsipkan.' : 'Surat ini belum diarsipkan.'}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    createOfficeLink = async () => {
        const id = this.id || this.state.datainsert?.id_surat_keluar
        if (!id) {
            showToastr('error', 'Simpan surat keluar terlebih dahulu sebelum membuat link Office 365.')
            return
        }

        this.setState({ officeLinkLoading: true })
        try {
            const response = await axios.post(`/api/surat_keluar/${id}/create-office-link`)
            const officeUrl = response?.data?.office365?.web_url || response?.data?.data?.office365_document_url
            showToastr(response?.data?.success ? 'success' : 'error', response?.data?.message || 'Pembuatan link Office 365 selesai.')

            if (response?.data?.success) {
                await this.getid()
                if (officeUrl) window.open(officeUrl, '_blank')
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data?.messages?.error || 'Gagal membuat link Office 365.'
            showToastr('error', message)
        } finally {
            this.setState({ officeLinkLoading: false })
        }
    }

    renderTemplateSelector = () => {
        const selectedTemplate = this.state.datainsert?.id_surat_template
        const templateDriveUrl = this.getTemplateGoogleDriveUrl()

        return (
            <div className="col-12">
                <div className="border rounded p-3 mb-1" style={{ background: '#f8fbfc' }}>
                    <div className="row g-3 align-items-end">
                        <div className="col-12">
                            <label className="font-semibold">Template Surat</label>
                            <select
                                className="form-control"
                                value={this.state.datainsert.id_surat_template || ''}
                                onChange={event => this.applyTemplate(event.target.value)}
                                disabled={this.state.is_disabled}
                            >
                                <option value="">Pilih template</option>
                                {this.state.templates.map(item => (
                                    <option key={item?.id_surat_template || item?.id} value={item?.id_surat_template || item?.id}>
                                        {item?.nama_template || item?.nama || item?.file_path}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedTemplate && this.state.datainsert.template_nama && (
                            <div className="col-12">
                                {templateDriveUrl ? (
                                    <div className="p-3 rounded" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                                                <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#0066DA"/>
                                                <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#00AC47"/>
                                                <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#EA4335"/>
                                                <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#00832D"/>
                                                <path d="M9.8 28.8L18.3 28.8L18.3 39.8C18.3 39.8 8.8 33.9 9.8 28.8Z" fill="#2684FC"/>
                                                <path d="M29.8 28.8L38.3 28.8C37.3 33.9 47.8 39.8 47.8 39.8L47.8 28.8H29.8Z" fill="#FFBA00"/>
                                            </svg>
                                            <span className="fw-bold" style={{ color: '#1d4ed8' }}>Template terhubung ke Google Docs</span>
                                        </div>
                                        <div className="mb-2" style={{ fontSize: 12, color: '#1e40af' }}>
                                            <strong>Langkah:</strong> Klik tombol di bawah → edit surat di Google Docs → kembali ke sini → lengkapi data → Kirim.
                                        </div>
                                        <a
                                            href={templateDriveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary d-inline-flex align-items-center gap-1"
                                            style={{ fontSize: 13 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                                                <path d="M6 39.5C6 33.7 10.7 28.8 16.5 28.8L35.5 28.8C38.5 28.8 41 31.3 41 34.3C41 37.3 38.5 39.8 35.5 39.8L16.5 39.8C8.4 39.8 1.5 32.9 1.5 24.8C1.5 20.6 3.8 16.8 7.4 14.5L6 9.4C6 9.4 6 9.4 6 39.5Z" fill="#fff"/>
                                                <path d="M42 9.8L32.5 9.8L32.5 19.3C32.5 22.3 30 24.8 27 24.8C24 24.8 21.5 22.3 21.5 19.3L21.5 9.8L12 9.8C12 9.8 42 5.3 42 9.8Z" fill="#fff"/>
                                                <path d="M21.5 34.3L21.5 24.8C21.5 21.8 24 19.3 27 19.3C30 19.3 32.5 21.8 32.5 24.8L32.5 34.3C32.5 37.3 30 39.8 27 39.8C24 39.8 21.5 37.3 21.5 34.3Z" fill="#fff"/>
                                                <path d="M12 34.3L12 24.8C12 21.8 14.5 19.3 17.5 19.3C20.5 19.3 23 21.8 23 24.8L23 34.3C23 37.3 20.5 39.8 17.5 39.8C14.5 39.8 12 37.3 12 34.3Z" fill="#fff"/>
                                            </svg>
                                            Buka & Edit Surat di Google Docs
                                        </a>
                                    </div>
                                ) : (
                                    <span className="badge bg-success d-inline-flex align-items-center gap-1">
                                        <span className="material-icons" style={{ fontSize: 14 }}>check_circle</span>
                                        Template: {this.state.datainsert.template_nama}
                                        <span className="text-white-50 ms-1" style={{ fontSize: 11 }}>(tanpa Google Docs)</span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    renderKualifikasiCheckbox = () => (
        <div className="col-12">
            <FormGroup label="Kualifikasi Surat" formCol noMb>
                <div className="d-flex flex-wrap" style={{ gap: 8, marginTop: 4 }}>
                    {kualifikasiOptions.map(option => {
                        const isChecked = this.state.selectedKualifikasi.includes(String(option.value))
                        return (
                            <label
                                key={option.value}
                                className={`d-flex align-items-center gap-1 px-3 py-2 rounded border cursor-pointer ${isChecked ? 'border-primary bg-primary text-white' : 'border-secondary bg-white text-dark'}`}
                                style={{ fontSize: 13, cursor: 'pointer', userSelect: 'none' }}
                            >
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isChecked}
                                    onChange={() => this.handleKualifikasiToggle(String(option.value))}
                                    disabled={this.state.is_disabled}
                                    style={{ marginTop: 0 }}
                                />
                                {option.label}
                            </label>
                        )
                    })}
                </div>
            </FormGroup>
        </div>
    )

    renderEditor = () => (
        <div className="col-12">
            <FormGroup
                label="Editor Surat"
                message_error={this.state.errors.isi_surat}
                disabled={this.state.is_disabled}
                formCol
                noMb
            >
                <div className="border rounded overflow-hidden mt-1">
                    {!this.state.is_disabled ? (
                        <div className="d-flex align-items-center flex-wrap px-2 py-2" style={{ background: '#eef7f8', gap: 6 }}>
                            {[
                                ['format_bold', 'Bold'],
                                ['format_italic', 'Italic'],
                                ['format_align_left', 'Align'],
                                ['format_list_bulleted', 'List'],
                                ['table_chart', 'Table'],
                            ].map(([icon, title]) => (
                                <button
                                    key={icon}
                                    type="button"
                                    className="btn btn-light btn-sm"
                                    title={title}
                                    onClick={() => showToastr('success', `${title} siap disambungkan ke editor dokumen.`)}
                                >
                                    <span className="material-icons" style={{ fontSize: 16 }}>{icon}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                    <textarea
                        className="form-control border-0"
                        rows={10}
                        value={this.state.datainsert.isi_surat || ''}
                        onChange={event => this.handleChange('isi_surat', event.target.value)}
                        disabled={this.state.is_disabled}
                        placeholder="Isi surat"
                        style={{ resize: 'vertical', borderRadius: 0 }}
                    />
                </div>
            </FormGroup>
        </div>
    )

    handleRecipientInternalChange = (selected) => {
        const ids = selected ? selected.map(opt => Number(opt.value)).filter(Boolean) : []
        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                penerima_ids: ids,
                tujuan_id: ids[0] || '',
                tujuan_nama: (selected || []).map(opt => opt.label).join(', '),
            },
            selectedPenerimaInternal: selected || [],
        }))
    }

    handleTembusanUsersChange = (selected) => {
        const ids = selected ? selected.map(opt => Number(opt.value)).filter(Boolean) : []
        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                tembusan_ids: ids,
                tembusan: (selected || []).map(opt => opt.label).join(', '),
                tembusan_email: (selected || []).map(opt => opt.email || '').join(','),
            },
            selectedTembusanInternal: selected || [],
        }))
    }

    renderRecipientInput = () => {
        const userOptions = this.state.userOptions || []
        const isInternal = this.state.datainsert.jenis_pengiriman === 'internal'

        return (
            <div className="col-12">
                <div className="border rounded p-3" style={{ background: '#f8fbfc' }}>
                    <div className="row g-3">
                        {/* Internal: pilih pegawai */}
                        {isInternal && (
                            <div className="col-12">
                                <label className="font-semibold">Pilih Penerima Internal</label>
                                <small className="text-muted d-block mb-2">Pilih pegawai sebagai tujuan surat keluar</small>
                                <AsyncSelect
                                    isMulti
                                    isClearable
                                    placeholder="Cari dan pilih penerima..."
                                    options={userOptions}
                                    defaultOptions={userOptions}
                                    value={this.state.selectedPenerimaInternal}
                                    onChange={this.handleRecipientInternalChange}
                                    isDisabled={this.state.is_disabled}
                                    styles={{
                                        control: styles => ({ ...styles, fontSize: 14 }),
                                        option: styles => ({ ...styles, fontSize: 14 }),
                                    }}
                                />
                            </div>
                        )}

                        {isInternal && (
                            <div className="col-12">
                                <label className="font-semibold">Tembusan Internal</label>
                                <AsyncSelect
                                    isMulti
                                    isClearable
                                    placeholder="Cari dan pilih tembusan..."
                                    options={userOptions}
                                    defaultOptions={userOptions}
                                    value={this.state.selectedTembusanInternal}
                                    onChange={this.handleTembusanUsersChange}
                                    isDisabled={this.state.is_disabled}
                                    styles={{
                                        control: styles => ({ ...styles, fontSize: 14 }),
                                        option: styles => ({ ...styles, fontSize: 14 }),
                                    }}
                                />
                            </div>
                        )}

                        {/* Eksternal: form pihak luar */}
                        {!isInternal && (
                            <>
                                <div className="col-md-6">
                                    {this.renderTextInput({
                                        column: 'tujuan_nama',
                                        label: 'Nama Penerima / Perusahaan',
                                        placeholder: 'Nama penerima atau nama perusahaan/institusi'
                                    })}
                                </div>
                                <div className="col-md-6">
                                    {this.renderTextInput({
                                        column: 'tujuan_email',
                                        label: 'Email Tujuan',
                                        placeholder: 'email@contoh.com'
                                    })}
                                </div>
                                <div className="col-12">
                                    {this.renderTextInput({
                                        column: 'tujuan_alamat',
                                        label: 'Alamat / Institusi',
                                        placeholder: 'Alamat lengkap atau nama institusi tujuan'
                                    })}
                                </div>
                                <div className="col-md-6">
                                    {this.renderTextInput({
                                        column: 'tujuan_kontak',
                                        label: 'Kontak (opsional)',
                                        placeholder: 'Nomor telepon atau kontak PIC'
                                    })}
                                </div>
                                <div className="col-md-6">
                                    {this.renderTextInput({
                                        column: 'tujuan_jabatan',
                                        label: 'Jabatan Penerima (opsional)',
                                        placeholder: 'Jabatan atau posisi penerima'
                                    })}
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        )
    }

    render() {
        if (this.state.path === 'detail') {
            return this.renderDetailMode()
        }

        return (
            <>
                <div className="row g-3">
                    {this.renderTemplateSelector()}

                    {/* Jenis surat otomatis mengikuti template yang dipilih. */}
                    <div className="col-12">
                        <div className="border rounded p-3" style={{ background: '#f8fbfc' }}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <FormGroup label="Jenis Surat" formCol noMb>
                                        <select
                                            className="form-control"
                                            value={this.state.datainsert.jenis || ''}
                                            onChange={e => this.handleChange('jenis', e.target.value)}
                                            disabled={this.state.is_disabled || Boolean(this.state.datainsert.id_surat_template)}
                                        >
                                            <option value="">-- Pilih Jenis --</option>
                                            {this.state.jenisSuratOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                            {this.state.datainsert.template_nama && !this.state.jenisSuratOptions.some(opt => String(opt.value) === String(this.state.datainsert.template_nama)) ? (
                                                <option value={this.state.datainsert.template_nama}>{this.state.datainsert.template_nama}</option>
                                            ) : null}
                                        </select>
                                        {this.state.datainsert.template_nama && (
                                            <small className="text-success" style={{ fontSize: 11 }}>
                                                <span className="material-icons" style={{ fontSize: 11, verticalAlign: 'middle' }}>check_circle</span>
                                                Otomatis dari template: {this.state.datainsert.template_nama}
                                            </small>
                                        )}
                                    </FormGroup>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kualifikasi multi-choice */}
                    {this.renderKualifikasiCheckbox()}

                    {/* Internal/Eksternal */}
                    <div className="col-12">
                        <div className="border rounded p-3" style={{ background: '#f8fbfc' }}>
                            <div className="row g-3 align-items-center">
                                <div className="col-auto">
                                    <label className="font-semibold" style={{ fontSize: 14 }}>Jenis Pengiriman:</label>
                                </div>
                                <div className="col-auto">
                                    <div className="d-flex gap-2">
                                        <label className={`d-flex align-items-center gap-1 px-3 py-2 rounded border cursor-pointer ${this.state.datainsert.jenis_pengiriman === 'internal' ? 'border-primary bg-primary text-white' : 'border-secondary bg-white text-dark'}`} style={{ fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="radio"
                                                name="jenis_pengiriman"
                                                value="internal"
                                                checked={this.state.datainsert.jenis_pengiriman === 'internal'}
                                                onChange={() => this.handleChange('jenis_pengiriman', 'internal')}
                                                disabled={this.state.is_disabled}
                                                style={{ marginTop: 0 }}
                                            />
                                            <span className="material-icons" style={{ fontSize: 16 }}>group</span>
                                            Internal
                                        </label>
                                        <label className={`d-flex align-items-center gap-1 px-3 py-2 rounded border cursor-pointer ${this.state.datainsert.jenis_pengiriman === 'eksternal' ? 'border-primary bg-primary text-white' : 'border-secondary bg-white text-dark'}`} style={{ fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="radio"
                                                name="jenis_pengiriman"
                                                value="eksternal"
                                                checked={this.state.datainsert.jenis_pengiriman === 'eksternal'}
                                                onChange={() => this.handleChange('jenis_pengiriman', 'eksternal')}
                                                disabled={this.state.is_disabled}
                                                style={{ marginTop: 0 }}
                                            />
                                            <span className="material-icons" style={{ fontSize: 16 }}>public</span>
                                            Eksternal
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <small className="text-muted">
                                        {this.state.datainsert.jenis_pengiriman === 'internal'
                                            ? 'Surat untuk pegawai/dinas dalam organisasi'
                                            : this.state.datainsert.jenis_pengiriman === 'eksternal'
                                                ? 'Surat untuk pihak luar organisasi'
                                                : 'Pilih jenis pengiriman surat'}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Penerima Surat */}
                    {this.renderRecipientInput()}

                    {/* Penandatangan */}
                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: 'nomor_agenda',
                            label: 'Nomor Agenda',
                            placeholder: this.state.nomorAgendaLoading
                                ? 'Memuat nomor agenda...'
                                : 'Akan diisi otomatis oleh sistem',
                            readOnly: true,
                        })}
                    </div>

                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: 'nomor_surat',
                            label: 'Nomor Surat',
                            placeholder: this.state.nomorAgendaLoading
                                ? 'Memuat nomor surat...'
                                : 'Akan diisi otomatis oleh sistem',
                            readOnly: true,
                        })}
                    </div>

                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: 'tanggal_surat',
                            label: 'Tanggal',
                            type: 'date'
                        })}
                    </div>

                    <div className="col-lg-6 col-md-12">
                        <FormGroup
                            label="Pilih Penandatangan"
                            formCol
                            noMb
                        >
                            <div className="mt-1">
                                <select
                                    className="form-control"
                                    value={this.state.datainsert.id_penandatangan || ''}
                                    onChange={this.handleSignerChange}
                                    disabled={this.state.is_disabled}
                                >
                                    <option value="">-- Pilih Penandatangan --</option>
                                    {this.state.signerOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </FormGroup>
                    </div>

                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: 'nama_penandatangan',
                            label: 'Nama Penandatangan',
                            placeholder: 'Terisi otomatis dari pilihan di atas'
                        })}
                    </div>

                    <div className="col-lg-6 col-md-12">
                        {this.renderTextInput({
                            column: 'jabatan_penandatangan',
                            label: 'Jabatan Penandatangan',
                            placeholder: 'Terisi otomatis dari pilihan di atas'
                        })}
                    </div>

                    {/* Toggle Options */}
                    <div className="col-12">
                        <div className="border rounded p-3" style={{ background: '#f8fbfc' }}>
                            <div className="row g-3">
                                <div className="col-lg-6 col-md-12">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            role="switch"
                                            id="switch_qr_code"
                                            checked={this.isFeatureEnabled(this.state.datainsert.generate_qr_code)}
                                            onChange={() => this.handleCheckboxChange('generate_qr_code')}
                                            disabled={this.state.is_disabled}
                                        />
                                        <label className="form-check-label" htmlFor="switch_qr_code">
                                            <strong>Tanda Tangan Digital (QR Code)</strong>
                                            <br /><small className="text-muted">Generate QR Code untuk verifikasi tanda tangan digital</small>
                                        </label>
                                    </div>
                                </div>
                                {this.state.datainsert.jenis_pengiriman === 'eksternal' && (
                                    <div className="col-lg-6 col-md-12">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id="switch_kirim_email"
                                                checked={this.isFeatureEnabled(this.state.datainsert.kirim_email_otomatis)}
                                                onChange={() => this.handleCheckboxChange('kirim_email_otomatis')}
                                                disabled={this.state.is_disabled}
                                            />
                                            <label className="form-check-label" htmlFor="switch_kirim_email">
                                                <strong>Kirim Email Otomatis</strong>
                                                <br /><small className="text-muted">Kirim notifikasi surat ke email tujuan setelah disetujui</small>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Display - shown when approved/signed and QR code exists */}
                {this.state.path === 'detail' && this.state.datainsert.qr_code_path && (
                    <div className="col-12 mt-3">
                        <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
                            <div className="font-semibold text-gray-900 mb-3">Tanda Tangan Digital &amp; QR Code</div>
                            <div className="row align-items-center">
                                <div className="col-auto">
                                    <img
                                        src={`/api/getfile/${encodeURIComponent(this.state.datainsert.qr_code_path)}`}
                                        alt="QR Code"
                                        style={{ maxWidth: 120, border: '1px solid #cbd5e1', borderRadius: 8 }}
                                    />
                                </div>
                                <div className="col">
                                    <div className="font-semibold text-sm text-gray-700 mb-1">Verifikasi Tanda Tangan</div>
                                    <p className="text-muted mb-2" style={{ fontSize: 13 }}>
                                        QR Code ini dapat dipindai untuk memverifikasi keaslian surat.
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-default-app btn-info"
                                        onClick={() => {
                                            const verUrl = this.state.datainsert.verification_url
                                            const code = verUrl && verUrl.includes('/verify/signature/')
                                                ? verUrl.split('/verify/signature/').pop()
                                                : null
                                            if (code) {
                                                window.open(`/verify-signature/${code}`, '_blank')
                                            } else {
                                                window.open(`/verify-signature/`, '_blank')
                                            }
                                        }}
                                        style={{ fontSize: 12 }}
                                    >
                                        <span className="material-icons mr-1" style={{ fontSize: 14 }}>qr_code_scanner</span>
                                        Verifikasi Sekarang
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                        check_circle
                                    </span>
                                    {this.id ? 'Simpan Surat Keluar' : 'Tambah Surat Keluar'}
                                </>
                            )}
                        </button>
                    </div>
                ) : null}
            </>
        )
    }
}

export default Surat_keluar_edit
