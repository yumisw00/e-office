"use client"

import { useEffect, useRef, useState } from "react"
import Button from "components/Button"
import BtnIconAct from "components/BtnIconAct"
import axios from "lib/axios"
import { formatDateApp, initAccessMethod, showToastr } from "pages/Utils"

const getBackupList = payload => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.data)) return payload.data.data
    if (Array.isArray(payload?.backups)) return payload.backups
    return []
}

const getFilename = item => (
    item?.filename ||
    item?.file_name ||
    item?.name ||
    item?.path?.split(/[\\/]/).pop() ||
    ""
)

const formatFileSize = size => {
    const numberSize = Number(size || 0)
    if (!numberSize) return "-"

    const units = ["B", "KB", "MB", "GB"]
    let value = numberSize
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
        value = value / 1024
        unitIndex += 1
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const BackupDatabase = () => {
    const [accessMethod, setAccessMethod] = useState({})
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const isGeneratingRef = useRef(false)

    useEffect(() => {
        init()
    }, [])

    const init = async () => {
        const { access_method } = await initAccessMethod("backup_database")
        setAccessMethod(access_method)
        loadBackups()
    }

    const loadBackups = async () => {
        setIsLoading(true)

        try {
            const response = await axios.get("/api/backup_database")
            setList(getBackupList(response.data))
        } catch (error) {
            showToastr("error", error?.response?.data?.message || "Gagal memuat daftar backup database.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateBackup = async () => {
        if (isGeneratingRef.current) return

        isGeneratingRef.current = true
        setIsGenerating(true)

        try {
            const response = await axios.post("/api/backup_database")
            showToastr("success", response?.data?.message || "Backup database berhasil dibuat.")
            loadBackups()
        } catch (error) {
            showToastr("error", error?.response?.data?.message || "Gagal membuat backup database.")
        } finally {
            isGeneratingRef.current = false
            setIsGenerating(false)
        }
    }

    const handleDownload = async item => {
        const filename = getFilename(item)
        if (!filename) {
            showToastr("error", "Nama file backup tidak ditemukan.")
            return
        }

        try {
            const response = await axios.get(`/api/backup_database/download/${encodeURIComponent(filename)}`, {
                responseType: "blob",
            })
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            showToastr("error", error?.response?.data?.message || "Gagal download backup database.")
        }
    }

    const handleRename = async item => {
        const filename = getFilename(item)
        const newFilename = window.prompt("Masukkan nama file backup baru:", filename)?.trim()

        if (!newFilename || newFilename === filename) return

        try {
            const response = await axios.patch(`/api/backup_database/${encodeURIComponent(filename)}`, {
                filename: newFilename,
            })
            showToastr("success", response?.data?.message || "Nama file backup berhasil diubah.")
            loadBackups()
        } catch (error) {
            showToastr("error", error?.response?.data?.message || "Nama file backup gagal diubah.")
        }
    }

    const handleDelete = async item => {
        const filename = getFilename(item)
        if (!filename || !window.confirm(`Hapus file backup ${filename}?`)) return

        try {
            const response = await axios.delete(`/api/backup_database/${encodeURIComponent(filename)}`)
            showToastr("success", response?.data?.message || "File backup berhasil dihapus.")
            loadBackups()
        } catch (error) {
            showToastr("error", error?.response?.data?.message || "File backup gagal dihapus.")
        }
    }

    return (
        <>
            <div className="container pl-4 pr-4">
                <div className="d-flex justify-content-end mb-3">
                    <Button
                        type="button"
                        className="btn-default-app"
                        disabled={isGenerating}
                        onClick={handleGenerateBackup}
                    >
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>
                            backup
                        </span>
                        {isGenerating ? "Membuat Backup..." : "Generate Backup"}
                    </Button>
                </div>
                <div className="table-responsive">
                    <table className="w-full table table-auto border-collapse border">
                        <thead>
                            <tr>
                                <th className="border text-center" style={{ width: 60 }}>No</th>
                                <th className="border">Nama File</th>
                                <th className="border" style={{ width: 140 }}>Ukuran</th>
                                <th className="border" style={{ width: 190 }}>Tanggal Backup</th>
                                <th className="border text-center" style={{ width: 140 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr>
                                    <td className="border text-center" colSpan={5}>
                                        {isLoading ? "Memuat data..." : "Belum ada backup database."}
                                    </td>
                                </tr>
                            ) : (
                                list.map((item, index) => {
                                    const filename = getFilename(item)
                                    const createdAt = item?.created_at || item?.tanggal || item?.date

                                    return (
                                        <tr key={filename || index}>
                                            <td className="border text-center">{index + 1}</td>
                                            <td className="border">{filename || "-"}</td>
                                            <td className="border">{formatFileSize(item?.size)}</td>
                                            <td className="border">
                                                {createdAt ? formatDateApp(createdAt, "YYYY-MM-DD HH:mm") : "-"}
                                            </td>
                                            <td className="border align-middle" style={{ padding: "8px 6px" }}>
                                                <div className="d-flex align-items-center justify-content-center td-action" style={{ gap: 2 }}>
                                                    <BtnIconAct
                                                        className="btn-warning"
                                                        icon="edit"
                                                        tooltips="Ganti nama"
                                                        onTap={() => handleRename(item)}
                                                    />
                                                    <BtnIconAct
                                                        className="btn-info"
                                                        icon="download"
                                                        tooltips="Download"
                                                        onTap={() => handleDownload(item)}
                                                    />
                                                    <BtnIconAct
                                                        className="btn-danger"
                                                        icon="delete"
                                                        tooltips="Hapus"
                                                        onTap={() => handleDelete(item)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default BackupDatabase
