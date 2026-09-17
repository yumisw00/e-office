"use client"

import { useEffect, useState } from "react"
import axios from "lib/axios"

const JenisSuratTabs = ({ value = "semua", onChange }) => {
    const [options, setOptions] = useState([])

    useEffect(() => {
        let active = true
        // Use the shared letter master-data endpoint so non-admin roles can see
        // the same active Jenis Surat options as administrators.
        axios.get('/api/surat_masuk/master-data', { withCredentials: true })
            .then(response => {
                const payload = response?.data
                const source = Array.isArray(payload?.data?.jenis) ? payload.data.jenis : payload?.data
                const list = Array.isArray(source) ? source : (Array.isArray(payload) ? payload : [])
                if (active) setOptions(list)
            })
            .catch(() => axios.get('/api/surat_masuk/master_data', { withCredentials: true })
                .then(response => {
                    const payload = response?.data
                    const source = Array.isArray(payload?.data?.jenis) ? payload.data.jenis : payload?.data
                    if (active) setOptions(Array.isArray(source) ? source : [])
                })
                .catch(() => { if (active) setOptions([]) }))
        return () => { active = false }
    }, [])

    return (
        <div className="jenis-surat-tabs" aria-label="Filter jenis surat">
            <span className="jenis-surat-tabs-label">Jenis Surat</span>
            <div className="jenis-surat-tabs-list">
                <button type="button" className={value === 'semua' ? 'active' : ''} onClick={() => onChange?.('semua')}>Semua</button>
                {options.map(option => (
                    <button key={option.id_jenis_surat || option.value} type="button" className={value === option.value ? 'active' : ''} onClick={() => onChange?.(option.value)}>
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default JenisSuratTabs
