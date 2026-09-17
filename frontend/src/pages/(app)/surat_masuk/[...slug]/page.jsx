"use client"

import Input from 'components/Input';
import InputFile from 'components/InputFile';
import InputSelect from 'components/InputSelect';
import Button from 'components/Button';
import { Modal } from 'react-bootstrap';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import surat_masukModel from "hooks/models/surat_masukModel";
import axios from 'lib/axios';
import { formatDateApp, showToastr, urlPreview } from 'pages/Utils';
import { canUseEofficeAction, getEofficeRole } from 'lib/eofficeAccess';
import { api_services } from 'hooks/api_services';
import EofficeTimelineModal from 'components/EofficeTimelineModal';
import {
    EofficeCard,
    EofficeFormSection,
    EofficeInfoGrid,
    EofficeStatusBadge,
} from 'components/EofficeModuleUI';
import {
    fallbackSuratMasukMasterData,
    normalizeSuratMasukMasterData,
    optionsToIndex,
} from 'lib/suratMasukMasterData';

const jenisOptions = fallbackSuratMasukMasterData.jenis
const sifatOptions = fallbackSuratMasukMasterData.sifat

class Surat_masukedit extends EditPage {
    model = new surat_masukModel()
    state = {
        ...this.state,
        ocr_loading: false,
        ocr_status: '',
        masterData: fallbackSuratMasukMasterData,
        jabatanOptions: [],
        userOptions: [],
        unitOptions: [],
        nomor_agenda_loading: false,
        nomor_agenda_generated: false,
        showTimeline: false,
        attachmentPage: 1,
        followUpTab: 'disposisi',
        disposisiLoading: false,
        distribusiLoading: false,
        archiveLoading: false,
        showArchiveModal: false,
        archiveForm: {
            nomor_surat: '',
            perihal: '',
            file_path: '',
            lokasi_fisik: '',
            tanggal_arsip: '',
        },
        disposisiForm: {
            id_penerima: [],
            instruksi: '',
            catatan_penyelesaian: '',
            tanggal_jatuh_tempo: '',
        },
        distribusiForm: {
            id_unit_tujuan: '',
            id_user_tujuan: '',
        },
        distribusiPegawaiList: [],
        matchedUnitLabel: '',
        // New state for enhanced detail view
        activeAttachmentIndex: 0,
        attachments: [],
        inlineTracking: [], // Inline tracking data
        inlineTrackingLoading: false,
        // Multi-value recipients for incoming letter
        selectedPenerimaMulti: [],
        // Multi-value sifat checkboxes
        selectedSifatMulti: [],
        // Auto-populated unit from current user
        autoUnitTujuan: '',
        autoUserTujuan: '',
    }

    getCurrentId = () => this.props.params?.slug?.[1] || this.props.params?.id || this.id

    closeDetailTab = () => {
        const role = getEofficeRole()
        const employeeInboxRoles = [
            'pimpinan', 'pegawai', 'pegawai_sdm', 'pegawai_keuangan',
            'pegawai_operasional', 'pegawai_pemasaran',
        ]

        this.props.router.push(
            employeeInboxRoles.includes(role) ? '/surat_masuk_pegawai' : '/surat_masuk'
        )
    }

    getInitialInsertData = () => {
        const initialData = this.props.initialData || {}
        const initialInsert = {}

        for (let m in initialData) {
            if (this.model.allowedFields.includes(m)) {
                initialInsert[m] = initialData[m]
            }
        }

        return initialInsert
    }

