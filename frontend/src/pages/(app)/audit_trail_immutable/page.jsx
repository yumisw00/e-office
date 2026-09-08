"use client"

import { useEffect, useMemo, useState } from "react";
import HeaderApp from "components/HeaderApp";
import { api_services } from "hooks/api_services";
import { formatDateApp } from "pages/Utils";
import {
    EofficeTable,
    EofficeTableEmpty,
    EofficeTableCell,
} from "components/EofficeModuleUI";

const normalizeList = response => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response)) return response;
    return [];
};

const getId = item => item?.id_log || item?.id || item?.value;

const AuditTrailImmutable = () => {
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const service = useMemo(() => api_services({ api_path: "/audit_trail_immutable" }), []);

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
                title="Audit Trail Immutable"
                is_loading={isLoading}
                data_btn={[]}
            />

            <div className="container pl-4 pr-4">
                <EofficeTable
                    headers={[
                        { label: 'No', width: 50 },
                        { label: 'Page', width: 140 },
                        { label: 'Activity', width: 180 },
                        { label: 'IP', width: 120 },
                        { label: 'Activity Time', width: 160 },
                        { label: 'Data', width: 240 },
                        { label: 'User', width: 150 },
                    ]}
                    colgroup={[50, 140, 180, 120, 160, 240, 150]}
                    minWidth={1040}
                >
                    {list.map((item, index) => (
                        <tr key={getId(item) || index}>
                            <EofficeTableCell width={50}>{index + 1}</EofficeTableCell>
                            <EofficeTableCell width={140} align="start" wrap>{item?.page || item?.nama || '-'}</EofficeTableCell>
                            <EofficeTableCell width={180} align="start" wrap>{item?.activity || item?.activity_desc || '-'}</EofficeTableCell>
                            <EofficeTableCell width={120}>{item?.ip || item?.ip_address || '-'}</EofficeTableCell>
                            <EofficeTableCell width={160}>{item?.activity_time ? formatDateApp(item.activity_time, 'YYYY-MM-DD HH:mm:ss') : '-'}</EofficeTableCell>
                            <EofficeTableCell width={240} align="start" wrap style={{ maxWidth: 220 }}>{item?.data || item?.payload || '-'}</EofficeTableCell>
                            <EofficeTableCell width={150} align="start" wrap>{item?.user_desc || item?.user || '-'}</EofficeTableCell>
                        </tr>
                    ))}
                    {!list.length ? (
                        <EofficeTableEmpty colSpan={7} message="Belum ada audit trail immutable." />
                    ) : null}
                </EofficeTable>
            </div>
        </>
    );
};

export default AuditTrailImmutable;
