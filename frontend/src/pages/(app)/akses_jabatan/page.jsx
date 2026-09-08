"use client"

import HeaderApp from "components/HeaderApp";
import TableHead from "components/TableHead";
import Pagination from "components/Pagination";
import EditDelete from "components/EditDelete";
import mt_sdm_jabatanModel from "hooks/models/mt_sdm_jabatanModel";
import sys_groupModel from "hooks/models/sys_groupModel";
import Mt_sdm_jabatanedit from "./[...slug]/page";
import IndexPage from "../IndexPage";
import InputSelect from "components/InputSelect";
import FormGroup from "components/FormGroup";
import Button from "components/Button";
import TableHeadCheckbox from "components/TableHeadCheckbox";
import InputCheckbox from "components/InputCheckbox";
import { api_services } from "hooks/api_services";
import { initAccessMethod, pageSlugParams, showToastr } from "pages/Utils";
import mt_sdm_dit_bidModel from "hooks/models/mt_sdm_dit_bidModel";
import mt_sdm_subbidModel from "hooks/models/mt_sdm_subbidModel";



class Akses_jabatan extends IndexPage {
    constructor(props) {
        super(props)
        // inisialisasi state
        this.state = {
            access_method: [],
            datafilter: {
                paginate: {
                    page: 1,
                    pagesize: 10000
                }
            },
            is_loading: false,
            list: [],
            listreferensi: [],
            filter: {},
            order: '',
            showModal: false,
            path: '',
            other_state: {},
            is_jabatan_saved: false
        }
    }

    titlePage = "Akses Jabatan"
    model = new mt_sdm_jabatanModel()
    mt_sdm_dit_bidModel = new mt_sdm_dit_bidModel()
    mt_sdm_subbidModel = new mt_sdm_subbidModel()
    sys_groupModel = new sys_groupModel()
    headers = [

        { name: 'nama', label: 'Nama Jabatan', width: 'auto', type: 'string' },
        { name: 'nama_pegawai', label: 'Nama Pegawai', width: 'auto', type: 'string' },
        { name: 'id_unit', label: 'Unit ', width: 'auto', type: 'list' },
        { name: 'id_kategori', label: 'Kategori ', width: 'auto', type: 'list' },
        { name: 'id_jenjang', label: 'Jenjang', width: 'auto', type: 'list' },
        { name: 'id_tipe_unit', label: 'Tipe Unit ', width: 'auto', type: 'list' },
        { name: 'id_dit_bid', label: 'DIT BID ', width: 'auto', type: 'list' },
        { name: 'id_subbid', label: 'Subbid ', width: 'auto', type: 'list' },


    ]

    init = async () => {
        const { access_method, path } = await initAccessMethod(this.props.pathaccess);
        this.setState({ path, access_method }, () => {
            // this.get()
            this.getreferensi()
        })
    }

    // get = async () => {
    //     const { filter, order, datafilter } = this.state
    //     var filterarr = {}
    //     this.headers.map(v => {
    //         if (filter[v.name]) {
    //             if (v.type == 'list') {
    //                 filterarr[v.name] = filter[v.name]
    //             } else {
    //                 filterarr[v.name] = '%' + filter[v.name] + '%'
    //             }
    //         }
    //     })
    //     this.setState({ is_loading: true })
    //     const response = await this.model.get({
    //         filter: {
    //             ...datafilter,
    //             paginate: {
    //                 page: 1,
    //                 pagesize: 10000
    //             },
    //             filter: filterarr,
    //             order
    //         },
    //     })
    //     this.setState({ is_loading: false })
    //     if (response.error || response.code) return

    //     this.setState({
    //         list: response.data,
    //         datafilter: {
    //             ...datafilter,
    //             paginate: {
    //                 ...datafilter.paginate,
    //                 total_records: response.total_records
    //             }
    //         }
    //     })
    // }

