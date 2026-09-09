import React, { useState, useEffect, useRef } from "react";
import { checkNotAuthorized, initAccessMethod } from "pages/Utils";

import BtnIconAct from "components/BtnIconAct";
import Pagination from "components/Pagination";
import { api_services } from "hooks/api_services";
import {
    EofficeCard,
    EofficeBadge,
    EofficeTableCell,
    EofficeTableWithFilter,
} from "components/EofficeModuleUI";

const headers = [
  { name: "page", label: "Page", width: "180px", type: "string" },
  { name: "activity", label: "Activity", width: "190px", type: "text" },
  { name: "ip", label: "IP", width: "120px", type: "string" },
  { name: "activity_time", label: "Activity Time", width: "170px", type: "datetime" },
  { name: "data", label: "Data", width: "360px", type: "text" },
  { name: "user_desc", label: "User", width: "130px", type: "string" },
];

// Table headers with filter config for EofficeTableWithFilter
const tableHeaders = [
  { name: 'page', label: 'Page', width: 180, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'activity', label: 'Activity', width: 190, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'ip', label: 'IP', width: 120, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'activity_time', label: 'Activity Time', width: 170, align: 'center', filterType: 'date', filterPlaceholder: 'Filter...' },
  { name: 'data', label: 'Data', width: 360, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'user_desc', label: 'User', width: 130, align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'aksi', label: 'Aksi', width: 80, align: 'center', filterType: 'none' },
];

const colgroup = [180, 190, 120, 170, 360, 130, 80];

const cleanLogPage = value =>
  String(value || "")
    .replace("https://rms.hutamakarya.com", "")
    .replace("http://rms.hutamakarya.com", "")
    .replace("http://localhost:5173/", "")
    .replace("https://localhost:5173/", "")
    .replace(/^\/+/, "");

const formatLogDate = value => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = number => String(number).padStart(2, "0");

  return [
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(" ");
};

const formatLogValue = (header, item) => {
  const value = item?.[header.name];
  if (value === null || value === undefined || value === "") return "-";

  if (header.name === "page") return cleanLogPage(value);
  if (header.name === "activity_time") return formatLogDate(value);
  if (typeof value === "object") return JSON.stringify(value, null, 2);

  return String(value).replace(/":/g, "\": ");
};

