import React, { Component, createRef, PureComponent } from "react";
import { initAccessMethod } from "pages/Utils";

class EditPage extends Component {
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
            other_state: {}
        }
    }
    model = null
    primaryKey = this.model ? this.model.primaryKey : null
    router = this.props.router
    pathname = this.props.pathname
    id = this.props.params.slug[1] ? this.props.params.slug[1] : null
    referensi_other = {}


    initialized = createRef(false);

    componentDidMount() {
        // console.log('this.props=>EditPage')
        // console.log(this.props)
        let datainsert = {}
        this.model.allowedFields.map(m => {
            datainsert[m] = ''
        })
        this.setState({ datainsert })
        if (!this.initialized.current) {
            this.init()
            this.initialized.current = true
        }
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updatePage(prevProps)

        // console.log('componentDidUpdate=>this.props');
        // console.log(prevProps);
        // console.log(this.props);

        if (prevProps.pathaccess == this.props.pathaccess && (prevProps.params.slug.length > 0 && this.props.params.slug.length > 0 && prevProps.params.slug[0] != this.props.params.slug[0])) {
            this.init()
        }

    }

    handleErrors = (column, message) => {
        this.setState({
            errors: {
                ...this.state.errors,
                [column]: message,
            }
        })
    }
    setErrors = errors => this.setState({ errors })
    handleChange(column, value) {
        this.setState(state => ({
            datainsert: {
                ...state.datainsert,
                [column]: value
            }
        }))
    }

    updatePage = (prevProps, prevState) => {
        if (prevProps.pathname !== this.props.pathname) {
            let path = this.props.pathname.includes('edit') ? 'edit' : this.props.pathname.includes('detail') ? 'detail' : null
            if (path) {
                this.init()
            }
        }
    }


    init = async () => {
        const { access_method, path } = await initAccessMethod(this.props.pathaccess, this.props.params);
        this.setState({ path, access_method, is_disabled: path === 'detail' ? true : false }, async () => {
            await this.getid()
            this.getreferensi()
            await this.getreferensi_other()
        })
    }

    getid = async () => {
        if (!this.id || this.state.path !== 'detail') return
        const { datainsert } = this.state

        this.setState({ is_loading: true })
        const response = await this.model.getId(this.id)
        this.setState({ is_loading: false })

        if (response.error || response.code) return

        // The backend returns { success: true, data: {...record fields...} }
        // so we must use response.data to get the actual record fields
        const record = response?.data ?? response
        let data = {}
        for (let m in record) {
            if (this.model.allowedFields.includes(m)) {
                data[m] = record[m]
            }
        }
        // console.log('getid')
        // console.log(data)
        this.setState({ datainsert: { ...datainsert, ...data } })

    }

    create = async () => {
        const { datainsert } = this.state

        let body = {
            ...datainsert
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
        const { datainsert } = this.state
        let body = {
            ...datainsert
        }

        this.setState({ btn_loading: true })
        const response = await this.model.update(this.id, { setErrors: this.setErrors, ...body })
        this.setState({ btn_loading: false })

        if (response.error || response.code) return

        // this.props.router.push(`/${this.props.pathaccess}`)

        // khusus untuk crud popup
        if (this.props.onLoad) {
            this.props.onLoad()
        }
    }

    getreferensi = async () => {
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

    getreferensi_other = async () => {
        if (Object.keys(this.referensi_other).length == 0) return
        for (let m in this.referensi_other) {
            const thismodel = this.referensi_other[m]
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
                listcombo: {
                    ...state.listcombo,
                    [m]: dataarr
                }
            }))
        }
    }
}

export default EditPage