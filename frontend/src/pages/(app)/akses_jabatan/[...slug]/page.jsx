"use client"

import Button from 'components/Button';
import Input from 'components/Input';
import InputSelect from 'components/InputSelect';
import InputCheckbox from 'components/InputCheckbox';
import InputNumeric from 'components/InputNumeric';
import InputRadio from 'components/InputRadio';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import mt_sdm_jabatanModel from "hooks/models/mt_sdm_jabatanModel";


class Mt_sdm_jabatanedit extends EditPage {
    model = new mt_sdm_jabatanModel()

    render() {
        return (
            <>

                <div className='row'>
                 
                
        <div className="col-sm-6">
                <FormGroup
						label={"Nama"}
						required={true}
						message_error={this.state.errors.nama}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <Input
            ref={null}
            id='nama'
            type='textarea'
            placeholder={'Nama'}
            className='block mt-1 w-full'
            value={this.state.datainsert.nama}
            onChange={value => this.handleChange('nama', value)}
            message_error={this.state.errors.nama}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Unit "}
						required={false}
						message_error={this.state.errors.id_unit}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <InputSelect
            ref={null}
            id='id_unit'
            type='select'
            placeholder={'Pilih...'}
            className='block mt-1 w-full'
            data={this.state.listreferensi.id_unit ? this.state.listreferensi.id_unit : []}
            required={false}
            isClearable
            isMulti={false}
            value={this.state.datainsert.id_unit}
            onChange={value => this.handleChange('id_unit', value)}
            message_error={this.state.errors.id_unit}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Position Id "}
						required={false}
						message_error={this.state.errors.position_id}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <Input
            ref={null}
            id='position_id'
            type='text'
            placeholder={'Position Id '}
            className='block mt-1 w-full'
            value={this.state.datainsert.position_id}
            onChange={value => this.handleChange('position_id', value)}
            message_error={this.state.errors.position_id}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Tgl Mulai Efektif "}
						required={false}
						message_error={this.state.errors.tgl_mulai_efektif}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <Input
            ref={null}
            id='tgl_mulai_efektif'
            type='date'
            placeholder={'Tgl Mulai Efektif '}
            className='block mt-1 w-full'
            value={this.state.datainsert.tgl_mulai_efektif}
            onChange={value => this.handleChange('tgl_mulai_efektif', value)}
            message_error={this.state.errors.tgl_mulai_efektif}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Tgl Akhir Efektif "}
						required={false}
						message_error={this.state.errors.tgl_akhir_efektif}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <Input
            ref={null}
            id='tgl_akhir_efektif'
            type='date'
            placeholder={'Tgl Akhir Efektif '}
            className='block mt-1 w-full'
            value={this.state.datainsert.tgl_akhir_efektif}
            onChange={value => this.handleChange('tgl_akhir_efektif', value)}
            message_error={this.state.errors.tgl_akhir_efektif}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Jabatan Parent "}
						required={false}
						message_error={this.state.errors.id_jabatan_parent}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <Input
            ref={null}
            id='id_jabatan_parent'
            type='number'
            placeholder={'Jabatan Parent '}
            className='block mt-1 w-full'
            value={this.state.datainsert.id_jabatan_parent}
            onChange={value => this.handleChange('id_jabatan_parent', value)}
            message_error={this.state.errors.id_jabatan_parent}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Superior Id "}
						required={false}
						message_error={this.state.errors.superior_id}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <Input
            ref={null}
            id='superior_id'
            type='text'
            placeholder={'Superior Id '}
            className='block mt-1 w-full'
            value={this.state.datainsert.superior_id}
            onChange={value => this.handleChange('superior_id', value)}
            message_error={this.state.errors.superior_id}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Urutan"}
						required={false}
						message_error={this.state.errors.urutan}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <InputNumeric
            ref={null}
            id='urutan'
            type='text'
           placeholder={'Urutan'}
           className='block mt-1 w-full'
            value={this.state.datainsert.urutan}
            onChange={value => this.handleChange('urutan', value)}
            message_error={this.state.errors.urutan}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
        <div className="col-sm-6">
                <FormGroup
						label={"Direktorat "}
						required={false}
						message_error={this.state.errors.is_direktorat}
						disabled={this.state.is_disabled}
					>
						<div className="col">
        
            <InputCheckbox
            ref={null}
            id='is_direktorat'
            type='checkbox'
            placeholder={'Direktorat '}
            data={[{label: 'Ya', value: '1'}]}
            value={this.state.datainsert.is_direktorat}
            className='block mt-1 w-full'
            onChange={value => this.handleChange('is_direktorat', value)}
            message_error={this.state.errors.is_direktorat}
            onError={this.handleErrors}
            disabled={this.state.is_disabled}
        />
            
   </div>
                        </FormGroup>
                    </div>
			
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

export default Mt_sdm_jabatanedit