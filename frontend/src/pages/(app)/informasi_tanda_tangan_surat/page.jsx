"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import HeaderApp from "components/HeaderApp"
import { EofficeCard } from "components/EofficeModuleUI"
import { api_services } from "hooks/api_services"
import { formatDateApp } from "pages/Utils"
import axios from "lib/axios"

const emptyData = {
    nomor_surat: '',
    tanggal_surat: '',
    tanggal_ttd: '',
    penandatangan: '',
    jabatan_penandatangan: '',
    nip_penandatangan: '',
    status: 'pending',
}

const StatusBadge = ({ status }) => {
    const styles = {
        'pending': { bg: '#fef3c7', color: '#92400e', icon: 'schedule', label: 'Menunggu' },
        'signed': { bg: '#d1fae5', color: '#065f46', icon: 'check_circle', label: 'Ditandatangani' },
        'cancelled': { bg: '#fee2e2', color: '#991b1b', icon: 'cancel', label: 'Dibatalkan' },
    }
    const style = styles[status] || styles.pending

    return (
        <span style={{
            background: style.bg,
            color: style.color,
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
        }}>
            <span className="material-icons" style={{ fontSize: 14 }}>{style.icon}</span>
            {style.label}
        </span>
    )
}

const InfoItem = ({ label, value, fullWidth = false }) => (
    <div style={{
        marginBottom: 16,
        gridColumn: fullWidth ? '1 / -1' : 'auto',
    }}>
        <div style={{
            fontSize: 11,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
        }}>
            {label}
        </div>
        <div style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#111827',
        }}>
            {value || '-'}
        </div>
    </div>
)

