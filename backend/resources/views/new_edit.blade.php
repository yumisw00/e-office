"use client"

import Button from 'components/Button';
import Input from 'components/Input';
import InputSelect from 'components/InputSelect';
import InputCheckbox from 'components/InputCheckbox';
import InputNumeric from 'components/InputNumeric';
import InputRadio from 'components/InputRadio';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import {{$config->tableName}}Model from "hooks/models/{{$config->tableName}}Model";
import HeaderApp from 'components/HeaderApp';


class {{ucfirst($config->tableName)}}edit extends EditPage {
    model = new {{$config->tableName}}Model()
    titlePage = "{!!$titlePageFrontend!!}"

    render() {
        return (
            <>

            <HeaderApp
                    title={`${this.state.path === "add" ? "Tambah" : this.state.path === "edit" ? "Edit" : "Detail"
                        } ${this.titlePage}`}
                    is_loading={this.state.is_loading}
                    data_btn={
                        Object.keys(this.state.access_method).length > 0 ? this.state.access_method.btn_top : []
                    }
                />
     <div className='container pl-4 pr-4'>

                <div className='row'>
                 
                {!!$inputsFrontendnew!!}
			
                </div>

              
                {this.state.path !== "detail" ? (
                    <div className="d-flex justify-content-end">
                        <Button
                            className="btn-default-app"
                            disabled={this.state.btn_loading}
                            onClick={!this.id ? this.create : this.update}
                        >
                            {this.state.btn_loading ? (
                                "Loading..."
                            ) : (
                                <>
                                    <span className="material-icons icon-btn-left mr-1">
                                        save
                                    </span>
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                ) : null}

     </div>
            </>
        )
    }

}

export default {{ucfirst($config->tableName)}}edit