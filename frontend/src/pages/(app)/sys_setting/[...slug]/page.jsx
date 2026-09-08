"use client"

import Button from 'components/Button';
import HeaderApp from 'components/HeaderApp';
import Input from 'components/Input';
import InputSelect from 'components/InputSelect';
import InputCheckbox from 'components/InputCheckbox';
import InputNumeric from 'components/InputNumeric';
import InputRadio from 'components/InputRadio';
import EditPage from 'pages/(app)/EditPage';
import FormGroup from 'components/FormGroup';
import sys_settingModel from "hooks/models/sys_settingModel";
import InputSelectAsync from 'components/InputSelectAsync';
import { api_services } from 'hooks/api_services';

const user_ttd = ['ttd_laporan_icofr_vp', 'ttd_laporan_icofr_kasat']

class Sys_settingedit extends EditPage {
	model = new sys_settingModel()
	constructor(props) {
		super(props)

		this.state = {
			access_method: [],
			is_loading: false,
			btn_loading: false,
			listreferensi: [],
			listcombo: [],
			datainsert: {},
			errors: {

			},
			is_disabled: false,
			path: '',
			other_state: {
				nid: '',
				nama: '',
				jabatan: '',
			}
		}
	}

	getreferensi = async () => {
		if (this.state.path == 'add') {
			this.handleGetJabatan()
		}

		if (!this.model.relasi) return
		for (let m in this.model.relasi) {
			const thismodel = this.model.relasi[m]
			const dataarr = await thismodel.getCombo()
			if (dataarr.error || dataarr.code) return
			this.setState(state => ({
				listcombo: {
					...state.listcombo,
					[m]: dataarr
				}
			}))
		}
	}

	handleGetJabatan = async (inputValue, callback, is_return) => {
		// console.log('this.handleGetJabatan');
		// console.log(inputValue);
		// console.log(column);


		const { filter, order, datafilter } = this.state
		var filterarr = {}

		// if (column == 'id_control_preparer') {
		// 	filterarr.id_group = id_group_preparer
		// } else {
		// 	filterarr.id_group = '10,2'

		// }

		if (inputValue && callback) {
			filterarr.nama = inputValue
		}

		let api_path = "/jabatan_and_pegawai"

		const { getapi_services } = api_services({
			api_path
		});

		const response = await getapi_services({
			filter: {
				paginate: {
					page: 1,
					pagesize: 20
				},
				filter: filterarr
			}
		});

		if (response.error || response.code) return

		let dataarr = []
		for (let m of response.data) {
			if (m.nid) {
				dataarr.push({ ...m, label: m.nama_pegawai, value: m.nid.trim() })
			}
		}

		this.setState(state => ({
			listcombo: {
				...state.listcombo,
				nid: dataarr
			}
		}))

		if (inputValue && callback) {
			callback(dataarr)
		}

		if (is_return) {
			return dataarr
		}

	};

	getid = async () => {
		if (!this.id) return
		const { datainsert } = this.state

		this.setState({ is_loading: true })
		const response = await this.model.getId(this.id)
		this.setState({ is_loading: false })

		if (response.error || response.code) return
		let data = {}
		for (let m in response) {
			if (this.model.allowedFields.includes(m)) {
				data[m] = response[m]
			}
		}

		if (user_ttd.includes(data.nama)) {
			const isi = JSON.parse(data.isi)
			let nid_arr = await this.handleGetJabatan(null, null, true)
			if (!nid_arr.some(m => m.nid == isi.nid)) {
				nid_arr.push({ ...isi, label: isi.nama, value: isi.nid })
			}
			this.setState(state => ({
				other_state: {
					...state.other_state,
					...isi
				},
				listcombo: {
					...state.listcombo,
					nid: nid_arr
				}
			}))
		}
		// console.log('getid')
		// console.log(data)
		this.setState({ datainsert: { ...datainsert, ...data } })

	}

	create = async () => {
		const { datainsert, other_state } = this.state

		let body = {
			...datainsert
		}

		if (user_ttd.includes(body.nama)) {
			let isi = {}
			isi.nid = other_state.nid
			isi.nama = other_state.nama
			isi.jabatan = other_state.jabatan

			body.isi = JSON.stringify(isi)
		}

		this.setState({ btn_loading: true })
		const response = await this.model.create({ setErrors: this.setErrors, ...body })
		this.setState({ btn_loading: false })
		if (response.error || response.code) return

		this.props.router.push(`/${this.props.pathaccess}`)

		// khusus untuk crud popup
		if (this.props.onLoad) {
			this.props.onLoad()
		}
	}