const InformasiTandaTanganSurat = () => {
    const params = useSearchParams()
    const [data, setData] = useState(emptyData)
    const [loading, setLoading] = useState(true)
    const [signatureUrl, setSignatureUrl] = useState(null)
    const [companyName, setCompanyName] = useState('')

    // Get from URL params or API
    const nomorSurat = params.get("nomor_surat") || ""
    const idSurat = params.get("id")

    useEffect(() => {
        loadData()
    }, [idSurat, nomorSurat])

    const loadData = async () => {
        if (!idSurat && !nomorSurat) {
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            if (idSurat) {
                // Fetch from API
                const service = api_services({ api_path: '/surat_keluar' })
                const response = await service.getapi_services({ id: idSurat })

                if (response?.data) {
                    const item = response.data
                    setData({
                        nomor_surat: item.nomor_surat || '',
                        tanggal_surat: item.tanggal_surat || item.tanggal || '',
                        tanggal_ttd: item.tanggal_ttd || item.tanggal_tanda_tangan || item.tanggal || '',
                        penandatangan: item.nama_penandatangan || '',
                        jabatan_penandatangan: item.jabatan_penandatangan || '',
                        nip_penandatangan: item.nip_penandatangan || '',
                        status: item.status_ttd || item.status_signature || 'pending',
                    })
                    setSignatureUrl(item.ttd_path || item.signature_path || null)
                    setCompanyName(item.company_name || item.nama_perusahaan || 'E-Office System')
                }
            } else {
                // Use URL params
                setData({
                    nomor_surat: nomorSurat,
                    tanggal_surat: params.get("tanggal_surat") || '',
                    tanggal_ttd: params.get("tanggal_ttd") || '',
                    penandatangan: params.get("penandatangan") || '',
                    jabatan_penandatangan: params.get("jabatan") || params.get("jabatan_penandatangan") || '',
                    nip_penandatangan: params.get("nip") || params.get("nip_penandatangan") || '',
                    status: params.get("status") || 'pending',
                })
                setSignatureUrl(params.get("ttd_path") || null)
            }
        } catch (error) {
            console.error('Failed to load data:', error)
        }

        setLoading(false)
    }

    const hasData = data.nomor_surat || data.penandatangan

    return (
        <div className="informasi-ttd-container" style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
            <HeaderApp
                title="Informasi Tanda Tangan Surat"
                is_loading={loading}
                data_btn={[]}
            />

            <div style={{ marginTop: 20 }}>
                {/* Header Card */}
                <EofficeCard className="p-4 mb-3">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        paddingBottom: 16,
                        borderBottom: '2px solid #e5e7eb',
                    }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            background: '#138a98',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span className="material-icons" style={{ color: 'white', fontSize: 32 }}>description</span>
                        </div>
                        <div>
                            <h2 style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#111827',
                                margin: 0,
                            }}>
                                INFORMASI TANDA TANGAN SURAT
                            </h2>
                            <p style={{
                                fontSize: 13,
                                color: '#6b7280',
                                margin: '4px 0 0 0',
                            }}>
                                {companyName}
                            </p>
                        </div>
                    </div>
                </EofficeCard>

                {/* Main Content */}
                {loading ? (
                    <EofficeCard className="p-5 text-center">
                        <span className="spinner-border text-info" role="status"></span>
                        <div className="mt-2 text-muted">Memuat data...</div>
                    </EofficeCard>
                ) : hasData ? (
                    <EofficeCard className="p-4">
                        {/* Status and Basic Info */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 12,
                                marginBottom: 20,
                            }}>
                                <h3 style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: '#111827',
                                    margin: 0,
                                }}>
                                    Detail Surat
                                </h3>
                                <StatusBadge status={data.status} />
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16,
                            }}>
                                <InfoItem label="Nomor Surat" value={data.nomor_surat} />
                                <InfoItem label="Tanggal Surat" value={formatDateApp(data.tanggal_surat) || data.tanggal_surat} />
                                <InfoItem label="Tanggal Penandatanganan" value={formatDateApp(data.tanggal_ttd) || data.tanggal_ttd} />
                            </div>
                        </div>

                        <div style={{
                            height: 1,
                            background: '#e5e7eb',
                            margin: '20px 0',
                        }} />

                        {/* Signer Info */}
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#111827',
                                margin: '0 0 16px 0',
                            }}>
                                Informasi Penandatangan
                            </h3>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16,
                            }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: 4,
                                    }}>
                                        Nama Penandatangan
                                    </div>
                                    <div style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: '#138a98',
                                    }}>
                                        {data.penandatangan || '-'}
                                    </div>
                                </div>
                                <InfoItem label="Jabatan" value={data.jabatan_penandatangan} />
                                <InfoItem label="NIP/NIDN" value={data.nip_penandatangan} />
                            </div>
                        </div>

                        {/* Signature Preview */}
                        <div style={{
                            marginTop: 24,
                            paddingTop: 24,
                            borderTop: '1px dashed #d1d5db',
                        }}>
                            <h3 style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#111827',
                                margin: '0 0 16px 0',
                            }}>
                                Tanda Tangan
                            </h3>

                            <div style={{
                                border: '2px dashed #d1d5db',
                                borderRadius: 8,
                                padding: 32,
                                textAlign: 'center',
                                minHeight: 150,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f9fafb',
                            }}>
                                {signatureUrl || data.status === 'signed' ? (
                                    <img
                                        src={signatureUrl}
                                        alt="Tanda Tangan"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: 120,
                                            objectFit: 'contain',
                                        }}
                                    />
                                ) : (
                                    <div style={{ color: '#9ca3af' }}>
                                        <span className="material-icons" style={{ fontSize: 48 }}>
                                            draw
                                        </span>
                                        <div style={{
                                            fontSize: 14,
                                            marginTop: 8,
                                        }}>
                                            Tanda tangan belum tersedia
                                        </div>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#6b7280',
                                            marginTop: 4,
                                        }}>
                                            {data.status === 'pending' ? 'Menunggu penandatanganan' : 'Status: ' + data.status}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </EofficeCard>
                ) : (
                    <EofficeCard className="p-5 text-center">
                        <div style={{ color: '#9ca3af' }}>
                            <span className="material-icons" style={{ fontSize: 64 }}>
                                description
                            </span>
                            <h3 style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: '#374151',
                                margin: '16px 0 8px 0',
                            }}>
                                Tidak Ada Data
                            </h3>
                            <p style={{
                                fontSize: 14,
                                color: '#6b7280',
                                margin: '0 0 16px 0',
                            }}>
                                Halaman ini memerlukan parameter nomor surat atau ID surat.
                            </p>
                            <div style={{
                                fontSize: 12,
                                color: '#9ca3af',
                                background: '#f3f4f6',
                                padding: '8px 16px',
                                borderRadius: 4,
                                display: 'inline-block',
                                fontFamily: 'monospace',
                            }}>
                                Contoh: /informasi_tanda_tangan_surat?id=123<br/>
                                atau: /informasi_tanda_tangan_surat?nomor_surat=123/UMP/2024
                            </div>
                        </div>
                    </EofficeCard>
                )}

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: 24,
                    padding: '16px 0',
                    color: '#6b7280',
                    fontSize: 12,
                }}>
                    <p style={{ margin: 0 }}>
                        Dokumen ini dicetak secara elektronik dan sah tanpa tanda tangan basah.
                    </p>
                    <p style={{ margin: '8px 0 0 0' }}>
                        Dicetak pada: {new Date().toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default InformasiTandaTanganSurat