const Sys_log = (props) => {
  const page_url = "sys_log";

  const [errors, setErrors] = useState({});
  const [access_method, setaccess_method] = useState({});
  const [is_loading, setis_loading] = useState(false);
  const [sys_log, setsys_log] = useState([]);

  const { getapi_services, deleteapi_services } = api_services({
    api_path: `/${page_url}`,
  });

  const [datafilter, setdatafilter] = useState({
    paginate: {
      page: 1,
      pagesize: 20,
    },
  });

  const [filter, setfilter] = useState({});
  const [inlineFilterValues, setInlineFilterValues] = useState({});
  const [order, setOrder] = useState("");

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      handleInitAccessMethod();
      initialized.current = true;
    }
    handlegetsys_log();
  }, [filter, datafilter.paginate.pagesize, datafilter.paginate.page, order]);

  const handleInitAccessMethod = async () => {
    const { access_method } = await initAccessMethod(page_url);
    setaccess_method(access_method);
  };

  const handlegetsys_log = async () => {
    setis_loading(true);

    var filterarr = {};
    headers.map((v) => {
      if (filter[v.name]) {
        if (v.type == "list") {
          filterarr[v.name] = filter[v.name];
        } else {
          filterarr[v.name] = "%" + filter[v.name] + "%";
        }
      }
    });

    const response = await getapi_services({
      setErrors,
      filter: {
        ...datafilter,
        filter: filterarr,
        order: order,
      },
    });

    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);
    if (response.error || response.code) return;
    setsys_log(response.data);
    setdatafilter({
      ...datafilter,
      paginate: {
        ...datafilter.paginate,
        total_records: response.total_records,
      },
    });
  };

  const handledeletesys_log = async (id) => {
    const response = await deleteapi_services({ setErrors, id });

    checkNotAuthorized(response);
    if (response.error || response.code) return;
    handlegetsys_log();
  };

  // Inline filter change handler
  const handleInlineFilterChange = (colName, value) => {
    setInlineFilterValues(prev => ({
      ...prev,
      [colName]: value,
    }))
  }

  // Get filtered list based on inline filters
  const getFilteredLogList = () => {
    const filters = inlineFilterValues
    return sys_log.filter(m => {
      // Page filter
      if (filters.page) {
        const search = filters.page.toLowerCase()
        const pageVal = cleanLogPage(m.page || '')
        if (!pageVal.toLowerCase().includes(search)) return false
      }
      // Activity filter
      if (filters.activity) {
        const search = filters.activity.toLowerCase()
        if (!(m.activity || '').toLowerCase().includes(search)) return false
      }
      // IP filter
      if (filters.ip) {
        const search = filters.ip.toLowerCase()
        if (!(m.ip || '').toLowerCase().includes(search)) return false
      }
      // Activity Time filter (date only - compare date part only)
      if (filters.activity_time) {
        if (!m.activity_time) return false
        const logDate = new Date(m.activity_time)
        if (Number.isNaN(logDate.getTime())) return false
        const logDateStr = logDate.toISOString().slice(0, 10) // "2026-07-30"
        if (logDateStr !== filters.activity_time) return false
      }
      // Data filter
      if (filters.data) {
        const search = filters.data.toLowerCase()
        const dataVal = typeof m.data === 'object' ? JSON.stringify(m.data) : (m.data || '')
        if (!dataVal.toLowerCase().includes(search)) return false
      }
      // User filter
      if (filters.user_desc) {
        const search = filters.user_desc.toLowerCase()
        if (!(m.user_desc || '').toLowerCase().includes(search)) return false
      }
      return true
    })
  }

  const filteredList = getFilteredLogList()

  return (
    <>
      <div className="container pl-4 pr-4">
        {/* Table with inline filter */}
        <EofficeTableWithFilter
          headers={tableHeaders}
          colgroup={colgroup}
          filterValues={inlineFilterValues}
          onFilterChange={handleInlineFilterChange}
          align="start"
          minWidth={1120}
        >
          {filteredList.map((m, i) => (
            <tr key={m.id_log || i} className="align-top">
              <EofficeTableCell align="start" wrap>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>
                  {cleanLogPage(m.page)}
                </span>
              </EofficeTableCell>
              <EofficeTableCell align="start" wrap>
                <span style={{ fontSize: 12, lineHeight: 1.4 }}>{m.activity || '-'}</span>
              </EofficeTableCell>
              <EofficeTableCell align="start">
                <span className="badge bg-slate-100 text-slate-700 border border-slate-200" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {m.ip || '-'}
                </span>
              </EofficeTableCell>
              <EofficeTableCell align="start">
                <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                  {formatLogDate(m.activity_time)}
                </span>
              </EofficeTableCell>
              <EofficeTableCell align="start" wrap>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: 80,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    lineHeight: 1.4,
                    background: 'transparent',
                    color: '#64748b',
                  }}
                >
                  {m.data && m.data !== '-' ? (typeof m.data === 'object' ? JSON.stringify(m.data) : m.data) : '-'}
                </pre>
              </EofficeTableCell>
              <EofficeTableCell align="start" wrap>
                <span className="badge bg-teal-50 text-teal-700 border border-teal-200" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {m.user_desc || '-'}
                </span>
              </EofficeTableCell>
              <EofficeTableCell align="center">
                <div className="d-flex align-items-center justify-content-center gap-1">
                  {access_method.btn_edit_delete?.edit && (
                    <BtnIconAct
                      className="btn-warning"
                      icon="edit"
                      href={`/${page_url}/edit/${m.id_log}`}
                      tooltips="Edit"
                    />
                  )}
                  {access_method.btn_edit_delete?.delete && (
                    <BtnIconAct
                      className="btn-danger"
                      icon="delete"
                      onTap={() => {
                        if (confirm("Anda yakin menghapus data ini?")) {
                          handledeletesys_log(m.id_log);
                        }
                      }}
                      tooltips="Delete"
                    />
                  )}
                </div>
              </EofficeTableCell>
            </tr>
          ))}
        </EofficeTableWithFilter>

        <Pagination
          paginate={datafilter.paginate}
          onPageClick={(page) => {
            setdatafilter({
              ...datafilter,
              paginate: {
                ...datafilter.paginate,
                page: page.selected + 1,
              },
            });
          }}
        />
      </div>
    </>
  );
};

export default Sys_log;
