import React, { useState, useEffect, useRef } from "react";
import BtnGroup from "components/BtnGroup";
import { checkNotAuthorized, initAccessMethod, showToastr } from "pages/Utils";

import BtnIconAct from "components/BtnIconAct";
import Pagination from "components/Pagination";
import { api_services } from "hooks/api_services";
import axios from "lib/axios";
import {
    EofficeCard,
    EofficeBadge,
    EofficeTableCell,
    EofficeTableWithFilter,
} from "components/EofficeModuleUI";

export const headers = [
  { name: "name", label: "Name", width: "auto", type: "string" },
  { name: "email", label: "Email", width: "auto", type: "string" },
  { name: "id_jabatan", label: "Jabatan", width: "auto", type: "list", nofilter: false, is_async: true },
];

// Table headers with filter config for EofficeTableWithFilter
const tableHeaders = [
  { name: 'name', label: 'Name', width: 'auto', align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'email', label: 'Email', width: 'auto', align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'jabatan', label: 'Jabatan', width: 'auto', align: 'center', filterType: 'text', filterPlaceholder: 'Filter...' },
  { name: 'aksi', label: 'Aksi', width: 160, align: 'center', filterType: 'none' },
];

const colgroup = ['auto', 'auto', 'auto', 160];

const Sys_user = (props) => {
  const page_url = "sys_user";

  const [errors, setErrors] = useState({});
  const [access_method, setaccess_method] = useState({});
  const [is_loading, setis_loading] = useState(false);
  const [sys_user, setsys_user] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  const { getapi_services, deleteapi_services } = api_services({
    api_path: `/${page_url}`,
  });

  const [datafilter, setdatafilter] = useState({
    paginate: {
      page: 1,
      pagesize: 20,
    },
  });

  const [listreferensi, setreferensi] = useState({});
  const [filter, setfilter] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempFilter, setTempFilter] = useState({});
  const [order, setOrder] = useState("");
  const [inlineFilterValues, setInlineFilterValues] = useState({});

  const initialized = useRef(false);
  const getActiveFilter = (data = {}) => Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
  const activeFilterCount = Object.keys(getActiveFilter(filter)).length;

  useEffect(() => {
    if (!initialized.current) {
      handleInitAccessMethod();
      handlegetid_pegawai();
      handlegetmt_sdm_jabatan();
      handlegetmt_sdm_unit();
      handlegetmt_sdm_dit_bid();
      handlegetsys_group();

      initialized.current = true;
    }
    if (true) {
      handlegetsys_user();
    }
  }, [filter, datafilter.paginate.pagesize, datafilter.paginate.page, order]);

  const handleInitAccessMethod = async () => {
    const { access_method } = await initAccessMethod(page_url);
    setaccess_method(access_method);
  };

  const handlegetsys_user = async () => {
    setis_loading(true);

    var filterarr = {};
    headers.map((v, k) => {
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
    setsys_user(response.data);
    setdatafilter({
      ...datafilter,
      paginate: {
        ...datafilter.paginate,
        total_records: response.total_records,
      },
    });
  };

  const handledeletesys_user = async (id) => {
    const response = await deleteapi_services({ setErrors, id });

    checkNotAuthorized(response);
    if (response.error || response.code) return;

    await deleteapi_services({
      setErrors,
      api_path: "/sys_user_group",
      id,
      disabledAlert: true,
    });
    handlegetsys_user();
  };

  const handleToggleActive = async (user) => {
    const isCurrentlyActive = user.is_active ?? true;
    const action = isCurrentlyActive ? 'nonaktifkan' : 'aktifkan';
    const confirmed = confirm(`Yakin ${action} pengguna "${user.name}"?`);
    if (!confirmed) return;

    setTogglingId(user.id_user);
    try {
      const response = await axios.post(`/api/${page_url}/${user.id_user}/toggle-active`);
      const data = response?.data;
      if (data?.success === false) {
        showToastr('error', data?.message || `Gagal ${action} pengguna.`);
        setTogglingId(null);
        return;
      }
      showToastr('success', data?.message || `Pengguna berhasil ${action}.`);
      handlegetsys_user();
    } catch (error) {
      const message = error?.response?.data?.message || `Gagal ${action} pengguna.`;
      showToastr('error', message);
    } finally {
      setTogglingId(null);
    }
  };

  const handlegetid_pegawai = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_pegawai",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });

    checkNotAuthorized(response);
    if (response.error || response.code) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr[m.id_pegawai] = m.nama;
    });
    setreferensi((listreferensi) => ({
      ...listreferensi,
      id_pegawai: dataarr,
    }));
  };

  const handlegetmt_sdm_jabatan = async (inputValue, callback) => {
    const datafilterJab = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    }

    if (inputValue && callback) {
      datafilterJab.paginate.pagesize = 20
      datafilterJab.filter = {
        nama: inputValue
      }
    }

    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_jabatan",
      filter: datafilterJab
    });

    checkNotAuthorized(response);
    if (response.error || response.code) return;

    let namearr = {};
    let dataarr = [];
    response.data.map((m) => {
      namearr[m.id_jabatan] = m.nama;
      dataarr.push({ label: m.nama, value: m.id_jabatan })
    });

    if (inputValue && callback) {
      return callback(dataarr)
    }

    setreferensi((listreferensi) => ({
      ...listreferensi,
      id_jabatan: namearr,
    }));
  };

  const handlegetmt_sdm_dit_bid = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_dit_bid",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = {};
    response.data.map((m) => {
      dataarr[m.code] = m.nama;
    });
    setreferensi((listreferensi) => ({
      ...listreferensi,
      id_dit_bid: dataarr,
    }));
  };

  const handlegetmt_sdm_unit = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_unit",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });

    checkNotAuthorized(response);
    if (response.error || response.code) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr[m.id_unit] = m.nama;
    });
    setreferensi((listreferensi) => ({
      ...listreferensi,
      id_unit: dataarr,
    }));
  };

  const handlegetsys_group = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/sys_group",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });

    checkNotAuthorized(response);
    if (response.error || response.code) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr[m.id_group] = m.nama;
    });
    setreferensi((listreferensi) => ({
      ...listreferensi,
      id_group: dataarr,
    }));
  };

  const handleLoadOptions = (inputValue, callback, name_column) => {
    if (name_column == 'id_jabatan') {
      handlegetmt_sdm_jabatan(inputValue, callback)
    }
  }

  // Inline filter change handler
  const handleInlineFilterChange = (colName, value) => {
    setInlineFilterValues(prev => ({
      ...prev,
      [colName]: value,
    }))
  }

  // Get filtered list based on inline filters
  const getFilteredUserList = () => {
    const filters = inlineFilterValues
    return sys_user.filter(m => {
      // Name filter
      if (filters.name) {
        const search = filters.name.toLowerCase()
        if (!(m.name || '').toLowerCase().includes(search)) return false
      }
      // Email filter
      if (filters.email) {
        const search = filters.email.toLowerCase()
        if (!(m.email || '').toLowerCase().includes(search)) return false
      }
      // Jabatan filter - select uses ID as value, compare with id_jabatan
      if (filters.jabatan) {
        if (String(m.id_jabatan || '') !== String(filters.jabatan)) return false
      }
      return true
    })
  }

  const filteredList = getFilteredUserList()

  // Build table headers with select options for group/unit/jabatan
  // Deduplicate options to avoid double entries in dropdown
  const buildUniqueOptions = (entries) => {
    const seen = new Set()
    return entries.filter(([k, v]) => {
      if (seen.has(v)) return false
      seen.add(v)
      return true
    }).map(([k, v]) => ({ value: k, label: v }))
  }

  const tableHeadersWithOptions = tableHeaders.map(h => {
    if (h.name === 'jabatan') {
      return {
        ...h,
        filterType: 'select',
        filterOptions: buildUniqueOptions(Object.entries(listreferensi.id_jabatan || {})),
      }
    }
    return h
  })

  return (
    <>
      <div className="container pl-4 pr-4">
        <div className="d-flex justify-content-end mb-3">
          <BtnGroup
            btn_top
            data={
              Object.keys(access_method).length > 0
                ? access_method.btn_top.map(button => ({
                  ...button,
                  label: button.label === 'Add' ? 'Tambah' : button.label,
                }))
                : []
            }
          />
        </div>
        {/* Table with inline filter */}
        <EofficeTableWithFilter
          headers={tableHeadersWithOptions}
          colgroup={colgroup}
          filterValues={inlineFilterValues}
          onFilterChange={handleInlineFilterChange}
          align="start"
          minWidth={900}
        >
          {filteredList.map((m, i) => (
            <tr key={m.id_user || i} className="align-middle">
              <EofficeTableCell align="start" wrap>
                <span className="font-semibold text-gray-900" style={{ fontSize: 13 }}>
                  {m.name || '-'}
                </span>
              </EofficeTableCell>
              <EofficeTableCell align="start" wrap>
                <span style={{ fontSize: 12, color: '#475569' }}>{m.email || '-'}</span>
              </EofficeTableCell>
              <EofficeTableCell align="start" wrap>
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {m.nama_jabatan || m.nama_group || '-'}
                </span>
              </EofficeTableCell>
              <EofficeTableCell align="center">
                <div className="td-action d-flex align-items-center justify-content-center gap-1">
                  {(access_method.editdelete || []).some(action => action.label === 'Edit') ? (
                    <BtnIconAct
                      className="btn-warning"
                      icon="edit"
                      href={`/${page_url}/edit/${m.id_user}`}
                    />
                  ) : null}
                  {(access_method.editdelete || []).some(action => action.label === 'Delete') ? (
                    <BtnIconAct
                      className="btn-danger"
                      icon="delete"
                      onTap={() => {
                        if (confirm('Yakin menghapus data ini?')) {
                          handledeletesys_user(m.id_user)
                        }
                      }}
                    />
                  ) : null}
                  <BtnIconAct
                    className={m.is_active ? 'btn-secondary' : 'btn-success'}
                    icon={m.is_active ? 'lock' : 'lock_open'}
                    tooltips={m.is_active ? 'Nonaktifkan pengguna' : 'Aktifkan pengguna'}
                    onTap={() => handleToggleActive(m)}
                  />
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

export default Sys_user;