    get = async () => {
        const { filter, order, datafilter, is_jabatan_saved } = this.state

        let is_not_request = false
        var filterarr = {}
        this.headers.map(v => {
            if (filter[v.name]) {
                if (v.type == 'list') {
                    filterarr[v.name] = filter[v.name]
                } else {
                    filterarr[v.name] = '%' + filter[v.name] + '%'
                }
            }
        })


        if (Object.keys(filterarr).length == 0 && !this.state.is_jabatan_saved) {
            is_not_request = true
        }


        if (is_not_request) {
            this.setState({ list: [] })
            return
        }

        filterarr.id_group = this.state.other_state.id_group
        if (is_jabatan_saved) {
            filterarr.is_jabatan_saved = true
        }

        const fltr = {
            filter: {
                ...datafilter,
                filter: filterarr,
                order
            },
        }

        fltr.filter.filter.show_unit = 1

        this.setState({ is_loading: true })
        const response = await this.model.get(fltr)
        this.setState({ is_loading: false })
        if (response.error || response.code) return

        const jabatan_saved = await this.handleGetJabatan()
        console.log('jabatan_saved');
        console.log(jabatan_saved);

        let list = []
        response.data.map(m => {
            let checked = false
            for (let x of jabatan_saved) {
                // if (x.id_jabatan == m.id_jabatan) {
                //     checked = true
                //     break
                // }
                if (x.id_jabatan == m.id_jabatan && x.nid.trim() == m.nid.trim()) {
                    console.log('JABATAN SAVED ITEM');
                    console.log(x);


                    checked = true
                    break
                }
            }
            m.checked = checked
            if (m.checked && is_jabatan_saved) {
                list.push(m)
            } else {
                list.push(m)
            }
        })

        console.log('list');
        console.log(list);


        this.setState(state => ({
            list: list.map(m => ({ ...m, id_tipe_unit: m?.code || '' })),
            datafilter: {
                ...state.datafilter,
                paginate: {
                    ...state.datafilter.paginate,
                    total_records: response.total_records
                }
            }
        }))
    }

    getreferensi = async () => {
        if (!this.model.relasi) return

        this.handleget_sys_group()
        for (let m in this.model.relasi) {
            const thismodel = this.model.relasi[m]
            const dataarr = await thismodel.getCombo()
            if (dataarr.error || dataarr.code) return

            let dataidx = {}
            dataarr.map(x => {
                dataidx[x.value] = x.label
            })

            this.setState(state => ({
                listreferensi: {
                    ...state.listreferensi,
                    [m]: dataidx
                },
            }))
        }

        this.setState(state => ({
            listreferensi: {
                ...state.listreferensi,
            },
            other_state: {
                ...state.other_state,
                checked_all: false,
                btn_loading_sync: false,
                id_group: '',
                is_loading_get_group: false,
                datajabatan: []
            }
        }))


    }

    handleChecked = (item, checked) => {
        let checked_all = true
        this.state.list.forEach(m => {
            // if (m.id_jabatan == item.id_jabatan) {
            //     m.checked = checked
            // }
            if (m.id_jabatan == item.id_jabatan && m.nid == item.nid) {
                m.checked = checked
            }

            if (!m.checked) {
                checked_all = false
            }
        })
        this.setState(state => ({
            list: this.state.list,
            other_state: {
                ...state.other_state,
                checked_all
            },
        }))
    }

    handleCheckedAll = (checked) => {
        // console.log(checked);
        // return
        this.state.list.forEach(m => {
            m.checked = checked
        })

        // console.log('this.state.list');
        // console.log(this.state.list);

        this.setState(state => ({
            list: this.state.list,
            other_state: {
                ...state.other_state,
                checked_all: checked
            },
        }))
    }

    handleget_sys_group = async () => {
        const { filter, order, datafilter } = this.state
        var filterarr = {}

        const response = await this.sys_groupModel.getCombo({
            filter: {
                ...datafilter,
                filter: filterarr,
                order
            },
        })
        if (response.error || response.code) return
        console.log('response=>sys_group');
        console.log(response);

        this.setState(state => ({
            listreferensi: {
                ...state.listreferensi,
                id_group: response
            },
        }))
    }

