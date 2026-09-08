"use client"

import { useEffect, useMemo, useState } from "react";
import HeaderApp from "components/HeaderApp";
import Button from "components/Button";
import EofficeStatusBadge from "components/EofficeStatusBadge";
import EofficeTimelineModal from "components/EofficeTimelineModal";
import { api_services } from "hooks/api_services";
import { formatDateApp } from "pages/Utils";

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const getIncomingId = item => item?.id_surat_masuk || item?.id
const getOutgoingId = item => item?.id_surat_keluar || item?.id

const TrackingSurat = () => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [selected, setSelected] = useState(null)
    const [timelinePath, setTimelinePath] = useState("")
    const [showTimeline, setShowTimeline] = useState(false)
    const [filterType, setFilterType] = useState("semua")

    const incomingService = useMemo(() => api_services({ api_path: "/surat_masuk" }), [])
    const outgoingService = useMemo(() => api_services({ api_path: "/surat_keluar" }), [])

    const loadData = async () => {
        setIsLoading(true)
        const [incomingResponse, outgoingResponse] = await Promise.all([
            incomingService.getapi_services({ filter: { paginate: { page: 1, pagesize: 500 } } }),
            outgoingService.getapi_services({ filter: { paginate: { page: 1, pagesize: 500 } } }),
        ])
        setIsLoading(false)

        const incoming = normalizeList(incomingResponse).map(item => ({
            ...item,
            jenis_tracking: "surat_masuk",
            tracking_id: getIncomingId(item),
            nomor: item?.nomor_surat || item?.nomor_agenda,
            tanggal: item?.tanggal_surat,
        }))
        const outgoing = normalizeList(outgoingResponse).map(item => ({
            ...item,
            jenis_tracking: "surat_keluar",
            tracking_id: getOutgoingId(item),
            nomor: item?.nomor_surat || item?.kode_draft,
            tanggal: item?.tanggal_surat,
        }))

        setList([...incoming, ...outgoing])
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredList = filterType === "semua" ? list : list.filter(item => item.jenis_tracking === filterType)

    const openTimeline = item => {
        setSelected(item)
        setTimelinePath(item.jenis_tracking === "surat_keluar"
            ? `/surat_keluar/${item.tracking_id}/timeline`
            : `/surat_masuk/${item.tracking_id}/timeline`
        )
        setShowTimeline(true)
    }

    return (
        <>
            <HeaderApp
                title="Tracking Surat"
                is_loading={isLoading}
                data_btn={[]}
                btnCustom={
                    <div className="d-flex align-items-center" style={{ gap: 8 }}>
                        <select className="form-control" style={{ width: 190 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="semua">Semua Surat</option>
                            <option value="surat_masuk">Surat Masuk</option>
                            <option value="surat_keluar">Surat Keluar</option>
                        </select>
                        <Button className="btn-default-app btn-secondary" onClick={loadData}>
                            <span className="material-icons mr-1" style={{ fontSize: 16 }}>refresh</span>
                            Refresh
                        </Button>
                    </div>
                }
            />

            <div className="container pl-4 pr-4">
                <div className="table-responsive">
                    <table className="w-full table border-collapse border" style={{ tableLayout: "fixed", minWidth: 1050 }}>
                        <thead>
                            <tr>
                                {["No", "Jenis", "Nomor Surat", "Perihal", "Tanggal", "Status", ""].map((label, index) => (
                                    <th key={label || index} className="border" style={{ backgroundColor: "#138a98", color: "#fff", textAlign: "center", padding: "10px 8px", width: index === 0 ? 44 : index === 6 ? 130 : "auto" }}>{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.map((item, index) => (
                                <tr key={`${item.jenis_tracking}-${item.tracking_id || index}`}>
                                    <td className="border text-center">{index + 1}</td>
                                    <td className="border">{item.jenis_tracking === "surat_keluar" ? "Surat Keluar" : "Surat Masuk"}</td>
                                    <td className="border color-link" style={{ overflowWrap: "anywhere" }}>{item.nomor || "-"}</td>
                                    <td className="border" style={{ overflowWrap: "anywhere" }}>{item?.perihal || "-"}</td>
                                    <td className="border">{item.tanggal ? formatDateApp(item.tanggal, "YYYY-MM-DD") : "-"}</td>
                                    <td className="border text-center"><EofficeStatusBadge value={item?.status || "pending"} /></td>
                                    <td className="border text-center">
                                        <Button className="btn-default-app btn-info" onClick={() => openTimeline(item)}>
                                            Timeline
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {!filteredList.length ? <tr><td className="border text-center text-muted" colSpan={7} style={{ padding: 28 }}>Belum ada data tracking.</td></tr> : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <EofficeTimelineModal
                show={showTimeline}
                onHide={() => setShowTimeline(false)}
                suratId={selected?.tracking_id}
                surat={selected}
                timelinePath={timelinePath}
            />
        </>
    )
}

export default TrackingSurat
