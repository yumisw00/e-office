

"use client"


import HeaderApp from "components/HeaderApp";
import TableHead from "components/TableHead";
import Pagination from "components/Pagination";
import EditDelete from "components/EditDelete";
import IndexPopupPage from "../IndexPopupPage";
import {{$config->tableName}}Model from "hooks/models/{{$config->tableName}}Model";
import {{ucfirst($config->tableName)}}edit from "./[...slug]/page";



    
class {{ucfirst($config->tableName)}} extends IndexPopupPage {
    model = new {{$config->tableName}}Model()
    titlePage = "{!!$titlePageFrontend!!}"
    headers = [
    {!!$headersFrontend!!}
    ]

    render() {
        return (
        <>
            <HeaderApp title={this.titlePage} is_loading={this.is_loading} data_btn={Object.keys(access_method).length > 0 ? access_method.btn_top : []} />
            <div className='container pl-4 pr-4'>

            <div className="table-responsive">

                <table className="w-full table table-auto border-collapse border">
                    <thead>
                            <TableHead
                                    data={this.headers ? this.headers : []}
                                    access_role={[]}
                                    referensi={this.state.listreferensi}
                                    onChange={(key, value) => {
                                        const { filter } = this.state
                                        this.setState({
                                            filter: {
                                                ...filter,
                                                [key]: value,
                                            }
                                        }, () => this.get());
                                    }}
                                    setOrder={(v) => {
                                        this.setState({ order: v }, () => this.get())
                                    }}
                                />
                    </thead>
                    <tbody>
                        { this.state.list .map((m, i) => (
                            <tr key={i}>
                                <td className='border text-center'>
                                {(parseInt(this.state.datafilter.paginate.page) - 1) *
                                    parseInt(this.state.datafilter.paginate.pagesize) +
                                    i +
                                    1}
                                </td>
                            
                                {this.headers.map((x, k) => (
                                        <td key={k} className="border">
                                            {x.type == 'list'
                                                ? listreferensi[x.name]
                                                    ? listreferensi[x.name][
                                                    m[x.name]
                                                    ]
                                                    : null
                                                : (
                                                    <>
                                                    {x.name == 'nama'  ? (
                                                        <div className="color-link cursor-pointer" onClick={() => {
                                                this.id = m[this.primaryKey]
                                                this.setState({ showModal: true, path: 'detail' })
                                            }}>
                                                {m[this.primaryKey]}
                                            </div>
                                                    ) : m[x.name]}
                                                    </>
                                                )}
                                        </td>
                                    ))}
                         
                              
                                    <td className="border">
                                            <div className="flex align-center justify-end td-action">
                                                <EditDelete
                                                    data={
                                                        this.state.access_method.editdelete
                                                            ? this.state.access_method.editdelete
                                                            : []
                                                    }
                                                    id={m[this.primaryKey]}
                                                    onDelete={() => this.delete(m[this.primaryKey])}
                                                    onEdit={() => {
                                                        this.id = m[this.primaryKey]
                                                        this.setState({ showModal: true, path: 'edit' })
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

            </div>

            {this.modaldetail(
                    <{{ucfirst($config->tableName)}}edit
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
    )
    }

}

export default {{ucfirst($config->tableName)}}


