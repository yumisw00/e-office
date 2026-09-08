"use client"

import { useEffect, useMemo, useState } from "react";
import HeaderApp from "components/HeaderApp";
import { api_services } from "hooks/api_services";
import { formatDateApp } from "pages/Utils";

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response)) return response;
    return [];
};

const getId = item => item?.id_sys_notification || item?.id || item?.value;

const SysNotification = () => {
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const service = useMemo(() => api_services({ api_path: "/sys_notification" }), []);

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

    return (
        <>
            <HeaderApp
                title="System Notification"
                is_loading={isLoading}
                data_btn={[]}
            />

            <div className="container pl-4 pr-4">
                <div className="table-responsive">
                    <table className="w-full table border-collapse border" style={{ minWidth: 980 }}>
                        <thead>
                            <tr>
                                {['No', 'Judul', 'Pesan', 'Tipe', 'Status', 'Created At'].map((label, index) => (
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
                                    <td className="border">{item?.title || item?.judul || '-'}</td>
                                    <td className="border">{item?.message || item?.pesan || '-'}</td>
                                    <td className="border text-center">{item?.type || item?.notification_type || '-'}</td>
                                    <td className="border text-center">{item?.is_read ? 'Terbaca' : 'Belum'}</td>
                                    <td className="border text-center">{item?.created_at ? formatDateApp(item.created_at, 'YYYY-MM-DD HH:mm') : '-'}</td>
                                </tr>
                            ))}
                            {!list.length ? (
                                <tr>
                                    <td className="border text-center text-muted" colSpan={6} style={{ padding: 28 }}>
                                        Belum ada system notification.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default SysNotification;
