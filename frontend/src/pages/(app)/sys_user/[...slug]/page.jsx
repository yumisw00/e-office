import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "components/Navigation";
import HeaderApp from "components/HeaderApp";
import { checkNotAuthorized, initAccessMethod } from "pages/Utils";
import InputSelect from "components/InputSelect";
import InputCheckbox from "components/InputCheckbox";
import InputNumeric from "components/InputNumeric";
import Input from "components/Input";
import Button from "components/Button";
import InputRadio from "components/InputRadio";
import { api_services } from "hooks/api_services";
import { showToastr } from "pages/Utils";
import LabelForm from "components/FormLabel";
import FormMultiple from "components/FormMultiple";
import TextArea from "components/FormTextArea";
import Label from "components/Label";
import FormGroup from "components/FormGroup";
import InputSelectAsync from "components/InputSelectAsync";

const titlePage = "User";

const rules = {
  name: { label: "Nama", required: true },
  email: { label: "Username(Email)", required: true },
  email_verified_at: { label: "Email Verified At ", required: false },
  password: { label: "Password", required: true },
  passwordConfirm: { label: "Confirm Password", required: true },
  remember_token: { label: "Remember Token ", required: false },
  last_ip: { label: "Last Ip ", required: false },
  last_login: { label: "Last Login ", required: false },
  salt: { label: "Salt", required: false },
  id_pegawai: { label: "Pegawai ", required: false },
  id_jabatan: { label: "Jabatan ", required: false },
  id_group: { label: "Group", required: false },
  dataAll: { label: "Group Dan Jabatan", required: false },
  nid: {
    label: 'NID',
    required: true,
  },
};

