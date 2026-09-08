import { go_logout, initFilterUrl, showToastr } from "pages/Utils";
import axios from "lib/axios";


// BaseModel.js
class Model {
    primaryKey = null;
    api_path = ''
    allowedFields = []
    datafilter = {
        paginate: {
            page: 1,
            pagesize: 10000
        }
    }

    relasi = null
    headers = []

    controller = {}

    get = async (props) => {

        const url = initFilterUrl({
            url: `/api/${this.api_path}`,
            filter: props.filter ? props.filter : props.datafilter,
        });

        if (this.controller[this.api_path]) this.controller[this.api_path].abort();
        this.controller[this.api_path] = new AbortController();

        return await axios
            .get(url, {
                ...props,
                signal: this.controller[this.api_path].signal,
            })
            .then((res) => res.data)
            .catch((error) => {

                if (error.response && error.response.status && error.response.status == 403) {
                    go_logout()
                    return
                }

                if (error.response == undefined) return { error };
                else return error.response.data;
            });
    }

    getId = async (id) => {
        const url = `/api/${this.api_path}/${id}`

        return await axios
            .get(url)
            .then((res) => {
                return res.data;
            })
            .catch((error) => {
                let msgerror = 'Ambil data gagal!'
                if (error.response.data.error && error.response.data.messages && error.response.data.messages.errors) {
                    msgerror += `. ${error.response.data.messages.errors}`
                }
                showToastr("error", msgerror);
                return error.response.data;

            });
    }

    create = async ({ setErrors, disabledAlert, ...props }) => {
        const url = `/api/${this.api_path}`
        if (setErrors) {
            setErrors([]);
        }

        return await axios
            .post(url, props, {
                timeout: 30000,
            })
            .then((res) => {
                if (!disabledAlert) {
                    showToastr("success", "Tambah data berhasil!");
                }
                return res.data;
            })
            .catch((error) => {
                const responseData = error.response?.data || { error };
                let msgerror = responseData.message || "Tambah data gagal!"
                if (responseData.errors) {
                    msgerror += `. ${Object.values(responseData.errors).flat().join(' ')}`
                } else if (responseData.error && responseData.messages && responseData.messages.errors) {
                    msgerror += `. ${responseData.messages.errors}`
                } else if (!error.response) {
                    msgerror += `. Backend tidak merespons atau koneksi terputus.`
                }

                showToastr("error", msgerror);

                if (responseData.errors && setErrors) {
                    setErrors(responseData.errors);
                }
                return responseData;
            });
    }

    update = async (id, { setErrors, disabledAlert, ...props }) => {
        if (setErrors) {
            setErrors([]);
        }

        let url = `/api/${this.api_path}/${id}`;

        if (this.controller[this.api_path]) this.controller[this.api_path].abort();
        this.controller[this.api_path] = new AbortController();

        return await axios
            .put(url, props, {
                signal: this.controller[this.api_path].signal,
            })
            .then((res) => {
                if (!disabledAlert) {
                    showToastr("success", "Ubah data berhasil!");
                }
                return res.data;
            })
            .catch((error) => {
                let msgerror = "Ubah data gagal!"
                if (error.response.data.error && error.response.data.messages && error.response.data.messages.errors) {
                    msgerror += `. ${error.response.data.messages.errors}`
                }
                showToastr("error", msgerror);

                if (error.response.data.errors && setErrors) {
                    setErrors(error.response.data.errors);
                }
                return error.response.data;
            });
    }

    delete = async (id) => {
        let url = `/api/${this.api_path}/${id}`;

        return await axios
            .delete(url)
            .then((res) => {
                showToastr("success", "Hapus data berhasil!");
                return res.data;
            })
            .catch((error) => {
                // console.log('error');
                // console.log(error);

                let msgerror = "Hapus data gagal!"
                if (error.response.data.error && error.response.data.messages && error.response.data.messages.errors) {
                    msgerror += `. ${error.response.data.messages.errors}`
                }
                showToastr("error", msgerror);
                return error.response.data;
            });
    }

    getCombo = async (props) => {
        const url = initFilterUrl({
            url: `/api/${this.api_path}`,
            filter: props && props.filter ? props.filter : this.datafilter,
        });

        return await axios
            .get(url)
            .then((res) => {
                let dataarr = []
                res.data.data.map(m => {
                    dataarr.push({ ...m, label: m.nama, value: m[this.primaryKey] })
                })
                return dataarr
            })
            .catch((error) => {
                if (error.response == undefined) return { error };
                else return error.response.data;
            });
    }

    getComboIdx = async (props) => {
        const url = initFilterUrl({
            url: `/api/${this.api_path}`,
            filter: props && props.filter ? props.filter : this.datafilter,
        });

        return await axios
            .get(url)
            .then((res) => {
                let dataarr = {}
                res.data.data.map(m => {
                    dataarr[m[this.primaryKey]] = m.nama
                })
                return dataarr
            })
            .catch((error) => {
                if (error.response == undefined) return { error };
                else return error.response.data;
            });
    }

    getComboAndIdx = async (props) => {
        const url = initFilterUrl({
            url: `/api/${this.api_path}`,
            filter: props && props.filter ? props.filter : this.datafilter,
        });

        return await axios
            .get(url)
            .then((res) => {
                let dataarr = []
                let idx = {}
                res.data.data.map(m => {
                    dataarr.push({ ...m, label: m.nama, value: m[this.primaryKey] })
                    idx[m[this.primaryKey]] = m.nama
                })
                return { combo: dataarr, idx }
            })
            .catch((error) => {
                if (error.response == undefined) return { error };
                else return error.response.data;
            });
    }

}

export default Model;

// mt_risk_sikap_terhadap_risiko
// mt_sdm_unit
// mt_risk_jenis_risiko
// risk_jadwal_pelaporan
// mt_risk_agregasi_risiko_sasaran
//
// mt_risk_scope
// mt_sdm_unit