	update = async () => {
		const { datainsert, other_state } = this.state
		let body = {
			...datainsert
		}

		if (user_ttd.includes(body.nama)) {
			let isi = {}
			isi.nid = other_state.nid
			isi.nama = other_state.nama
			isi.jabatan = other_state.jabatan

			body.isi = JSON.stringify(isi)
		}

		this.setState({ btn_loading: true })
		const response = await this.model.update(this.id, { setErrors: this.setErrors, ...body })
		this.setState({ btn_loading: false })

		if (response.error || response.code) return

		this.props.router.push(`/${this.props.pathaccess}`)

		// khusus untuk crud popup
		if (this.props.onLoad) {
			this.props.onLoad()
		}
	}

	render() {
		const isStandalone = !this.props.onLoad
		const pagePath = this.props.params?.slug?.[0]
		const formTitle = pagePath === 'add'
			? ''
			: pagePath === 'edit'
				? 'Edit Konfigurasi'
				: 'Detail Konfigurasi'

		return (
			<>
				{isStandalone ? (
					<HeaderApp
						title={formTitle}
						is_loading={this.state.is_loading}
						data_btn={[{ icon: 'arrow_back', label: 'Kembali', url: `/${this.props.pathaccess}` }]}
					/>
				) : null}
				<div className={isStandalone ? 'container pl-4 pr-4 pt-3' : ''}>

				<div className='row'>

					<div className="col-sm-6">
						<FormGroup
							label={"Nama"}
							required
							message_error={this.state.errors.nama}
							disabled={this.state.is_disabled}
						>
							<div className="col">

								<Input
									id="nama"
									type="text"
									placeholder={"Nama"}
									value={this.state.datainsert.nama}
									className="block mt-1 w-full"
									onChange={(value) => this.handleChange("nama", value)}
									required={true}
									message_error={this.state.errors.nama}
									onError={this.handleErrors}
									disabled={this.state.is_disabled}
								/>


							</div>
						</FormGroup>
					</div>


					<div className="col-sm-6">
						{user_ttd.includes(this.state.datainsert.nama) ? (
							<>
								<InputSelectAsync
									ref={null}
									id=''
									type='select'
									placeholder={'Pilih...'}
									className='block mt-1 w-full'
									data={this.state.listcombo?.nid || []}
									required={false}
									isMulti={false}
									value={this.state.other_state.nid}
									onChange={(value) => {
										let item = {}
										for (let m of this.state.listcombo.nid) {
											if (m.value == value) {
												item = m
												break
											}
										}
										this.setState(state => ({
											other_state: {
												...state.other_state,
												nid: value,
												nama: item ? item.nama_pegawai : '',
												jabatan: item ? item.nama : ''
											}
										}))
									}}
									message_error={null}
									onError={() => null}
									disabled={this.state.is_disabled}
									loadOptions={(inputValue, callback) => this.handleGetJabatan(inputValue, callback)}
								/>
								{this.state.other_state.nid ? (
									<Input
										ref={null}
										id=''
										type='text'
										placeholder={'Jabatan'}
										className='block mt-1 w-full'
										required={false}
										isClearable
										isMulti={false}
										value={this.state.other_state.jabatan}
										onChange={(value) => {
											this.setState(state => ({
												other_state: {
													...state.other_state,
													jabatan: value
												}
											}))
										}}
										message_error={null}
										onError={() => null}
										disabled={this.state.is_disabled}

									/>
								) : null}
							</>
						) : (
							<FormGroup
								label={"Isi"}
								required
								message_error={this.state.errors.isi}
								disabled={this.state.is_disabled}
							>
								<div className="col">

									<Input
										id="isi"
										type="text"
										placeholder={"Isi"}
										value={this.state.datainsert.isi}
										className="block mt-1 w-full"
										onChange={(value) => this.handleChange("isi", value)}
										required={true}
										message_error={this.state.errors.isi}
										onError={this.handleErrors}
										disabled={this.state.is_disabled}
									/>


								</div>
							</FormGroup>
						)}
					</div>

				</div>


				{this.state.path !== "detail" ? (
					<div className="d-flex justify-content-end mt-3">
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
									Simpan
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

export default Sys_settingedit