    getDetailData = () => {
        const data = { ...this.getInitialInsertData() }

        Object.entries(this.state.datainsert || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                data[key] = value
            }
        })

        return data
    }

    getAttachmentValue = data => {
        const candidates = [
            data?.file_surat,
            data?.lampiran,
            data?.file_path,
            data?.path,
            data?.attachment,
            data?.attachment_path,
            data?.lampiran_info?.path,
            data?.file_surat_info?.path,
            data?.lampiran_info?.url,
            data?.file_surat_info?.url,
        ]

        return candidates.find(value => typeof value === 'string' && value.trim()) || ''
    }

    create = async () => {
        const insertData = { ...this.state.datainsert }
        const body = {
            ...insertData,
            tenggat_waktu: null,
            // Simpan nomor yang tampil pada form. Jika dikosongkan, backend
            // tetap akan membuat nomor agenda secara otomatis.
            nomor_agenda: this.state.datainsert.nomor_agenda?.trim() || null,
            // API menerima status internal `baru`, bukan label/status lama `pending`.
            status: this.state.datainsert.status || 'draft'
        }

        this.setState({ btn_loading: true })

        try {
            const response = await this.model.create({ setErrors: this.setErrors, disabledAlert: true, ...body })
            if (response?.error || response?.code) {
                this.setState({ btn_loading: false })
                return
            }

            const responseData = response?.data || response
            const insertedId = responseData?.id || responseData?.id_surat_masuk

            if (!insertedId) {
                showToastr('error', 'Backend belum mengembalikan ID surat masuk. Data kemungkinan belum tersimpan.')
                this.setState({ btn_loading: false })
                return
            }

            showToastr('success', 'Tambah data berhasil!')
            this.setState({ btn_loading: false })

            if (this.props.onLoad) {
                this.props.onLoad()
            }
        } catch (error) {
            this.setState({ btn_loading: false })
        }
    }

    getid = async () => {
        this.id = this.getCurrentId()

        if (!this.id) return
        const { datainsert } = this.state
        const initialInsert = this.getInitialInsertData()

        if (Object.keys(initialInsert).length > 0) {
            this.setState({ datainsert: { ...datainsert, ...initialInsert } })
        }

        this.setState({ is_loading: true })
        const response = await this.model.getId(this.id)
        this.setState({ is_loading: false })

        if (!response || response.error || response.code) return

        // Endpoint detail menggunakan kontrak { success, data }. Saat dibuka
        // langsung di tab baru tidak ada initialData dari tabel, jadi record
        // harus diambil dari wrapper response API ini.
        const record = response?.data?.data ?? response?.data ?? response

        let data = {}
        for (let m in record) {
            if (this.model.allowedFields.includes(m)) {
                data[m] = record[m]
            }
        }

        this.setState(state => ({
            datainsert: { ...state.datainsert, ...data },
        }))
    }

    getreferensi_other = async () => {
        await Promise.all([
            this.handlegetMasterData(),
            this.handlegetJabatanOptions(),
            this.handlegetUserOptions(),
            this.handlegetUnitOptions(),
            this.handlegetCurrentUserContext(),
        ])
        this.handlegetNomorAgendaPreview()
        this.handlegetAttachments()
        this.handlegetInlineTracking()
    }

    // Fuzzy match text to unit options (handles abbreviations like "DIR-UTAMA" → "Direktorat Utama")
    findBestUnitMatch = (text, unitOptions) => {
        if (!text || !unitOptions?.length) return null

        const normalize = (str) => {
            return str
                .toLowerCase()
                .replace(/\bdirektorat\b/gi, 'direktur')
                .replace(/\bdir\b(?!e)/gi, 'direktur')
                .replace(/\bdivisi\b/gi, 'div')
                .replace(/\bdiv\b/gi, 'div')
                .replace(/\bbagian\b/gi, 'bag')
                .replace(/\bbag\b(?!i)/gi, 'bag')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
        }

        const parts = String(text).split(',').map(p => p.trim()).filter(Boolean)
        for (const part of parts) {
            const normPart = normalize(part)
            const partWords = normPart.split(' ').filter(Boolean)
            const matched = unitOptions.find(opt => {
                const normLabel = normalize(opt.label || '')
                if (normLabel.includes(normPart) || normPart.includes(normLabel)) return true
                const labelWords = normLabel.split(' ').filter(Boolean)
                const matchCount = partWords.filter(w => w.length > 2 && (
                    normLabel.includes(w) || labelWords.some(lw => lw.length > 2 && (lw.includes(w) || w.includes(lw)))
                )).length
                return matchCount >= Math.max(1, Math.floor(partWords.length / 2))
            })
            if (matched) return matched
        }
        return null
    }

    // Auto-populate disposisi/distribusi form from letter's kepada_tujuan (unit name text)
    handleAutoPopulateFromLetterData = () => {
        const { datainsert, unitOptions } = this.state
        const kepadaRaw = datainsert?.kepada_tujuan || ''
        const unitKerja = datainsert?.unit_kerja || ''

        if (kepadaRaw) {
            const matchedUnit = this.findBestUnitMatch(kepadaRaw, unitOptions)
            this.setState(state => ({
                matchedUnitLabel: matchedUnit ? matchedUnit.label : kepadaRaw,
                distribusiForm: {
                    ...state.distribusiForm,
                    id_unit_tujuan: matchedUnit ? matchedUnit.value : '',
                },
            }))
            return
        }

        if (unitKerja) {
            const matchedUnit = this.findBestUnitMatch(unitKerja, unitOptions)
            this.setState(state => ({
                matchedUnitLabel: matchedUnit ? matchedUnit.label : unitKerja,
                distribusiForm: {
                    ...state.distribusiForm,
                    id_unit_tujuan: matchedUnit ? matchedUnit.value : '',
                },
            }))
        }
    }

    // Auto-populate kirim unit based on current user context
    handlegetCurrentUserContext = async () => {
        try {
            const { getStoredUserLogin } = require('lib/eofficeAccess')
            const userLogin = getStoredUserLogin() || {}
            const user = userLogin?.user || {}
            const activeGroup = Array.isArray(userLogin?.groups)
                ? userLogin.groups.find(group => String(group?.id_group) === String(userLogin?.id_group || user?.id_group))
                : {}

            const pickFirst = (...values) => values.find(v => v !== undefined && v !== null && v !== '')

            const idUnit = pickFirst(
                userLogin?.id_unit, userLogin?.id_unit_kerja, userLogin?.id_sdm_unit,
                user?.id_unit, user?.id_unit_kerja, user?.id_sdm_unit,
                activeGroup?.id_unit, activeGroup?.id_unit_kerja, activeGroup?.id_sdm_unit
            )
            const idUser = pickFirst(
                userLogin?.id_user, user?.id_user, activeGroup?.id_user
            )

            // Auto-populate distribusiForm with current user's unit
            this.setState(state => ({
                distribusiForm: {
                    ...state.distribusiForm,
                    id_unit_tujuan: idUnit || '',
                    id_user_tujuan: idUser || '',
                },
                autoUnitTujuan: idUnit || '',
                autoUserTujuan: idUser || '',
            }))
        } catch (error) {
            // Silently ignore - unit will be selected manually
        }
    }

    // Toggle penerima multi-select
    handlePenerimaMultiToggle = (value) => {
        this.setState(state => {
            const current = state.selectedPenerimaMulti
            const newSelected = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value]
            return { selectedPenerimaMulti: newSelected }
        })
    }

    // Toggle sifat checkbox
    handleSifatMultiToggle = (value) => {
        this.setState(state => {
            const current = state.selectedSifatMulti
            const newSelected = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value]
            // Update datainsert with comma-separated sifat values
            const newDatainsert = { ...state.datainsert, sifat: newSelected.join(', ') }
            return { selectedSifatMulti: newSelected, datainsert: newDatainsert }
        })
    }

    capitalizeFirst = (str) => {
        if (!str) return ''
        return String(str).charAt(0).toUpperCase() + String(str).slice(1)
    }

    // Get all attachments for carousel
    handlegetAttachments = async () => {
        const data = this.getDetailData()
        const attachments = []

        // Check file_surat
        if (data?.file_surat) {
            attachments.push({
                file: data.file_surat,
                name: data.file_surat_name || data.nama_file_surat || 'Surat Utama',
                type: 'primary'
            })
        }

        // Check lampiran fields
        const lampiranFields = ['lampiran', 'lampiran_2', 'lampiran_3', 'lampiran_4', 'lampiran_5']
        lampiranFields.forEach((field, idx) => {
            if (data?.[field]) {
                attachments.push({
                    file: data[field],
                    name: data[`${field}_name`] || `Lampiran ${idx + 1}`,
                    type: 'attachment'
                })
            }
        })

        this.setState({ attachments, activeAttachmentIndex: 0 })
    }

    // Get inline tracking data
    handlegetInlineTracking = async () => {
        const currentId = this.getCurrentId()
        if (!currentId) return

        this.setState({ inlineTrackingLoading: true })

        try {
            const response = await axios.get(`/api/surat_masuk/${currentId}/timeline`)
            const events = response.data?.data || response.data || []
            this.setState({ inlineTracking: events, inlineTrackingLoading: false })
        } catch (error) {
            console.error('Failed to load inline tracking:', error)
            this.setState({ inlineTracking: [], inlineTrackingLoading: false })
        }
    }

    // Change attachment in carousel
    changeAttachment = (direction) => {
        this.setState(state => {
            const newIndex = state.activeAttachmentIndex + direction
            if (newIndex < 0 || newIndex >= state.attachments.length) return state
            return { activeAttachmentIndex: newIndex }
        })
    }

    // Select specific attachment
    selectAttachment = (index) => {
        this.setState({ activeAttachmentIndex: index })
    }

    // Get current attachment file
    getCurrentAttachment = () => {
        const { attachments, activeAttachmentIndex } = this.state
        if (attachments.length === 0) return null
        return attachments[Math.min(activeAttachmentIndex, attachments.length - 1)]
    }

    handlegetUserOptions = async () => {
        // Gunakan direktori penerima, bukan endpoint manajemen pengguna.
        // Endpoint /sys_user dibatasi untuk Admin Sistem sehingga daftar penerima
        // menjadi kosong saat form ini dibuka oleh Pimpinan/Admin Konten.
        const { getapi_services } = api_services({ api_path: '/surat_keluar/recipients' })
        const response = await getapi_services({
            filter: {
                paginate: { page: 1, pagesize: 10000 },
            },
        })

        if (response?.error || response?.code) return

        const rows = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
                ? response.result
                : []

        const userOptions = rows
            .map(item => ({
                value: item.id_user || item.id,
                label: item.name || item.nama || item.email || `User ${item.id_user || item.id}`,
            }))
            .filter(item => item.value)

        this.setState({ userOptions })
    }

    handlegetUnitOptions = async () => {
        const recipientUnits = [
            { value: 'DIV-SDM', label: 'SDM / HRD' },
            { value: 'DIV-KEU', label: 'Keuangan & Akuntansi' },
            { value: 'DIV-OPS', label: 'Operasional & Produksi' },
            { value: 'DIV-MKT', label: 'Pemasaran & Penjualan' },
        ]
        const { getapi_services } = api_services({ api_path: '/mt_sdm_unit' })
        const response = await getapi_services({
            filter: {
                paginate: { page: 1, pagesize: 10000 },
            },
        })

        if (response?.error || response?.code) {
            this.setState({ unitOptions: recipientUnits })
            return
        }

        const rows = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
                ? response.result
                : []

        const availableUnits = rows
            .map(item => ({
                value: item.id_unit || item.id,
                label: item.nama || item.name || item.id_unit || item.id,
            }))
            .filter(item => item.value)

        // Surat masuk is routed only to the four operational divisions.
        const unitOptions = recipientUnits.map(unit =>
            availableUnits.find(item => item.label === unit.label || item.value === unit.value) || unit
        )

        // Auto-populate after unitOptions is set in state
        this.setState({ unitOptions }, () => {
            this.handleAutoPopulateFromLetterData()
        })
    }

    handlegetJabatanOptions = async () => {
        const { getapi_services } = api_services({ api_path: '/mt_sdm_jabatan' })
        const response = await getapi_services({
            filter: {
                paginate: { page: 1, pagesize: 1000 },
            },
        })

        if (response?.error || response?.code) return

        const rows = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
                ? response.result
                : []

        const jabatanOptions = [...new Set(rows
            .map(item => item?.nama_jabatan || item?.nama || item?.jabatan)
            .filter(Boolean)
            .map(value => String(value).trim())
            .filter(Boolean))]
            .sort((left, right) => left.localeCompare(right, 'id'))

        this.setState({ jabatanOptions })
    }

    handlegetMasterData = async () => {
        const { getapi_services } = api_services({ api_path: `/surat_masuk/master-data` })
        const response = await getapi_services({})
        if (response.error || response.code) return

        const masterData = normalizeSuratMasukMasterData(response)
        this.setState(state => ({
            masterData,
            listcombo: {
                ...state.listcombo,
                jenis: masterData.jenis,
                sifat: masterData.sifat,
                status: masterData.status,
            },
            listreferensi: {
                ...state.listreferensi,
                jenis: optionsToIndex(masterData.jenis),
                sifat: optionsToIndex(masterData.sifat),
                status: optionsToIndex(masterData.status),
            },
        }))
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

    handleDisposisiFormChange = (key, value) => {
        this.setState(state => ({
            disposisiForm: {
                ...state.disposisiForm,
                [key]: value,
            },
        }))
    }

    handleDistribusiFormChange = (key, value) => {
        this.setState(state => ({
            distribusiForm: {
                ...state.distribusiForm,
                [key]: value,
            },
        }))
    }

    submitDisposisi = async () => {
        const currentId = this.getCurrentId()
        const form = this.state.disposisiForm

        if (!currentId) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        if (!Array.isArray(form.id_penerima) || form.id_penerima.length === 0) {
            showToastr('error', 'Penerima disposisi wajib dipilih.')
            return
        }

        const { postapi_services } = api_services({ api_path: '/surat_disposisi' })

        this.setState({ disposisiLoading: true })
        try {
            const responses = await Promise.all(form.id_penerima.map(id_penerima => postapi_services({
                disabledAlert: true,
                id_surat_masuk: currentId,
                id_penerima,
                tanggal_jatuh_tempo: form.tanggal_jatuh_tempo || null,
                status: 'baru',
            })))
            const response = responses.find(item => item?.success === false || item?.error || item?.code) || responses[0]

            if (!response || response?.success === false || response?.error || response?.code) {
                this.setState({ disposisiLoading: false })
                showToastr('error', response?.message || 'Disposisi gagal dibuat.')
                return
            }

            this.setState({
                disposisiLoading: false,
                datainsert: {
                    ...this.state.datainsert,
                    status: 'menunggu_disposisi',
                },
                disposisiForm: {
                    id_penerima: [],
                    instruksi: '',
                    catatan_penyelesaian: '',
                    tanggal_jatuh_tempo: '',
                },
            })
            this.handlegetInlineTracking()
            showToastr('success', 'Disposisi berhasil dibuat.')
        } catch (error) {
            this.setState({ disposisiLoading: false })
            const msg = error?.response?.data?.message ||
                error?.response?.data?.error ||
                (typeof error?.response?.data?.error === 'object'
                    ? Object.values(error.response.data.error).flat().join(', ')
                    : 'Gagal membuat disposisi.')
            showToastr('error', msg)
        }
    }

    submitDistribusi = async () => {
        const currentId = this.getCurrentId()
        const form = this.state.distribusiForm
        const data = this.state.datainsert

        if (!currentId) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        // Determine id_unit_tujuan and id_user_tujuan
        // Use form values if available, otherwise auto-match from letter's kepada_tujuan
        let idUnitTujuan = form.id_unit_tujuan || ''
        let idUserTujuan = form.id_user_tujuan || data?.id_penerima || ''
        const distribusiPegawaiList = []

        // Auto-match unit from letter's kepada_tujuan (fuzzy match)
        if (!idUnitTujuan && data?.kepada_tujuan) {
            const matchedUnit = this.findBestUnitMatch(data.kepada_tujuan, this.state.unitOptions)
            if (matchedUnit) {
                idUnitTujuan = matchedUnit.value
            }
        }

        // Auto-match user from letter's kepada_tujuan (fuzzy match) if single select is used
        if (!idUserTujuan && data?.kepada_tujuan) {
            const kepadaRaw = String(data.kepada_tujuan).trim()
            const matchedUser = this.state.userOptions.find(opt =>
                String(opt.label || '').toLowerCase().includes(kepadaRaw.toLowerCase()) ||
                kepadaRaw.toLowerCase().includes(String(opt.label || '').toLowerCase())
            )
            if (matchedUser) {
                idUserTujuan = matchedUser.value
            }
        }

        if (!idUnitTujuan && !idUserTujuan) {
            showToastr('error', 'Penerima/tujuan dari data surat belum ditemukan.')
            return
        }

        this.setState({ distribusiLoading: true })

        try {
            await axios.post(`/api/surat_masuk/${currentId}/distribute`, {
                id_unit_tujuan: idUnitTujuan || null,
                id_user_tujuan: idUserTujuan || null,
                id_users: null,
            }, { timeout: 30000 })

            this.setState({
                datainsert: {
                    ...this.state.datainsert,
                    status: 'menunggu_disposisi',
                },
                distribusiForm: {
                    id_unit_tujuan: '',
                    id_user_tujuan: '',
                },
                distribusiPegawaiList: [],
            })
            this.handlegetInlineTracking()
            showToastr('success', 'Distribusi berhasil dikirim.')
        } catch (error) {
            const responseData = error?.response?.data || {}
            const validationMessage = responseData?.error && typeof responseData.error === 'object'
                ? Object.values(responseData.error).flat().join(' ')
                : ''
            const message = responseData?.messages?.errors ||
                responseData?.messages?.error ||
                responseData?.message ||
                validationMessage ||
                (!error?.response ? 'Backend tidak merespons atau koneksi terputus.' : '') ||
                'Distribusi gagal dikirim.'
            showToastr('error', message)
        } finally {
            this.setState({ distribusiLoading: false })
        }
    }

    openArchiveModal = () => {
        const currentId = this.getCurrentId()
        const data = this.getDetailData()

        if (!currentId) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        if (data.sudah_diarsipkan) {
            showToastr('info', 'Surat ini sudah pernah diarsipkan.')
            return
        }

        this.setState({
            showArchiveModal: true,
            archiveForm: {
                nomor_surat: data.nomor_surat || '',
                perihal: data.perihal || '',
                file_path: this.getAttachmentValue(data),
                lokasi_fisik: '',
                tanggal_arsip: this.getTodayDate(),
            },
        })
    }

    handleArchiveFormChange = (key, value) => {
        this.setState(state => ({
            archiveForm: {
                ...state.archiveForm,
                [key]: value,
            },
        }))
    }

    submitArchive = async event => {
        event?.preventDefault()
        const currentId = this.getCurrentId()
        const form = this.state.archiveForm

        if (!currentId) {
            showToastr('error', 'ID surat masuk tidak ditemukan.')
            return
        }

        if (!form.tanggal_arsip) {
            showToastr('error', 'Tanggal arsip wajib diisi.')
            return
        }

        this.setState({ archiveLoading: true })
        let response
        try {
            response = (await axios.post(`/api/surat_masuk/${currentId}/archive`, {
                lokasi_fisik: form.lokasi_fisik || '',
                tanggal_arsip: form.tanggal_arsip,
            }))?.data
        } catch (error) {
            this.setState({ archiveLoading: false })
            showToastr('error', error?.response?.data?.message || 'Surat masuk gagal diarsipkan.')
            return
        }

        if (!response?.success || !response?.data) {
            this.setState({ archiveLoading: false })
            showToastr('error', response?.message || 'Surat masuk gagal diarsipkan.')
            return
        }

        this.setState({
            archiveLoading: false,
            showArchiveModal: false,
            datainsert: {
                ...this.state.datainsert,
                status: 'selesai',
                sudah_diarsipkan: true,
            },
        })
        this.handlegetInlineTracking()
        showToastr('success', 'Surat berhasil masuk arsip.')
    }

    canSave = () => {
        if (this.state.path === 'detail') return false
        if (this.id) return canUseEofficeAction('surat_masuk', 'edit')
        return canUseEofficeAction('surat_masuk', 'add')
    }

    normalizeOcrPayload = response => {
        // Try direct fields first (simplified backend response: {success, message, fields, data})
        if (response?.fields && typeof response.fields === 'object') {
            return { ...response.fields }
        }

        // Try data.fields (wrapped response)
        if (response?.data?.fields && typeof response.data.fields === 'object') {
            return { ...response.data.fields }
        }

        // Try data as direct fields (new simplified format: {success, message, fields, data: {...fields}})
        if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            const dataKeys = Object.keys(response.data)
            const hasOcrKey = dataKeys.some(k =>
                ['nomor_agenda', 'nomor_surat', 'jenis', 'asal_surat', 'perihal'].includes(k)
            )
            if (hasOcrKey) {
                return { ...response.data }
            }
        }

        let payload = response?.result_payload ||
            response?.result ||
            response?.ocr ||
            response?.data ||
            response ||
            {}

        const ocrFieldKeys = [
            'nomor_agenda', 'nomor_surat', 'jenis', 'tanggal_surat',
            'asal_surat', 'kepada_tujuan', 'sifat',
            'tanggal_terima', 'perihal', 'isi_ringkasan', 'catatan',
        ]

        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload)
            } catch (error) {
                payload = {}
            }
        }

        for (let index = 0; index < 3; index++) {
            const hasOcrField = ocrFieldKeys.some(key => payload?.[key] !== undefined)

            if (
                hasOcrField ||
                !payload?.data ||
                typeof payload.data !== 'object' ||
                Array.isArray(payload.data)
            ) {
                break
            }

            payload = payload.data
        }

        return {
            ...payload,
            extracted_text: response?.extracted_text || response?.data?.extracted_text || payload.extracted_text,
            summary: response?.summary || response?.data?.summary || payload.summary,
        }
    }

    getStatusLabel = value => {
        const status = value || 'pending'
        const raw = this.state.listreferensi.status?.[status] || status
        return this.capitalizeFirst(raw)
    }

    pickOcrValue = (payload, keys) => {
        for (const key of keys) {
            if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
                return payload[key]
            }
        }

        return ''
    }

    normalizeOcrDate = value => {
        if (!value) return ''
        const dateText = String(value).trim()

        if (/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
            return dateText.substring(0, 10)
        }

        const monthMap = {
            januari: '01',
            februari: '02',
            maret: '03',
            april: '04',
            mei: '05',
            juni: '06',
            juli: '07',
            agustus: '08',
            september: '09',
            oktober: '10',
            november: '11',
            desember: '12',
        }

        const longDate = dateText
            .toLowerCase()
            .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/)

        if (longDate && monthMap[longDate[2]]) {
            return `${longDate[3]}-${monthMap[longDate[2]]}-${longDate[1].padStart(2, '0')}`
        }

        const slashDate = dateText.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
        if (slashDate) {
            const day = slashDate[1].padStart(2, '0')
            const month = slashDate[2].padStart(2, '0')
            return `${slashDate[3]}-${month}-${day}`
        }

        return value
    }

    normalizeText = value => String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()

    normalizeOption = (value, options) => {
        if (!value) return ''

        const normalized = this.normalizeText(value)
        const match = options.find(option => {
            const label = this.normalizeText(option.label)
            const optionValue = this.normalizeText(option.value)

            return label === normalized ||
                optionValue === normalized ||
                label.includes(normalized) ||
                normalized.includes(label)
        })

        return match ? match.value : value
    }

    getTodayDate = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    handlegetNomorAgendaPreview = async () => {
        if (this.id || this.state.path !== 'add' || this.state.nomor_agenda_loading) return
        if (this.state.nomor_agenda_generated || this.state.datainsert.nomor_agenda) return

        this.setState({ nomor_agenda_loading: true })

        try {
            const { getapi_services } = api_services({ api_path: '/surat_masuk/nomor-agenda-preview' })
            const response = await getapi_services({})

            const nomorAgenda = response?.nomor_agenda || response?.data?.nomor_agenda || null

            this.setState(state => ({
                nomor_agenda_loading: false,
                nomor_agenda_generated: true,
                datainsert: {
                    ...state.datainsert,
                    nomor_agenda: state.datainsert.nomor_agenda || nomorAgenda || '',
                },
            }))
        } catch (error) {
            this.setState({ nomor_agenda_loading: false })
        }
    }

    applyOcrResult = response => {
        const payload = this.normalizeOcrPayload(response)
        const tanggalSurat = this.normalizeOcrDate(this.pickOcrValue(payload, ['tanggal_surat', 'tgl_surat', 'tanggal']))
        const tanggalTerima = this.normalizeOcrDate(this.pickOcrValue(payload, ['tanggal_terima', 'tgl_terima']))

        const mappedData = {
            nomor_agenda: '',
            nomor_surat: this.pickOcrValue(payload, ['nomor_surat', 'no_surat', 'nomor', 'nomorSurat']),
            jenis: this.normalizeOption(this.pickOcrValue(payload, ['jenis', 'jenis_surat', 'tipe_surat']), this.state.masterData.jenis || jenisOptions),
            tanggal_surat: tanggalSurat,
            asal_surat: this.pickOcrValue(payload, ['asal_surat', 'dari', 'pengirim', 'sender']),
            // Penerima/Tujuan dipilih manual dari daftar pengguna aktif.
            // Jangan isi dari teks OCR karena nama instansi, nomor, atau bagian
            // dokumen sering salah dikenali sebagai penerima.
            kepada_tujuan: '',
            sifat: this.normalizeOption(this.pickOcrValue(payload, ['sifat', 'prioritas']), this.state.masterData.sifat || sifatOptions),
            tanggal_terima: tanggalTerima,
            perihal: this.pickOcrValue(payload, ['perihal', 'subject', 'hal']),
            isi_ringkasan: this.pickOcrValue(payload, ['isi_ringkasan', 'ringkasan', 'summary', 'isi', 'extracted_text']),
            catatan: this.pickOcrValue(payload, ['catatan', 'notes']),
        }

        const meaningfulFields = [
            'nomor_surat',
            'jenis',
            'tanggal_surat',
            'asal_surat',
            'sifat',
            'perihal',
            'isi_ringkasan',
            'catatan',
        ]
        const meaningfulCount = meaningfulFields.filter(key => mappedData[key]).length

        if (meaningfulCount === 0) {
            const responseKeys = Object.keys(payload).join(', ') || 'kosong'
            this.setState({
                ocr_status: `AI OCR gagal membaca dokumen. Silakan input manual di form Data Surat. Key response: ${responseKeys}`,
            })
            return false
        }

        mappedData.status = this.state.datainsert.status || 'draft'

        if (!mappedData.tanggal_terima) {
            mappedData.tanggal_terima = this.getTodayDate()
        }

        const cleanData = {}
        Object.keys(mappedData).forEach(key => {
            if (key !== 'nomor_agenda' && mappedData[key]) cleanData[key] = mappedData[key]
        })

        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                ...cleanData,
            },
            ocr_status: 'OCR selesai. Semua field yang terbaca sudah diisi otomatis.',
        }))

        return true
    }

    handleExtractOcr = async () => {
        const fileSurat = this.state.datainsert.file_surat

        if (!fileSurat || typeof fileSurat === 'string') {
            showToastr('error', 'Pilih lampiran surat terlebih dahulu.')
            return
        }

        this.setState({
            ocr_loading: true,
            ocr_status: 'Mengirim dokumen ke backend OCR...',
        })

        try {
            const response = await axios.post('/api/surat_masuk/ocr', {
                file_surat: fileSurat,
            }, { timeout: 120000 })

            console.log('surat_masuk_ocr_response', response.data)
            const applied = this.applyOcrResult(response.data)

            if (applied) {
                this.setState({
                    ocr_loading: false,
                })
                showToastr('success', 'OCR selesai, form sudah diisi otomatis.')
                return
            }

            this.setState({
                ocr_loading: false,
            })
            showToastr('error', 'AI OCR gagal membaca dokumen. Silakan input manual di form Data Surat.')
        } catch (error) {
            // Try to extract a meaningful error message
            const errorData = error.response?.data
            let errorMessage = 'Gagal menjalankan OCR dari backend.'

            if (errorData) {
                // Check various possible error message locations
                const candidates = [
                    errorData?.messages?.errors,       // Laravel validation format
                    errorData?.error?.detail?.[0],    // Standard error format
                    errorData?.error?.file_surat?.[0], // Field-specific error
                    errorData?.message,               // Direct message
                    typeof errorData.error === 'string' ? errorData.error : null,
                ]
                const found = candidates.find(c => typeof c === 'string' && c.trim())
                if (found) errorMessage = found
            } else if (!error.response) {
                errorMessage = 'Backend tidak merespons. Periksa koneksi internet atau status server.'
            } else if (error.response?.status === 413) {
                errorMessage = 'Ukuran file terlalu besar. Batasi ukuran lampiran.'
            } else if (error.response?.status === 0) {
                errorMessage = 'Koneksi ke server terputus. Coba lagi.'
            }

            this.setState({
                ocr_loading: false,
                ocr_status: `AI OCR gagal membaca dokumen. Silakan input manual di form Data Surat. [${errorMessage}]`,
            })
            showToastr('error', `AI OCR gagal: ${errorMessage}`)
        }
    }

    isOcrFailed = () => String(this.state.ocr_status || '').toLowerCase().includes('gagal')

    getFileUrl = value => {
        if (!value || typeof value !== 'string') return ''
        if (/^https?:\/\//i.test(value)) return value
        return urlPreview(value.startsWith('/') ? value : `/${value}`)
    }

    getFileName = value => {
        if (!value || typeof value !== 'string') return '-'
        return value.split('/').pop() || value
    }

    isPreviewableFile = value => /\.(pdf|png|jpe?g|gif|webp)$/i.test(String(value || '').split('?')[0])

    isPdfFile = value => /\.pdf$/i.test(String(value || '').split('?')[0])

    isImageFile = value => /\.(png|jpe?g|gif|webp)$/i.test(String(value || '').split('?')[0])

    isGoogleDriveUrl = value => /(^https?:\/\/)?(docs|drive)\.google\.com\//i.test(String(value || ''))

    getGoogleDrivePreviewUrl = value => {
        try {
            const url = new URL(value)
            const documentMatch = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/i)
            if (documentMatch) {
                return `https://docs.google.com/${documentMatch[1]}/d/${documentMatch[2]}/preview`
            }

            const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)/i)
            if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`

            const fileId = url.searchParams.get('id')
            return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : value
        } catch {
            return value
        }
    }

    getPreviewUrl = (fileUrl, file) => {
        if (!fileUrl) return ''
        if (this.isGoogleDriveUrl(fileUrl)) return this.getGoogleDrivePreviewUrl(fileUrl)
        if (!this.isPdfFile(file)) return fileUrl

        const separator = fileUrl.includes('#') ? '&' : '#'
        return `${fileUrl}${separator}toolbar=0&navpanes=0&view=FitH&page=${this.state.attachmentPage}`
    }

    changeAttachmentPage = direction => {
        this.setState(state => ({
            attachmentPage: Math.max(1, state.attachmentPage + direction),
        }))
    }

    renderDetailValue = value => value || '-'

    renderAttachmentPreview = data => {
        const file = this.getAttachmentValue(data || this.getDetailData())
        const fileUrl = this.getFileUrl(file)
        const previewUrl = this.getPreviewUrl(fileUrl, file)
        const fileName = this.getFileName(file)
        const isPdf = this.isPdfFile(file)
        const isImage = this.isImageFile(file)
        const isGoogleDrive = this.isGoogleDriveUrl(fileUrl)

        return (
            <EofficeCard className="p-3 h-100 d-flex flex-column" style={{ minHeight: 0 }}>
                <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="font-semibold text-gray-900">Lampiran Surat</div>
                        <div className="text-gray-500" style={{ fontSize: 12, overflowWrap: 'anywhere', lineHeight: 1.35 }}>{fileName}</div>
                    </div>
                    {fileUrl ? (
                        <Button className="btn-default-app btn-info" onClick={() => window.open(fileUrl, '_blank')}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>open_in_new</span>
                            Buka
                        </Button>
                    ) : null}
                </div>

                {fileUrl ? (
                    <div className="d-flex align-items-center justify-content-between mb-2" style={{ gap: 8 }}>
                        <div className="d-flex align-items-center" style={{ gap: 6 }}>
                            <button
                                type="button"
                                className="btn btn-light btn-sm border"
                                disabled={!isPdf || this.state.attachmentPage <= 1}
                                onClick={() => this.changeAttachmentPage(-1)}
                            >
                                <span className="material-icons" style={{ fontSize: 16 }}>chevron_left</span>
                            </button>
                            <div className="font-semibold" style={{ fontSize: 12, minWidth: 72, textAlign: 'center' }}>
                                {isPdf ? `Hal. ${this.state.attachmentPage}` : 'Preview'}
                            </div>
                            <button
                                type="button"
                                className="btn btn-light btn-sm border"
                                disabled={!isPdf}
                                onClick={() => this.changeAttachmentPage(1)}
                            >
                                <span className="material-icons" style={{ fontSize: 16 }}>chevron_right</span>
                            </button>
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                            {isPdf ? 'Gunakan tombol panah untuk slide halaman.' : isImage ? 'Lampiran foto surat.' : ''}
                        </div>
                    </div>
                ) : null}

                {!fileUrl ? (
                    <div className="text-muted text-center py-5 border rounded-md bg-light flex-1">Belum ada lampiran surat.</div>
                ) : isGoogleDrive || isPdf ? (
                    <iframe
                        key={`${fileUrl}-${this.state.attachmentPage}`}
                        title="Preview lampiran surat masuk"
                        src={previewUrl}
                        style={{ width: '100%', flex: 1, minHeight: 0, border: '1px solid #d9e2e7', borderRadius: 6, background: '#2f2f2f' }}
                    />
                ) : isImage ? (
                    <div className="d-flex align-items-center justify-content-center border rounded-md bg-dark flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                        <img
                            src={previewUrl}
                            alt="Lampiran surat masuk"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-5 border rounded-md bg-light flex-1">
                        <span className="material-icons text-gray-500" style={{ fontSize: 42 }}>description</span>
                        <div className="font-semibold mt-2">Preview tidak tersedia untuk tipe file ini.</div>
                        <div className="text-muted mt-1">Gunakan tombol Buka untuk melihat lampiran.</div>
                    </div>
                )}
            </EofficeCard>
        )
    }

    renderFollowUpForms = data => {
        const role = getEofficeRole()
        const canDistribute = ['admin_sistem', 'admin_konten'].includes(role)
        const recipientName = data?.penerima_user?.name || data?.penerima || data?.kepada_tujuan || '-'

        if (!canDistribute) {
            return (
                <EofficeCard className="p-2">
                    <div className="font-semibold text-gray-900 mb-2">Disposisi</div>
                    <div className="text-muted mb-2" style={{ fontSize: 12 }}>
                        Pilih pegawai penerima dan tenggat, lalu klik Tambah Disposisi.
                    </div>
                    <div className="row g-2">
                        <div className="col-12">
                            <label className="font-semibold" style={{ fontSize: 12 }}>Penerima Disposisi</label>
                            <InputSelect
                                id="disposisi_penerima"
                                type="select"
                                placeholder="Pilih pegawai penerima"
                                data={this.state.userOptions}
                                // InputSelect expects a comma-separated value for
                                // multi-select; it resolves IDs back to labels.
                                value={this.state.disposisiForm.id_penerima.join(',')}
                                onChange={value => this.handleDisposisiFormChange('id_penerima', (Array.isArray(value) ? value : []).map(option => String(option.value || option)))}
                                isClearable
                                isMulti
                                closeMenuOnSelect={false}
                            />
                        </div>
                        <div className="col-12">
                            <label className="font-semibold" style={{ fontSize: 12 }}>Tenggat</label>
                            <input type="date" className="form-control" value={this.state.disposisiForm.tanggal_jatuh_tempo} onChange={event => this.handleDisposisiFormChange('tanggal_jatuh_tempo', event.target.value)} />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                        <Button type="button" className="btn-default-app btn-info" onClick={this.submitDisposisi} disabled={this.state.disposisiLoading}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>send</span>
                            {this.state.disposisiLoading ? 'Mengirim...' : 'Tambah Disposisi'}
                        </Button>
                    </div>
                </EofficeCard>
            )
        }

        return (
            <EofficeCard className="p-2">
            <div className="font-semibold text-gray-900 mb-2">Distribusi</div>
            <div className="text-muted mb-2" style={{ fontSize: 12 }}>
                Kirim distribusi surat {data.nomor_surat || data.nomor_agenda || '-'} ke unit atau pegawai penerima.
            </div>
            <div className="row g-2">
                <div className="col-12">
                    <label className="font-semibold" style={{ fontSize: 12 }}>Penerima/Tujuan</label>
                    <div className="form-control bg-light" style={{ minHeight: 38 }}>{recipientName}</div>
                    <small className="text-success" style={{ fontSize: 11 }}>Diambil otomatis dari `sys_user`</small>
                </div>
            </div>
            <div className="d-flex justify-content-end mt-2">
                <Button
                    type="button"
                    className="btn-default-app btn-info"
                    onClick={this.submitDistribusi}
                    disabled={this.state.distribusiLoading === true}
                >
                    <span className="material-icons mr-1" style={{ fontSize: 16 }}>share</span>
                    {this.state.distribusiLoading ? 'Mengirim...' : 'DISTRIBUSIKAN'}
                </Button>
            </div>
            </EofficeCard>
        )
    }

    renderDetailMode = () => {
        const data = this.getDetailData()
        const currentId = this.getCurrentId()
        const infoItems = [
            { label: 'Nomor Agenda', value: data.nomor_agenda },
            { label: 'Nomor Surat', value: data.nomor_surat },
            { label: 'Pengirim', value: data.asal_surat },
            { label: 'Penerima/Tujuan', value: data.kepada_tujuan },
            { label: 'Jenis', value: data.jenis },
            { label: 'Sifat', value: this.capitalizeFirst(data.sifat) },
            { label: 'Tanggal Surat', value: data.tanggal_surat ? formatDateApp(data.tanggal_surat, 'YYYY-MM-DD') : '' },
            { label: 'Tanggal Terima', value: data.tanggal_terima ? formatDateApp(data.tanggal_terima, 'YYYY-MM-DD') : '' },
            { label: 'Status', value: this.getStatusLabel(data.status) },
        ]

        return (
            <div className="surat-masuk-detail-page" style={{ minHeight: 'calc(100vh - 92px)', background: '#fff', border: '1px solid #d6dce1', borderRadius: 6, overflow: 'hidden' }}>
                <div className="d-flex align-items-center justify-content-between" style={{ minHeight: 52, padding: '0 14px', borderBottom: '1px solid #d6dce1', background: '#fff' }}>
                    <h1 className="mb-0" style={{ fontSize: 22, fontWeight: 500, color: '#252b31' }}>Detail Surat Masuk</h1>
                    <button
                        type="button"
                        aria-label="Tutup detail surat masuk"
                        onClick={this.closeDetailTab}
                        style={{ border: 0, borderRadius: 6, width: 30, height: 30, background: '#f28b8b', color: '#fff', fontSize: 22, lineHeight: '26px', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                {/* 3 Column Layout: Detail | Slide Lampiran | Tracking + Follow-up */}
                <div className="d-flex flex-column flex-xl-row" style={{ gap: 12, padding: 12, minHeight: 'calc(100vh - 145px)', background: '#fff' }}>
                    {/* KIRI: Detail Info */}
                    <div className="d-flex flex-column" style={{ flex: '0 0 28%', minWidth: 280, minHeight: 0, overflow: 'auto', paddingRight: 0 }}>
                        <EofficeCard className="p-3 mb-2" style={{ flex: '0 0 auto', border: '1px solid #d9dee3', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
                            <div className="d-flex align-items-start justify-content-between mb-3" style={{ gap: 10 }}>
                                <div>
                                    <div className="font-semibold text-gray-900" style={{ fontSize: 16 }}>{this.renderDetailValue(data.perihal)}</div>
                                    <div className="text-gray-500 mt-1" style={{ fontSize: 12 }}>Detail surat masuk</div>
                                </div>
                                <EofficeStatusBadge value={data.status || 'baru'} />
                            </div>
                            <EofficeInfoGrid items={infoItems} />
                            <div className="mt-2">
                                <div className="text-gray-500" style={{ fontSize: 11 }}>Isi/Ringkasan</div>
                                <div className="mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.4, maxHeight: 100, overflowY: 'auto' }}>{this.renderDetailValue(data.isi_ringkasan)}</div>
                            </div>
                            {data.catatan && (
                                <div className="mt-2">
                                    <div className="text-gray-500" style={{ fontSize: 11 }}>Catatan</div>
                                    <div className="mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.4 }}>{this.renderDetailValue(data.catatan)}</div>
                                </div>
                            )}
                            <div
                                className={`alert py-2 px-3 mt-3 mb-0 ${data.sudah_diarsipkan ? 'alert-success' : 'alert-warning'}`}
                                style={{ fontSize: 12 }}
                            >
                                <span className="material-icons mr-1" style={{ fontSize: 15, verticalAlign: 'middle' }}>
                                    {data.sudah_diarsipkan ? 'inventory_2' : 'pending_actions'}
                                </span>
                                {data.sudah_diarsipkan
                                    ? 'Surat ini sudah diarsipkan.'
                                    : 'Surat ini belum diarsipkan.'}
                            </div>
                            <div className="d-flex flex-wrap align-items-center mt-3" style={{ gap: 8 }}>
                                <Button
                                    className={`btn-default-app btn-sm ${data.sudah_diarsipkan ? 'btn-secondary' : 'btn-info'}`}
                                    onClick={this.openArchiveModal}
                                    disabled={data.sudah_diarsipkan === true}
                                >
                                    <span className="material-icons mr-1" style={{ fontSize: 14 }}>archive</span>
                                    {data.sudah_diarsipkan ? 'Sudah Diarsipkan' : 'Arsipkan'}
                                </Button>
                            </div>
                        </EofficeCard>
                    </div>

                    {/* TENGAH: Slide Lampiran */}
                    <div style={{ flex: '1 1 44%', minWidth: 300, minHeight: 0 }}>
                        {this.renderAttachmentCarousel(data)}
                    </div>

                    {/* KANAN: Tracking + Follow-up */}
                    <div className="d-flex flex-column" style={{ flex: '0 0 28%', minWidth: 280, minHeight: 0, overflow: 'auto' }}>
                        {this.renderInlineTracking()}
                        {this.renderFollowUpForms(data)}
                    </div>
                </div>

                <EofficeTimelineModal
                    show={this.state.showTimeline}
                    onHide={() => this.setState({ showTimeline: false })}
                    suratId={currentId}
                    surat={data}
                    timelinePath={currentId ? `/surat_masuk/${currentId}/timeline` : ''}
                />

                <Modal show={this.state.showArchiveModal} onHide={() => this.setState({ showArchiveModal: false })} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Arsip Surat Masuk</Modal.Title>
                    </Modal.Header>
                    <form onSubmit={this.submitArchive}>
                        <Modal.Body>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="font-semibold">Jenis Surat</label>
                                    <input className="form-control" value="Surat Masuk" disabled />
                                </div>
                                <div className="col-md-6">
                                    <label className="font-semibold">Tanggal Arsip</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={this.state.archiveForm.tanggal_arsip || ''}
                                        onChange={event => this.handleArchiveFormChange('tanggal_arsip', event.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="font-semibold">ID Surat Masuk</label>
                                    <input className="form-control" value={currentId || ''} disabled />
                                </div>
                                <div className="col-md-6">
                                    <label className="font-semibold">Nomor Surat</label>
                                    <input
                                        className="form-control"
                                        value={this.state.archiveForm.nomor_surat || ''}
                                        onChange={event => this.handleArchiveFormChange('nomor_surat', event.target.value)}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="font-semibold">Path File</label>
                                    <input
                                        className="form-control"
                                        value={this.state.archiveForm.file_path || ''}
                                        onChange={event => this.handleArchiveFormChange('file_path', event.target.value)}
                                        placeholder="Lokasi file arsip"
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="font-semibold">Lokasi Arsip Fisik</label>
                                    <input
                                        className="form-control"
                                        value={this.state.archiveForm.lokasi_fisik || ''}
                                        onChange={event => this.handleArchiveFormChange('lokasi_fisik', event.target.value)}
                                        placeholder="Contoh: Ruang Arsip, Rak No. 10, Box A-03"
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="font-semibold">Perihal</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={this.state.archiveForm.perihal || ''}
                                        onChange={event => this.handleArchiveFormChange('perihal', event.target.value)}
                                    />
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button className="btn-default-app btn-light" type="button" onClick={() => this.setState({ showArchiveModal: false })}>
                                Batal
                            </Button>
                            <Button className="btn-default-app btn-info" type="submit" disabled={this.state.archiveLoading}>
                                {this.state.archiveLoading ? 'Menyimpan...' : 'Simpan Arsip'}
                            </Button>
                        </Modal.Footer>
                    </form>
                </Modal>
            </div>
        )
    }

    // Render carousel untuk slide lampiran
    renderAttachmentCarousel = (data) => {
        const { attachments, activeAttachmentIndex } = this.state
        const currentAttachment = this.getCurrentAttachment()
        const fileUrl = this.getFileUrl(currentAttachment?.file)
        const isPdf = this.isPdfFile(currentAttachment?.file)
        const isImage = this.isImageFile(currentAttachment?.file)
        const isGoogleDrive = this.isGoogleDriveUrl(fileUrl)
        const previewUrl = this.getPreviewUrl(fileUrl, currentAttachment?.file)

        return (
            <EofficeCard className="p-3 h-100 d-flex flex-column" style={{ minHeight: 0 }}>
                {/* Header dengan slide info */}
                <div className="d-flex align-items-center justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="font-semibold text-gray-900" style={{ fontSize: 14 }}>
                            <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>attach_file</span>
                            Lampiran Surat
                        </div>
                        {currentAttachment?.name && (
                            <div className="text-gray-500" style={{ fontSize: 11, overflowWrap: 'anywhere' }}>
                                {currentAttachment.name}
                            </div>
                        )}
                    </div>
                    {attachments.length > 1 && (
                        <div className="d-flex align-items-center" style={{ gap: 4 }}>
                            <span className="badge bg-light text-dark" style={{ fontSize: 11 }}>
                                {activeAttachmentIndex + 1} / {attachments.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigasi slide dots */}
                {attachments.length > 1 && (
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-2 flex-wrap">
                        {attachments.map((att, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => this.selectAttachment(idx)}
                                className={`btn btn-sm ${idx === activeAttachmentIndex ? 'btn-primary' : 'btn-light border'}`}
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                title={att.name}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tombol navigasi prev/next */}
                {attachments.length > 1 && (
                    <div className="d-flex align-items-center justify-content-between mb-2" style={{ gap: 8 }}>
                        <button
                            type="button"
                            className="btn btn-light btn-sm border"
                            disabled={activeAttachmentIndex <= 0}
                            onClick={() => this.changeAttachment(-1)}
                        >
                            <span className="material-icons" style={{ fontSize: 16 }}>chevron_left</span>
                            Prev
                        </button>
                        <button
                            type="button"
                            className="btn btn-light btn-sm border"
                            disabled={activeAttachmentIndex >= attachments.length - 1}
                            onClick={() => this.changeAttachment(1)}
                        >
                            Next
                            <span className="material-icons" style={{ fontSize: 16 }}>chevron_right</span>
                        </button>
                    </div>
                )}

                {/* Preview lampiran */}
                {!fileUrl ? (
                    <div className="text-muted text-center py-5 border rounded-md bg-light flex-1 d-flex align-items-center justify-content-center">
                        <div>
                            <span className="material-icons text-gray-400" style={{ fontSize: 42 }}>description</span>
                            <div className="mt-2">Belum ada lampiran surat.</div>
                        </div>
                    </div>
                ) : isGoogleDrive || isPdf ? (
                    <iframe
                        key={`${fileUrl}-${this.state.attachmentPage}-${activeAttachmentIndex}`}
                        title={`Lampiran ${activeAttachmentIndex + 1}`}
                        src={previewUrl}
                        style={{ width: '100%', flex: 1, minHeight: 0, border: '1px solid #d9e2e7', borderRadius: 6, background: '#2f2f2f' }}
                    />
                ) : isImage ? (
                    <div className="d-flex align-items-center justify-content-center border rounded-md bg-dark flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                        <img
                            src={previewUrl}
                            alt={`Lampiran ${activeAttachmentIndex + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-5 border rounded-md bg-light flex-1 d-flex align-items-center justify-content-center">
                        <div>
                            <span className="material-icons text-gray-500" style={{ fontSize: 42 }}>description</span>
                            <div className="font-semibold mt-2">Preview tidak tersedia</div>
                            <div className="text-muted mt-1">Gunakan tombol di bawah untuk melihat.</div>
                        </div>
                    </div>
                )}

                {/* Tombol aksi */}
                <div className="d-flex align-items-center justify-content-end gap-2 mt-2">
                    {fileUrl && (
                        <Button className="btn-default-app btn-info btn-sm" onClick={() => window.open(fileUrl, '_blank')}>
                            <span className="material-icons mr-1" style={{ fontSize: 14 }}>open_in_new</span>
                            Buka
                        </Button>
                    )}
                </div>
            </EofficeCard>
        )
    }

    // Render inline tracking di panel kanan
    renderInlineTracking = () => {
        const { inlineTracking, inlineTrackingLoading } = this.state

        return (
            <EofficeCard className="p-2 mb-2">
                <div className="d-flex align-items-center justify-content-between mb-2" style={{ gap: 8 }}>
                    <div className="font-semibold text-gray-900" style={{ fontSize: 13 }}>
                        <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>timeline</span>
                        Tracking Surat
                    </div>
                    <Button className="btn-default-app btn-outline-info btn-sm" onClick={() => this.setState({ showTimeline: true })}>
                        <span className="material-icons" style={{ fontSize: 14 }}>open_in_full</span>
                    </Button>
                </div>

                {inlineTrackingLoading ? (
                    <div className="text-center py-3">
                        <span className="spinner-border spinner-border-sm text-muted"></span>
                        <div className="text-muted mt-1" style={{ fontSize: 11 }}>Memuat tracking...</div>
                    </div>
                ) : inlineTracking.length > 0 ? (
                    <div className="tracking-timeline" style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {inlineTracking.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="tracking-event" style={{
                                display: 'flex',
                                gap: 8,
                                padding: '6px 0',
                                borderBottom: idx < Math.min(inlineTracking.length - 1, 4) ? '1px solid #eee' : 'none'
                            }}>
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
                                        {this.getTrackingTime(event)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {inlineTracking.length > 5 && (
                            <div className="text-center mt-1">
                                <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0"
                                    style={{ fontSize: 11 }}
                                    onClick={() => this.setState({ showTimeline: true })}
                                >
                                    Lihat semua ({inlineTracking.length} events)
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-muted text-center py-2" style={{ fontSize: 11 }}>
                        Belum ada tracking.
                    </div>
                )}
            </EofficeCard>
        )
    }

    // Helper untuk tracking badge color
    getTrackingBadgeColor = (type) => {
        const colors = {
            'created': 'bg-success',
            'updated': 'bg-info',
            'distributed': 'bg-primary',
            'read': 'bg-secondary',
            'disposition': 'bg-warning text-dark',
            'disposition_completed': 'bg-success',
            'archived': 'bg-dark',
        }
        return colors[type] || 'bg-secondary'
    }

    // Helper untuk tracking icon
    getTrackingIcon = (type) => {
        const icons = {
            'created': '✓',
            'updated': '✎',
            'distributed': '→',
            'read': '◎',
            'disposition': '↗',
            'disposition_completed': '✓✓',
            'archived': '▣',
        }
        return icons[type] || '•'
    }

    // Helper untuk tracking title
    getTrackingTitle = (event) => {
        const titles = {
            'created': 'Surat dibuat',
            'updated': 'Diperbarui',
            'distributed': 'Didistribusikan',
            'read': 'Dibaca',
            'disposition': 'Disposisi',
            'disposition_completed': 'Disposisi selesai',
            'archived': 'Diarsipkan',
        }
        return titles[event.type] || event.description || event.title || event.type
    }

    // Helper untuk tracking time
    getTrackingTime = (event) => {
        const time = event.created_at || event.tanggal || event.waktu || event.time
        if (time) {
            return formatDateApp(time) || time
        }
        return ''
    }

    renderTextInput = ({ column, label, type = 'text', required = false, placeholder = label, readOnly = false }) => (
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
                    readOnly={readOnly}
                    message_error={this.state.errors[column]}
                    onError={this.handleErrors}
                    disabled={this.state.is_disabled}
                />
            </div>
        </FormGroup>
    )

    renderSelect = ({ column, label, data, required = false }) => (
        <FormGroup
            label={label}
            required={required}
            message_error={this.state.errors[column]}
            disabled={this.state.is_disabled}
            formCol
            noMb
        >
            <div className="mt-1">
                <InputSelect
                    id={column}
                    type="select"
                    placeholder={"Pilih..."}
                    value={this.state.datainsert[column]}
                    className="block mt-1 w-full"
                    data={data}
                    onChange={(value) => this.handleChange(column, value)}
                    required={required}
                    isClearable
                    isMulti={false}
                    message_error={this.state.errors[column]}
                    onError={this.handleErrors}
                    disabled={this.state.is_disabled}
                />
            </div>
        </FormGroup>
    )

    renderRecipientInput = () => {
        // `kepada_tujuan` adalah kolom teks pada surat masuk, sehingga simpan
        // nama pengguna. Opsi sumbernya tetap dari sys_user; ID dipertahankan
        // di `userOptions` untuk form distribusi/disposisi yang mengharuskan ID.
        const recipientOptions = this.state.userOptions.map(option => ({
            value: option.label,
            label: option.label,
        }))

        return (
            <FormGroup
                label="Penerima/Tujuan"
                required
                message_error={this.state.errors.kepada_tujuan}
                disabled={this.state.is_disabled}
                formCol
                noMb
            >
                <div className="mt-1">
                    <InputSelect
                        id="kepada_tujuan"
                        type="select"
                        placeholder="Pilih..."
                        value={this.state.datainsert.kepada_tujuan || ''}
                        data={recipientOptions}
                        onChange={(value) => {
                            // InputSelect isMulti returns array of option objects; convert to comma-separated string
                            const stringValue = Array.isArray(value)
                                ? value.map(v => v.value || v).join(', ')
                                : (value?.value || value || '')
                            this.handleChange('kepada_tujuan', stringValue)
                        }}
                        required
                        isClearable
                        isMulti
                        closeMenuOnSelect={false}
                    />
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        Pilih pengguna penerima surat (bisa lebih dari satu).
                    </div>
                </div>
            </FormGroup>
        )
    }

    renderSifatCheckbox = () => {
        const sifatOptions = this.state.masterData?.sifat || fallbackSuratMasukMasterData.sifat
        const currentSifat = this.state.datainsert.sifat || ''
        const selectedSifat = currentSifat.split(',').map(s => s.trim()).filter(Boolean)

        return (
            <FormGroup
                label="Sifat"
                required
                message_error={this.state.errors.sifat}
                disabled={this.state.is_disabled}
                formCol
                noMb
            >
                <div className="mt-1">
                    <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                        {sifatOptions.map(option => {
                            const isChecked = selectedSifat.includes(String(option.value))
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
                                        onChange={() => {
                                            const newSelected = isChecked
                                                ? selectedSifat.filter(s => s !== String(option.value))
                                                : [...selectedSifat, String(option.value)]
                                            const newValue = newSelected.join(', ')
                                            this.handleChange('sifat', newValue)
                                            this.setState({ selectedSifatMulti: newSelected })
                                        }}
                                        disabled={this.state.is_disabled}
                                        style={{ marginTop: 0 }}
                                    />
                                    {option.label}
                                </label>
                            )
                        })}
                    </div>
                </div>
            </FormGroup>
        )
    }

    render() {
        const masterData = this.state.masterData || fallbackSuratMasukMasterData

        if (this.state.path === 'detail') {
            return (
                <>
                    {this.state.showArchiveModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1040,
                        }} />
                    )}
                    {this.renderDetailMode()}
                </>
            )
        }

        return (
            <>
                <EofficeFormSection
                    title="AI OCR & Input Manual"
                    subtitle="Unggah lampiran lalu jalankan OCR. Jika OCR gagal, lanjut isi Data Surat secara manual di bawah."
                    icon="document_scanner"
                >
                    <div className="row g-3">
                        <div className="col-lg-7 col-md-12">
                        <FormGroup
                            label={"Lampiran Surat"}
                            message_error={this.state.errors.file_surat}
                            disabled={this.state.is_disabled}
                            formCol
                            noMb
                        >
                            <div className="mt-1">
                                <InputFile
                                    id="file_surat"
                                    value={this.state.datainsert.file_surat || ''}
                                    preview={typeof this.state.datainsert.file_surat == 'string' ? this.state.datainsert.file_surat : ''}
                                    ext={['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']}
                                    max={10240}
                                    onChange={(value) => this.handleChange("file_surat", value)}
                                    message_error={this.state.errors.file_surat}
                                    onError={this.handleErrors}
                                    disabled={this.state.is_disabled}
                                    className="d-block"
                                />
                            </div>
                        </FormGroup>
                        </div>
                    </div>

                    {this.isOcrFailed() ? (
                        <div className="alert alert-danger mt-3 mb-3">
                            AI OCR gagal membaca dokumen. Silakan input manual di form Data Surat.
                        </div>
                    ) : null}

                    <button
                        type="button"
                        className="btn-default-app bg-primary"
                        disabled={this.state.ocr_loading || !this.state.datainsert.file_surat}
                        onClick={this.handleExtractOcr}
                    >
                        <span className="material-icons icon-btn-left mr-1">
                            document_scanner
                        </span>
                        {this.state.ocr_loading ? 'Memproses AI OCR...' : 'Jalankan AI OCR'}
                    </button>

                    <div className="mt-2 text-muted" style={{ minHeight: 22, fontSize: 13 }}>
                        {this.state.ocr_loading ? 'Dokumen sedang diproses. Mohon tunggu sampai hasil OCR muncul.' : this.state.ocr_status || 'Belum ada proses OCR.'}
                    </div>
                </EofficeFormSection>

                <EofficeFormSection
                    title="Data Surat"
                    subtitle="Field ini bisa terisi otomatis dari OCR atau diisi manual jika OCR gagal."
                    icon="edit_document"
                >
                    <div className='row g-3'>
                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'nomor_agenda',
                                label: 'Nomor Agenda',
                                placeholder: this.state.nomor_agenda_loading
                                    ? 'Memuat nomor agenda...'
                                    : 'Bila kosong akan diisi otomatis oleh sistem',
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'nomor_surat',
                                label: 'Nomor Surat',
                                required: true
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'asal_surat',
                                label: 'Pengirim',
                                required: true
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'perihal',
                                label: 'Perihal',
                                required: true
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderRecipientInput()}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            <FormGroup label="Status" disabled formCol noMb>
                                <div className="mt-1">
                                    <div className="form-control bg-light d-flex align-items-center" style={{ minHeight: 38 }}>
                                        {this.getStatusLabel(this.state.datainsert.status)}
                                    </div>
                                </div>
                            </FormGroup>
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'tanggal_terima',
                                label: 'Tanggal Terima',
                                type: 'date'
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderSelect({
                                column: 'jenis',
                                label: 'Jenis',
                                data: masterData.jenis,
                                required: true
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderTextInput({
                                column: 'tanggal_surat',
                                label: 'Tanggal Surat',
                                type: 'date',
                                required: true
                            })}
                        </div>

                        <div className="col-lg-6 col-md-12">
                            {this.renderSifatCheckbox()}
                        </div>

                        <div className="col-12">
                            {this.renderTextInput({
                                column: 'isi_ringkasan',
                                label: 'Isi/Ringkasan',
                                type: 'textarea'
                            })}
                        </div>

                        <div className="col-12">
                            {this.renderTextInput({
                                column: 'catatan',
                                label: 'Catatan',
                                type: 'textarea'
                            })}
                        </div>
                    </div>
                </EofficeFormSection>

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
                                    {this.id ? 'Simpan Surat Masuk' : 'Tambah Surat Masuk'}
                                </>
                            )}
                        </button>
                    </div>
                ) : null}
            </>
        )
    }
}

export default Surat_masukedit
