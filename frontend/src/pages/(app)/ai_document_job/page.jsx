"use client"

import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import HeaderApp from "components/HeaderApp";
import Button from "components/Button";
import { api_services } from "hooks/api_services";
import { formatDateApp } from "pages/Utils";

const emptyForm = {
    nama_job: "",
    jenis_job: "ocr",
    status: "pending",
    deskripsi: "",
};

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response)) return response;
    return [];
};

const getId = item => item?.id_ai_document_job || item?.id || item?.value;

const AiDocumentJob = () => {
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const service = useMemo(() => api_services({ api_path: "/ai_document_job" }), []);

    const loadData = async () => {
        setIsLoading(true);
        const response = await service.getapi_services({ filter: { paginate: { page: 1, pagesize: 1000 } } });
        setIsLoading(false);

        if (response?.error || response?.code) {
            setList([]);
            return;
        }

        setList(normalizeList(response));
    };

    useEffect(() => {
        loadData();
    }, []);

    const openForm = item => {
        setSelectedId(getId(item));
        setForm({
            ...emptyForm,
            ...item,
        });
        setShowModal(true);
    };

    const saveData = async event => {
        event?.preventDefault();
        const response = selectedId
            ? await service.putapi_services({ id: selectedId, ...form })
            : await service.postapi_services(form);
        if (response?.error || response?.code) return;
        setShowModal(false);
        setSelectedId(null);
        setForm(emptyForm);
        loadData();
    };

    const deleteData = async item => {
        const id = getId(item);
        if (!id) return;
        const response = await service.deleteapi_services({ id });
        if (response?.error || response?.code) return;
        loadData();
    };

    return (
        <>
            <HeaderApp
                title="AI Document Jobs"
                is_loading={isLoading}
                data_btn={[]}
                btnCustom={
                    <Button className="ml-2 btn-default-app btn-info" onClick={() => openForm({})}>
                        <span className="material-icons mr-1" style={{ fontSize: 16 }}>smart_toy</span>
                        Tambah Job
                    </Button>
                }
            />

            <div className="container pl-4 pr-4">
                <div className="table-responsive">
                    <table className="w-full table border-collapse border" style={{ minWidth: 980 }}>
                        <thead>
                            <tr>
                                {['No', 'Nama Job', 'Jenis', 'Status', 'Created At', 'Aksi'].map((label, index) => (
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
                                    <td className="border">{item?.nama_job || item?.name || '-'}</td>
                                    <td className="border text-center">{item?.jenis_job || item?.type || '-'}</td>
                                    <td className="border text-center">{item?.status || '-'}</td>
                                    <td className="border text-center">{item?.created_at ? formatDateApp(item.created_at, 'YYYY-MM-DD HH:mm') : '-'}</td>
                                    <td className="border text-center">
                                        <div className="d-flex justify-center flex-wrap" style={{ gap: 6 }}>
                                            <Button className="btn-default-app btn-info" onClick={() => openForm(item)}>Edit</Button>
                                            <Button className="btn-default-app btn-danger" onClick={() => deleteData(item)}>Hapus</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!list.length ? (
                                <tr>
                                    <td className="border text-center text-muted" colSpan={6} style={{ padding: 28 }}>
                                        Belum ada AI Document Job.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedId ? 'Edit AI Document Job' : 'Tambah AI Document Job'}</Modal.Title>
                </Modal.Header>
                <form onSubmit={saveData}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="font-semibold">Nama Job</label>
                                <input className="form-control" value={form.nama_job || ''} onChange={e => setForm({ ...form, nama_job: e.target.value })} required />
                            </div>
                            <div className="col-md-6">
                                <label className="font-semibold">Jenis Job</label>
                                <select className="form-control" value={form.jenis_job || 'ocr'} onChange={e => setForm({ ...form, jenis_job: e.target.value })}>
                                    <option value="ocr">OCR</option>
                                    <option value="classification">Classification</option>
                                    <option value="transcribe">Transcribe</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="font-semibold">Status</label>
                                <select className="form-control" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="pending">Menunggu</option>
                                    <option value="running">Running</option>
                                    <option value="completed">Selesai</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="font-semibold">Deskripsi</label>
                                <textarea className="form-control" rows={4} value={form.deskripsi || ''} onChange={e => setForm({ ...form, deskripsi: e.target.value })} />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-default-app btn-light" type="button" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button className="btn-default-app btn-info" type="submit">Simpan Job</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    );
};

export default AiDocumentJob;
