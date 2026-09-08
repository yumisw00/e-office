"use client"

import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import HeaderApp from "components/HeaderApp";
import Button from "components/Button";
import EofficeStatusBadge from "components/EofficeStatusBadge";
import { api_services } from "hooks/api_services";
import axios from "lib/axios";
import { formatDateApp, showToastr } from "pages/Utils";
import { canUseEofficeAction, getStoredUserLogin } from "lib/eofficeAccess";

const ACTIVE_STATUSES = ['waiting', 'pending', 'review'];

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response)) return response;
    return [];
};

const getId = item => item?.id_surat_approval || item?.id || item?.value;

const getCurrentUserId = () => {
    const stored = getStoredUserLogin() || {};
    return stored?.id_user || stored?.user?.id_user || stored?.user?.id || null;
};

const getCurrentUserName = () => {
    const stored = getStoredUserLogin() || {};
    return stored?.name || stored?.user?.name || stored?.user?.nama || 'Unknown User';
};

// Generate a simple barcode-like QR data string
const generateApprovalQRData = (item, approverName) => {
    const now = new Date()
    const iso = now.toISOString()
    const dateStr = formatDateApp(iso) || iso
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const data = {
        jenis: item?.jenis_surat || item?.jenis || item?.nomor_surat || '-',
        no_surat: item?.nomor_surat || item?.no_surat || '-',
        perihal: item?.perihal || item?.subject || '-',
        pengirim: item?.pengirim || item?.dari || '-',
        approver: approverName,
        tanggal: dateStr,
        waktu: timeStr,
        status: 'Disetujui',
        id: getId(item),
    }

    return JSON.stringify(data)
}

// Simple QR code using Google QR Server API
const SimpleQRCode = ({ data, size = 200 }) => {
    // For simplicity, we'll use Google QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&margin=10`

    return (
        <div className="text-center">
            <img
                src={qrUrl}
                alt="QR Code Approval"
                width={size}
                height={size}
                style={{ border: '8px solid white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                onError={(e) => {
                    e.target.style.display = 'none'
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'
                }}
            />
            <div style={{ display: 'none' }} className="text-muted mt-2">
                QR Code tidak dapat ditampilkan.
                <br />
                <code style={{ fontSize: 11 }}>{data}</code>
            </div>
        </div>
    )
}

