"use client"

import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import HeaderApp from "components/HeaderApp";
import Button from "components/Button";
import EofficeStatusBadge from "components/EofficeStatusBadge";
import { api_services } from "hooks/api_services";
import axios from "lib/axios";
import { formatDateApp, showToastr, urlPreview } from "pages/Utils";
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

const getReadOnlyPreviewUrl = value => {
    if (!value) return '';
    const rawUrl = String(value);
    const absoluteUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `/${rawUrl.replace(/^\/+/, '')}`;
    const googleDoc = absoluteUrl.match(/https?:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/i);
    if (googleDoc) return `https://docs.google.com/${googleDoc[1]}/d/${googleDoc[2]}/preview`;
    const googleDriveFile = absoluteUrl.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (googleDriveFile) return `https://drive.google.com/file/d/${googleDriveFile[1]}/preview`;
    const googleDriveOpen = absoluteUrl.match(/https?:\/\/drive\.google\.com\/open\?[^#]*\bid=([^&]+)/i);
    if (googleDriveOpen) return `https://drive.google.com/file/d/${googleDriveOpen[1]}/preview`;
    return absoluteUrl.startsWith('/') ? urlPreview(absoluteUrl) : absoluteUrl;
};

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
    const [previewModal, setPreviewModal] = useState({ show: false, loading: false, data: null });

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

    useEffect(() => {
        const handleApprovalQueueUpdate = event => {
            if (event.key === 'eoffice-approval-queue-updated') loadData();
        };
        window.addEventListener('storage', handleApprovalQueueUpdate);
        return () => window.removeEventListener('storage', handleApprovalQueueUpdate);
    }, []);

    const openPreview = async item => {
        const suratId = item?.id_surat_keluar;
        if (!suratId) {
            showToastr('error', 'ID surat keluar tidak ditemukan.');
            return;
        }
        setPreviewModal({ show: true, loading: true, data: item });
        try {
            const response = await axios.get(`/api/surat_keluar/${suratId}`);
            const result = response?.data?.data || response?.data?.result || response?.data;
            setPreviewModal({ show: true, loading: false, data: result ? { ...item, ...result } : item });
        } catch (error) {
            setPreviewModal({ show: true, loading: false, data: item });
            showToastr('error', error?.response?.data?.message || 'Detail surat gagal dimuat.');
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const suratId = params.get('preview_approval');
        const approvalRowId = params.get('preview_approval_row');
        if (suratId) openPreview({ id_surat_keluar: suratId, id_surat_approval: approvalRowId });
    }, []);

    const openPreviewTab = item => {
        const suratId = item?.id_surat_keluar;
        if (!suratId) {
            showToastr('error', 'ID surat keluar tidak ditemukan.');
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set('preview_approval', suratId);
        url.searchParams.set('preview_approval_row', getId(item));
        const previewWindow = window.open(url.toString(), '_blank');
        if (!previewWindow) showToastr('error', 'Tab preview diblokir browser. Izinkan pop-up untuk membuka preview surat.');
    };

    const closePreview = () => {
        setPreviewModal({ show: false, loading: false, data: null });
        if (new URLSearchParams(window.location.search).has('preview_approval')) {
            window.close();
            window.setTimeout(() => {
                if (!window.closed) window.location.replace(window.location.pathname);
            }, 150);
        }
    };

    const previewData = previewModal.data || {};
    const previewApprovalRowId = new URLSearchParams(window.location.search).get('preview_approval_row');
    const previewApprovalItem = (previewData.approval || [])
        .find(approval => String(approval.id_surat_approval) === String(previewApprovalRowId));
    const previewActionItem = previewApprovalItem
        ? { ...previewData, ...previewApprovalItem, id_surat_keluar: previewData.id_surat_keluar }
        : null;
    const previewPath = previewData.file_pdf_path || previewData.file_draft_path || previewData.lampiran_path;
    const previewUrl = getReadOnlyPreviewUrl(previewPath || previewData.google_drive_document_url || previewData.drive_document_url);

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

            // Remove the processed approval immediately, then confirm with the API.
            const processedId = getId(item)
            setList(current => current.filter(row => getId(row) !== processedId))
            setPreviewModal(current => ({
                ...current,
                data: {
                    ...current.data,
                    approval: (current.data?.approval || []).map(approval => String(approval.id_surat_approval) === String(processedId)
                        ? { ...approval, status: 'approved', tanggal_aksi: new Date().toISOString() }
                        : approval),
                },
            }));
            try {
                window.localStorage.setItem('eoffice-approval-queue-updated', String(Date.now()));
            } catch (error) {
                // The current preview still updates if browser storage is unavailable.
            }

            // Generate barcode/QR data after approval.
            const approverName = getCurrentUserName()
            const qrData = generateApprovalQRData(item, approverName)
            setBarcodeModal({ show: true, item: { ...item, status: 'approved' }, qrData, approverName })

            await loadData();
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
            const rejectedApprovalId = String(getId(rejectingItem));
            const rejectedAt = new Date().toISOString();
            setPreviewModal(current => ({
                ...current,
                data: {
                    ...current.data,
                    approval: (current.data?.approval || []).map(approval => String(approval.id_surat_approval) === rejectedApprovalId
                        ? { ...approval, status: 'rejected', catatan_revisi: rejectionNote.trim(), tanggal_aksi: rejectedAt }
                        : approval),
                },
            }));
            try {
                window.localStorage.setItem('eoffice-approval-queue-updated', String(Date.now()));
            } catch (error) {
                // The current preview still updates if browser storage is unavailable.
            }
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
                <div className="table-responsive surat-approval-table">
                    <table className="w-full table border-collapse border" style={{ minWidth: 980 }}>
                        <thead>
                            <tr>
                                {['No', 'Nomor Surat', 'Kepada', 'Pembuat', 'Tanggal Diajukan', 'Urutan', 'Status'].map((label, index) => (
                                    <th
                                        key={index}
                                        className="border"
                                        style={{
                                            backgroundColor: '#138a98',
                                            color: '#fff',
                                            textAlign: 'center',
                                            padding: '10px 8px',
                                            verticalAlign: 'middle',
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
                                    <td className="border">
                                        <div className="d-flex flex-column align-items-start" style={{ lineHeight: 1.35 }}>
                                            <button
                                                type="button"
                                                className="btn p-0 text-left"
                                                onClick={() => openPreviewTab(item)}
                                                title="Lihat preview surat"
                                                style={{ color: '#138a98', fontWeight: 700, textDecoration: 'none', border: 0, background: 'transparent' }}
                                            >
                                                {item?.nomor_surat || item?.kode_draft || '-'}
                                            </button>
                                            {item?.kode_draft && item?.kode_draft !== item?.nomor_surat ? (
                                                <span className="text-muted" style={{ fontSize: 12 }}>{item.kode_draft}</span>
                                            ) : null}
                                        </div>
                                    </td>
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
                                </tr>
                            ))}
                            {!list.length ? (
                                <tr>
                                    <td className="border text-center text-muted" colSpan={7} style={{ padding: 28 }}>
                                        Tidak ada surat yang menunggu approval Anda saat ini.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={previewModal.show && !barcodeModal.show} onHide={closePreview} fullscreen="always" className="eoffice-modal-detail approval-preview-fullscreen">
                <Modal.Header closeButton>
                    <Modal.Title>Preview Approval</Modal.Title>
                </Modal.Header>
                <Modal.Body className="eoffice-modal-body">
                    {previewModal.loading ? <div className="text-center py-5">Memuat detail surat...</div> : (
                        <div style={{ height: '100%', minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(280px, 28fr) minmax(400px, 44fr) minmax(280px, 28fr)', gap: 12 }}>
                            <section className="border rounded p-3" style={{ minWidth: 0, overflowY: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,.08)' }}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <strong>{previewData.nomor_surat || previewData.kode_draft || 'Detail surat'}</strong>
                                    <span className="badge bg-info">{previewData.status || 'Menunggu Persetujuan'}</span>
                                </div>
                                <div className="text-muted mb-3" style={{ fontSize: 12 }}>{previewData.perihal || 'Detail surat keluar'}</div>
                                <div className="row g-2">
                                    {[
                                        ['Nomor Agenda', previewData.kode_draft],
                                        ['Nomor Surat', previewData.nomor_surat],
                                        ['Jenis Surat', previewData.jenis || previewData.jenis_surat],
                                        ['Kepada', previewData.tujuan_nama || previewData.kepada],
                                        ['Pembuat', previewData.created_by_name || previewData.nama_pembuat || previewData.created_by_desc],
                                        ['Tanggal Surat', previewData.tanggal_surat],
                                    ].map(([label, value]) => (
                                        <div className="col-md-6" key={label}>
                                            <div className="border rounded p-2 bg-light h-100">
                                                <div className="text-muted" style={{ fontSize: 11 }}>{label}</div>
                                                <strong style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{value || '-'}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3">
                                    <div className="text-muted" style={{ fontSize: 11 }}>Isi/Ringkasan</div>
                                    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 13 }}>{previewData.ringkasan || previewData.isi_surat || '-'}</div>
                                </div>
                            </section>
                            <section className="border rounded p-2" style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 2px 5px rgba(0,0,0,.08)' }}>
                                <div className="font-semibold mb-2"><span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>attach_file</span>Lampiran Surat</div>
                                {previewUrl ? <iframe title="Preview surat yang menunggu approval" src={previewUrl} style={{ width: '100%', flex: 1, minHeight: 0, border: '1px solid #d6dce1', borderRadius: 4, background: '#2f2f2f' }} /> : <div className="text-muted text-center py-5">Belum ada lampiran surat.</div>}
                            </section>
                            <section style={{ minWidth: 0, overflowY: 'auto' }}>
                                <div className="border rounded p-3" style={{ boxShadow: '0 2px 5px rgba(0,0,0,.08)' }}>
                                    <strong><span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>timeline</span>Tracking Approval</strong>
                                    {(previewData.approval || []).length ? previewData.approval.map((approval, index) => {
                                        const status = String(approval.status || 'waiting').toLowerCase();
                                        const label = ({ waiting: 'Menunggu Persetujuan', pending: 'Menunggu Persetujuan', review: 'Menunggu Persetujuan', approved: 'Disetujui', rejected: 'Ditolak' })[status] || approval.status || 'Menunggu Persetujuan';
                                        return <div key={approval.id_surat_approval || index} className="border-bottom py-2" style={{ fontSize: 13 }}>
                                            <strong>{approval.nama_approver || `Approver ${approval.urutan || index + 1}`}</strong>
                                            <div className={status === 'approved' ? 'text-success' : status === 'rejected' ? 'text-danger' : 'text-muted'}>{label}</div>
                                            {approval.tanggal_aksi ? <div className="text-muted" style={{ fontSize: 11 }}>{approval.tanggal_aksi}</div> : null}
                                            {approval.catatan_revisi ? <div className="mt-1">Catatan: {approval.catatan_revisi}</div> : null}
                                        </div>;
                                    }) : <div className="text-muted mt-2" style={{ fontSize: 12 }}>Data tracking approval tidak tersedia.</div>}
                                </div>
                                {previewActionItem && ACTIVE_STATUSES.includes(String(previewActionItem.status || '').toLowerCase()) ? (
                                    <div className="d-flex flex-wrap mt-2" style={{ gap: 8 }}>
                                        {canApprove ? (
                                            <Button
                                                className="btn-default-app"
                                                type="button"
                                                disabled={processing}
                                                onClick={() => handleApprove(previewActionItem)}
                                                style={{ background: '#22a06b', color: '#fff', borderColor: '#22a06b' }}
                                            >
                                                <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>check</span>
                                                Setujui Approval
                                            </Button>
                                        ) : null}
                                        {canReject ? (
                                            <Button
                                                className="btn-default-app btn-danger"
                                                type="button"
                                                disabled={processing}
                                                onClick={() => openReject(previewActionItem)}
                                            >
                                                <span className="material-icons mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>close</span>
                                                Tolak Approval
                                            </Button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </section>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

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
            <Modal show={barcodeModal.show} onHide={closePreview} fullscreen="always" className="eoffice-modal-detail approval-preview-fullscreen approval-receipt-fullscreen">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <span className="material-icons mr-1" style={{ fontSize: 20, verticalAlign: 'middle' }}>qr_code_2</span>
                        Tanda Terima Approval
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="approval-receipt-body">
                    <div className="approval-receipt-card text-center">
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
                        onClick={closePreview}
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