    handleGetJabatan = async () => {

        const { filter, order, datafilter } = this.state
        var filterarr = {}
        filterarr.id_group = this.state.other_state.id_group

        // let id_jabatan_arr = []
        // this.state.list.map(m => {
        //     id_jabatan_arr.push(m.id_jabatan)
        // })
        // filterarr.id_jabatan = id_jabatan_arr.join(',')

        const { getapi_services } = api_services({
            api_path: "/get_jabatan",
        });

        // this.setState(state => ({
        //     other_state: {
        //         ...state.other_state,
        //         is_loading_get_group: true
        //     },
        // }))
        const response = await getapi_services({
            filter: {
                ...datafilter,
                paginate: {
                    page: 1,
                    pagesize: 10000
                },
                filter: filterarr
            }
        });
        // this.setState(state => ({
        //     other_state: {
        //         ...state.other_state,
        //         is_loading_get_group: false
        //     },
        // }))
        if (response.error || response.code) return
        // console.log('response=>handleGetJabatan');
        // console.log(response);
        // if(!response.id_jabatan) return

        // this.state.list.forEach(m => {
        //     let checked = false
        //     for (let x of response.data) {
        //         if (x.id_jabatan == m.id_jabatan) {
        //             checked = true
        //             break
        //         }
        //     }
        //     m.checked = checked
        // })

        // console.log('this.state.list');
        // console.log(this.state.list);


        // this.setState(state => ({
        //     list: this.state.list,
        //     // other_state: {
        //     //     ...state.other_state,
        //     //     datajabatan: response.data
        //     // }
        // }))

        return response.data

    };

    handleSaveJabatan = async () => {

        if (!this.state.other_state.id_group) {
            showToastr('error', 'User group harus dipilih!')
            return
        }
        const { postapi_services } = api_services({
            api_path: "/update_jabatan",
        });

        // console.log('handleSaveJabatan');
        // console.log(this.state.other_state.id_group);
        // console.log(this.state.list);

        let data = []

        this.state.list.forEach(m => {
            data.push({
                id_group: this.state.other_state.id_group,
                id_jabatan: m.id_jabatan,
                checked: m.checked ? true : false,
                nid: m.nid
            })

        })
        const body = {
            data,
        };

        // console.log('body');
        // console.log(body);
        // return


        this.setState({ btn_loading: true })
        const response = await postapi_services({
            ...body,
            alertSuccess: 'Jabatan berhasil disimpan!'
        });
        this.setState({ btn_loading: false })

        if (response.code || response.error) return

    };

    handleSyncJabatan = async () => {
        const { postapi_services } = api_services({
            api_path: "/update_jabatan",
        });
        this.setState({ btn_loading_sync: true })
        const response = await postapi_services({
            ...body,
            alertSuccess: 'Sinkoronisasi jabatan berhasil!'
        });
        this.setState({ btn_loading_sync: false })

        if (response.code || response.error) return


    };

    sync = async () => {
        const { getapi_services } = api_services({ api_path: `/sync` })

        this.setState({ btn_loading_sync: true })
        const response = await getapi_services({})
        this.setState({ btn_loading_sync: false })

        if (response.code || response.error) return
        showToastr('success', 'Sinkoronisasi jabatan berhasil!')
    }