const SuratApproval = () => {
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rejectingItem, setRejectingItem] = useState(null);
    const [rejectionNote, setRejectionNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [barcodeModal, setBarcodeModal] = useState({ show: false, item: null, qrData: '' });

    const service = useMemo(() => api_services({ api_path: '/surat_approval' }), []);

    const loadData = async () => {
        setIsLoading(true);
        const response = await service.getapi_services({
            filter: { paginate: { page: 1, pagesize: 1000 } },
        });
        setIsLoading(false);

        if (response?.error || response?.code) {
            setList([]);
            return;
        }

        const all = normalizeList(response);
        // The API already scopes rows to the authenticated approver. Keeping
        // only the active workflow states here avoids stale localStorage user
        // data hiding a valid approval queue.
        const mine = all.filter(item => ACTIVE_STATUSES.includes(String(item?.status || '').toLowerCase()));

        setList(mine);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async item => {
        const idSurat = item?.id_surat_keluar;
        if (!idSurat) {
            showToastr('error', 'Surat keluar tidak ditemukan pada data approval.');
            return;
        }

        setProcessing(true);
        try {
            const response = await axios.post(`/api/surat_keluar/${idSurat}/approve`, {
                id_surat_approval: getId(item),
            });
            const data = response?.data;
            if (data?.success === false) {
                showToastr('error', data?.message || 'Gagal menyetujui surat.');
                setProcessing(false);
                return;
            }
            showToastr('success', data?.message || 'Surat keluar berhasil disetujui.');

            // Generate barcode/QR data after approval
            const approverName = getCurrentUserName()
            const qrData = generateApprovalQRData(item, approverName)
            setBarcodeModal({ show: true, item, qrData, approverName })

            loadData();
        } catch (error) {
            const message = error?.response?.data?.message || 'Gagal menyetujui surat.';
            showToastr('error', message);
        } finally {
            setProcessing(false);
        }
    };

    const openReject = item => {
        setRejectingItem(item);
        setRejectionNote('');
    };

    const closeReject = () => {
        setRejectingItem(null);
        setRejectionNote('');
    };

    const handleReject = async () => {
        if (!rejectingItem) return;
        if (!rejectionNote.trim()) {
            showToastr('error', 'Catatan revisi wajib diisi.');
            return;
        }

        const idSurat = rejectingItem?.id_surat_keluar;
        if (!idSurat) {
            showToastr('error', 'Surat keluar tidak ditemukan pada data approval.');
            return;
        }

        setProcessing(true);
        const submitService = api_services({ api_path: '/surat_keluar' });
        const response = await submitService.postapi_services({
            id: idSurat,
            api_path: `/surat_keluar/${idSurat}/reject`,
            id_surat_approval: getId(rejectingItem),
            catatan_revisi: rejectionNote.trim(),
            disabledAlert: true,
        });
        setProcessing(false);

        if (response?.error || response?.code || response?.success === false) {
            const message = response?.data?.message || response?.message || 'Gagal menolak surat.';
            showToastr('error', message);
            return;
        }

        showToastr('success', response?.data?.message || 'Surat keluar ditolak.');
        closeReject();
        loadData();
    };

    const canApprove = canUseEofficeAction('surat_approval', 'approve');
    const canReject = canUseEofficeAction('surat_approval', 'reject');

    return (
        <>
            <HeaderApp
                title=""
                is_loading={isLoading}
                data_btn={[]}
                btnCustom={
                    <div style={{ marginTop: 16, marginBottom: 0 }}><Button className="ml-2 btn-default-app btn-info" onClick={loadData}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>refresh</span>
                        Refresh
                    </Button></div>
                }
            />

            <div className="container pl-4 pr-4">
                <div className="table-responsive">
                    <table className="w-full table border-collapse border" style={{ minWidth: 980 }}>
                        <thead>
                            <tr>
                                {['No', 'Nomor Surat', 'Perihal', 'Kepada', 'Pembuat', 'Tanggal Diajukan', 'Urutan', 'Status', 'Aksi'].map((label, index) => (
                                    <th
                                        key={index}
                                        className="border"
                                        style={{
                                            backgroundColor: '#138a98',
                                            color: '#fff',
                                            textAlign: 'center',
                                            padding: '10px 8px',
                                            verticalAlign: 'middle',
                                            width: index === 8 ? 64 : undefined,
                                        }}
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((item, index) => (
                                <tr key={getId(item) || index}>
                                    <td className="border text-center">{index + 1}</td>
                                    <td className="border">{item?.nomor_surat || item?.kode_draft || '-'}</td>
                                    <td className="border">{item?.perihal || '-'}</td>
                                    <td className="border">{item?.tujuan_nama || item?.kepada || '-'}</td>
                                    <td className="border">{item?.created_by_name || item?.nama_pembuat || '-'}</td>
                                    <td className="border text-center">
                                        {item?.tanggal_diajukan || item?.created_at
                                            ? formatDateApp(item?.tanggal_diajukan || item?.created_at, 'YYYY-MM-DD HH:mm')
                                            : '-'}
                                    </td>
                                    <td className="border text-center">{item?.urutan || '-'}</td>
                                    <td className="border text-center">
                                        <EofficeStatusBadge value={item?.status || 'review'} />
                                    </td>
                                    <td className="border text-center approval-action-cell">
                                        <div className="d-flex justify-content-center" style={{ gap: 4 }}>
                                            {canApprove ? (
                                                <Button
                                                    className="btn-default-app"
                                                    style={{ background: '#22a06b', color: '#fff', borderColor: '#22a06b', width: 28, minWidth: 28, height: 28, padding: 0, justifyContent: 'center' }}
                                                    disabled={processing}
                                                    onClick={() => handleApprove(item)}
                                                    title="Setujui"
                                                    aria-label="Setujui"
                                                >
                                                    <span className="material-icons" style={{ display: 'block', fontSize: 16, lineHeight: 1 }}>check</span>
                                                </Button>
                                            ) : null}
                                            {canReject ? (
                                                <Button
                                                    className="btn-default-app btn-danger"
                                                    style={{ width: 28, minWidth: 28, height: 28, padding: 0, justifyContent: 'center' }}
                                                    disabled={processing}
                                                    onClick={() => openReject(item)}
                                                    title="Tolak"
                                                    aria-label="Tolak"
                                                >
                                                    <span className="material-icons" style={{ display: 'block', fontSize: 16, lineHeight: 1 }}>close</span>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!list.length ? (
                                <tr>
                                    <td className="border text-center text-muted" colSpan={9} style={{ padding: 28 }}>
                                        Tidak ada surat yang menunggu approval Anda saat ini.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={!!rejectingItem} onHide={closeReject} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Tolak Surat Keluar</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
                        Surat akan dikembalikan ke status <strong>draft</strong> dan dapat diedit kembali oleh pembuat.
                    </p>
                    <label className="font-semibold">Catatan Revisi <span className="text-danger">*</span></label>
                    <textarea
                        className="form-control mt-1"
                        rows={4}
                        value={rejectionNote}
                        onChange={event => setRejectionNote(event.target.value)}
                        placeholder="Tuliskan alasan penolakan / revisi yang diminta..."
                        autoFocus
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-default-app btn-light" type="button" onClick={closeReject} disabled={processing}>
                        Batal
                    </Button>
                    <Button
                        className="btn-default-app btn-danger"
                        type="button"
                        onClick={handleReject}
                        disabled={processing || !rejectionNote.trim()}
                    >
                        {processing ? 'Memproses...' : 'Tolak Surat'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Barcode/QR Code Modal after approval */}
            <Modal show={barcodeModal.show} onHide={() => setBarcodeModal({ show: false, item: null, qrData: '' })} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <span className="material-icons mr-1" style={{ fontSize: 20, verticalAlign: 'middle' }}>qr_code_2</span>
                        Tanda Terima Approval
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <SimpleQRCode data={barcodeModal.qrData} size={200} />
                        <hr />
                        <div className="text-start">
                            <div className="mb-2">
                                <div className="text-muted" style={{ fontSize: 11 }}>Jenis Surat</div>
                                <div className="font-semibold" style={{ fontSize: 14 }}>{barcodeModal.item?.jenis_surat || barcodeModal.item?.jenis || '-'}</div>
                            </div>
                            <div className="mb-2">
                                <div className="text-muted" style={{ fontSize: 11 }}>Nomor Surat</div>
                                <div className="font-semibold" style={{ fontSize: 14 }}>{barcodeModal.item?.nomor_surat || '-'}</div>
                            </div>
                            <div className="mb-2">
                                <div className="text-muted" style={{ fontSize: 11 }}>Perihal</div>
                                <div className="font-semibold" style={{ fontSize: 14 }}>{barcodeModal.item?.perihal || '-'}</div>
                            </div>
                            <div className="mb-2">
                                <div className="text-muted" style={{ fontSize: 11 }}>Disetujui oleh</div>
                                <div className="font-semibold text-success" style={{ fontSize: 14 }}>{barcodeModal.approverName || '-'}</div>
                            </div>
                            <div className="mb-2">
                                <div className="text-muted" style={{ fontSize: 11 }}>Tanggal & Waktu</div>
                                <div className="font-semibold" style={{ fontSize: 14 }}>
                                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    {' '}
                                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            </div>
                            <div className="mb-2">
                                <div className="text-muted" style={{ fontSize: 11 }}>Status</div>
                                <span className="badge bg-success">Disetujui</span>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        className="btn-default-app btn-light"
                        type="button"
                        onClick={() => setBarcodeModal({ show: false, item: null, qrData: '' })}
                    >
                        Tutup
                    </Button>
                    <Button
                        className="btn-default-app btn-info"
                        type="button"
                        onClick={() => {
                            const link = document.createElement('a')
                            link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(barcodeModal.qrData)}&format=png&margin=10`
                            link.download = `approval-qr-${barcodeModal.item?.id_surat_approval || barcodeModal.item?.id || 'scan'}.png`
                            link.click()
                        }}
                    >
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>download</span>
                        Download QR Code
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SuratApproval;
