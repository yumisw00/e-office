import axios from "lib/axios";
import { initFilterUrl, initFilterUrlLikelihood, showToastr } from "pages/Utils";

const api_axios = "/api";
var controller = {};

export const api_services = ({ api_path } = {}) => {
  // const [cancel, setcancel] = useState(null)

  const csrf = () => axios.get("/sanctum/csrf-cookie");
  // var controller = {};

  const getapi_services = async ({ setErrors, ...props }) => {

    if (setErrors) {
      setErrors([]);
    }

    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }

    const filter_url = initFilterUrl({
      url: `${api_axios}${urllocal}`,
      filter: props.filter,
    });

    if (controller[urllocal]) controller[urllocal].abort();

    controller[urllocal] = new AbortController();

    return await axios
      .get(filter_url, {
        ...props,
        signal: controller[urllocal].signal,

      })
      .then((res) => {
        return res.data
      })
      .catch((error) => {

        if (error.response == undefined) return { error };
        else return error.response.data;


      });
  };

  const getapi_services_likelihood = async ({ setErrors, ...props }) => {

    if (setErrors) {
      setErrors([]);
    }

    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }

    const filter_url = initFilterUrlLikelihood({
      url: `${api_axios}${urllocal}`,
      filter: props.filter,
    });

    if (controller[urllocal]) controller[urllocal].abort();

    controller[urllocal] = new AbortController();

    return await axios
      .get(filter_url, {
        ...props,
        signal: controller[urllocal].signal,

      })
      .then((res) => res.data)
      .catch((error) => {

        if (error.response == undefined) return { error };
        else return error.response.data;


      });
  };

  const getapi_servicesid = async ({ setErrors, ...props }) => {
    // await csrf()

    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }

    if (props.id) urllocal = urllocal + "/" + props.id;

    if (setErrors) {
      setErrors([]);
    }

    return await axios
      .get(`${api_axios}${urllocal}`, props)
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
  };

  const postapi_services = async ({ setErrors, disabledAlert, ...props }) => {


    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
      delete props.api_path;
    }
    if (setErrors) {
      setErrors([]);
    }

    let url = `${api_axios}${urllocal}`;
    if (props.customUrl) {
      url = `${api_axios}${props.customUrl}`;
      delete props.customUrl;
    }

    return await axios
      .post(url, props)
      .then((res) => {
        if (!disabledAlert) {
          showToastr("success", props.alertSuccess ? props.alertSuccess : "Tambah data berhasil!");
        }
        return res.data;
      })
      .catch((error) => {
        const responseData = error.response?.data || { success: false, error }

        if (!disabledAlert) {
          let msgerror = responseData.message || "Tambah data gagal!"
          if (responseData.errors) {
            msgerror += `. ${Object.values(responseData.errors).flat().join(' ')}`
          } else if (responseData.error && responseData.messages && responseData.messages.errors) {
            msgerror += `. ${responseData.messages.errors}`
          }

          showToastr("error", msgerror);
        }

        if (setErrors && responseData.errors) {
          setErrors(responseData.errors);
        }
        return responseData;

      });
  };

  const putapi_services = async ({ setErrors, ...props }) => {


    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }
    if (setErrors) {
      setErrors([]);
    }

    const id = props.id;
    delete props.id;
    delete props.api_path;

    let url = `${api_axios}${urllocal}`;
    if (props.customUrl) {
      url = `${api_axios}${props.customUrl}`;
      delete props.customUrl;
    }

    if (id) url = url + "/" + id;

    return await axios
      .put(`${url}`, props)
      .then((res) => {
        if (!props.disabledAlert) {
          showToastr("success", props.alertSuccess ? props.alertSuccess : "Ubah data berhasil!");
        }
        return res.data;
      })
      .catch((error) => {
        if (!props.disabledAlert) {
          let msgerror = "Ubah data gagal!"
          if (error.response.data.error && error.response.data.messages && error.response.data.messages.errors) {
            msgerror += `. ${error.response.data.messages.errors}`
          }
          showToastr("error", msgerror);
        }
        if (setErrors && error.response.data.error && error.response.data.errors) {
          setErrors(error.response.data.errors);
        }
        return error.response.data;

      });
  };

  const deleteapi_services = async ({ setErrors, ...props }) => {
    // await csrf()

    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }
    if (setErrors) {
      setErrors([]);
    }

    const id = props.id;
    delete props.id;

    return await axios
      .delete(`${api_axios}${urllocal}/${id}`, props)
      .then((res) => {
        if (!props.disabledAlert) {
          showToastr("success", "Hapus data berhasil!");
        }
        return res.data;
      })
      .catch((error) => {
        if (!props.disabledAlert) {
          // console.log('error');
          // console.log(error);

          let msgerror = "Hapus data gagal!"
          if (error.response.data.error && error.response.data.messages && error.response.data.messages.errors) {
            msgerror += `. ${error.response.data.messages.errors}`
          } else if (error.response.data.error && error.response.data.messages && error.response.data.messages.error) {
            msgerror += `. ${error.response.data.messages.error}`
          }
          showToastr("error", msgerror);
        }
        return error.response.data;

      });
  };

  const getapi_servicesid_return_url = async ({ setErrors, ...props }) => {
    // await csrf()

    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }

    if (props.id) urllocal = urllocal + "/" + props.id;

    if (setErrors) {
      setErrors([]);
    }

    return `${api_axios}${urllocal}`

    return await axios
      .get(`${api_axios}${urllocal}`, props)
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
  };

  const getapi_services_return_url = async ({ setErrors, ...props }) => {

    if (setErrors) {
      setErrors([]);
    }

    var urllocal = api_path;
    if (props.api_path) {
      urllocal = props.api_path;
    }

    const filter_url = initFilterUrl({
      url: `${api_axios}${urllocal}`,
      filter: props.filter,
    });

    // return ({ filter_url })

    return await axios
      .get(filter_url, {
        ...props,


      })
      .then((res) => {
        const resspo = {}
        resspo.res = res.data
        resspo.filter_url = filter_url

        return resspo;
      })
      .catch((error) => {

        if (error.response == undefined) return { error };
        else return error.response.data;


      });
  };

  const get_fetch = async ({ setErrors, ...props }) => {
    console.log('GETFETCH=>');
    console.log(props);
    
    return await fetch(`${import.meta.env.VITE_BACKEND_URL}api${api_path}`, {
      method: "GET",
      headers: {
        action: 'index',
        page: '',
      },
      credentials: 'include',
    });
  }

  return {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
    deleteapi_services,
    getapi_services_likelihood,
    getapi_services_return_url,
    getapi_servicesid_return_url,
    get_fetch
  };
};
