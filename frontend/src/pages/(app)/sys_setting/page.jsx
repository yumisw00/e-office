"use client"

import BtnGroup from "components/BtnGroup";
import TableHead from "components/TableHead";
import Pagination from "components/Pagination";
import BtnIconAct from "components/BtnIconAct";
import sys_settingModel from "hooks/models/sys_settingModel";
import Sys_settingedit from "./[...slug]/page";
import IndexPage from "../IndexPage";


class Sys_setting extends IndexPage {
    titlePage = "Setting"
    model = new sys_settingModel()
    headers = [

        { name: "nama", label: "Nama", width: "auto", type: "string" },

        { name: "isi", label: "Isi", width: "auto", type: "string" },

    ]
    render() {
        return (
            <>
                <div className="container pl-4 pr-4">
                    <div className="d-flex justify-content-end mb-3">
                        <BtnGroup
                            btn_top
                            data={
                                Object.keys(this.state.access_method).length > 0
                                    ? this.state.access_method.btn_top.map(button => ({
                                        ...button,
                                        label: button.label === 'Add' ? 'Tambah' : button.label,
                                    }))
                                    : []
                            }
                            onAdd={() => {
                                this.id = null
                                this.setState({ showModal: true, path: 'add' })
                            }}
                        />
                    </div>





                    <div className="table-responsive">
                        <table className="w-full table table-auto border-collapse border">
                            <thead>
                                <TableHead
                                    data={this.headers ? this.headers : []}
                                    actionWidth={96}
                                    access_role={[]}
                                    referensi={this.state.listreferensi}
                                    onChange={(key, value) => {
                                        const { filter } = this.state
                                        this.setState(state => ({
                                            filter: {
                                                ...state.filter,
                                                [key]: value,
                                            },
                                            datafilter: {
                                                ...state.datafilter,
                                                paginate: {
                                                    ...state.datafilter.paginate,
                                                    page: 1
                                                }
                                            }
                                        }), () => this.get());
                                    }}
                                    setOrder={(v) => {
                                        this.setState({ order: v }, () => this.get())
                                    }}
                                    showfilter={false}
                                />
                            </thead>
                            <tbody>
                                {this.state.list.map((m, i) => (
                                    <tr key={i}>
                                        <td className='border text-center'>
                                            {(parseInt(this.state.datafilter.paginate.page) - 1) *
                                                parseInt(this.state.datafilter.paginate.pagesize) +
                                                i +
                                                1}
                                        </td>

                                        {this.headers.map((x, k) => (
                                            <td key={k} className={`border ${x.type == 'decimal' ? 'text-end' : ''}`}>
                                                {x.type == 'list'
                                                    ? this.state.listreferensi[x.name]
                                                        ? this.state.listreferensi[x.name][
                                                        m[x.name]
                                                        ]
                                                        : null
                                                    : (
                                                        <>
                                                            {x.name == 'nama' ? (
                                                                <div className="color-link cursor-pointer" onClick={() => {
                                                                    this.id = m[this.model.primaryKey]
                                                                    this.setState({ showModal: true, path: 'detail' })
                                                                }}>
                                                                    {m['nama']}
                                                                </div>
                                                            ) : m[x.name]}
                                                        </>
                                                    )}
                                            </td>
                                        ))}


                                        <td className="border" style={{ width: 96, minWidth: 96, padding: "8px 6px" }}>
                                            <div className="flex align-center justify-center td-action" style={{ gap: 6 }}>
                                                <BtnIconAct
                                                    className="btn-warning"
                                                    icon="edit"
                                                    onTap={() => {
                                                        this.id = m[this.model.primaryKey]
                                                        this.setState({ showModal: true, path: 'edit' })
                                                    }}
                                                />
                                                <BtnIconAct
                                                    className="btn-danger"
                                                    icon="delete"
                                                    onTap={() => {
                                                        if (confirm('Yakin menghapus data ini?')) {
                                                            this.delete(m[this.model.primaryKey])
                                                        }
                                                    }}
                                                />
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



                    {/* <div style={{ overflowX: 'unset' }}>
                        <div>
                            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                                <thead>
                                    <tr>
                                        {Array.from({ length: 20 }, (_, i) => (
                                            <th
                                                key={i}
                                                style={{
                                                    border: '1px solid black',
                                                    height: 200,
                                                    minWidth: 150,
                                                    position: "sticky",
                                                    top: 0,
                                                    background: "white", // penting biar gak ketimpa isi tabel
                                                    zIndex: 2,           // biar selalu di atas
                                                }}
                                            >
                                                Col ke: {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 20 }, (_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 20 }, (_, j) => (
                                                <td
                                                    key={j}
                                                    style={{
                                                        minWidth: 150,
                                                        height: 50,
                                                    }}
                                                >
                                                    Row {i + 1}, Col {j + 1}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    <div className="height70"></div> */}

                </div>

                {this.modaldetail(
                    <Sys_settingedit
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

export default Sys_setting