    handlegetmt_sdm_dit_bid = async (inputValue, callback) => {

        let datafilter = {
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000
                },
                filter: {}
            }
        }

        if (this.state.filter.id_unit) {
            datafilter.filter.filter.id_unit = this.state.filter.id_unit
        }

        if (inputValue && callback) {
            datafilter.filter.filter = {
                nama: inputValue
            }
        }

        let dataarr = await this.mt_sdm_dit_bidModel.getCombo(datafilter)
        if (dataarr.error || dataarr.code) return

        let datalist = {}
        for (let m of dataarr) {
            datalist[m.value] = m.label
        }

        if (inputValue && callback) {
            callback(dataarr)
        } else {
            this.setState(state => ({
                listcombo: {
                    ...state.listcombo,
                    id_dit_bid: dataarr,
                },
                listreferensi: {
                    ...state.listreferensi,
                    id_dit_bid: datalist
                }
            }))


        }
    }

    handlegetmt_sdm_subbid = async (inputValue, callback) => {

        let datafilter = {
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 10000
                },
                filter: {}
            }
        }

        if (this.state.filter.id_unit) {
            datafilter.filter.filter.id_unit = this.state.filter.id_unit
        }
        if (this.state.filter.id_dit_bid) {
            datafilter.filter.filter.id_dit_bid = this.state.filter.id_dit_bid
        }

        if (inputValue && callback) {
            datafilter.filter.filter = {
                nama: inputValue
            }
        }

        let dataarr = await this.mt_sdm_subbidModel.getCombo(datafilter)
        if (dataarr.error || dataarr.code) return

        let datalist = {}
        for (let m of dataarr) {
            datalist[m.value] = m.label
        }

        if (inputValue && callback) {
            callback(dataarr)
        } else {
            this.setState(state => ({
                listcombo: {
                    ...state.listcombo,
                    id_subbid: dataarr,
                },
                listreferensi: {
                    ...state.listreferensi,
                    id_subbid: datalist
                }
            }))


        }
    }

    render() {
        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={[]
                        // Object.keys(this.state.access_method).length > 0 ? this.state.access_method.btn_top : []
                    }
                // onAdd={() => {
                //     this.id = null
                //     this.setState({ showModal: true, path: 'add' })
                // }}
                />
                <div className="container pl-4 pr-4">
                    <div className="table-responsive">
                        <div className="row mb-3">
                            <div className="col-md-5 d-flex align-items-end">
                                <div className="flex-1">

                                    <FormGroup
                                        label={this.state.other_state.is_loading_get_group ? "Loading..." : "User Group"}
                                        required={true}
                                        formCol
                                        noMb
                                    >
                                        <div className="col">

                                            <InputSelect
                                                ref={null}
                                                id='id_group'
                                                type='select'
                                                placeholder={'Pilih...'}
                                                className='block mt-1 w-full'
                                                data={this.state.listreferensi.id_group ? this.state.listreferensi.id_group : []}
                                                required={false}
                                                isClearable
                                                isMulti={false}
                                                value={this.state.other_state && this.state.other_state.id_group ? this.state.other_state.id_group : ''}
                                                onChange={value => this.setState(state => ({
                                                    other_state: {
                                                        ...state.other_state,
                                                        id_group: value
                                                    }
                                                }), this.get)}

                                                disabled={this.state.is_disabled}

                                            />

                                        </div>
                                    </FormGroup>
                                </div>

                                {this.state.other_state.id_group ? (
                                    <div className="d-flex">
                                        <label className='ms-3 d-flex flex-row'>
                                            <input
                                                type="checkbox"
                                                checked={this.state.is_jabatan_saved}
                                                value={''}
                                                onChange={e => {
                                                    this.setState({ is_jabatan_saved: e.target.checked }, () => {
                                                        this.get()
                                                    })
                                                }}
                                                className="me-2"
                                            />
                                            Jabatan yang sudah diberi akses
                                        </label>

                                    </div>
                                ) : null}


                            </div>
                            <div className="col-md-7 d-flex justify-content-end align-items-end">
                                <Button
                                    className="btn-default-app height-same-input bg-warning"
                                    disabled={this.state.btn_loading_sync}
                                    onClick={this.sync}
                                >
                                    {this.state.btn_loading_sync ? (
                                        "Loading..."
                                    ) : (
                                        <>
                                            <span className="material-icons icon-btn-left">
                                                sync
                                            </span>
                                            Sync
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <table className="w-full table table-auto border-collapse border">
                            <thead>
                                <TableHeadCheckbox
                                    data={this.headers ? this.headers : []}
                                    access_role={[]}
                                    referensi={this.state.listreferensi}
                                    onChange={(key, value) => {
                                        // const { filter } = this.state
                                        // this.setState({
                                        //     filter: {
                                        //         ...filter,
                                        //         [key]: value,
                                        //     }
                                        // }, () => {
                                        //     this.get()

                                        //     if(key == 'id_unit') {
                                        //         this.handlegetmt_sdm_dit_bid()
                                        //         this.handlegetmt_sdm_subbid()
                                        //     }
                                        // });

                                        this.setState(state => ({
                                            filter: {
                                                ...state.filter,
                                                [key]: value,
                                            }
                                        }), () => {
                                            this.get()

                                            if (key == 'id_unit') {
                                                this.handlegetmt_sdm_dit_bid()
                                                this.handlegetmt_sdm_subbid()
                                            }
                                            if (key == 'id_dit_bid') {
                                                this.handlegetmt_sdm_subbid()
                                            }
                                        })
                                    }}
                                    setOrder={(v) => {
                                        this.setState({ order: v }, () => this.get())
                                    }}
                                    checkboxDisabled={this.state.list.length > 0 ? false : true}
                                    onChecked={this.handleCheckedAll}
                                    checked={this.state.other_state.checked_all ? this.state.other_state.checked_all : false}
                                />
                            </thead>
                            <tbody>
                                {this.state.list.map((m, i) => (
                                    <tr key={i}>
                                        <td className='border text-center'>
                                            {/* {(parseInt(this.state.datafilter.paginate.page) - 1) *
                                                parseInt(this.state.datafilter.paginate.pagesize) +
                                                i +
                                                1} */}

                                            <input type="checkbox" checked={m.checked} value={''} onChange={e => {
                                                this.handleChecked(m, e.target.checked)
                                            }} />
                                        </td>

                                        {this.headers.map((x, k) => (
                                            <td key={k} className={`border ${x.type == 'decimal' ? 'text-end' : ''}`}>
                                                {x.type == 'list'
                                                    ? (
                                                        <>
                                                            {x.name == 'id_tipe_unit' ? (
                                                                <>
                                                                    {this.state.listreferensi?.[x.name]?.[m['id_type_unit']] || ''}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {this.state.listreferensi[x.name]
                                                                        ? this.state.listreferensi[x.name][
                                                                        m[x.name]
                                                                        ]
                                                                        : null}
                                                                </>
                                                            )}
                                                        </>
                                                    )
                                                    : (
                                                        <>
                                                            {x.name == 'nama' ? (
                                                                // <div className="color-link cursor-pointer" onClick={() => {
                                                                //     this.id = m[this.model.primaryKey]
                                                                //     this.setState({ showModal: true, path: 'detail' })
                                                                // }}>
                                                                // </div>
                                                                <>
                                                                    {m['nama']}
                                                                </>
                                                            ) : x.name == 'nama_pegawai' ? (
                                                                <>
                                                                    {m.nid} {m.nama_pegawai}
                                                                </>
                                                            ) : m[x.name]}
                                                        </>
                                                    )}
                                            </td>
                                        ))}


                                        <td className="border">
                                            <div className="flex align-center justify-end td-action">
                                                {/* <EditDelete
                                                    data={
                                                        this.state.access_method.editdelete
                                                            ? this.state.access_method.editdelete
                                                            : []
                                                    }
                                                    id={m[this.model.primaryKey]}
                                                    onDelete={() => this.delete(m[this.model.primaryKey])}
                                                    onEdit={() => {
                                                        this.id = m[this.model.primaryKey]
                                                        this.setState({ showModal: true, path: 'edit' })
                                                    }}
                                                /> */}
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        paginate={this.state.datafilter.paginate}
                        onPageClick={(page) => {
                            const { datafilter } = this.state
                            this.setState({
                                datafilter: {
                                    ...datafilter,
                                    paginate: {
                                        ...datafilter.paginate,
                                        page: page.selected + 1,
                                    },
                                }
                            }, () => this.get());
                        }}
                    />

                    {this.state.list.length > 0 ? (
                        <div className="d-flex justify-content-end">
                            <Button
                                className="btn-default-app bg-success height-same-input"
                                disabled={this.state.btn_loading}
                                onClick={this.handleSaveJabatan}
                            >
                                {this.state.btn_loading ? (
                                    "Loading..."
                                ) : (
                                    <>
                                        <span className="material-icons icon-btn-left">
                                            save
                                        </span>
                                        Save
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : null}

                    <div className="height70"></div>

                </div>


                {this.modaldetail(
                    <Mt_sdm_jabatanedit
                        params={{
                            id: this.id,
                            slug: [this.state.path, this.id]
                        }}
                        router={this.props.router}
                        pathname={`${this.props.pathname}/${this.state.path}/${this.id}`}
                        pathaccess={this.props.pathaccess}
                        onLoad={() => {
                            this.setState({ showModal: false })
                            this.get()
                        }}
                    />
                )}


            </>
        );
    }

}

export default Akses_jabatan