const Sys_useredit = (props) => {
  const page_url = "sys_user";

  const pathname = usePathname();
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [path, setpath] = useState("");
  const [is_disabled, setis_disabled] = useState(false);
  const [access_method, setaccess_method] = useState({});
  const [is_loading, setis_loading] = useState(false);
  const [btn_loading, setbtn_loading] = useState(false);
  const id = props.params.slug[1];

  const {
    getapi_services,
    getapi_servicesid,
    postapi_services,
    putapi_services,
    deleteapi_services,
  } = api_services({
    api_path: `/${page_url}`,
  });

  const [nid, setnid] = useState("");
  const [name, setname] = useState("");
  const [email, setemail] = useState("");
  const [email_verified_at, setemail_verified_at] = useState("");
  const [password, setpassword] = useState("");
  const [passwordConfirm, setpasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [remember_token, setremember_token] = useState("");
  const [last_ip, setlast_ip] = useState("");
  const [last_login, setlast_login] = useState("");
  const [salt, setsalt] = useState("");
  const [id_jabatan, setid_jabatan] = useState("");
  const [dataAll, setDataAll] = useState([]);
  

  const initialized = useRef(false);

  useEffect(() => {
    //first load

    if (props.params.slug[0] == "edit") {
      rules.password.required = false;
      rules.passwordConfirm.required = false;
    } else {
      rules.password.required = true;
      rules.passwordConfirm.required = true;
    }

    handleInitAccessMethod();
    handlegetsys_userid();

    if (!initialized.current) {

      initialized.current = true;
    }
  }, [pathname]);

  useEffect(() => {
    // console.log(dataAll)
  }, [dataAll]);

  const handleInitAccessMethod = async () => {
    const { access_method, path, id } = await initAccessMethod(
      page_url,
      props.params
    );
    setaccess_method(access_method);
    setpath(path);
    if (path === "detail") {
      setis_disabled(true);
    } else {
      setis_disabled(false);
    }
  };

  const handleErrors = (column, message) => {
    setErrors({
      ...errors,
      [column]: message,
    });
  };

  const handlegetsys_userid = async () => {
    await handleGetIdJabatan(null, null, true);
    await handleGetIdGroup(true);

    if (!id) return;

    setis_loading(true);
    const response = await getapi_servicesid({ setErrors, id });
    if (response) {
      const responseGroup = await getapi_services({
        setErrors,
        filter: {
          paginate: {
            page: 1,
            pagesize: 20,
          },
          filter: {
            id_user: id,
          },
        },
        api_path: "/sys_user_group",
      });
      // console.log('getsys_user_group')
      // console.log(responseGroup)
      if (responseGroup.error) return;

      responseGroup.data.map((v, i) => {
        dataAll[i] = { id_group: v.id_group, id_jabatan: v.id_jabatan };
      });

      // console.log('dataIdJabatan=>')
      // console.log(dataIdJabatan)
      // console.log('dataIdJabatan=>end')

      let dataIdJabatanArr = dataIdJabatan
      for (let m of responseGroup.data) {
        let is_ready = false
        for (let x of dataIdJabatan) {
          if (x.value == m.id_jabatan) {
            is_ready = true
            break
          }
        }
        if (!is_ready) {
          dataIdJabatanArr.push({ label: m.nama_jabatan, value: m.id_jabatan })
        }
      }

      // console.log(dataIdJabatanArr)
      // console.log('dataIdJabatanArr=>end')
      if(dataIdJabatanArr && dataIdJabatanArr.length > 0 && dataIdJabatanArr[0].value) {

        setDataIdJabatan(dataIdJabatan => dataIdJabatanArr)
      }
    }
    // console.log('getsys_userid')
    // console.log(response)
    if (!response.error || response.error.message != "canceled")
      setis_loading(false);

    checkNotAuthorized(response);

    if (response.error || response.code) return;

    setname(response.name);
    setemail(response.email);
    setpassword(response.password);
    setnid(response.nid);



  };

  const handlegetafter_get_id = () => {

  }

  const handlepostsys_user = async () => {
    const body = {
      nid,
      name,
      email,
      password,
      // Simpan grup dan jabatan bersama data pengguna. Sebelumnya data ini
      // dikirim melalui request terpisah yang dapat dibatalkan saat halaman
      // langsung berpindah ke daftar pengguna.
      dataAll: (cleanDataAll() || []).map((row) => ({
        ...row,
        id_jabatan: (typeof row.id_jabatan === 'object' && row.id_jabatan !== null)
          ? row.id_jabatan.value
          : row.id_jabatan,
      })),
    };
    setbtn_loading(true);
    // id_group.map((valGroup, indexGroup) => {
    //     dataGroupDanJabatan[indexGroup] = {
    //         ...dataGroupDanJabatan[indexGroup],
    //         id_group: valGroup,
    //         id_jabatan: 0,
    //     }
    // })
    // id_jabatan.map((valJabatan, indexJabatan) => {
    //     dataGroupDanJabatan[indexJabatan] = {
    //         ...dataGroupDanJabatan[indexJabatan],
    //         id_jabatan: valJabatan,
    //     }
    // })

    if (password == passwordConfirm) {
      const response = await postapi_services({ setErrors, ...body });
      // console.log('postsys_user')
      // console.log(response)
      setbtn_loading(false);

      checkNotAuthorized(response);

      if (response.error || response.code) return;

      router.push(`/${page_url}`);
    } else {
      showToastr("error", "Confirm Password Salah!");
      setbtn_loading(false);
    }
  };

  const handleputsys_user = async () => {
    // console.log(typeof password)
    // const body = {
    //     name,
    //     email,
    // }

    setbtn_loading(true);

    if (password == passwordConfirm) {
      // Convert id_jabatan objects to plain values before sending to API
      const cleanDataAllForApi = (cleanDataAll() || []).map(row => ({
        ...row,
        id_jabatan: (typeof row.id_jabatan === 'object' && row.id_jabatan !== null)
          ? row.id_jabatan.value
          : row.id_jabatan,
      }));
      let body = {
        name,
        email,
        dataAll: cleanDataAllForApi,
        nid
      };
      if (password) {
        body = { ...body, password: password };
      }
      // console.log(body.password)
      const response = await putapi_services({
        setErrors,
        ...body,
        id,
      });

      if (response) {
        // const responseDeleteDampak = await deleteapi_services({
        //     api_path: `/sys_user_group`,
        //     id,
        // })
        // if (responseDeleteDampak) {
        //     dataAll.map(async (val, index) => {
        //         const body = {
        //             id_user: response['id_user'],
        //             id_group: val.id_group,
        //             id_jabatan: val.id_jabatan,
        //         }
        //         const responseGroup = await postapi_services({
        //             setErrors,
        //             ...body,
        //             customUrl: '/sys_user_group',
        //         })
        //         // console.log('postsys_user_group')
        //         // console.log(responseGroup)
        //     })
        // }
        // console.log('putsys_user')
        // console.log(response)
      }
      setbtn_loading(false);

      checkNotAuthorized(response);

      if (response.error || response.code) return;

      router.push(`/${page_url}`);
    } else {
      showToastr("error", "Confirm Password Salah!");
      setbtn_loading(false);
    }
  };

  const [dataIdJabatan, setDataIdJabatan] = useState([]);
  const handleGetIdJabatan = async (inputValue, callback, is_return) => {
    const filterarr = {}
    if (inputValue && callback) {
      filterarr.nama = inputValue
    }
    const response = await getapi_services({
      setErrors,
      api_path: "/mt_sdm_jabatan",
      filter: {
        paginate: {
          page: 1,
          pagesize: 20,
        },
        filter: filterarr
      },
    });
    // console.log('getmt_sdm_jabatan')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error || response.code) return;

    // Master jabatan dapat memuat beberapa ID untuk nama yang sama. Tampilkan
    // satu opsi per nama agar dropdown tidak berulang.
    const seenJabatanNames = new Set();
    const dataarr = [];
    for (const m of response.data) {
      const normalizedName = String(m.nama || '').trim().toLocaleLowerCase();
      const isPimpinanRole = /direksi|direktur|pimpinan/.test(normalizedName);
      if (!normalizedName || isPimpinanRole || seenJabatanNames.has(normalizedName)) {
        continue;
      }
      seenJabatanNames.add(normalizedName);
      dataarr.push({
        label: m.nama,
        value: m.id_jabatan,
      });
    }

    if (inputValue && callback) {

      callback(dataarr);
    } else {

      setDataIdJabatan(dataarr);
    }

    if (is_return) {
      return dataarr
    }
  };

  const [dataIdGroup, setDataIdGroup] = useState("");
  const getGroupOption = (groupId) => (dataIdGroup || []).find(
    (item) => String(item.value) === String(groupId)
  );
  const isPegawaiGroup = (groupId) => {
    const group = getGroupOption(groupId);
    return String(group?.label || "").trim().toLowerCase() === "pegawai";
  };
  const cleanDataAll = (rows = dataAll) => rows
    .filter((row) => row?.id_group)
    .map((row) => ({
      ...row,
      id_jabatan: isPegawaiGroup(row.id_group) ? row.id_jabatan || null : null,
    }));

  const handleGetIdGroup = async (is_return) => {
    const response = await getapi_services({
      setErrors,
      api_path: "/sys_group",
      filter: {
        paginate: {
          page: 1,
          pagesize: 2000,
        },
      },
    });
    // console.log('getmt_sys_group')
    // console.log(response)

    checkNotAuthorized(response);
    if (response.error || response.code) return;
    let dataarr = [];
    response.data.map((m) => {
      dataarr.push({
        label: m.nama,
        value: m.id_group,
      });
    });
    setDataIdGroup(dataIdGroup => dataarr);

    if (is_return) {
      return dataarr
    }
  };

  return (
    <>
      <HeaderApp
        title={`${path === "add" ? "Tambah" : path === "edit" ? "Edit" : "Detail"
          } ${titlePage}`}
        hideTitle
        is_loading={is_loading}
        data_btn={[]}
      />
      <div className="container pl-4 pr-4">
        <div className="d-flex justify-content-end mb-3">
          <Button
            className="btn-default-app btn-info"
            onClick={() => router.push(`/${page_url}`)}
          >
            <span className="material-icons icon-btn-left mr-1">arrow_back</span>
            Kembali
          </Button>
        </div>

        <div className="row g-3 user-form-layout">
          <div className="col-lg-6">
            <section className="user-form-card h-100">
              <div className="user-form-card-header">
                <span className="material-icons">person</span>
                <div>
                  <div className="user-form-card-title">Informasi Akun</div>
                  <div className="user-form-card-subtitle">Isi identitas dan kredensial pengguna.</div>
                </div>
              </div>


            {/* <FormGroup
              label={"NID"}
              required
              message_error={errors.nid}
              disabled={is_disabled}
            >
              <div className="col">

                <Input
                  ref={null}
                  id="nid"
                  type="text"
                  label={rules.nid.label}
                  placeholder={rules.nid.label}
                  value={nid}
                  className="block mt-1 w-full"
                  onChange={value => setnid(value)}
                  required={rules.nid.required}
                  autoFocus
                  message_error={errors.nid}
                  onError={handleErrors}
                  disabled={is_disabled}
                />
              </div>
            </FormGroup> */}


            <FormGroup
              label={"Nama"}
              required
              message_error={errors.name}
              disabled={is_disabled}
            >
              <div className="col">
                <Input
                  ref={null}
                  id="name"
                  type="textarea"
                  placeholder={rules.name.label}
                  value={name}
                  className="block mt-1 w-full"
                  onChange={(value) => setname(value)}
                  required={rules.name.required}
                  message_error={errors.name}
                  onError={handleErrors}
                  disabled={is_disabled}
                />
              </div>
            </FormGroup>

            <FormGroup
              label={"Email"}
              required
              message_error={errors.email}
              disabled={is_disabled}
            >
              <div className="col">
                <Input
                  ref={null}
                  id="email"
                  type="email"
                  placeholder={rules.email.label}
                  value={email}
                  className="block mt-1 w-full"
                  onChange={(value) => setemail(value)}
                  required={rules.email.required}
                  message_error={errors.email}
                  onError={handleErrors}
                  disabled={is_disabled}
                />
              </div>
            </FormGroup>


            {props.params.slug[0] == "edit" ? (
              <div className="w-full flex">
                <div className="col-sm-4"></div>
                <Label className={"ps-[12px] mb-2"}>
                  Kosongkan password apabila Anda tidak ingin merubahnya.
                </Label>
              </div>
            ) : (
              ""
            )}

            <FormGroup
              label={"Password"}
              required={props.params.slug[0] == "add" ? true : false}
              message_error={errors.password}
              disabled={is_disabled}
            >
              <div className="col position-relative">
                <Input
                  ref={null}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={rules.password.label}
                  value={password}
                  className="block mt-1 w-full pr-5"
                  onChange={(value) => setpassword(value)}
                  required={rules.password.required}
                  message_error={errors.password}
                  onError={handleErrors}
                  disabled={is_disabled}
                />
                <button
                  type="button"
                  className="btn p-0 border-0 position-absolute"
                  style={{ right: 24, top: 14, color: '#64748b' }}
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <span className="material-icons" style={{ fontSize: 20 }}>{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </FormGroup>

            <FormGroup
              label={"Confirm Password"}
              required={props.params.slug[0] == "add" ? true : false}
              message_error={errors.passwordConfirm}
              disabled={is_disabled}
            >
              <div className="col position-relative">
                <Input
                  ref={null}
                  id="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder={rules.passwordConfirm.label}
                  value={passwordConfirm}
                  className="block mt-1 w-full pr-5"
                  onChange={(value) => setpasswordConfirm(value)}
                  required={rules.passwordConfirm.required}
                  message_error={errors.passwordConfirm}
                  onError={handleErrors}
                  disabled={is_disabled}
                />
                <button
                  type="button"
                  className="btn p-0 border-0 position-absolute"
                  style={{ right: 24, top: 14, color: '#64748b' }}
                  onClick={() => setShowPasswordConfirm(value => !value)}
                  aria-label={showPasswordConfirm ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                  title={showPasswordConfirm ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <span className="material-icons" style={{ fontSize: 20 }}>{showPasswordConfirm ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </FormGroup>
            </section>
          </div>
          <div className="col-lg-6">
            <section className="user-form-card h-100">
              <div className="user-form-card-header">
                <span className="material-icons">admin_panel_settings</span>
                <div>
                  <div className="user-form-card-title">Akses & Jabatan</div>
                  <div className="user-form-card-subtitle">Tentukan grup akses dan jabatan pengguna.</div>
                </div>
              </div>
              <LabelForm
                label=""
                formCol={true}
                message_error={errors.dataAll}
                value={dataAll}
                required={rules.dataAll.required}
                form={
                  <table width={"100%"} className="border">
                    <thead>
                      <tr>
                        <th className="border border-slate-600 bg-slate-400 w-[1%] text-center">
                          No
                        </th>
                        <th className="border border-slate-600 bg-slate-400 text-center w-[49%]">
                          Grup Akses
                        </th>
                        <th className="border border-slate-600 bg-slate-400 text-center w-[49%]">
                          Jabatan Pegawai
                        </th>
                        <th className="border border-slate-600 bg-slate-400  text-center w-[1%]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <FormMultiple
                        disabled={is_disabled}
                        onChange={setDataAll}
                        rows={dataAll}
                        form={(i, no, buttonRemove) => {
                          return (
                            <tr key={i}>
                              <td className="border border-slate-600">{no}</td>
                              <td className="border border-slate-600">
                                <InputSelect
                                  ref={null}
                                  id="id_group"
                                  type="select"
                                  formOnly={true}
                                  placeholder={"Pilih..."}
                                  value={dataAll[i].id_group}
                                  className="block mt-1 "
                                  data={dataIdGroup}
                                  onChange={(e) => {
                                    const nextDataAll = [...dataAll];
                                    nextDataAll[i] = {
                                      ...nextDataAll[i],
                                      id_group: e,
                                      id_jabatan: isPegawaiGroup(e) ? nextDataAll[i]?.id_jabatan || "" : "",
                                    };
                                    setDataAll(nextDataAll);
                                  }}
                                  required={rules.id_group.required}
                                  autoFocus
                                  isClearable
                                  isMulti={false}
                                  message_error={errors.id_group}
                                  onError={handleErrors}
                                  disabled={is_disabled}
                                />
                              </td>
                              <td className="border border-slate-600">
                                {isPegawaiGroup(dataAll[i]?.id_group) ? (
                                  <InputSelectAsync
                                    ref={null}
                                    id="id_jabatan"
                                    type="select"
                                    formOnly={true}
                                    placeholder={"Pilih jabatan pegawai..."}
                                    value={dataAll[i]?.id_jabatan || ''}
                                    className="block mt-1 "
                                    data={dataIdJabatan}
                                    onChange={(r) => {
                                      const nextDataAll = [...dataAll];
                                      nextDataAll[i] = {
                                        ...nextDataAll[i],
                                        id_jabatan: r,
                                      };
                                      setDataAll(nextDataAll);
                                    }}
                                    required={rules.id_jabatan.required}
                                    autoFocus
                                    isClearable
                                    isMulti={false}
                                    message_error={errors.id_jabatan}
                                    onError={handleErrors}
                                    disabled={is_disabled}
                                    loadOptions={handleGetIdJabatan}
                                  />
                                ) : (
                                  <div className="px-3 py-2 text-muted" style={{ fontSize: 13 }}>
                                    Khusus grup Pegawai
                                  </div>
                                )}
                              </td>
                              {buttonRemove ? (
                                <td className="border border-slate-600">
                                  {buttonRemove}
                                </td>
                              ) : null}
                            </tr>
                          );
                        }}
                        buttonAdd={(button) =>
                          button ? (
                            <tr>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td>{button}</td>
                            </tr>
                          ) : null
                        }
                      />
                    </tbody>
                  </table>
                }
              />

            {/* <LabelForm
                            label="Jabatan"
                            message_error={errors.id_jabatan}
                            value={id_jabatan}
                            required={rules.id_jabatan.required}
                            form={
                                <table width={'100%'}>
                                    <tbody>
                                        <FormMultiple
                                            disabled={is_disabled}
                                            onChange={setid_jabatan}
                                            rows={id_jabatan}
                                            form={(i, no, buttonRemove) => {
                                                return (
                                                    <tr key={i}>
                                                        <td>{no}</td>
                                                        <td className="w-full">
                                                            <InputSelect
                                                                ref={null}
                                                                id="id_jabatan"
                                                                type="select"
                                                                formOnly={true}
                                                                placeholder={
                                                                    'Pilih...'
                                                                }
                                                                value={
                                                                    id_jabatan[
                                                                        i
                                                                    ]
                                                                }
                                                                className="block mt-1 w-full"
                                                                data={
                                                                    dataIdJabatan
                                                                }
                                                                onChange={e => {
                                                                    id_jabatan[
                                                                        i
                                                                    ] = e
                                                                }}
                                                                required={
                                                                    rules
                                                                        .id_jabatan
                                                                        .required
                                                                }
                                                                autoFocus
                                                                isClearable
                                                                isMulti={false}
                                                                message_error={
                                                                    errors.id_jabatan
                                                                }
                                                                onError={
                                                                    handleErrors
                                                                }
                                                                disabled={
                                                                    is_disabled
                                                                }
                                                            />
                                                        </td>
                                                        {buttonRemove ? (
                                                            <td>
                                                                {buttonRemove}
                                                            </td>
                                                        ) : null}
                                                    </tr>
                                                )
                                            }}
                                            buttonAdd={button =>
                                                button ? (
                                                    <tr>
                                                        <td></td>
                                                        <td></td>
                                                        <td>{button}</td>
                                                    </tr>
                                                ) : null
                                            }
                                        />
                                    </tbody>
                                </table>
                            }
                        /> */}

            {/* <InputSelect
                            ref={null}
                            id="id_group"
                            type="select"
                            label={'Group '}
                            placeholder={'Pilih...'}
                            value={id_group}
                            className="block mt-1 w-full"
                            data={dataIdGroup}
                            onChange={setid_group}
                            required={rules.id_group.required}
                            autoFocus
                            isClearable
                            isMulti={false}
                            message_error={errors.id_group}
                            onError={handleErrors}
                            disabled={is_disabled}
                        /> */}

            {/* <InputSelect
                            ref={null}
                            id="id_jabatan"
                            type="select"
                            label={'Jabatan '}
                            placeholder={'Pilih...'}
                            value={id_jabatan}
                            className="block mt-1 w-full"
                            data={dataIdJabatan}
                            onChange={setid_jabatan}
                            required={rules.id_jabatan.required}
                            autoFocus
                            isClearable
                            isMulti={false}
                            message_error={errors.id_jabatan}
                            onError={handleErrors}
                            disabled={is_disabled}
                        /> */}
            </section>
          </div>
        </div>

        {path !== "detail" ? (
          <div className="user-form-actions d-flex justify-content-end mt-3">
            <Button
              className="btn-default-app"
              disabled={btn_loading}
              onClick={!id ? handlepostsys_user : handleputsys_user}
            >
              {btn_loading ? (
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
      <style>{`
        .user-form-layout { max-width: 1180px; margin: 0 auto; }
        .user-form-actions { max-width: 1180px; margin-left: auto; margin-right: auto; }
        .user-form-card { padding: 20px; background: #fff; border: 1px solid #d9e5e8; border-radius: 10px; box-shadow: 0 2px 6px rgba(15, 116, 128, .06); }
        .user-form-card-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #e7eef0; }
        .user-form-card-header > .material-icons { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; color: #0f7480; background: #e6f5f6; font-size: 19px; }
        .user-form-card-title { color: #1e293b; font-size: 15px; font-weight: 700; }
        .user-form-card-subtitle { margin-top: 2px; color: #64748b; font-size: 12px; }
        .user-form-card table { margin-bottom: 0; }
        .user-form-card th { background: #eff6f7 !important; color: #334155; border-color: #d9e5e8 !important; }
        .user-form-card td { border-color: #d9e5e8 !important; }
        @media (max-width: 991px) { .user-form-layout { max-width: none; } }
      `}</style>
    </>
  );
};

export default Sys_useredit;
