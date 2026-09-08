import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "components/Navigation";
import HeaderApp from "components/HeaderApp";
import {
  bulanIntToBulanText,
  bulanNumbValueVar,
  bulanTextValueVar,
  bulanTextVar,
  checkNotAuthorized,
  clearStorage,
  combokategoridampak,
  createTableHeader,
  formatDateApp,
  initAccessMethod,
  initBreadcrumbs,
  initMasterDB,
  nilaiDampakOtomatis,
  nilaiEksposurKualitatifOtomatis,
  nilaiEksposurOtomatis,
  skalaDampakOtomatis,
  skalaRisikoOtomatis,
} from "pages/Utils";
import InputSelect from "components/InputSelect";
import InputCheckbox from "components/InputCheckbox";
import InputNumeric from "components/InputNumeric";
import Input from "components/Input";
import Button from "components/Button";
import InputRadio from "components/InputRadio";
import { api_services } from "hooks/api_services";
import InputSelectAsync from "components/InputSelectAsync";
import InputSelectCombo from "components/InputSelectCombo";
import InputColumnMultiple from "components/InputColumnMultiple";
import InputSelectCreate from "components/InputSelectCreate";
import InputColumnMultipleMerge from "components/InputColumnMultipleMerge";
import { useSelector, useDispatch } from "react-redux";
import Modal from "react-bootstrap/Modal";
import {
  NilaiEksposurLevelRisikoQuarter,
  NilaiEksposurLevelRisikoViewOnly,
} from "pages/(app)/risk_profile_analisa_risiko_inheren/[id_register]/page";
import {
  htmlheaddampak,
  htmlheadexisting_control,
  htmlheadkri1,
  htmlheadkriNegatif,
  htmlheadkriPolaritasNull,
  htmlheadkriPositif,
  htmlheadkriStabilize,
  init_dampak,
  init_existing_control,
  init_kri_new,
  rules,
} from "pages/(app)/risk_profile/[id_register]/[...slug]/page";
import Accordion from "react-bootstrap/Accordion";
// risk profile end
import { rules as rules_analisa_risiko_inheren } from "pages/(app)/risk_profile_analisa_risiko_inheren/[id_register]/[...slug]/page";
import {
  q_init1,
  q_init2,
  q_init3,
  q_init4,
  quarter_init,
  rules as rules_analisa_risiko_residual,
} from "pages/(app)/risk_profile_analisa_risiko_residual/[id_register]/[...slug]/page";
import { rules as rules_rencana_perlakuan_risiko } from "pages/(app)/risk_profile_rencana_perlakuan_risiko/[id_register]/[...slug]/page";
import { combobulan, nl2br, rupiah } from "lib/helper";
import {
  htmlheadkrikuantitatif_realisasi,
  htmlheadrealisasi_perlakuan_risiko,
  init_kri,
  rules as rules_realisasi_pelaksanaan_perlakuan_risiko_dan_biaya,
} from "pages/(app)/risk_profile_realisasi_pelaksanaan_perlakuan_risiko_dan_biaya/[id_register]/[...slug]/page";
import { init_level_risiko } from "pages/(app)/risk_profile_realisasi_risiko_residual/[id_register]/[...slug]/page";

