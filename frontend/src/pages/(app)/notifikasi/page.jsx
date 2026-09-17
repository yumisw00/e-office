"use client"

import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import HeaderApp from "components/HeaderApp";
import Button from "components/Button";
import EditDelete from "components/EditDelete";
import {
    EofficeCard,
    EofficeEmptyState,
    EofficeStatusBadge,
    EofficeTableCell,
    EofficeTableWithFilter,
} from "components/EofficeModuleUI";
import { api_services } from "hooks/api_services";
import { formatDateApp, showToastr } from "pages/Utils";
import { canUseEofficeAction } from "lib/eofficeAccess";

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    if (Array.isArray(response?.result)) return response.result
    if (Array.isArray(response)) return response
    return []
}

const emptyForm = {
    title: "",
    message: "",
    id_unit_tujuan: "",
    id_user: "",
    type: "info",
}

const Notifikasi = () => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [unitOptions, setUnitOptions] = useState([])
    const [userOptions, setUserOptions] = useState([])
    const [filters, setFilters] = useState({})
    const canCreate = canUseEofficeAction('notifikasi', 'add')

    const service = useMemo(() => api_services({ api_path: "/eoffice/notifications" }), [])

    const loadData = async () => {
        setIsLoading(true)
        const response = await service.getapi_services({})
        setIsLoading(false)

        if (response?.error || response?.code) {
            setList([])
            return
        }

        setList(normalizeList(response))
    }

    const loadRecipients = async () => {
        const response = await service.getapi_services({
            api_path: "/eoffice/notification-recipients",
        })

        if (response?.error || response?.code) return

        setUnitOptions(response?.units || response?.data?.units || [])
        setUserOptions(response?.users || response?.data?.users || [])
    }

    useEffect(() => {
        loadData()
        loadRecipients()
    }, [])

    const filteredUserOptions = userOptions.filter(user => {
        if (!form.id_unit_tujuan) return true
        return String(user.id_unit || '') === String(form.id_unit_tujuan)
    })

    const filteredList = list.filter(item => {
        const isRead = item?.is_read === true || item?.is_read === 1 || item?.read_at
        const values = {
            title: item?.title || item?.judul || '',
            message: item?.message || item?.pesan || item?.body || '',
            created_at: item?.created_at ? formatDateApp(item.created_at, "YYYY-MM-DD HH:mm") : '',
            status: isRead ? 'read' : 'pending',
        }

        return Object.entries(filters).every(([key, filterValue]) => {
            if (!filterValue) return true
            return String(values[key] || '').toLowerCase().includes(String(filterValue).toLowerCase())
        })
    })

    const tableHeaders = [
        { name: 'title', label: 'Judul', width: 210, align: 'center', filterType: 'text' },
        { name: 'message', label: 'Pesan', width: 360, align: 'center', filterType: 'text' },
        { name: 'created_at', label: 'Tanggal', width: 170, align: 'center', filterType: 'text' },
        {
            name: 'status',
            label: 'Status',
            width: 150,
            align: 'center',
            filterType: 'select',
            filterOptions: [
                { value: 'pending', label: 'Belum Dibaca' },
                { value: 'read', label: 'Dibaca' },
            ],
        },
        { name: 'aksi', label: 'Aksi', width: 60, align: 'center', filterType: 'none' },
    ]

    const getRecipientIds = () => {
        if (form.id_user) return [Number(form.id_user)]
        if (form.id_unit_tujuan) {
            return filteredUserOptions
                .map(user => Number(user.value))
                .filter(Boolean)
        }

        return []
    }

    const markRead = async item => {
        const id = item?.id_notification || item?.id
        if (!id) return
        const response = await service.postapi_services({
            api_path: `/eoffice/notifications/${id}/read`,
            disabledAlert: true,
        })
        if (response?.error || response?.code) return
        loadData()
    }

    const saveData = async event => {
        event?.preventDefault()
        const idUsers = getRecipientIds()

        if (!idUsers.length) {
            showToastr('error', 'Pilih unit tujuan atau penerima pegawai terlebih dahulu.')
            return
        }

        const response = await service.postapi_services({
            title: form.title,
            message: form.message,
            id_users: idUsers,
            payload: {
                id_unit_tujuan: form.id_unit_tujuan || null,
            },
        })
        if (response?.error || response?.code) return
        setShowModal(false)
        setForm(emptyForm)
        loadData()
    }

    return (
        <>
            <HeaderApp
                title="Notifikasi"
                hideTitle
                is_loading={isLoading}
                data_btn={[]}
                btnCustom={
                    canCreate ? (
                        <div className="notifikasi-create-wrap">
                            <Button
                                className="ml-2 btn-default-app btn-info notifikasi-create-btn"
                                onClick={() => setShowModal(true)}
                            >
                                <span className="material-icons mr-1" style={{ fontSize: 16 }}>notifications</span>
                                Buat Notifikasi
                            </Button>
                        </div>
                    ) : null
                }
            />

            <div className="container pl-4 pr-4">
                <EofficeCard className="p-3 mb-3">
                    {list.length ? (
                        <EofficeTableWithFilter
                            className="notifikasi-table"
                            headers={tableHeaders}
                            colgroup={[210, 360, 170, 150, 60]}
                            filterValues={filters}
                            onFilterChange={(name, value) => setFilters(current => ({ ...current, [name]: value }))}
                            minWidth={950}
                        >
                            {filteredList.map((item, index) => {
                                const isRead = item?.is_read === true || item?.is_read === 1 || item?.read_at
                                return (
                                    <tr key={item?.id_notification || item?.id || index}>
                                        <EofficeTableCell width={210} align="start" wrap className="font-semibold">
                                            {item?.title || item?.judul || "-"}
                                        </EofficeTableCell>
                                        <EofficeTableCell width={360} align="start" wrap>
                                            {item?.message || item?.pesan || item?.body || "-"}
                                        </EofficeTableCell>
                                        <EofficeTableCell width={170}>
                                            {item?.created_at ? formatDateApp(item.created_at, "YYYY-MM-DD HH:mm") : "-"}
                                        </EofficeTableCell>
                                        <EofficeTableCell width={150}>
                                            <EofficeStatusBadge value={isRead ? "read" : "pending"} label={isRead ? "Dibaca" : "Belum Dibaca"} />
                                        </EofficeTableCell>
                                        <EofficeTableCell width={60}>
                                            {!isRead ? (
                                                <EditDelete
                                                    data={[{
                                                        label: 'Tandai Dibaca',
                                                        icon: 'done_all',
                                                        onClick: () => markRead(item),
                                                    }]}
                                                />
                                            ) : null}
                                        </EofficeTableCell>
                                    </tr>
                                )
                            })}
                            {!filteredList.length ? (
                                <tr>
                                    <td className="text-center text-muted" colSpan={5} style={{ padding: 28 }}>
                                        Tidak ada notifikasi yang sesuai filter.
                                    </td>
                                </tr>
                            ) : null}
                        </EofficeTableWithFilter>
                    ) : (
                        <EofficeEmptyState
                            icon="notifications_none"
                            title="Belum ada notifikasi"
                            description="Notifikasi yang tersedia akan muncul di sini."
                        />
                    )}
                </EofficeCard>
            </div>

            <Modal show={canCreate && showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Buat Notifikasi</Modal.Title>
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body>
                        <div className="form-group">
                            <label>Judul</label>
                            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Pesan</label>
                            <textarea className="form-control" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                        </div>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label>Unit Tujuan</label>
                                <select
                                    className="form-control"
                                    value={form.id_unit_tujuan}
                                    onChange={e => setForm({ ...form, id_unit_tujuan: e.target.value, id_user: "" })}
                                >
                                    <option value="">Pilih unit tujuan</option>
                                    {unitOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label>Penerima Pegawai</label>
                                <select
                                    className="form-control"
                                    value={form.id_user}
                                    onChange={e => setForm({ ...form, id_user: e.target.value })}
                                >
                                    <option value="">{form.id_unit_tujuan ? 'Semua pegawai di unit' : 'Pilih pegawai penerima'}</option>
                                    {filteredUserOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            {form.id_unit_tujuan && !form.id_user ? (
                                <div className="col-12 text-muted" style={{ fontSize: 12 }}>
                                    Notifikasi akan dikirim ke {filteredUserOptions.length} pegawai di unit yang dipilih.
                                </div>
                            ) : null}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-default-app btn-light" type="button" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button className="btn-default-app btn-info" type="submit">Kirim</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    )
}

export default Notifikasi
