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


class {{ucfirst($config->tableName)}}edit extends EditPage {
    model = new {{$config->tableName}}Model()

    render() {
        return (
            <>

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
            </>
        )
    }

}

export default {{ucfirst($config->tableName)}}edit