const DetailRiskProfile = (props) => {
  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
  } = api_services({});

  const [
    is_loading_id_risk_agregasi_risiko,
    setis_loading_id_risk_agregasi_risiko,
  ] = useState(false);
  const [risk_profile_data, setrisk_profile_data] = useState({});
  const [is_loading, setis_loading] = useState(false);
  const [errors, setErrors] = useState({});
  const is_disabled = true;
  const [id_tingkat_agregasi_risiko, setid_tingkat_agregasi_risiko] =
    useState("");
  const [jenis_param, setjenis_param] = useState("");
  const [master, setmaster] = useState({});
  const [datamt_risk_dampak, setdatamt_risk_dampak] = useState([]);
  const [datamt_risk_kemungkinan, setdatamt_risk_kemungkinan] = useState([]);
  const [risk_profile_and_master_loaded, setrisk_profile_and_master_loaded] =
    useState(false);

  const [nama, setnama] = useState("");
  const [id_penyebab, setid_penyebab] = useState([]);
  const [sasaran, setsasaran] = useState("");
  const [nilai_sasaran, setnilai_sasaran] = useState("");
  const [id_sasaran, setid_sasaran] = useState("");
  const [id_jenis_risiko, setid_jenis_risiko] = useState("");
  const [id_taksonomi, setid_taksonomi] = useState("");
  const [id_risiko, setid_risiko] = useState("");
  const [deskripsi, setdeskripsi] = useState("");
  const [is_kuantitatif, setis_kuantitatif] = useState("");
  const [existing_control, setexisting_control] = useState([]);
  const [id_kriteria_dampak, setid_kriteria_dampak] = useState("");
  const [dampak, setdampak] = useState([]);
  const [kri_new, setkri_new] = useState([]);
  const [tgl_risiko, settgl_risiko] = useState("");
  const [id_risk_agregasi_risiko, setid_risk_agregasi_risiko] = useState("");

  const [analisa_risiko_inheren_loading, setanalisa_risiko_inheren_loading] =
    useState(false);
  const [analisa_risiko_residual_loading, setanalisa_risiko_residual_loading] =
    useState(false);
  const [nama_register, setnama_register] = useState("");
  const [
    rencana_perlakuan_risiko_loading,
    setrencana_perlakuan_risiko_loading,
  ] = useState(false);
  const [
    realisasi_risiko_residual_loading,
    setrealisasi_risiko_residual_loading,
  ] = useState(false);
  const [
    realisasi_pelaksanaan_perlakuan_risiko_dan_biaya_loading,
    setrealisasi_pelaksanaan_perlakuan_risiko_dan_biaya_loading,
  ] = useState(false);

  useEffect(() => {
    if (risk_profile_data && master) {
      // console.log('setrisk_profile_and_master_loaded')
      // console.log('setrisk_profile_and_master_loaded')
      setrisk_profile_and_master_loaded(true);
    }
  }, [risk_profile_data, master]);

  const handleInit = () => {
    setjenis_param(props.risk_profile_item.jenis);
    handlegetrisk_profileid();
    handlegetrisk_registerid();
    handleInitMasterDB();

    handlegetid_sasaran();
    handlegetid_jenis_risiko();
    handlegetid_taksonomi();
    handlegetrisk_penyebab();
    handlegetrisk_dampak();
    handlegetmt_risk_jenis_control();
    handlegetmt_risk_efektifitas_control();
    handlegetmt_risk_kriteria_dampak();
  };

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handleInitMasterDB = async () => {
    let param = {
      func: getapi_services,
      id: props.risk_profile_item.id_register,
      tahun: props.tahun,
      jenis: props.risk_profile_item.jenis,
    };
    if (props.risk_profile_item.id_kriteria_dampak) {
      param.id_kriteria_dampak = props.risk_profile_item.id_kriteria_dampak;
    }
    const master = await initMasterDB(param);
    setmaster(master);

    if (!master) return false;

    let datamt_risk_dampak = [];
    let datamt_risk_kemungkinan = [];

    master.dampak.map((m) => {
      datamt_risk_dampak.push({
        label: m.nama,
        value: m.id_dampak,
        colorapply: m.warna,
      });
    });
    master.kemungkinan.map((m) => {
      datamt_risk_kemungkinan.push({
        label: m.nama,
        value: m.id_kemungkinan,
        colorapply: m.warna,
      });
    });

    setdatamt_risk_dampak(datamt_risk_dampak);
    setdatamt_risk_kemungkinan(datamt_risk_kemungkinan);

    return master;
  };

  // const handleInitMasterDB = async (id_kriteria_dampak) => {
  //   let param = {
  //     func: getapi_services,
  //     id,
  //     tahun,
  //     jenis: jenis_param,
  //   }
  //   if (id_kriteria_dampak) {
  //     param.id_kriteria_dampak = id_kriteria_dampak
  //   }
  //   const master = await initMasterDB(param);
  //   // console.log('master')
  //   // console.log(master)
  //   setmaster(master);

  //   if (!master) return false

  //   let datamt_risk_dampak = [];
  //   let datamt_risk_kemungkinan = [];

  //   master.dampak.map((m) => {
  //     datamt_risk_dampak.push({
  //       label: m.nama,
  //       value: m.id_dampak,
  //       colorapply: m.warna,
  //     });
  //   });
  //   master.kemungkinan.map((m) => {
  //     datamt_risk_kemungkinan.push({
  //       label: m.nama,
  //       value: m.id_kemungkinan,
  //       colorapply: m.warna,
  //     });
  //   });

  //   setdatamt_risk_dampak(datamt_risk_dampak);
  //   setdatamt_risk_kemungkinan(datamt_risk_kemungkinan);

  //   return master
  // };

  const handlegetrisk_profileid = async () => {
    // console.log('handlegetrisk_profileid')
    // console.log(path_param)
    // if (!id_profile) return
    // if (path_param != 'edit' && path_param != 'detail') return

    setis_loading(true);
    const response = await getapi_servicesid({
      api_path: `/risk_profile/${props.risk_profile_item.id_register}`,
      id: props.risk_profile_item.id_risk_profile,
    });
    // console.log('getrisk_profileid=>sidebar')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error) return;

    setsasaran(response.sasaran);
    setid_sasaran(response.id_sasaran);
    setnilai_sasaran(response.nilai_sasaran);
    setid_jenis_risiko(response.id_jenis_risiko);
    setid_taksonomi(response.id_taksonomi);

    setnama(response.nama);
    setdeskripsi(response.deskripsi);
    setis_kuantitatif(response.is_kuantitatif);
    settgl_risiko(response.tgl_risiko);
    setid_kriteria_dampak(response.id_kriteria_dampak);
    setid_risk_agregasi_risiko(response.id_risk_agregasi_risiko);

    setid_risiko({ label: response.nama, value: response.id_risiko });
    let id_penyebab = [];
    response.penyebab.map((m) => {
      id_penyebab.push({
        label: m.nama,
        value: m.id_penyebab,
        id_profile_penyebab: m.id_profile_penyebab,
      });
    });
    setid_penyebab(id_penyebab);

    // setkri_kualitatif(response.kri_kualitatif)
    // setkri_kuantitatif(response.kri_kuantitatif)

    let kri_new = [...response.kri_kualitatif, ...response.kri_kuantitatif];
    setkri_new(kri_new);

    setexisting_control(response.control);
    setdampak(response.dampak);

    setrisk_profile_data(response);

    // const masterres = await handleInitMasterDB(response.jenis == 1 && response.is_kuantitatif == 1 ? response.id_kriteria_dampak : null)

    handlegetid_risk_agregasi_risikoid(response.id_risk_agregasi_risiko);
  };

  const [dataid_sasaran, setdataid_sasaran] = useState([]);

  const handlegetid_sasaran = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    // if (inputValue) {
    //     filter.nama = inputValue
    // }
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_sasaran",
      filter,
    });
    // console.log('getmt_risk_sasaran')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_sasaran,
      });
    });

    setdataid_sasaran(dataarr);
    // if (!inputValue && !callback) {
    // } else {
    //     callback(
    //         dataarr
    //     )
    // }
  };

  const [dataid_jenis_risiko, setdataid_jenis_risiko] = useState([]);

  const handlegetid_jenis_risiko = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_jenis_risiko",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('getmt_risk_jenis_risiko')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_jenis_risiko,
      });
    });
    setdataid_jenis_risiko(dataarr);
  };

  const [dataid_taksonomi, setdataid_taksonomi] = useState([]);

  const handlegetid_taksonomi = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_taksonomi",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('getmt_risk_taksonomi')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_taksonomi,
      });
    });
    setdataid_taksonomi(dataarr);
  };

  const [dataid_risiko, setdataid_risiko] = useState([]);

  const handlegetid_risiko = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 1000,
      },
    };
    if (inputValue) {
      filter.filter = {
        nama: inputValue,
      };
    }
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_risiko",
      filter,
    });
    // console.log('getrisk_risiko')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_risiko,
      });
    });

    if (inputValue && callback) {
      callback(dataarr);
    } else {
      setdataid_risiko(dataarr);
    }
  };

  const [dataid_penyebab, setdataid_penyebab] = useState([]);

  const handlegetrisk_penyebab = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 1000,
      },
    };
    if (inputValue) {
      filter.filter = {
        nama: inputValue,
      };
    }
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_penyebab",
      filter,
    });
    // console.log('getrisk_penyebab')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_penyebab,
      });
    });

    if (!inputValue && !callback) {
      setdataid_penyebab(dataarr);
    } else {
      callback(dataarr);
    }
  };

  const [dataid_dampak, setdataid_dampak] = useState([]);

  const handlegetrisk_dampak = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 1000,
      },
    };
    if (inputValue) {
      filter.filter = {
        nama: inputValue,
      };
    }
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_dampak",
      filter,
    });
    // console.log('getrisk_dampak')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_dampak,
      });
    });

    if (!inputValue && !callback) {
      setdataid_dampak(dataarr);
    } else {
      callback(dataarr);
    }
  };

  const [datamt_risk_kriteria_dampak, setdatamt_risk_kriteria_dampak] =
    useState([]);

  const handlegetmt_risk_kriteria_dampak = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_kriteria_dampak",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
        filter: {
          jenis: jenis_param,
        },
      },
    });
    // console.log('mt_risk_kriteria_dampak')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_kriteria_dampak,
      });
    });
    setdatamt_risk_kriteria_dampak(dataarr);
  };

  const [datamt_risk_jenis_control, setdatadatamt_risk_jenis_control] =
    useState([]);

  const handlegetmt_risk_jenis_control = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_jenis_control",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_risk_jenis_control')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_jenis_control,
      });
    });
    setdatadatamt_risk_jenis_control(dataarr);
  };

  const [
    datamt_risk_efektifitas_control,
    setdatadatamt_risk_efektifitas_control,
  ] = useState([]);

  const handlegetmt_risk_efektifitas_control = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_efektifitas_control",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_risk_efektifitas_control')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_efektifitas_control,
      });
    });
    setdatadatamt_risk_efektifitas_control(dataarr);
  };

  const [dataid_risk_agregasi_risiko, setdataid_risk_agregasi_risiko] =
    useState([]);

  const handlegetid_risk_agregasi_risiko = async (inputValue, callback) => {
    if (!id_kriteria_dampak) {
      return;
    }

    setis_loading_id_risk_agregasi_risiko(true);
    const response = await getapi_services({
      setErrors,
      api_path: `/mt_risk_agregasi_risiko`,
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
        filter: {
          id_kriteria_dampak,
          jenis: jenis_param,
          id_kelompok_bisnis,
        },
      },
    });
    // console.log('handlegetid_risk_agregasi_risiko')
    // console.log(response)
    setis_loading_id_risk_agregasi_risiko(false);

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_risk_agregasi_risiko,
      });
    });
    if (!callback) {
      setdataid_risk_agregasi_risiko(dataarr);
    } else {
      callback(dataarr);
    }
  };

  const handlegetid_risk_agregasi_risikoid = async (id) => {
    setis_loading_id_risk_agregasi_risiko(true);
    const response = await getapi_servicesid({
      setErrors,
      api_path: `/mt_risk_agregasi_risiko`,
      id,
    });
    // console.log('handlegetid_risk_agregasi_risiko=>id')
    // console.log(response)
    setis_loading_id_risk_agregasi_risiko(false);

    checkNotAuthorized(response);
    if (response.error) return;

    setdataid_risk_agregasi_risiko([{ value: id, label: response.nama }]);
  };

  const handlegetrisk_registerid = async () => {
    setis_loading(true);
    const response = await getapi_servicesid({
      setErrors,
      api_path: `/risk_register/getdetail`,
      id: props.risk_profile_item.id_register,
    });
    console.log("getrisk_registerid=>sidebar");
    console.log(response);
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    setnama_register(response.nama);

    if (response.error) return;
  };

  return (
    <Modal
      onShow={handleInit}
      show={props.show}
      onHide={() => {
        props.onClose();
        setrisk_profile_and_master_loaded(false);
      }}
      fullscreen
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {props.risk_profile_item ? props.risk_profile_item.nama : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <div className="d-flex justify-content-center">
            {is_loading ? (
              <div
                className="me-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            ) : null}
          </div>

          <div className="">
            <Input
              ref={null}
              id="sasaran"
              type="textarea"
              label={"Risk Register"}
              // tooltips={'Diisi sesuai dengan sasaran Perusahaan'}
              placeholder={rules.sasaran.label}
              value={nama_register}
              className="block mt-1 w-full"
              onChange={(event) => setsasaran(event.target.value)}
              required={rules.sasaran.required}
              autoFocus
              message_error={errors.sasaran}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />
            <Input
              ref={null}
              id="sasaran"
              type="textarea"
              label={rules.sasaran.label}
              // tooltips={'Diisi sesuai dengan sasaran Perusahaan'}
              placeholder={rules.sasaran.label}
              value={sasaran}
              className="block mt-1 w-full"
              onChange={(event) => setsasaran(event.target.value)}
              required={rules.sasaran.required}
              autoFocus
              message_error={errors.sasaran}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />

            {id_tingkat_agregasi_risiko === 0 ||
            id_tingkat_agregasi_risiko === null ||
            jenis_param === "1" ? (
              <div className="row">
                <div className="col-lg-4">
                  <InputNumeric
                    ref={null}
                    id="nilai_sasaran"
                    type="text"
                    label={"Nilai Sasaran"}
                    placeholder={rules.nilai_sasaran.label}
                    value={nilai_sasaran}
                    className="block mt-1 w-full"
                    onChange={(value) => {
                      setnilai_sasaran(value);
                    }}
                    required={rules.nilai_sasaran.required}
                    autoFocus
                    message_error={errors.nilai_sasaran}
                    onError={handleErrors}
                    disabled={is_disabled}
                    formCol
                  />
                </div>
              </div>
            ) : null}

            <InputSelect
              ref={null}
              id="id_sasaran"
              type="select"
              label={rules.id_sasaran.label}
              //     tooltips={
              //         'Diisi dengan pilihan sasaran Kementerian Perusahaan yang meliputi:\
              // 1) Nilai ekonomi dan sosial;\
              // 2) Inovasi bisnis model;\
              // 3) Kepemimpinan teknologi;\
              // 4) Peningkatan investasi; dan\
              // 5) Pengembangan talenta.'
              //     }
              placeholder={"Pilih..."}
              value={id_sasaran}
              className="block mt-1 w-full"
              data={dataid_sasaran}
              onChange={setid_sasaran}
              required={rules.id_sasaran.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_sasaran}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />
            <InputSelect
              ref={null}
              id="id_sasaran"
              type="select"
              label={rules.id_sasaran.label}
              //     tooltips={
              //         'Diisi dengan pilihan sasaran Kementerian Perusahaan yang meliputi:\
              // 1) Nilai ekonomi dan sosial;\
              // 2) Inovasi bisnis model;\
              // 3) Kepemimpinan teknologi;\
              // 4) Peningkatan investasi; dan\
              // 5) Pengembangan talenta.'
              //     }
              placeholder={"Pilih..."}
              value={id_sasaran}
              className="block mt-1 w-full"
              data={dataid_sasaran}
              onChange={setid_sasaran}
              required={rules.id_sasaran.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_sasaran}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />

            <InputSelect
              ref={null}
              id="id_jenis_risiko"
              type="select"
              label={rules.id_jenis_risiko.label}
              // tooltips={
              //     'Diisi dengan Taksonomi Risiko yang berlaku pada masing-masing Perusahaan'
              // }
              placeholder={"Pilih..."}
              value={id_jenis_risiko}
              className="block mt-1 w-full"
              data={dataid_jenis_risiko}
              onChange={setid_jenis_risiko}
              required={rules.id_jenis_risiko.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_jenis_risiko}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />

            <InputSelect
              ref={null}
              id="id_taksonomi"
              type="select"
              label={rules.id_taksonomi.label}
              //     tooltips={
              //         'Diisi dengan pilihan kategori risiko Portofolio Perusahaan Kementerian Perusahaan berikut:\
              // 1. Risiko Fiskal - Dividen\
              // 2. Risiko Fiskal - PMN\
              // 3. Risiko Fiskal - Subsidi & Kompensasi\
              // 4. Risiko Kebijakan - SDM\
              // 5. Risiko Kebijakan - Sektoral\
              // 6. Risiko Komposisi - Konsentrasi Portofolio\
              // 7. Risiko Struktur - Struktur Korporasi\
              // 8. Risiko Restrukturisasi & Reorganisasi - Penggabungan, Pengambilalihan, Peleburan, Pemisahan, Pembubaran, Likuidasi, Kemitraan, dan Restrukturisasi\
              // 9. Risiko Industri Umum - Formulasi Strategis\
              // 10. Risiko Industri Umum - Pasar & Makroekonomi\
              // 11. Risiko Industri Umum - Keuangan\
              // 12. Risiko Industri Umum - Reputasi & Kepatuhan\
              // 13. Risiko Industri Umum - Proyek\
              // 14. Risiko Industri Umum - Teknologi & Keamanan Siber\
              // 15. Risiko Industri Umum - Sosial & Lingkungan\
              // 16. Risiko Industri Umum - Operasional\
              // 17. Risiko Industri Perbankan - Kredit\
              // 18. Risiko Industri Perbankan - Likuiditas\
              // 19. Risiko Industri Asuransi - Investasi\
              // 20. Risiko Industri Asuransi - Aktuarial'
              //     }
              placeholder={"Pilih..."}
              value={id_taksonomi}
              className="block mt-1 w-full"
              data={dataid_taksonomi}
              onChange={setid_taksonomi}
              required={rules.id_taksonomi.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_taksonomi}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />

            <div className="row">
              <div className="col-lg-4">
                <Input
                  ref={null}
                  id="tgl_risiko"
                  type="date"
                  label={rules.tgl_risiko.label}
                  // tooltips={'Tanggal Risiko'}
                  placeholder={rules.tgl_risiko.label}
                  value={tgl_risiko}
                  className="block mt-1 w-full"
                  onChange={(event) => settgl_risiko(event.target.value)}
                  required={rules.tgl_risiko.required}
                  autoFocus
                  message_error={errors.tgl_risiko}
                  onError={handleErrors}
                  disabled={is_disabled}
                  formCol
                />
              </div>
            </div>

            <Input
              ref={null}
              id="deskripsi"
              type="textarea"
              label={rules.deskripsi.label}
              // tooltips={'Penjelasan /narasi atas peristiwa risiko'}
              placeholder={rules.deskripsi.label}
              value={deskripsi}
              className="block mt-1 w-full"
              onChange={(event) => setdeskripsi(event.target.value)}
              required={rules.deskripsi.required}
              autoFocus
              message_error={errors.deskripsi}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />

            <InputSelectCombo
              ref={null}
              id="id_penyebab"
              type="select"
              label={rules.id_penyebab.label}
              // tooltips={
              //     'Diisi penyebab risiko secara jelas. Perusahaan dapat menggali berbagai penyebab risiko. Sebagai contoh dapat melihat dari berbagai segi: people, process, network, maupun system.'
              // }
              placeholder={"Pilih..."}
              value={id_penyebab}
              className="block mt-1 w-full"
              data={dataid_penyebab}
              onChange={setid_penyebab}
              required={rules.id_penyebab.required}
              autoFocus
              isClearable
              isMulti={true}
              message_error={errors.penyebab}
              onError={handleErrors}
              disabled={is_disabled}
              loadOptions={handlegetrisk_penyebab}
              formCol
              withNumb
            />

            <InputColumnMultipleMerge
              ref={null}
              id="kri_new"
              type="select"
              label={rules.kri_new.label}
              placeholder={rules.kri_new.label}
              value={kri_new}
              className="block mt-1 w-full"
              onChange={setkri_new}
              required={jenis_param == "1" ? false : rules.kri_new.required}
              autoFocus
              message_error={errors.kri_new}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
              htmlheadkrikualitatif={htmlheadkri1}
              htmlheadkrikuantitatifnull={htmlheadkriPolaritasNull}
              htmlheadkrikuantitatifStabilize={htmlheadkriStabilize}
              htmlheadkrikuantitatifPositif={htmlheadkriPositif}
              htmlheadkrikuantitatifNegatif={htmlheadkriNegatif}
              datainit={init_kri_new}
              datakuantitatif={[
                { label: "Kualitatif", value: 0 },
                { label: "Kuantitatif", value: 1 },
              ]}
              risk_profile
            />

            <InputColumnMultiple
              ref={null}
              id="existing_control"
              type="select"
              label={rules.control.label}
              // tooltips={'Existing Control '}
              placeholder={rules.control.label}
              value={existing_control}
              className="block mt-1 w-full"
              onChange={setexisting_control}
              required={jenis_param == "1" ? false : rules.control.required}
              autoFocus
              message_error={errors.control}
              onError={handleErrors}
              disabled={is_disabled}
              htmlhead={htmlheadexisting_control}
              datainit={init_existing_control}
              datamt_risk_jenis_control={datamt_risk_jenis_control}
              datamt_risk_efektifitas_control={datamt_risk_efektifitas_control}
              formCol
            />

            <div className="row">
              <div className="col-lg-4">
                <InputSelect
                  ref={null}
                  id="is_kuantitatif"
                  type="select"
                  label={rules.is_kuantitatif.label}
                  //             tooltips={
                  //                 'Diisi dengan pilihan kategori dampak:\
                  // - Dampak kuantitatif\
                  // - Dampak kualitatif'
                  //             }
                  placeholder={"Pilih..."}
                  value={is_kuantitatif}
                  className="block mt-1 w-full"
                  data={combokategoridampak()}
                  onChange={setis_kuantitatif}
                  required={rules.is_kuantitatif.required}
                  autoFocus
                  isClearable
                  isMulti={false}
                  message_error={errors.is_kuantitatif}
                  onError={handleErrors}
                  disabled={is_disabled}
                  formCol
                />
              </div>
            </div>

            <InputSelect
              ref={null}
              id="id_kriteria_dampak"
              type="select"
              label={"Kriteria Dampak"}
              // tooltips={'Kriteria Dampak'}
              placeholder={"Pilih..."}
              value={id_kriteria_dampak}
              className="block mt-1 w-full"
              data={datamt_risk_kriteria_dampak}
              onChange={setid_kriteria_dampak}
              required={rules.id_kriteria_dampak.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_kriteria_dampak}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
            />

            <InputSelect
              ref={null}
              id="id_risk_agregasi_risiko"
              type="select"
              label={"Agregasi Risiko"}
              // tooltips={'Agregasi Risiko'}
              placeholder={
                is_loading_id_risk_agregasi_risiko ? "Loading..." : "Pilih..."
              }
              value={id_risk_agregasi_risiko}
              className="block mt-1 w-full"
              data={dataid_risk_agregasi_risiko}
              onChange={setid_risk_agregasi_risiko}
              required={rules.id_risk_agregasi_risiko.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_risk_agregasi_risiko}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
              loadOptions={handlegetid_risk_agregasi_risiko}
            />

            <InputColumnMultiple
              ref={null}
              id="dampak"
              type="select"
              label={rules.dampak.label}
              // tooltips={'Dampak '}
              placeholder={rules.dampak.label}
              value={dampak}
              className="block mt-1 w-full"
              onChange={setdampak}
              required={rules.dampak.required}
              autoFocus
              message_error={errors.dampak}
              onError={handleErrors}
              disabled={is_disabled}
              htmlhead={htmlheaddampak}
              datainit={init_dampak}
              datamt_risk_dampak={dataid_dampak}
              loadOptions={handlegetrisk_dampak}
              formCol
            />
          </div>
        </div>

        {Object.keys(risk_profile_data).length > 0 && master ? (
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-full">
                  <div>Analisa Risiko Inheren</div>
                  {analisa_risiko_inheren_loading ? (
                    <div
                      className="me-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    >
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                      </span>
                    </div>
                  ) : null}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Analisa_risiko_inheren
                  master={master}
                  datamt_risk_dampak={datamt_risk_dampak}
                  datamt_risk_kemungkinan={datamt_risk_kemungkinan}
                  risk_profile_data={risk_profile_data}
                  risk_profile_and_master_loaded={
                    risk_profile_and_master_loaded
                  }
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-full">
                  <div>Analisa Risiko Residual</div>
                  {analisa_risiko_residual_loading ? (
                    <div
                      className="me-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    >
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                      </span>
                    </div>
                  ) : null}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Analisa_risiko_residual
                  master={master}
                  datamt_risk_dampak={datamt_risk_dampak}
                  datamt_risk_kemungkinan={datamt_risk_kemungkinan}
                  risk_profile_data={risk_profile_data}
                  risk_profile_and_master_loaded={
                    risk_profile_and_master_loaded
                  }
                  onLoading={setanalisa_risiko_residual_loading}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-full">
                  <div>Rencana Perlakuan Risiko</div>
                  {rencana_perlakuan_risiko_loading ? (
                    <div
                      className="me-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    >
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                      </span>
                    </div>
                  ) : null}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Rencana_perlakuan_risiko
                  master={master}
                  datamt_risk_dampak={datamt_risk_dampak}
                  datamt_risk_kemungkinan={datamt_risk_kemungkinan}
                  risk_profile_data={risk_profile_data}
                  risk_profile_and_master_loaded={
                    risk_profile_and_master_loaded
                  }
                  tahun={props.tahun}
                  bulan={props.bulan}
                  onLoading={setrencana_perlakuan_risiko_loading}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-full">
                  <div>Realisasi Risiko Residual</div>
                  {realisasi_risiko_residual_loading ? (
                    <div
                      className="me-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    >
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                      </span>
                    </div>
                  ) : null}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Realisasi_risiko_residual
                  master={master}
                  datamt_risk_dampak={datamt_risk_dampak}
                  datamt_risk_kemungkinan={datamt_risk_kemungkinan}
                  risk_profile_data={risk_profile_data}
                  risk_profile_and_master_loaded={
                    risk_profile_and_master_loaded
                  }
                  tahun={props.tahun}
                  bulan={props.bulan}
                  onLoading={setrealisasi_risiko_residual_loading}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-full">
                  <div>Realisasi Pelaksanaan Perlakuan Risiko dan Biaya</div>
                  {realisasi_pelaksanaan_perlakuan_risiko_dan_biaya_loading ? (
                    <div
                      className="me-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    >
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                      </span>
                    </div>
                  ) : null}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Realisasi_pelaksanaan_perlakuan_risiko_dan_biaya
                  master={master}
                  datamt_risk_dampak={datamt_risk_dampak}
                  datamt_risk_kemungkinan={datamt_risk_kemungkinan}
                  risk_profile_data={risk_profile_data}
                  risk_profile_and_master_loaded={
                    risk_profile_and_master_loaded
                  }
                  tahun={props.tahun}
                  bulan={props.bulan}
                  onLoading={
                    setrealisasi_pelaksanaan_perlakuan_risiko_dan_biaya_loading
                  }
                />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        ) : null}

        <div style={{ height: 90 }}></div>
      </Modal.Body>
      {/* <Modal.Footer>
                <Button variant="secondary" onClick={handleAjukanHide}>
                    Close
                </Button>
                <Button variant="primary" onClick={() => { handleAjukan() }}>
                    {jenisajuan == 1 ? "Ajukan" : "Kembalikan"}
                </Button>
            </Modal.Footer> */}
    </Modal>
  );
};

export default DetailRiskProfile;

const Analisa_risiko_inheren = (props) => {
  // const id = props.params['id_register']
  // const path_param = props.params.slug[0]
  // const jenis_param = props.params.slug[1]
  // const id_profile = props.params.slug[2]

  // const page_url = 'risk_profile'

  const [errors, setErrors] = useState({});
  const [is_loading, setis_loading] = useState(false);
  const is_disabled = true;
  // const id = props.params.slug[1];

  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
  } = api_services({});

  const [master, setmaster] = useState({});

  const [jenis_risk_string, setjenis_risk_string] = useState("");

  const [penjelasan_dampak, setpenjelasan_dampak] = useState("");
  const [nilai_dampak_inheren, setnilai_dampak_inheren] = useState("");
  const [id_dampak_inheren, setid_dampak_inheren] = useState("");
  const [nilai_kemungkinan, setnilai_kemungkinan] = useState("");
  const [id_kemungkinan_inheren, setid_kemungkinan_inheren] = useState("");
  const [nilai_sasaran, setnilai_sasaran] = useState(null);

  const [level_risiko, setlevel_risiko] = useState({
    level: "",
    warna: "",
    skala: "",
  });

  const [nilai_eksposur, setnilai_eksposur] = useState("");
  const [all_data_loaded, setall_data_loaded] = useState(false);

  useEffect(() => {
    if (props.risk_profile_and_master_loaded && props.master) {
      handleInit();
    }
  }, [props.risk_profile_and_master_loaded, props.master]);

  useEffect(() => {
    if (all_data_loaded) {
      // handleDataOtomatis(
      //     jenis_risk_string == 'Kuantitatif'
      //         ? 'nilai_dampak_inheren'
      //         : 'id_dampak_inheren',
      //     jenis_risk_string == 'Kuantitatif'
      //         ? nilai_dampak_inheren
      //         : id_dampak_inheren,
      // )

      handleDataOtomatisDetail();
    }
  }, [all_data_loaded]);

  const handleInit = () => {
    setpenjelasan_dampak(props.risk_profile_data.penjelasan_dampak);
    setnilai_dampak_inheren(props.risk_profile_data.nilai_dampak_inheren);
    setid_dampak_inheren(props.risk_profile_data.id_dampak_inheren);
    setnilai_kemungkinan(props.risk_profile_data.nilai_kemungkinan);
    setid_kemungkinan_inheren(props.risk_profile_data.id_kemungkinan_inheren);

    let jenis_risk_string =
      props.risk_profile_data.is_kuantitatif == 1
        ? "Kuantitatif"
        : "Kualitatif";
    setjenis_risk_string(jenis_risk_string);

    setnilai_sasaran(props.risk_profile_data.nilai_sasaran);

    setmaster(props.master);

    // console.log('ANALISA RISIKO INHEREN=>handleInit')
    // console.log(props.risk_profile_data)
    // console.log(props.master)

    setall_data_loaded(true);
  };

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handleDataOtomatis = (column, value) => {
    return;
    if (column && value) {
      if (jenis_risk_string == "Kuantitatif") {
        // console.log('Kuantitatif')
        if (column == "nilai_dampak_inheren") {
          const resid_dampak_inheren = skalaDampakOtomatis(
            master,
            value,
            nilai_sasaran
          );
          const nilai_eksposur = nilaiEksposurOtomatis(
            value,
            nilai_kemungkinan
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            resid_dampak_inheren,
            id_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_eksposur(nilai_eksposur);
          setid_dampak_inheren(resid_dampak_inheren);
        }
        if (column == "nilai_kemungkinan") {
          const resid_kemungkinan_inheren = skalaProbabilitasOtomatis(
            master,
            value
          );
          const nilai_eksposur = nilaiEksposurOtomatis(
            nilai_dampak_inheren,
            value
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            id_dampak_inheren,
            resid_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setid_kemungkinan_inheren(resid_kemungkinan_inheren);
          setnilai_eksposur(nilai_eksposur);
        }
      }
      if (jenis_risk_string == "Kualitatif") {
        // console.log('Kualitatif')
        if (column == "id_dampak_inheren") {
          const nilai_eksposur = nilaiEksposurKualitatifOtomatis(
            value,
            nilai_kemungkinan,
            master,
            nilai_sasaran
          );
          const nilai_dampak_inherenres = nilaiDampakOtomatis(
            nilai_eksposur,
            nilai_kemungkinan
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            value,
            id_kemungkinan_inheren
          );
          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_dampak_inheren(nilai_dampak_inherenres);
          setnilai_eksposur(nilai_eksposur);
        }
        if (column == "nilai_kemungkinan") {
          const nilai_eksposurres = nilaiEksposurKualitatifOtomatis(
            id_dampak_inheren,
            value,
            master,
            nilai_sasaran
          );
          const nilai_dampak_inherenres = nilaiDampakOtomatis(
            nilai_eksposurres,
            value
          );
          const resid_kemungkinan_inheren = skalaProbabilitasOtomatis(
            master,
            value
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            id_dampak_inheren,
            resid_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_eksposur(nilai_eksposurres);
          setnilai_dampak_inheren(nilai_dampak_inherenres);
          setid_kemungkinan_inheren(resid_kemungkinan_inheren);
        }
      }
    }
  };

  const handleDataOtomatisDetail = () => {
    if (jenis_risk_string == "Kuantitatif") {
      const nilai_eksposur = nilaiEksposurOtomatis(
        nilai_dampak_inheren,
        nilai_kemungkinan
      );
      const resskala_risiko = skalaRisikoOtomatis(
        master,
        id_dampak_inheren,
        id_kemungkinan_inheren
      );

      setlevel_risiko({
        level: resskala_risiko == null ? "" : resskala_risiko.nama,
        skala: resskala_risiko == null ? "" : resskala_risiko.skala,
        warna: resskala_risiko == null ? "" : resskala_risiko.warna,
      });
      setnilai_eksposur(nilai_eksposur);
    }
    if (jenis_risk_string == "Kualitatif") {
      const nilai_eksposur = nilaiEksposurKualitatifOtomatis(
        id_dampak_inheren,
        nilai_kemungkinan,
        master,
        nilai_sasaran
      );
      const resskala_risiko = skalaRisikoOtomatis(
        master,
        id_dampak_inheren,
        id_kemungkinan_inheren
      );
      setlevel_risiko({
        level: resskala_risiko == null ? "" : resskala_risiko.nama,
        skala: resskala_risiko == null ? "" : resskala_risiko.skala,
        warna: resskala_risiko == null ? "" : resskala_risiko.warna,
      });
      setnilai_eksposur(nilai_eksposur);
    }

    // setotomatis_successfully(true)
  };

  return (
    <>
      <div className="">
        <Input
          ref={null}
          id="penjelasan_dampak"
          type="textarea"
          label={rules_analisa_risiko_inheren.penjelasan_dampak.label}
          placeholder={rules_analisa_risiko_inheren.penjelasan_dampak.label}
          value={penjelasan_dampak}
          className="block mt-1 w-full"
          onChange={(event) => setpenjelasan_dampak(event.target.value)}
          required={rules_analisa_risiko_inheren.penjelasan_dampak.required}
          autoFocus
          message_error={errors.penjelasan_dampak}
          onError={handleErrors}
          disabled={is_disabled}
          formCol
        />

        <div className="row">
          <div className="col-lg-6">
            <InputNumeric
              ref={null}
              id="nilai_dampak_inheren"
              type="text"
              label={rules_analisa_risiko_inheren.nilai_dampak_inheren.label}
              placeholder={
                rules_analisa_risiko_inheren.nilai_dampak_inheren.label
              }
              value={nilai_dampak_inheren}
              className="block mt-1 w-full"
              onChange={(value) => {
                setnilai_dampak_inheren(value);
                handleDataOtomatis("nilai_dampak_inheren", value);
              }}
              required={
                rules_analisa_risiko_inheren.nilai_dampak_inheren.required
              }
              autoFocus
              message_error={errors.nilai_dampak_inheren}
              onError={handleErrors}
              // disabled={is_disabled}
              disabled={jenis_risk_string == "Kualitatif" ? true : is_disabled}
              formCol
            />
          </div>
          <div className="col-lg-6">
            <InputSelect
              ref={null}
              id="id_dampak_inheren"
              type="select"
              label={rules_analisa_risiko_inheren.id_dampak_inheren.label}
              placeholder={"Pilih..."}
              value={id_dampak_inheren}
              className="block mt-1 w-full"
              data={props.datamt_risk_dampak}
              onChange={(value) => {
                setid_dampak_inheren(value);
                handleDataOtomatis("id_dampak_inheren", value);
              }}
              required={rules_analisa_risiko_inheren.id_dampak_inheren.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_dampak_inheren}
              onError={handleErrors}
              disabled={jenis_risk_string == "Kuantitatif" ? true : is_disabled}
              // loadOptions={handlegetrisk_dampak}
              formCol
              colorapply
            />
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <InputNumeric
              ref={null}
              id="nilai_kemungkinan"
              type="text"
              label={rules_analisa_risiko_inheren.nilai_kemungkinan.label}
              placeholder={rules_analisa_risiko_inheren.nilai_kemungkinan.label}
              value={nilai_kemungkinan}
              className="block mt-1 w-full"
              onChange={(value) => {
                setnilai_kemungkinan(value);
                handleDataOtomatis("nilai_kemungkinan", value);
              }}
              required={rules_analisa_risiko_inheren.nilai_kemungkinan.required}
              autoFocus
              message_error={errors.nilai_kemungkinan}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
              maxLength={6}
            />
          </div>
          <div className="col-lg-6">
            <InputSelect
              ref={null}
              id="id_kemungkinan_inheren"
              type="select"
              label={rules_analisa_risiko_inheren.id_kemungkinan_inheren.label}
              placeholder={"Pilih..."}
              value={id_kemungkinan_inheren}
              className="block mt-1 w-full"
              data={props.datamt_risk_kemungkinan}
              onChange={setid_kemungkinan_inheren}
              required={
                rules_analisa_risiko_inheren.id_kemungkinan_inheren.required
              }
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_kemungkinan_inheren}
              onError={handleErrors}
              disabled={true}
              // loadOptions={handlegetrisk_dampak}
              formCol
              colorapply
            />
          </div>
        </div>

        <NilaiEksposurLevelRisikoViewOnly
          nilai_eksposur={nilai_eksposur}
          level_risiko={level_risiko}
        />
      </div>
    </>
  );
};

const Analisa_risiko_residual = (props) => {
  const page_url = "risk_profile";

  const [errors, setErrors] = useState({});
  const is_disabled = true;
  const [is_loading, setis_loading] = useState(false);

  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
  } = api_services({});
  const [trigger_test, settrigger_test] = useState(0);
  const [jenis_risk_string, setjenis_risk_string] = useState("");
  const [master, setmaster] = useState({});

  const [nilai_sasaran, setnilai_sasaran] = useState(null);

  const [nilai_dampak_inheren, setnilai_dampak_inheren] = useState([q_init1]);
  const [id_dampak_inheren, setid_dampak_inheren] = useState([q_init2]);
  const [nilai_kemungkinan, setnilai_kemungkinan] = useState([q_init3]);
  const [id_kemungkinan_inheren, setid_kemungkinan_inheren] = useState([
    q_init4,
  ]);

  const [tahun, settahun] = useState(formatDateApp(new Date(), "YYYY"));

  const [all_data_loaded, setall_data_loaded] = useState(false);
  const [eksposur_levelrisiko, seteksposur_levelrisiko] = useState([
    { ...quarter_init, type: "q1" },
    { ...quarter_init, type: "q2" },
    { ...quarter_init, type: "q3" },
    { ...quarter_init, type: "q4" },
  ]);

  useEffect(() => {
    if (props.risk_profile_and_master_loaded && props.master) {
      handleInit();
    }
  }, [props.risk_profile_and_master_loaded, props.master]);

  useEffect(() => {
    if (all_data_loaded) {
      if (jenis_risk_string == "Kuantitatif") {
        handleNilaiEksposurAndLevelRisiko();
      } else {
        handleNilaiEksposurAndLevelRisikoKualitatif();
      }
    }
  }, [all_data_loaded]);

  useEffect(() => {
    props.onLoading(is_loading);
  }, [is_loading]);

  const handleInit = () => {
    setdatadatamt_risk_dampak(props.datamt_risk_dampak);
    setdatamt_risk_kemungkinan(props.datamt_risk_kemungkinan);
    setmaster(props.master);

    let jenis_risk_string =
      props.risk_profile_data.is_kuantitatif == 1
        ? "Kuantitatif"
        : "Kualitatif";
    setjenis_risk_string(jenis_risk_string);

    setnilai_sasaran(props.risk_profile_data.nilai_sasaran);

    // console.log('XXXXXXXXXXXXXXXX')
    // console.log('props.risk_profile_data')
    // console.log(props.risk_profile_data)
    handlegetrisk_profile_target_residual();
  };

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handlegetrisk_profile_target_residual = async () => {
    setis_loading(true);
    const response = await getapi_servicesid({
      setErrors,
      api_path: `/risk_profile_target_residual/${props.risk_profile_data.id_register}`,
      id: props.risk_profile_data.id_risk_profile,
    });
    // console.log('risk_profile_target_residual')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error) return;

    // const [nilai_dampak_inheren, setnilai_dampak_inheren] = useState([q_init1]);
    // const [id_dampak_inheren, setid_dampak_inheren] = useState([q_init2]);
    // const [nilai_kemungkinan, setnilai_kemungkinan] = useState([q_init3]);
    // const [id_kemungkinan_inheren, setid_kemungkinan_inheren] = useState([q_init4]);

    if (response.length == 0) {
      return;
    }

    let nilai_dampak_inheren_obj = nilai_dampak_inheren;
    let id_dampak_inheren_obj = id_dampak_inheren;
    let nilai_kemungkinan_obj = nilai_kemungkinan;
    let id_kemungkinan_inheren_obj = id_kemungkinan_inheren;

    nilai_dampak_inheren_obj[0].q_init1_1 = response.nilai_dampak[`${tahun}q1`];
    nilai_dampak_inheren_obj[0].q_init1_2 = response.nilai_dampak[`${tahun}q2`];
    nilai_dampak_inheren_obj[0].q_init1_3 = response.nilai_dampak[`${tahun}q3`];
    nilai_dampak_inheren_obj[0].q_init1_4 = response.nilai_dampak[`${tahun}q4`];

    id_dampak_inheren_obj[0].q_init2_1 = response.id_dampak[`${tahun}q1`];
    id_dampak_inheren_obj[0].q_init2_2 = response.id_dampak[`${tahun}q2`];
    id_dampak_inheren_obj[0].q_init2_3 = response.id_dampak[`${tahun}q3`];
    id_dampak_inheren_obj[0].q_init2_4 = response.id_dampak[`${tahun}q4`];

    nilai_kemungkinan_obj[0].q_init3_1 =
      response.nilai_kemungkinan[`${tahun}q1`];
    nilai_kemungkinan_obj[0].q_init3_2 =
      response.nilai_kemungkinan[`${tahun}q2`];
    nilai_kemungkinan_obj[0].q_init3_3 =
      response.nilai_kemungkinan[`${tahun}q3`];
    nilai_kemungkinan_obj[0].q_init3_4 =
      response.nilai_kemungkinan[`${tahun}q4`];

    id_kemungkinan_inheren_obj[0].q_init4_1 =
      response.id_kemungkinan[`${tahun}q1`];
    id_kemungkinan_inheren_obj[0].q_init4_2 =
      response.id_kemungkinan[`${tahun}q2`];
    id_kemungkinan_inheren_obj[0].q_init4_3 =
      response.id_kemungkinan[`${tahun}q3`];
    id_kemungkinan_inheren_obj[0].q_init4_4 =
      response.id_kemungkinan[`${tahun}q4`];

    setnilai_dampak_inheren(nilai_dampak_inheren_obj);
    setid_dampak_inheren(id_dampak_inheren_obj);
    setnilai_kemungkinan(nilai_kemungkinan_obj);
    setid_kemungkinan_inheren(id_kemungkinan_inheren_obj);
    setall_data_loaded(true);
  };

  const [datamt_risk_dampak, setdatadatamt_risk_dampak] = useState([]);
  const [datamt_risk_kemungkinan, setdatamt_risk_kemungkinan] = useState([]);

  const handleChangeColumn = async (column, value, varr) => {
    const columnarr = column.split("_");
    let eventt = "";

    if (jenis_risk_string == "Kuantitatif") {
      if (varr == "nilai_dampak_inheren") {
        const num_last = columnarr[columnarr.length - 1];
        eventt = "skalaDampakOtomatis";

        const q = await skalaDampakOtomatis(master, value, nilai_sasaran);
        // console.log('q')
        // console.log(q)

        setid_dampak_inheren((id_dampak_inheren) => {
          Object.keys(id_dampak_inheren[0]).map((m) => {
            if (m == `q_init2_${num_last}`) {
              return (id_dampak_inheren[0][m] = q);
            }
          });
          return id_dampak_inheren;
        });

        handleNilaiEksposurAndLevelRisiko();
      }
      if (varr == "nilai_kemungkinan") {
        const num_last = columnarr[columnarr.length - 1];
        eventt = "skalaProbabilitasOtomatis";

        const q = await skalaProbabilitasOtomatis(master, value);

        // console.log('q')
        // console.log(q)

        setid_kemungkinan_inheren((id_kemungkinan_inheren) => {
          Object.keys(id_kemungkinan_inheren[0]).map((m) => {
            if (m == `q_init4_${num_last}`) {
              return (id_kemungkinan_inheren[0][m] = q);
            }
          });
          return id_kemungkinan_inheren;
        });

        handleNilaiEksposurAndLevelRisiko();
      }
    }
    if (jenis_risk_string == "Kualitatif") {
      if (varr == "id_dampak_inheren") {
        const num_last = columnarr[columnarr.length - 1];
        eventt = "nilaiDampakOtomatis";

        handleNilaiEksposurAndLevelRisikoKualitatif();
      }
      if (varr == "nilai_kemungkinan") {
        const num_last = columnarr[columnarr.length - 1];
        eventt = "skalaProbabilitasOtomatis";

        const q = await skalaProbabilitasOtomatis(master, value);

        // console.log('q')
        // console.log(q)

        setid_kemungkinan_inheren((id_kemungkinan_inheren) => {
          Object.keys(id_kemungkinan_inheren[0]).map((m) => {
            if (m == `q_init4_${num_last}`) {
              return (id_kemungkinan_inheren[0][m] = q);
            }
          });
          return id_kemungkinan_inheren;
        });

        handleNilaiEksposurAndLevelRisikoKualitatif();
      }
    }
  };

  const handleNilaiEksposurAndLevelRisiko = () => {
    Object.keys(nilai_dampak_inheren[0]).map((m) => {
      const columnarr = m.split("_");
      const num_last = columnarr[columnarr.length - 1];

      let qVfirst = nilai_dampak_inheren[0][m];
      let qVsecond = null;

      let eksposur = "";
      Object.keys(nilai_kemungkinan[0]).map((x) => {
        if (x == `q_init3_${num_last}`) {
          qVsecond = nilai_kemungkinan[0][x];
        }
      });
      if (
        qVfirst == "" ||
        qVfirst == null ||
        qVsecond == "" ||
        qVsecond == null
      ) {
        eksposur = "";
      } else {
        eksposur = nilaiEksposurOtomatis(qVfirst, qVsecond);
      }

      let qid_dampak = "";
      Object.keys(id_dampak_inheren[0]).map((x) => {
        if (x == `q_init2_${num_last}`) {
          qid_dampak = id_dampak_inheren[0][x];
        }
      });
      let qid_kemungkinan = "";
      Object.keys(id_kemungkinan_inheren[0]).map((x) => {
        if (x == `q_init4_${num_last}`) {
          qid_kemungkinan = id_kemungkinan_inheren[0][x];
        }
      });

      let skala = "",
        warna = "",
        level = "";
      if (
        qid_dampak == "" ||
        qid_dampak == null ||
        qid_kemungkinan == "" ||
        qid_kemungkinan == null
      ) {
        (skala = ""), (warna = ""), (level = "");
      } else {
        const skalaRisikoOtomatisRes = skalaRisikoOtomatis(
          master,
          qid_dampak,
          qid_kemungkinan
        );
        if (skalaRisikoOtomatisRes == null) {
          (skala = ""), (warna = ""), (level = "");
        } else {
          skala = skalaRisikoOtomatisRes.skala;
          warna = skalaRisikoOtomatisRes.warna;
          level = skalaRisikoOtomatisRes.nama;
        }
      }

      let eksposur_levelrisiko_new = [];
      seteksposur_levelrisiko((eksposur_levelrisiko) => {
        eksposur_levelrisiko.map((z) => {
          if (z.type == `q${num_last}`) {
            z.eksposur = eksposur;
            z.skala = skala;
            z.warna = warna;
            z.level = level;

            return z;
          }
        });
        eksposur_levelrisiko_new = eksposur_levelrisiko;
        return eksposur_levelrisiko;
      });

      settrigger_test((trigger_test) => trigger_test + 1);
    });
  };

  const handleNilaiEksposurAndLevelRisikoKualitatif = () => {
    Object.keys(nilai_dampak_inheren[0]).map((m) => {
      const columnarr = m.split("_");
      const num_last = columnarr[columnarr.length - 1];

      let eksposur = "";

      let qid_dampak = "";
      Object.keys(id_dampak_inheren[0]).map((x) => {
        if (x == `q_init2_${num_last}`) {
          qid_dampak = id_dampak_inheren[0][x];
        }
      });
      let qVsecond = null;
      Object.keys(nilai_kemungkinan[0]).map((x) => {
        if (x == `q_init3_${num_last}`) {
          qVsecond = nilai_kemungkinan[0][x];
        }
      });
      if (
        qid_dampak == "" ||
        qid_dampak == null ||
        qVsecond == "" ||
        qVsecond == null
      ) {
        eksposur = "";
      } else {
        eksposur = nilaiEksposurKualitatifOtomatis(
          qid_dampak,
          qVsecond,
          master,
          nilai_sasaran
        );
      }

      let qNilaiDampak = nilaiDampakOtomatis(eksposur, qVsecond);

      setnilai_dampak_inheren((nilai_dampak_inheren) => {
        nilai_dampak_inheren[0][`q_init1_${num_last}`] = qNilaiDampak;
        return nilai_dampak_inheren;
      });

      let qid_kemungkinan = "";
      Object.keys(id_kemungkinan_inheren[0]).map((x) => {
        if (x == `q_init4_${num_last}`) {
          qid_kemungkinan = id_kemungkinan_inheren[0][x];
        }
      });

      let skala = "",
        warna = "",
        level = "";
      if (
        qid_dampak == "" ||
        qid_dampak == null ||
        qid_kemungkinan == "" ||
        qid_kemungkinan == null
      ) {
        (skala = ""), (warna = ""), (level = "");
      } else {
        const skalaRisikoOtomatisRes = skalaRisikoOtomatis(
          master,
          qid_dampak,
          qid_kemungkinan
        );
        if (skalaRisikoOtomatisRes == null) {
          (skala = ""), (warna = ""), (level = "");
        } else {
          skala = skalaRisikoOtomatisRes.skala;
          warna = skalaRisikoOtomatisRes.warna;
          level = skalaRisikoOtomatisRes.nama;
        }
      }

      seteksposur_levelrisiko((eksposur_levelrisiko) => {
        eksposur_levelrisiko.map((z) => {
          if (z.type == `q${num_last}`) {
            z.eksposur = eksposur;
            z.skala = skala;
            z.warna = warna;
            z.level = level;

            return z;
          }
        });
        return eksposur_levelrisiko;
      });

      settrigger_test((trigger_test) => trigger_test + 1);
    });
  };

  return (
    <>
      <div className="">
        <InputColumnMultiple
          ref={null}
          id="nilai_dampak_inheren"
          type="select"
          label={rules_analisa_risiko_residual.nilai_dampak_inheren.label}
          placeholder={rules_analisa_risiko_residual.nilai_dampak_inheren.label}
          value={nilai_dampak_inheren}
          className="block mt-1 w-full"
          onChange={(value) => {
            // console.log('setnilai_dampak_inheren')
            // console.log(value)
            // settrigger_test(trigger_test + 1)
            setnilai_dampak_inheren(value);
          }}
          onChangeColumn={handleChangeColumn}
          required={rules_analisa_risiko_residual.nilai_dampak_inheren.required}
          autoFocus
          message_error={errors.nilai_dampak_inheren}
          onError={handleErrors}
          // disabled={is_disabled}
          disabled={jenis_risk_string == "Kualitatif" ? true : is_disabled}
          formCol
          notAdd
          tahun={tahun}
        />

        <InputColumnMultiple
          ref={null}
          id="id_dampak_inheren"
          type="select"
          label={rules_analisa_risiko_residual.id_dampak_inheren.label}
          placeholder={rules_analisa_risiko_residual.id_dampak_inheren.label}
          value={id_dampak_inheren}
          className="block mt-1 w-full"
          onChange={(value) => {
            // console.log('setid_dampak_inheren')
            // settrigger_test(trigger_test + 1)
            setid_dampak_inheren(value);
          }}
          onChangeColumn={handleChangeColumn}
          required={rules_analisa_risiko_residual.id_dampak_inheren.required}
          autoFocus
          message_error={errors.id_dampak_inheren}
          onError={handleErrors}
          // disabled={is_disabled}
          disabled={jenis_risk_string == "Kuantitatif" ? true : is_disabled}
          formCol
          notAdd
          tahun={tahun}
          datamt_risk_dampak={datamt_risk_dampak}
        />

        <InputColumnMultiple
          ref={null}
          id="nilai_kemungkinan"
          type="select"
          label={rules_analisa_risiko_residual.nilai_kemungkinan.label}
          placeholder={rules_analisa_risiko_residual.nilai_kemungkinan.label}
          value={nilai_kemungkinan}
          className="block mt-1 w-full"
          onChange={(value) => {
            // console.log('setnilai_kemungkinan')
            // settrigger_test(trigger_test + 1)
            setnilai_kemungkinan(value);
          }}
          onChangeColumn={handleChangeColumn}
          required={rules_analisa_risiko_residual.nilai_kemungkinan.required}
          autoFocus
          message_error={errors.nilai_kemungkinan}
          onError={handleErrors}
          disabled={is_disabled}
          formCol
          notAdd
          tahun={tahun}
        />

        <InputColumnMultiple
          ref={null}
          id="id_kemungkinan_inheren"
          type="select"
          label={rules_analisa_risiko_residual.id_kemungkinan_inheren.label}
          placeholder={
            rules_analisa_risiko_residual.id_kemungkinan_inheren.label
          }
          value={id_kemungkinan_inheren}
          className="block mt-1 w-full"
          onChange={(value) => {
            setid_kemungkinan_inheren(value);
          }}
          onChangeColumn={handleChangeColumn}
          required={
            rules_analisa_risiko_residual.id_kemungkinan_inheren.required
          }
          autoFocus
          message_error={errors.id_kemungkinan_inheren}
          onError={handleErrors}
          // disabled={is_disabled}
          disabled={true}
          formCol
          notAdd
          tahun={tahun}
          datamt_risk_kemungkinan={datamt_risk_kemungkinan}
        />

        <NilaiEksposurLevelRisikoQuarter
          trigger={trigger_test}
          master={master}
          nilai_dampak_inheren={nilai_dampak_inheren[0]}
          id_dampak_inheren={id_dampak_inheren[0]}
          nilai_kemungkinan={nilai_kemungkinan[0]}
          id_kemungkinan_inheren={id_kemungkinan_inheren[0]}
          defaultValue={eksposur_levelrisiko}
        />
      </div>
    </>
  );
};

const Rencana_perlakuan_risiko = (props) => {
  const [errors, setErrors] = useState({});
  const is_disabled = true;
  const [is_loading, setis_loading] = useState(false);

  // const id = props.params.slug[1];

  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
  } = api_services({});
  const [risk_profile_mitigasi, setrisk_profile_mitigasi] = useState({});

  const initialized = useRef(false);

  useEffect(() => {
    //first load
    if (!initialized.current) {
      initialized.current = true;

      // handlegetrisk_penyebab()

      // handlegetrisk_profile_penyebab()
      // handlegetrisk_profile_penyebabid()
      // handlegetrisk_profile_mitigasiid()

      handlegetmt_risk_perlakuan();
      handlegetmt_risk_jenis_perlakuan();
      handlegetmt_risk_jenis_program_rkap();
      handlegetmt_sdm_jabatan();
    }
  }, []);

  useEffect(() => {
    if (props.risk_profile_and_master_loaded) {
      handleInit();
    }
  }, [props.risk_profile_and_master_loaded]);

  useEffect(() => {
    props.onLoading(is_loading);
  }, [is_loading]);

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handleInit = () => {
    // setdatadatamt_risk_dampak(props.datamt_risk_dampak)
    // setdatamt_risk_kemungkinan(props.datamt_risk_kemungkinan)
    // setmaster(props.master)
    // setnilai_sasaran(props.risk_profile_data.nilai_sasaran)

    handlegetrisk_profile_mitigasi();
  };

  const handlegetrisk_profile_mitigasi = async () => {
    setis_loading(true);

    const response = await getapi_services({
      api_path: `/risk_profile_mitigasi/${props.risk_profile_data.id_register}`,
      setErrors,
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
        filter: {
          jenis: props.risk_profile_data.jenis,
          bulan: props.bulan,
          tahun: props.tahun,
          // id_risk_profile: props.risk_profile_data.id_risk_profile
        },
        // order: order,
      },
    });
    // console.log('getrisk_profile_mitigasi')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);
    if (response.error) return;

    let resdata = [];
    response.data.map((m) => {
      if (m.id_risk_profile == props.risk_profile_data.id_risk_profile) {
        resdata.push(m);
      }
    });
    handletree_risk_profile_mitigasi(resdata);
  };

  const handletree_risk_profile_mitigasi = async (data) => {
    // console.log('handletree_risk_profile_mitigasi')
    // console.log(data)
    // href={`/${props.page_url}/${props.id_register}/add/${props.rows[m]['risiko']['id_risk_profile']}/${props.rows[m]['risiko']['id_mitigasi']}/${props.rows[m]['risiko']['jenis']}`}

    let dataarr = {};
    let id_risiko_uniq = {};
    data.map((m) => {
      id_risiko_uniq[m.id_risiko] = {};
      id_risiko_uniq[m.id_risiko]["id_risiko"] = m.id_risiko;
      id_risiko_uniq[m.id_risiko]["nama"] = m.nama;
      id_risiko_uniq[m.id_risiko]["id_risk_profile"] = m.id_risk_profile;
      id_risiko_uniq[m.id_risiko]["id_mitigasi"] = m.id_mitigasi;
      id_risiko_uniq[m.id_risiko]["jenis"] = m.jenis;
    });
    let id_profile_penyebab_uniq = {};
    data.map((m) => {
      if (m.id_profile_penyebab) {
        id_profile_penyebab_uniq[m.id_profile_penyebab] = {};
        id_profile_penyebab_uniq[m.id_profile_penyebab]["id_profile_penyebab"] =
          m.id_profile_penyebab;
        id_profile_penyebab_uniq[m.id_profile_penyebab]["nama_penyebab"] =
          m.nama_penyebab;
        id_profile_penyebab_uniq[m.id_profile_penyebab]["id_risk_profile"] =
          m.id_risk_profile;
        id_profile_penyebab_uniq[m.id_profile_penyebab]["jenis"] = m.jenis;
      }
    });
    let id_mitigasi_uniq = {};
    data.map((m) => {
      if (m.id_mitigasi) {
        id_mitigasi_uniq[m.id_mitigasi] = {};
        id_mitigasi_uniq[m.id_mitigasi]["id_mitigasi"] = m.id_mitigasi;
        id_mitigasi_uniq[m.id_mitigasi]["nama_mitigasi"] = m.nama_mitigasi;
        id_mitigasi_uniq[m.id_mitigasi]["id_risk_profile"] = m.id_risk_profile;
        id_mitigasi_uniq[m.id_mitigasi]["id_profile_penyebab"] =
          m.id_profile_penyebab;
        id_mitigasi_uniq[m.id_mitigasi]["jenis"] = m.jenis;
        id_mitigasi_uniq[m.id_mitigasi]["progress"] = m.progress
          ? m.progress
          : "";
        id_mitigasi_uniq[m.id_mitigasi]["biaya"] = m.biaya ? m.biaya : "";
      }
    });

    // delete id_risiko_uniq[2]
    // delete id_risiko_uniq[11]
    // delete id_risiko_uniq[12]

    Object.keys(id_risiko_uniq).map((m) => {
      id_risiko_uniq[m].penyebab = {};
      let rowSpan = 0;

      Object.keys(id_profile_penyebab_uniq).map((x) => {
        if (
          id_profile_penyebab_uniq[x].id_risk_profile ==
          id_risiko_uniq[m].id_risk_profile
        ) {
          id_risiko_uniq[m].penyebab[x] = id_profile_penyebab_uniq[x];
          id_risiko_uniq[m].penyebab[x].mitigasi = {};

          Object.keys(id_mitigasi_uniq).map((z) => {
            if (
              id_mitigasi_uniq[z].id_profile_penyebab ==
              id_profile_penyebab_uniq[x].id_profile_penyebab
            ) {
              id_risiko_uniq[m].penyebab[x].mitigasi[z] = id_mitigasi_uniq[z];
            }
          });
          id_risiko_uniq[m].penyebab[x].rowSpan = Object.keys(
            id_risiko_uniq[m].penyebab[x].mitigasi
          ).length;

          if (id_risiko_uniq[m].penyebab[x].rowSpan == 0) {
            id_risiko_uniq[m].penyebab[x].rowSpan = 1;
          }
          rowSpan += id_risiko_uniq[m].penyebab[x].rowSpan;
        }
      });

      // console.log('rowSpan')
      // console.log(rowSpan)

      if (rowSpan == 0) {
        id_risiko_uniq[m].rowSpan = Object.keys(
          id_risiko_uniq[m].penyebab
        ).length;
      } else {
        id_risiko_uniq[m].rowSpan = rowSpan;
      }
    });

    // console.log('id_risiko_uniq')
    // console.log(id_risiko_uniq)
    // return

    // setrisk_profile_mitigasi(id_risiko_uniq)

    const risk_profile_mitigasi = id_risiko_uniq;

    let rows = {};

    Object.keys(risk_profile_mitigasi).map((m, i) => {
      let rowcount = risk_profile_mitigasi[m].rowSpan;

      let col1pushed = false;
      for (let x = 0; x < rowcount; x++) {
        const rowsnow = Object.keys(rows).length + 1;
        rows[rowsnow] = {};

        if (!col1pushed) {
          rows[rowsnow]["risiko"] = risk_profile_mitigasi[m];
          col1pushed = true;
        }
      }
    });

    // console.log('rows')
    // console.log(rows)
    // return

    let penyebabpushed = [];
    let mitigasipushed = [];
    Object.keys(risk_profile_mitigasi).map((m, i) => {
      let parentIdx = 0;
      Object.keys(rows).map((x, y) => {
        if (rows[x].risiko && rows[x].risiko.id_risiko == m) {
          parentIdx = x;
        }
      });

      Object.keys(risk_profile_mitigasi[m].penyebab).map((x, y) => {
        let penyebabfirstispushed = false;
        for (let a in rows) {
          if (rows[a].penyebab) {
            penyebabfirstispushed = true;
            break;
          }
        }

        if (!penyebabfirstispushed) {
          rows[parentIdx]["penyebab"] = risk_profile_mitigasi[m].penyebab[x];
          penyebabpushed.push(risk_profile_mitigasi[m].penyebab[x]);
        } else {
          const prevPenyebab = penyebabpushed[penyebabpushed.length - 1];
          let prevIdx = 0;

          Object.keys(rows).map((a, b) => {
            if (
              rows[a].penyebab &&
              rows[a].penyebab.id_profile_penyebab ==
                prevPenyebab.id_profile_penyebab
            ) {
              prevIdx = a;
            }
          });
          const insertIdx = parseInt(prevIdx) + prevPenyebab.rowSpan;
          // console.log('rows')
          // console.log(rows)
          // console.log('insertIdx')
          // console.log(insertIdx)
          rows[insertIdx]["penyebab"] = risk_profile_mitigasi[m].penyebab[x];
          penyebabpushed.push(risk_profile_mitigasi[m].penyebab[x]);
        }

        // Object.keys(risk_profile_mitigasi[m].penyebab).map((x, y) => {
        //     let penyebabfirstispushed = false
        //     for (let a in rows) {
        //         if (rows[a].penyebab) {
        //             penyebabfirstispushed = true
        //             break
        //         }
        //     }

        //     if (!penyebabfirstispushed) {
        //         rows[parentIdx]['penyebab'] = risk_profile_mitigasi[m].penyebab[x]
        //         penyebabpushed.push(risk_profile_mitigasi[m].penyebab[x])
        //     } else {
        //         const prevPenyebab = penyebabpushed[penyebabpushed.length - 1]
        //         let prevIdx = 0

        //         Object.keys(rows).map((a, b) => {
        //             if (rows[a].penyebab && rows[a].penyebab.id_profile_penyebab == prevPenyebab.id_profile_penyebab) {
        //                 prevIdx = a
        //             }
        //         })
        //         const insertIdx = parseInt(prevIdx) + prevPenyebab.rowSpan
        //         rows[insertIdx]['penyebab'] = risk_profile_mitigasi[m].penyebab[x]
        //         penyebabpushed.push(risk_profile_mitigasi[m].penyebab[x])
        //     }

        // })
      });
    });

    let rowsidxpushed = 1;
    Object.keys(risk_profile_mitigasi).map((m) => {
      Object.keys(risk_profile_mitigasi[m].penyebab).map((z) => {
        if (
          Object.keys(risk_profile_mitigasi[m].penyebab[z].mitigasi).length > 0
        ) {
          Object.keys(risk_profile_mitigasi[m].penyebab[z].mitigasi).map(
            (a) => {
              rows[rowsidxpushed]["mitigasi"] =
                risk_profile_mitigasi[m].penyebab[z].mitigasi[a];

              mitigasipushed.push(
                risk_profile_mitigasi[m].penyebab[z].mitigasi[a]
              );
              rowsidxpushed += 1;
            }
          );
        } else {
          mitigasipushed.push({});
          rowsidxpushed += 1;
        }
      });
    });

    // console.log('rows')
    // console.log(rows)
    // return

    // setrisk_profile_mitigasi(rows)

    let r = {};
    let c = 1;

    for (let m in rows) {
      if (rows[m].mitigasi) {
        setis_loading(true);
        let res = new Promise(async (resolve, reject) => {
          let response = await getapi_servicesid({
            setErrors,
            api_path: `/risk_profile_mitigasi/${rows[m].mitigasi.id_risk_profile}`,
            id: rows[m].mitigasi.id_mitigasi,
          });

          resolve(response);
        });
        let ress = await res.then((z) => z);
        // if (!response.error || response.error.message != 'canceled')
        setis_loading(false);

        // console.log('ress')
        // console.log(ress)

        checkNotAuthorized(ress);
        if (ress.error) return;

        if (ress.timeline) {
          let timeline_item = {};

          for (let x in ress.timeline) {
            const col = x;
            const bulanInt = col.substr(4);
            const bulanStr = bulanIntToBulanText(parseInt(bulanInt));
            timeline_item[bulanStr] = `${ress.timeline[x]}`;
          }

          ress.timeline = timeline_item;
        }

        rows[m].mitigasi.data = ress;
      }
      r[c] = rows[m];
      c++;
    }

    // console.log('rows=>x')
    // console.log(r)
    // return

    setrisk_profile_mitigasi(r);
  };

  const [datamt_risk_perlakuan, setdatamt_risk_perlakuan] = useState([]);
  const [namemt_risk_perlakuan, setnamemt_risk_perlakuan] = useState({});
  const handlegetmt_risk_perlakuan = async () => {
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_perlakuan",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
        filter: {
          jenis: props.risk_profile_data.jenis,
        },
      },
    });
    // console.log('mt_risk_perlakuan')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = {};
    // response.data.map(m => {
    //     dataarr.push({
    //         label: m.nama,
    //         // value: m.id_perlakuan
    //         value: m.id_perlakuan
    //     })
    // })
    // setdatamt_risk_perlakuan(dataarr)
    response.data.map((m) => {
      dataarr[m.id_perlakuan] = m.nama;
    });
    setnamemt_risk_perlakuan(dataarr);
  };

  const [datamt_risk_jenis_perlakuan, setdatamt_risk_jenis_perlakuan] =
    useState([]);
  const [namemt_risk_jenis_perlakuan, setnamemt_risk_jenis_perlakuan] =
    useState({});
  const handlegetmt_risk_jenis_perlakuan = async (id_jenis_perlakuan_arr) => {
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_jenis_perlakuan",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_risk_jenis_perlakuan')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = {};
    response.data.map((m) => {
      dataarr[m.id_jenis_perlakuan] = m.nama;
    });
    setnamemt_risk_jenis_perlakuan(dataarr);

    // if (!id_jenis_perlakuan_arr) {
    //     response.data.map(m => {
    //         dataarr.push({
    //             label: m.nama,
    //             value: m.id_jenis_perlakuan
    //         })
    //     })
    //     setdatamt_risk_jenis_perlakuan(dataarr)

    // } else {
    //     response.data.map(m => {
    //         id_jenis_perlakuan_arr.map(x => {
    //             if (x == m.id_jenis_perlakuan) {
    //                 dataarr.push({
    //                     label: m.nama,
    //                     value: m.id_jenis_perlakuan
    //                 })
    //             }
    //         })
    //     })
    //     setid_jenis_perlakuan(dataarr)
    // }
  };

  const [datamt_risk_jenis_program_rkap, setdatamt_risk_jenis_program_rkap] =
    useState([]);
  const [namemt_risk_jenis_program_rkap, setnamemt_risk_jenis_program_rkap] =
    useState({});
  const handlegetmt_risk_jenis_program_rkap = async () => {
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_jenis_program_rkap",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_risk_jenis_program_rkap')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = {};
    response.data.map((m) => {
      dataarr[m.id_jenis_program_rkap] = m.nama;
    });
    setnamemt_risk_jenis_program_rkap(dataarr);
  };

  const [datamt_sdm_jabatan, setdatamt_sdm_jabatan] = useState([]);
  const [namemt_sdm_jabatan, setnamemt_sdm_jabatan] = useState({});
  const handlegetmt_sdm_jabatan = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_jabatan",
      filter,
    });
    // console.log('mt_sdm_jabatan')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);
    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = {};
    response.data.map((m) => {
      dataarr[m.id_jabatan] = m.id_jabatan;
    });

    setnamemt_sdm_jabatan(dataarr);
  };

  return (
    <>
      <div className="">
        <table className="w-full table table-auto border-collapse border">
          <thead>
            <tr>
              <th className="border">Penyebab</th>
              <th className="border">Rencana Perlakuan Risiko</th>
            </tr>
          </thead>
          <tbody>
            <TrTdRiskProfileMitigasiNew
              rows={risk_profile_mitigasi}
              namemt_risk_perlakuan={namemt_risk_perlakuan}
              namemt_risk_jenis_perlakuan={namemt_risk_jenis_perlakuan}
              namemt_risk_jenis_program_rkap={namemt_risk_jenis_program_rkap}
              namemt_sdm_jabatan={namemt_sdm_jabatan}
              bulan={props.bulan}
              bulancurrent
            />
          </tbody>
        </table>
      </div>
    </>
  );
};

