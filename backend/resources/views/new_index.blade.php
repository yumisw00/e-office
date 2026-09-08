"use client"

import HeaderApp from "components/HeaderApp";
import TableHead from "components/TableHead";
import Pagination from "components/Pagination";
import EditDelete from "components/EditDelete";
import {{$config->tableName}}Model from "hooks/models/{{$config->tableName}}Model";
import {{ucfirst($config->tableName)}}edit from "./[...slug]/page";
import IndexPage from "../IndexPage";
import LinkAddEdit from "components/LinkAddEdit";


class {{ucfirst($config->tableName)}} extends IndexPage {
    titlePage = "{!!$titlePageFrontend!!}"
    model = new {{$config->tableName}}Model()
    headers = [
    
        {!!$headersFrontend!!}
				
    ]
    render() {
        return (
            <>
                <HeaderApp
                    title={this.titlePage}
                    is_loading={this.state.is_loading}
                    data_btn={
                        Object.keys(this.state.access_method).length > 0 ? this.state.access_method.btn_top : []
                    }
                 
                />
                <div className="container pl-4 pr-4">
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
                                        <td key={k} className={`border ${x.type == 'decimal' ? 'text-end' : ''}`}>
                                            {x.type == 'list'
                                                ? this.state.listreferensi[x.name]
                                                    ? this.state.listreferensi[x.name][
                                                    m[x.name]
                                                    ]
                                                    : null
                                                : (
                                                    <>
                                                    {x.name == 'nama'  ? (
                                                        <LinkAddEdit 
                                                        label={m['nama']}
                                                        href={`/${ this.props.pathaccess }/detail/${ m[this.model.primaryKey] }`}
                                                        />
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
                                                    id={m[this.model.primaryKey]}
                                                
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

              
             
            </>
        );
    }

}

export default {{ucfirst($config->tableName)}}


