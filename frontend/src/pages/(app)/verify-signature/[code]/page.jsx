"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'lib/axios'
import { formatDateApp } from 'pages/Utils'

const capitalizeFirst = str => {
    if (!str) return ''
    return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

export default function VerifySignaturePage() {
    const params = useParams()
    const router = useRouter()
    const code = params?.code

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!code) return

        const fetchVerification = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await axios.get(`/api/digital-signature/verify/${code}`)
                setData(response.data?.data || null)
            } catch (err) {
                setError(err?.response?.data?.message || 'Verifikasi gagal. QR Code tidak valid atau sudah kedaluwarsa.')
                setData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchVerification()
    }, [code])

    const renderStatusBadge = (valid) => {
        if (valid) {
            return (
                <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <span className="material-icons mr-1" style={{ fontSize: 16 }}>verified</span>
                    Tanda Tangan Valid
                </span>
            )
        }
        return (
            <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-semibold text-amber-700">
                <span className="material-icons mr-1" style={{ fontSize: 16 }}>warning</span>
                Integritas File Tidak Valid
            </span>
        )
    }

    const renderQrCode = () => {
        // Prefer base64 SVG (no auth needed), fallback to URL
        const src = data?.signature?.qr_code_svg_base64 || data?.signature?.qr_code_url
        if (!src) return null
        return (
            <div className="text-center mb-4">
                <img
                    src={src}
                    alt="QR Code"
                    style={{ maxWidth: 180, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-border text-info mb-3" role="status">
                        <span className="sr-only">Memuat...</span>
                    </div>
                    <p className="text-gray-500">Memverifikasi tanda tangan digital...</p>
                </div>
            </div>
        )
    }

    if (error || !data?.found) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white border border-red-200 rounded-lg shadow-sm p-6 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-red-500" style={{ fontSize: 36 }}>cancel</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Verifikasi Gagal</h1>
                    <p className="text-gray-500 mb-4">
                        {error || 'QR Code tidak ditemukan atau tidak valid.'}
                    </p>
                    <div className="bg-red-50 border border-red-100 rounded p-3">
                        <p className="text-xs text-red-600">
                            Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const { signature, surat, signer } = data
    const signedAt = signature?.signed_at ? new Date(signature.signed_at) : null
    const formattedDate = signedAt ? formatDateApp(signature.signed_at, 'YYYY-MM-DD') : '-'
    const formattedTime = signedAt ? signedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'
    const statusLabel = capitalizeFirst(surat?.status || 'unknown')

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                            <span className="material-icons text-teal-600" style={{ fontSize: 28 }}>verified_user</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Verifikasi Tanda Tangan Digital</h1>
                            <p className="text-gray-500" style={{ fontSize: 13 }}>E-Office Document Verification System</p>
                        </div>
                    </div>
                </div>

                {/* QR Code Display */}
                {renderQrCode()}

                {/* Validation Badge */}
                <div className="text-center mb-4">
                    {renderStatusBadge(signature?.integrity_valid)}
                </div>

                {/* Document Information */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold text-gray-900">Informasi Surat</h2>
                    </div>
                    <div className="p-4">
                        <table className="w-full" style={{ fontSize: 14 }}>
                            <tbody>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4" style={{ width: '40%' }}>Nomor Surat</td>
                                    <td className="font-semibold text-gray-900 py-2">{surat?.nomor_surat || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Perihal</td>
                                    <td className="font-semibold text-gray-900 py-2">{surat?.perihal || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Jenis Surat</td>
                                    <td className="text-gray-900 py-2">{surat?.jenis ? capitalizeFirst(surat.jenis) : '-'}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Status</td>
                                    <td className="py-2">
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700">
                                            {statusLabel}
                                        </span>
                                    </td>
                                </tr>
                                {surat?.file_url && (
                                    <tr>
                                        <td className="text-gray-500 py-2 pr-4">Dokumen</td>
                                        <td className="py-2">
                                            <a
                                                href={surat.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                                style={{ fontSize: 13 }}
                                            >
                                                <span className="material-icons" style={{ fontSize: 14 }}>picture_as_pdf</span>
                                                Lihat Dokumen
                                            </a>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Signer Information */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold text-gray-900">Informasi Penandatangan</h2>
                    </div>
                    <div className="p-4">
                        <table className="w-full" style={{ fontSize: 14 }}>
                            <tbody>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4" style={{ width: '40%' }}>Nama Penyetuju</td>
                                    <td className="font-semibold text-gray-900 py-2">{signer?.name || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Jabatan Penyetuju</td>
                                    <td className="text-gray-900 py-2">{signer?.jabatan || signer?.email || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Tanggal Persetujuan</td>
                                    <td className="text-gray-900 py-2">{formattedDate}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Jam Persetujuan</td>
                                    <td className="text-gray-900 py-2">{formattedTime}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 py-2 pr-4">Serial Sertifikat</td>
                                    <td className="text-gray-900 py-2 font-mono" style={{ fontSize: 12 }}>{signature?.certificate_serial || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-gray-400" style={{ fontSize: 12 }}>
                        Dokumen ini telah diverifikasi pada {new Date().toLocaleString('id-ID')}
                    </p>
                    <p className="text-gray-400" style={{ fontSize: 11 }}>
                        E-Office Document Verification System
                    </p>
                </div>
            </div>
        </div>
    )
}