const TrTdRiskProfileMitigasiNew = (props) => {
  // console.log('TrTdRiskProfileMitigasiNew')
  // console.log(props.bulan)
  // console.log(combobulan())
  let numb = 0;
  return (
    <>
      {Object.keys(props.rows).map((m, i) => {
        return (
          <tr key={i}>
            {/* <td className='border text-center' colSpan={1} rowSpan={1}>{(props.datafilter.paginate.page - 1) * props.datafilter.paginate.pagesize + i + 1}</td> */}
            {/* {props.rows[m]['risiko'] ? (
                            <>
                                <td className='border' colSpan={1} rowSpan={props.rows[m]['risiko']['rowSpan']}>
                                    <div className='d-flex'>
                                        <div className='flex-1'>
                                            {props.rows[m]['risiko']['nama']}
                                        </div>
                                    </div>
                                </td>
                            </>
                        ) : null} */}
            {props.rows[m]["penyebab"] &&
            Object.keys(props.rows[m]["penyebab"]).length > 0 ? (
              <td
                className="border"
                colSpan={1}
                rowSpan={props.rows[m]["penyebab"]["rowSpan"]}
              >
                <div className="d-flex">
                  <div className="flex-1">
                    {props.rows[m]["penyebab"]["nama_penyebab"]}
                  </div>
                </div>
              </td>
            ) : null}
            {props.rows[m]["mitigasi"] &&
            Object.keys(props.rows[m]["mitigasi"]).length > 0 ? (
              <td className="border">
                <span
                  className=""
                  dangerouslySetInnerHTML={{
                    __html: nl2br(props.rows[m]["mitigasi"]["nama_mitigasi"]),
                  }}
                ></span>

                {/* id_perlakuan
                                id_jenis_perlakuan
                                id_jenis_program_rkap
                                id_pic */}
                <div style={{ height: 20 }}></div>
                {props.rows[m]["mitigasi"]["data"] ? (
                  <>
                    <div className="form-group mb-2">
                      <label>
                        {rules_rencana_perlakuan_risiko.id_perlakuan.label}
                      </label>
                      <div>
                        {
                          props.namemt_risk_perlakuan[
                            props.rows[m]["mitigasi"]["data"].id_perlakuan
                          ]
                        }
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label>
                        {
                          rules_rencana_perlakuan_risiko.id_jenis_perlakuan
                            .label
                        }
                      </label>
                      <div>
                        {
                          props.namemt_risk_jenis_perlakuan[
                            props.rows[m]["mitigasi"]["data"].id_jenis_perlakuan
                          ]
                        }
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label>
                        {rules_rencana_perlakuan_risiko.output_perlakuan.label}
                      </label>
                      <div>
                        {props.rows[m]["mitigasi"]["data"].output_perlakuan}
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label>
                        {rules_rencana_perlakuan_risiko.biaya.label}
                      </label>
                      <div>
                        {rupiah(props.rows[m]["mitigasi"]["data"].biaya)}
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label>
                        {rules_rencana_perlakuan_risiko.output_perlakuan.label}
                      </label>
                      <div>
                        {props.rows[m]["mitigasi"]["data"].output_perlakuan}
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label>
                        {
                          rules_rencana_perlakuan_risiko.id_jenis_program_rkap
                            .label
                        }
                      </label>
                      <div>
                        {
                          props.namemt_risk_jenis_program_rkap[
                            props.rows[m]["mitigasi"]["data"]
                              .id_jenis_program_rkap
                          ]
                        }
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label>
                        {rules_rencana_perlakuan_risiko.id_pic.label}
                      </label>
                      <div>
                        {
                          props.namemt_sdm_jabatan[
                            props.rows[m]["mitigasi"]["data"].id_pic
                          ]
                        }
                      </div>
                    </div>

                    <div className="form-group mb-2">
                      <label>
                        {rules_rencana_perlakuan_risiko.timeline.label}
                      </label>

                      <table className="w-full table table-auto border-collapse border">
                        <thead>
                          <tr>
                            {combobulan().map((x, y) => {
                              if (props.bulancurrent) {
                                if (props.bulan == x.value) {
                                  return (
                                    <td key={y} className="border text-center">
                                      {parseInt(x.value)}
                                    </td>
                                  );
                                }
                              } else {
                                return (
                                  <td key={y} className="border text-center">
                                    {parseInt(x.value)}
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {Object.keys(
                              props.rows[m]["mitigasi"]["data"].timeline
                            ).map((x, y) => {
                              if (props.bulancurrent) {
                                // console.log("props.rows[m]['mitigasi']['data'].timeline[x]")
                                // console.log(props.rows[m]['mitigasi']['data'].timeline[x])
                                if (x == bulanNumbValueVar[props.bulan]) {
                                  return (
                                    <td className="border" key={y}>
                                      <InputCheckbox
                                        ref={null}
                                        type="checkbox"
                                        data={[{ label: "", value: "1" }]}
                                        value={
                                          props.rows[m]["mitigasi"]["data"]
                                            .timeline[x]
                                        }
                                        className="block mt-1 w-full"
                                        onChange={(value) => null}
                                        required={false}
                                        isMulti={false}
                                        autoFocus
                                        disabled={true}
                                        formOnly
                                        center
                                      />
                                    </td>
                                  );
                                }
                              } else {
                                return (
                                  <td className="border" key={y}>
                                    <InputCheckbox
                                      ref={null}
                                      type="checkbox"
                                      data={[{ label: "", value: "1" }]}
                                      value={
                                        props.rows[m]["mitigasi"]["data"]
                                          .timeline[x]
                                      }
                                      className="block mt-1 w-full"
                                      onChange={(value) => null}
                                      required={false}
                                      isMulti={false}
                                      autoFocus
                                      disabled={true}
                                      formOnly
                                      center
                                    />
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </td>
            ) : null}
          </tr>
        );
      })}
    </>
  );
};

const Realisasi_risiko_residual = (props) => {
  // const id = props.params['id_register']
  // const path_param = props.params.slug[0]
  // const jenis_param = props.params.slug[1]
  // const id_profile = props.params.slug[2]

  // const page_url = 'risk_profile'

  const [errors, setErrors] = useState({});
  const [is_loading, setis_loading] = useState(false);
  const is_disabled = true;
  // const id = props.params.slug[1];

  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
  } = api_services({});

  const [master, setmaster] = useState({});

  const [jenis_risk_string, setjenis_risk_string] = useState("");

  const [penjelasan_dampak, setpenjelasan_dampak] = useState("");
  const [nilai_dampak_inheren, setnilai_dampak_inheren] = useState("");
  const [id_dampak_inheren, setid_dampak_inheren] = useState("");
  const [nilai_kemungkinan, setnilai_kemungkinan] = useState("");
  const [id_kemungkinan_inheren, setid_kemungkinan_inheren] = useState("");
  const [nilai_sasaran, setnilai_sasaran] = useState(null);

  const [level_risiko, setlevel_risiko] = useState({
    level: "",
    warna: "",
    skala: "",
  });

  const [nilai_eksposur, setnilai_eksposur] = useState("");
  const [all_data_loaded, setall_data_loaded] = useState(false);

  useEffect(() => {
    if (props.risk_profile_and_master_loaded && props.master) {
      handleInit();
    }
  }, [props.risk_profile_and_master_loaded, props.master]);

  useEffect(() => {
    if (all_data_loaded) {
      // handleDataOtomatis(
      //     jenis_risk_string == 'Kuantitatif'
      //         ? 'nilai_dampak_inheren'
      //         : 'id_dampak_inheren',
      //     jenis_risk_string == 'Kuantitatif'
      //         ? nilai_dampak_inheren
      //         : id_dampak_inheren,
      // )
      handleDataOtomatisDetail();
    }
  }, [all_data_loaded]);

  useEffect(() => {
    props.onLoading(is_loading);
  }, [is_loading]);

  const handleInit = () => {
    setpenjelasan_dampak(props.risk_profile_data.penjelasan_dampak);
    setnilai_dampak_inheren(props.risk_profile_data.nilai_dampak_inheren);
    setid_dampak_inheren(props.risk_profile_data.id_dampak_inheren);
    setnilai_kemungkinan(props.risk_profile_data.nilai_kemungkinan);
    setid_kemungkinan_inheren(props.risk_profile_data.id_kemungkinan_inheren);

    let jenis_risk_string =
      props.risk_profile_data.is_kuantitatif == 1
        ? "Kuantitatif"
        : "Kualitatif";
    setjenis_risk_string(jenis_risk_string);

    setnilai_sasaran(props.risk_profile_data.nilai_sasaran);

    setmaster(props.master);

    // console.log('XXXXXXXXXXXXXXXX')
    // console.log('props.risk_profile_data')
    // console.log(props.risk_profile_data)
    // setall_data_loaded(true)
    handlegetrisk_profile_realisasi_residual();
  };

  const handlegetrisk_profile_realisasi_residual = async () => {
    const tahun_bulan = `${props.tahun}${parseInt(props.bulan)}`;
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: `/risk_profile_realisasi_residual/${props.risk_profile_data.id_risk_profile}/${tahun_bulan}`,
    });
    // console.log('risk_profile_realisasi_residual')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error) return;

    if (response.length == 0) {
      // setperiode('')
      setpenjelasan_dampak("");
      setnilai_dampak_inheren("");
      setid_dampak_inheren("");
      setnilai_kemungkinan("");
      setid_kemungkinan_inheren("");
      setnilai_eksposur("");
      setlevel_risiko(init_level_risiko);
      return;
    }

    // setperiode(response[0].periode)
    setpenjelasan_dampak(response[0].penjelasan_dampak);
    setnilai_dampak_inheren(response[0].nilai_dampak);
    setid_dampak_inheren(response[0].id_dampak);
    setnilai_kemungkinan(response[0].nilai_kemungkinan);
    setid_kemungkinan_inheren(response[0].id_kemungkinan);

    setall_data_loaded(true);
  };

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handleDataOtomatis = (column, value) => {
    return;
    if (column && value) {
      if (jenis_risk_string == "Kuantitatif") {
        // console.log('Kuantitatif')
        if (column == "nilai_dampak_inheren") {
          const resid_dampak_inheren = skalaDampakOtomatis(
            master,
            value,
            nilai_sasaran
          );
          const nilai_eksposur = nilaiEksposurOtomatis(
            value,
            nilai_kemungkinan
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            resid_dampak_inheren,
            id_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_eksposur(nilai_eksposur);
          setid_dampak_inheren(resid_dampak_inheren);
        }
        if (column == "nilai_kemungkinan") {
          const resid_kemungkinan_inheren = skalaProbabilitasOtomatis(
            master,
            value
          );
          const nilai_eksposur = nilaiEksposurOtomatis(
            nilai_dampak_inheren,
            value
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            id_dampak_inheren,
            resid_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setid_kemungkinan_inheren(resid_kemungkinan_inheren);
          setnilai_eksposur(nilai_eksposur);
        }
      }
      if (jenis_risk_string == "Kualitatif") {
        // console.log('Kualitatif')
        if (column == "id_dampak_inheren") {
          const nilai_eksposur = nilaiEksposurKualitatifOtomatis(
            value,
            nilai_kemungkinan,
            master,
            nilai_sasaran
          );
          const nilai_dampak_inherenres = nilaiDampakOtomatis(
            nilai_eksposur,
            nilai_kemungkinan
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            value,
            id_kemungkinan_inheren
          );
          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_dampak_inheren(nilai_dampak_inherenres);
          setnilai_eksposur(nilai_eksposur);
        }
        if (column == "nilai_kemungkinan") {
          const nilai_eksposurres = nilaiEksposurKualitatifOtomatis(
            id_dampak_inheren,
            value,
            master,
            nilai_sasaran
          );
          const nilai_dampak_inherenres = nilaiDampakOtomatis(
            nilai_eksposurres,
            value
          );
          const resid_kemungkinan_inheren = skalaProbabilitasOtomatis(
            master,
            value
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            id_dampak_inheren,
            resid_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_eksposur(nilai_eksposurres);
          setnilai_dampak_inheren(nilai_dampak_inherenres);
          setid_kemungkinan_inheren(resid_kemungkinan_inheren);
        }
      }
    }
  };

  const handleDataOtomatisDetail = () => {
    if (jenis_risk_string == "Kuantitatif") {
      const nilai_eksposur = nilaiEksposurOtomatis(
        nilai_dampak_inheren,
        nilai_kemungkinan
      );
      const resskala_risiko = skalaRisikoOtomatis(
        master,
        id_dampak_inheren,
        id_kemungkinan_inheren
      );

      setlevel_risiko({
        level: resskala_risiko == null ? "" : resskala_risiko.nama,
        skala: resskala_risiko == null ? "" : resskala_risiko.skala,
        warna: resskala_risiko == null ? "" : resskala_risiko.warna,
      });
      setnilai_eksposur(nilai_eksposur);
    }
    if (jenis_risk_string == "Kualitatif") {
      const nilai_eksposur = nilaiEksposurKualitatifOtomatis(
        id_dampak_inheren,
        nilai_kemungkinan,
        master,
        nilai_sasaran
      );
      const resskala_risiko = skalaRisikoOtomatis(
        master,
        id_dampak_inheren,
        id_kemungkinan_inheren
      );
      setlevel_risiko({
        level: resskala_risiko == null ? "" : resskala_risiko.nama,
        skala: resskala_risiko == null ? "" : resskala_risiko.skala,
        warna: resskala_risiko == null ? "" : resskala_risiko.warna,
      });
      setnilai_eksposur(nilai_eksposur);
    }

    // setotomatis_successfully(true)
  };

  return (
    <>
      <div className="">
        <Input
          ref={null}
          id="penjelasan_dampak"
          type="textarea"
          label={rules_analisa_risiko_inheren.penjelasan_dampak.label}
          placeholder={rules_analisa_risiko_inheren.penjelasan_dampak.label}
          value={penjelasan_dampak}
          className="block mt-1 w-full"
          onChange={(event) => setpenjelasan_dampak(event.target.value)}
          required={rules_analisa_risiko_inheren.penjelasan_dampak.required}
          autoFocus
          message_error={errors.penjelasan_dampak}
          onError={handleErrors}
          disabled={is_disabled}
          formCol
        />

        <div className="row">
          <div className="col-lg-6">
            <InputNumeric
              ref={null}
              id="nilai_dampak_inheren"
              type="text"
              label={rules_analisa_risiko_inheren.nilai_dampak_inheren.label}
              placeholder={
                rules_analisa_risiko_inheren.nilai_dampak_inheren.label
              }
              value={nilai_dampak_inheren}
              className="block mt-1 w-full"
              onChange={(value) => {
                setnilai_dampak_inheren(value);
                handleDataOtomatis("nilai_dampak_inheren", value);
              }}
              required={
                rules_analisa_risiko_inheren.nilai_dampak_inheren.required
              }
              autoFocus
              message_error={errors.nilai_dampak_inheren}
              onError={handleErrors}
              // disabled={is_disabled}
              disabled={jenis_risk_string == "Kualitatif" ? true : is_disabled}
              formCol
            />
          </div>
          <div className="col-lg-6">
            <InputSelect
              ref={null}
              id="id_dampak_inheren"
              type="select"
              label={rules_analisa_risiko_inheren.id_dampak_inheren.label}
              placeholder={"Pilih..."}
              value={id_dampak_inheren}
              className="block mt-1 w-full"
              data={props.datamt_risk_dampak}
              onChange={(value) => {
                setid_dampak_inheren(value);
                handleDataOtomatis("id_dampak_inheren", value);
              }}
              required={rules_analisa_risiko_inheren.id_dampak_inheren.required}
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_dampak_inheren}
              onError={handleErrors}
              disabled={jenis_risk_string == "Kuantitatif" ? true : is_disabled}
              // loadOptions={handlegetrisk_dampak}
              formCol
              colorapply
            />
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <InputNumeric
              ref={null}
              id="nilai_kemungkinan"
              type="text"
              label={rules_analisa_risiko_inheren.nilai_kemungkinan.label}
              placeholder={rules_analisa_risiko_inheren.nilai_kemungkinan.label}
              value={nilai_kemungkinan}
              className="block mt-1 w-full"
              onChange={(value) => {
                setnilai_kemungkinan(value);
                handleDataOtomatis("nilai_kemungkinan", value);
              }}
              required={rules_analisa_risiko_inheren.nilai_kemungkinan.required}
              autoFocus
              message_error={errors.nilai_kemungkinan}
              onError={handleErrors}
              disabled={is_disabled}
              formCol
              maxLength={6}
            />
          </div>
          <div className="col-lg-6">
            <InputSelect
              ref={null}
              id="id_kemungkinan_inheren"
              type="select"
              label={rules_analisa_risiko_inheren.id_kemungkinan_inheren.label}
              placeholder={"Pilih..."}
              value={id_kemungkinan_inheren}
              className="block mt-1 w-full"
              data={props.datamt_risk_kemungkinan}
              onChange={setid_kemungkinan_inheren}
              required={
                rules_analisa_risiko_inheren.id_kemungkinan_inheren.required
              }
              autoFocus
              isClearable
              isMulti={false}
              message_error={errors.id_kemungkinan_inheren}
              onError={handleErrors}
              disabled={true}
              // loadOptions={handlegetrisk_dampak}
              formCol
              colorapply
            />
          </div>
        </div>

        <NilaiEksposurLevelRisikoViewOnly
          nilai_eksposur={nilai_eksposur}
          level_risiko={level_risiko}
        />
      </div>
    </>
  );
};

const Realisasi_pelaksanaan_perlakuan_risiko_dan_biaya = (props) => {
  // const id = props.params['id_register']
  // const path_param = props.params.slug[0]
  // const id_profile = props.params.slug[1]
  // const id_profile_penyebab_param = props.params.slug[2]
  // const jenis_param = props.params.slug[3]
  // const id_mitigasi_param = props.params.slug[4]

  const [errors, setErrors] = useState({});
  const is_disabled = true;
  const [is_loading, setis_loading] = useState(false);

  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
  } = api_services({});

  const [jenis_risk_string, setjenis_risk_string] = useState("");

  const [waktu_terpapar_risiko, setwaktu_terpapar_risiko] = useState("");

  const [id_penyebab, setid_penyebab] = useState([]);
  const [id_dampak, setid_dampak] = useState([]);

  const [kri_kualitatif, setkri_kualitatif] = useState([]);
  const [kri_kuantitatif, setkri_kuantitatif] = useState([]);
  const [existing_control, setexisting_control] = useState([]);
  const [dampak, setdampak] = useState([]);

  const [id_risiko, setid_risiko] = useState("");

  const [penjelasan_dampak, setpenjelasan_dampak] = useState("");
  const [nilai_dampak_inheren, setnilai_dampak_inheren] = useState("");
  const [id_dampak_inheren, setid_dampak_inheren] = useState("");
  const [nilai_kemungkinan, setnilai_kemungkinan] = useState("");
  const [id_kemungkinan_inheren, setid_kemungkinan_inheren] = useState("");

  const [id_mitigasi, setid_mitigasi] = useState("");
  const [periode, setperiode] = useState("");
  const [nama, setnama] = useState("");
  const [realisasi_perlakuan_risiko, setrealisasi_perlakuan_risiko] = useState(
    []
  );

  const [all_data_loaded, setall_data_loaded] = useState(false);
  const [nilai_sasaran, setnilai_sasaran] = useState(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (props.risk_profile_and_master_loaded) {
      handleInit();
    }
  }, [props.risk_profile_and_master_loaded]);

  useEffect(() => {
    props.onLoading(is_loading);
  }, [is_loading]);

  // useEffect(() => {
  //     if (initialized.current && all_data_loaded && path_param == 'detail') {
  //         handleDataOtomatis(jenis_risk_string == 'Kuantitatif' ? 'nilai_dampak_inheren' : 'id_dampak_inheren', jenis_risk_string == 'Kuantitatif' ? nilai_dampak_inheren : id_dampak_inheren)
  //     }
  // }, [all_data_loaded])

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handleInit = () => {
    handlegetrisk_profile_mitigasi_realisasi();
  };

  const handlegetrisk_registerid = async (id, data) => {
    const response = await getapi_servicesid({
      setErrors,
      api_path: "/risk_register",
      id,
    });
    // console.log('getrisk_registerid=>parent')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    data.push({
      label: response.nama,
      url: `/risk_profile/${response.id_register}`,
    });

    if (response.id_parent_register === null) return data;

    await handlegetrisk_registerid(response.id_parent_register, data);
  };

  const handlegetrisk_profile_mitigasi_realisasi = async () => {
    const tahun_bulan = `${props.tahun}${parseInt(props.bulan)}`;
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: `/risk_profile_mitigasi_realisasi/${props.risk_profile_data.id_risk_profile}/${tahun_bulan}`,
    });
    // console.log('risk_profile_mitigasi_realisasi')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error) return;

    let kri_kuantitatif = [];
    response.kri_kuantitatif.map((m) => {
      kri_kuantitatif.push({
        ...m,
        status_kuantitatif: m.status,
        periode: tahun_bulan,
      });
    });
    let kri_kualitatif = [];
    response.kri_kualitatif.map((m) => {
      kri_kualitatif.push({
        ...m,
        periode: tahun_bulan,
      });
    });
    let mitigasi = [];
    response.mitigasi.map((m) => {
      mitigasi.push({
        ...m,
        periode: tahun_bulan,
      });
    });

    // console.log('risk_profile_mitigasi_realisasi=>')
    // console.log(kri_kuantitatif)
    // console.log(kri_kualitatif)
    // console.log(mitigasi)

    setkri_kuantitatif(kri_kuantitatif);
    setkri_kualitatif(kri_kualitatif);
    setrealisasi_perlakuan_risiko(mitigasi);
  };

  const handlegetrisk_profileid = async () => {
    if (!id_profile) return;

    setis_loading(true);
    const response = await getapi_servicesid({ setErrors, id: id_profile });
    // console.log('getrisk_profileid')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error) return;

    setsasaran(response.sasaran);
    setid_sasaran(response.id_sasaran);
    setid_jenis_risiko(response.id_jenis_risiko);
    setid_taksonomi(response.id_taksonomi);

    setnama(response.nama);
    setdeskripsi(response.deskripsi);
    setis_kuantitatif(response.is_kuantitatif);

    setid_risiko({ label: response.nama, value: response.id_risiko });
    let id_penyebab = [];
    response.penyebab.map((m) => {
      id_penyebab.push({
        label: m.nama,
        value: m.id_penyebab,
        id_profile_penyebab: m.id_profile_penyebab,
      });
    });
    setid_penyebab(id_penyebab);

    setkri_kualitatif(response.kri_kualitatif);
    setkri_kuantitatif(response.kri_kuantitatif);

    setexisting_control(response.control);
    setdampak(response.dampak);

    setpenjelasan_dampak(response.penjelasan_dampak);
    setnilai_dampak_inheren(response.nilai_dampak_inheren);
    setid_dampak_inheren(response.id_dampak_inheren);
    setnilai_kemungkinan(response.nilai_kemungkinan);
    setid_kemungkinan_inheren(response.id_kemungkinan_inheren);

    let jenis_risk_string =
      response.is_kuantitatif == 1 ? "Kuantitatif" : "Kualitatif";
    setjenis_risk_string(jenis_risk_string);

    setnilai_sasaran(response.nilai_sasaran);

    setbulan(formatDateApp(new Date(), "MM"));
  };

  const [dataid_sasaran, setdataid_sasaran] = useState([]);

  const handlegetid_sasaran = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    // if (inputValue) {
    //     filter.nama = inputValue
    // }
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_sasaran",
      filter,
    });
    // console.log('getmt_risk_sasaran')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_sasaran,
      });
    });

    setdataid_sasaran(dataarr);
    // if (!inputValue && !callback) {
    // } else {
    //     callback(
    //         dataarr
    //     )
    // }
  };

  const [datamt_risk_dampak, setdatadatamt_risk_dampak] = useState([]);

  const handlegetmt_risk_dampak = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    // if (inputValue) {
    //     filter.nama = inputValue
    // }
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_dampak",
      filter,
    });
    // console.log('mt_risk_dampak')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_dampak,
      });
    });

    setdatadatamt_risk_dampak(dataarr);
    // if (!inputValue && !callback) {
    // } else {
    //     callback(
    //         dataarr
    //     )
    // }
  };

  const [datamt_risk_kemungkinan, setdatamt_risk_kemungkinan] = useState([]);

  const handlegetmt_risk_kemungkinan = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    // if (inputValue) {
    //     filter.nama = inputValue
    // }
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_kemungkinan",
      filter,
    });
    // console.log('mt_risk_kemungkinan')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_kemungkinan,
      });
    });

    setdatamt_risk_kemungkinan(dataarr);
    // if (!inputValue && !callback) {
    // } else {
    //     callback(
    //         dataarr
    //     )
    // }
  };

  const [dataid_jenis_risiko, setdataid_jenis_risiko] = useState([]);

  const handlegetid_jenis_risiko = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_jenis_risiko",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('getmt_risk_jenis_risiko')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_jenis_risiko,
      });
    });
    setdataid_jenis_risiko(dataarr);
  };

  const [dataid_taksonomi, setdataid_taksonomi] = useState([]);

  const handlegetid_taksonomi = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_taksonomi",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('getmt_risk_taksonomi')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_taksonomi,
      });
    });
    setdataid_taksonomi(dataarr);
  };

  const [dataid_register, setdataid_register] = useState([]);

  const handlegetid_register = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_register",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('getrisk_register')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_register,
      });
    });
    setdataid_register(dataarr);
  };

  const [dataid_risiko, setdataid_risiko] = useState([]);

  const handlegetid_risiko = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_risiko",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('getrisk_risiko')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_risiko,
      });
    });
    setdataid_risiko(dataarr);
  };

  const [dataid_penyebab, setdataid_penyebab] = useState([]);

  const handlegetrisk_penyebab = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    if (inputValue) {
      filter.paginate.pagesize = 10;
      filter.filter = {
        nama: inputValue,
      };
    }
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_penyebab",
      filter,
    });
    // console.log('getrisk_penyebab')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_penyebab,
      });
    });

    if (!inputValue && !callback) {
      setdataid_penyebab(dataarr);
    } else {
      callback(dataarr);
    }
  };

  const [dataid_dampak, setdataid_dampak] = useState([]);

  const handlegetrisk_dampak = async (inputValue, callback) => {
    let filter = {
      paginate: {
        page: 1,
        pagesize: 10000,
      },
    };
    if (inputValue) {
      filter.paginate.pagesize = 10;
      filter.filter = {
        nama: inputValue,
      };
    }
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_dampak",
      filter,
    });
    // console.log('getrisk_dampak')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_dampak,
      });
    });

    if (!inputValue && !callback) {
      setdataid_dampak(dataarr);
    } else {
      callback(dataarr);
    }
  };

  const [datamt_risk_jenis_control, setdatadatamt_risk_jenis_control] =
    useState([]);

  const handlegetmt_risk_jenis_control = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_jenis_control",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_risk_jenis_control')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_jenis_control,
      });
    });
    setdatadatamt_risk_jenis_control(dataarr);
  };

  const [
    datamt_risk_efektifitas_control,
    setdatadatamt_risk_efektifitas_control,
  ] = useState([]);

  const handlegetmt_risk_efektifitas_control = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_risk_efektifitas_control",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_risk_efektifitas_control')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_efektifitas_control,
      });
    });
    setdatadatamt_risk_efektifitas_control(dataarr);
  };

  const [datarisk_profile_mitigasi, setdatarisk_profile_mitigasi] = useState(
    []
  );

  const handlegetrisk_profile_mitigasi = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_profile_mitigasi",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('risk_profile_mitigasi')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_mitigasi,
      });
    });
    setdatarisk_profile_mitigasi(dataarr);
  };

  const [datamt_sdm_jabatan, setdatamt_sdm_jabatan] = useState([]);
  const handlegetmt_sdm_jabatan = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_jabatan",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_sdm_jabatan')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_jabatan,
      });
    });
    setdatamt_sdm_jabatan(dataarr);
  };

  const [datarisk_profile_kri, setdatarisk_profile_kri] = useState([]);

  const handlegetrisk_profile_kri = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_profile_kri",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('risk_profile_kri')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_kri,
      });
    });
    setdatarisk_profile_kri(dataarr);
  };

  const [datamt_status_rencana_perlakuan, setdatamt_status_rencana_perlakuan] =
    useState([]);

  const handlegemt_status_rencana_perlakuan = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_status_rencana_perlakuan",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('mt_status_rencana_perlakuan')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_status_rencana_perlakuan,
      });
    });
    setdatamt_status_rencana_perlakuan(dataarr);
  };

  const handlegetrisk_profile_penyebabid = async () => {
    if (!id_profile_penyebab_param) {
      return;
    }
    const response = await getapi_servicesid({
      setErrors,
      api_path: "/risk_profile_penyebab",
      id: id_profile_penyebab_param,
    });
    // console.log('risk_profile_penyebabid')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;

    setid_profile_penyebab(response.id_profile_penyebab);
  };

  const [datarisk_profile_penyebab, setdatarisk_profile_penyebab] = useState(
    []
  );
  const handlegetrisk_profile_penyebab = async () => {
    const response = await getapi_services({
      setErrors,
      api_path: "/risk_profile_penyebab",
      filter: {
        paginate: {
          page: 1,
          pagesize: 10000,
        },
      },
    });
    // console.log('risk_profile_penyebab')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_profile_penyebab,
      });
    });
    setdatarisk_profile_penyebab(dataarr);
  };

  const handlegetrisk_profile_realisasi_residual = async () => {
    if (!id_profile) return;

    const tahun_bulan = `${tahun}${parseInt(bulan)}`;
    setis_loading(true);
    const response = await getapi_services({
      setErrors,
      api_path: `/risk_profile_realisasi_residual/${id_profile}/${tahun_bulan}`,
    });
    // console.log('risk_profile_realisasi_residual')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error) return;

    if (response.length == 0) {
      // setperiode('')
      // setpenjelasan_dampak('')
      setnilai_dampak_inheren("");
      setid_dampak_inheren("");
      setnilai_kemungkinan("");
      setid_kemungkinan_inheren("");
      setnilai_eksposur("");
      setlevel_risiko(init_level_risiko);
      return;
    }

    // setperiode(response[0].periode)
    // setpenjelasan_dampak(response[0].penjelasan_dampak)
    setnilai_dampak_inheren(response[0].nilai_dampak);
    setid_dampak_inheren(response[0].id_dampak);
    setnilai_kemungkinan(response[0].nilai_kemungkinan);
    setid_kemungkinan_inheren(response[0].id_kemungkinan);

    setall_data_loaded(true);
  };

  const handleDataOtomatis = async (column, value) => {
    if (column && value) {
      if (jenis_risk_string == "Kuantitatif") {
        // console.log('Kuantitatif')
        if (column == "nilai_dampak_inheren") {
          const resid_dampak_inheren = skalaDampakOtomatis(
            master,
            value,
            nilai_sasaran
          );
          const nilai_eksposur = nilaiEksposurOtomatis(
            value,
            nilai_kemungkinan
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            resid_dampak_inheren,
            id_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_eksposur(nilai_eksposur);
          setid_dampak_inheren(resid_dampak_inheren);
        }
        if (column == "nilai_kemungkinan") {
          const resid_kemungkinan_inheren = skalaProbabilitasOtomatis(
            master,
            value
          );
          const nilai_eksposur = nilaiEksposurOtomatis(
            nilai_dampak_inheren,
            value
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            id_dampak_inheren,
            resid_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setid_kemungkinan_inheren(resid_kemungkinan_inheren);
          setnilai_eksposur(nilai_eksposur);
        }
      }
      if (jenis_risk_string == "Kualitatif") {
        // console.log('Kualitatif')
        if (column == "id_dampak_inheren") {
          const nilai_eksposur = nilaiEksposurKualitatifOtomatis(
            value,
            nilai_kemungkinan,
            master,
            nilai_sasaran
          );
          const nilai_dampak_inherenres = nilaiDampakOtomatis(
            nilai_eksposur,
            nilai_kemungkinan
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            value,
            id_kemungkinan_inheren
          );
          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_dampak_inheren(nilai_dampak_inherenres);
          setnilai_eksposur(nilai_eksposur);
        }
        if (column == "nilai_kemungkinan") {
          const nilai_eksposurres = nilaiEksposurKualitatifOtomatis(
            id_dampak_inheren,
            value,
            master,
            nilai_sasaran
          );
          const nilai_dampak_inherenres = nilaiDampakOtomatis(
            nilai_eksposurres,
            value
          );
          const resid_kemungkinan_inheren = skalaProbabilitasOtomatis(
            master,
            value
          );
          const resskala_risiko = skalaRisikoOtomatis(
            master,
            id_dampak_inheren,
            resid_kemungkinan_inheren
          );

          setlevel_risiko({
            level: resskala_risiko == null ? "" : resskala_risiko.nama,
            skala: resskala_risiko == null ? "" : resskala_risiko.skala,
            warna: resskala_risiko == null ? "" : resskala_risiko.warna,
          });
          setnilai_eksposur(nilai_eksposurres);
          setnilai_dampak_inheren(nilai_dampak_inherenres);
          setid_kemungkinan_inheren(resid_kemungkinan_inheren);
        }
      }
    }
  };

  return (
    <div className="">
      <InputColumnMultiple
        ref={null}
        id="kri_realisasi"
        type="select"
        label={"Realisasi KRI Kuantitatif"}
        // tooltips={'KRI Kualitatif'}
        placeholder={"Realisasi KRI Kuantitatif"}
        value={kri_kuantitatif}
        className="block mt-1 w-full"
        onChange={setkri_kuantitatif}
        required={false}
        autoFocus
        message_error={errors.kri_kuantitatif}
        onError={handleErrors}
        disabled={is_disabled}
        htmlhead={htmlheadkrikuantitatif_realisasi}
        datainit={init_kri}
        is_kuantitatif
        formCol
        notAdd
      />

      <InputColumnMultiple
        ref={null}
        id="kri_realisasi"
        type="select"
        label={"Realisasi KRI Kualitatif"}
        // tooltips={'KRI Kualitatif'}
        placeholder={"Realisasi KRI Kualitatif"}
        value={kri_kualitatif}
        className="block mt-1 w-full"
        onChange={setkri_kualitatif}
        required={false}
        autoFocus
        message_error={errors.kri_kualitatif}
        onError={handleErrors}
        disabled={is_disabled}
        htmlhead={htmlheadkrikuantitatif_realisasi}
        datainit={init_kri}
        is_kualitatif
        formCol
        notAdd
      />

      <InputColumnMultiple
        ref={null}
        id="realisasi_perlakuan_risiko"
        type="select"
        label={
          rules_realisasi_pelaksanaan_perlakuan_risiko_dan_biaya
            .realisasi_perlakuan_risiko.label
        }
        // tooltips={'KRI Kualitatif'}
        placeholder={
          rules_realisasi_pelaksanaan_perlakuan_risiko_dan_biaya
            .realisasi_perlakuan_risiko.label
        }
        value={realisasi_perlakuan_risiko}
        className="block mt-1 w-full"
        onChange={setrealisasi_perlakuan_risiko}
        required={false}
        autoFocus
        message_error={errors.realisasi_perlakuan_risiko}
        onError={handleErrors}
        disabled={is_disabled}
        htmlhead={htmlheadrealisasi_perlakuan_risiko}
        formCol
        datamt_status_rencana_perlakuan={datamt_status_rencana_perlakuan}
        notAdd
      />
    </div>
  );
};
