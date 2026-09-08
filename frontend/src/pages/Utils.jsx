import moment from "moment";
import toast from "react-hot-toast";
import { eofficeDevPages, getEofficeAccessForPage, resolveEofficePage } from "lib/eofficeAccess";
// import { usePathname } from 'components/Navigation'

export const is_apply_ai = true
export const is_apply_fake_data_ai = false
export const is_apply_update_generated_ai_to_null = true


export const efektif_tidakefektif_tat_combo = [
  { label: 'Efektif', value: 'efektif' },
  { label: 'Tidak Efektif', value: 'tidak efektif' },
  { label: 'Tidak Ada Transaksi', value: 'tat' },
]

const efektif_tidakefektif_remediasi_combo = [
  { label: 'Efektif', value: 'efektif' },
  { label: 'Tidak Efektif', value: 'tidak efektif' },
  { label: 'Efektif Setelah Remediasi', value: 'efektif setelah remediasi' },
]

const efektivitas_all_combo = [
  { label: 'Efektivitas CSA', value: 'efektivitas_csa' },
  { label: 'Efektivitas TOO', value: 'efektivitas_too' },
  { label: 'Efektivitas TOD', value: 'efektivitas_tod' },
  { label: 'Efektivitas TOE', value: 'efektivitas_toe' },
]

const pengajuan_all_combo = [
  { label: 'Status Pengajuan CSA', value: 'id_status' },
  { label: 'Status Pengajuan TOO', value: 'id_status_too' },
  { label: 'Status Pengajuan TOD', value: 'id_status_tod' },
  { label: 'Status Pengajuan TOE', value: 'id_status_toe' },
]


export const efektivitas_tod_combo = [
  { label: 'Efektif', value: 'efektif' },
  { label: 'Tidak Efektif', value: 'tidak efektif' },
  { label: 'Efektif Setelah Remediasi', value: 'efektif setelah remediasi' }
]

export const sesuai_tidak_sesuai_combo = [
  { label: 'Sesuai', value: 'sesuai' },
  { label: 'Tidak Sesuai', value: 'tidak sesuai' },
]

export const tersedia_tidak_tersedia_combo = [
  { label: 'Tersedia', value: 'tersedia' },
  { label: 'Tidak Tersedia', value: 'tidak tersedia' },
  { label: 'N/A', value: 'na' },
]

export const efektif_tdkefektif_combo = [
  { label: 'Efektif', value: 'efektif' },
  { label: 'Tidak Efektif', value: 'tidak efektif' },
]

const url_api = process.env.NEXT_PUBLIC_BACKEND_URL;
const extUploadFile = {};
const fileUploadConfig = {
  allowed_types: [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xls",
    "rar",
    "zip",
    "ppt",
    "pptx",
    "jpg",
    "png",
    "jpeg",
  ],
  maxSize: 5120,
  allowed_types_default: ["gif", "jpg", "jpeg", "bmp", "png", "pdf", "xlsx", "doc", "docx"],
  allowed_types_default_ext: [
    "image/gif",
    "image/jpeg",
    "image/jpg",
    "image/bmp",
    "image/png",
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/wps-office.xlsx",
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/wps-office.docx',
    'application/wps-office.doc',
  ],
};

const checkExtFileUpload = (extArr, ext) => { };

const checkIsValid = () => { };

const checkRules = () => { };

const fileToBase64 = (file) => {
  let res = new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  return res.then((res) => res);
};

const normalizeGetFileParam = (param = "") => {
  if (!param) return "";
  return String(param).startsWith("/") ? String(param) : `/${param}`;
};

const urlDownload = (param) => {
  const url_backend = import.meta.env.VITE_BACKEND_URL;
  const fileParam = normalizeGetFileParam(param);
  // console.log(url_backend.slice(-1))
  if (url_backend.slice(-1) == "/") {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL
      }api/getfile${fileParam}`;
  } else {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL
      }/api/getfile${fileParam}`;
  }
};

const urlPreview = (param, event) => {
  if (event && event == "is_bg_login") {
    return `${import.meta.env.VITE_BACKEND_URL
      }api/getfile/background_login/bg-login.png`;
  }
  return `${import.meta.env.VITE_BACKEND_URL}api/getfile${normalizeGetFileParam(param)}`;
};

const urlPreviewNew = (param, event) => {
  return `${import.meta.env.VITE_BACKEND_URL}api/${param}`;
};

const redirectAuth = async () => {
  const isLoggedIn = await getStorage("isLoggedIn");
  if (isLoggedIn === "1") {
    window.location.href = "/dashboard";
  }
  window.location.href = "/login";
};

const errorFormMessage = (rules, column, message) => {
  rules.map((m, i) => {
    if (m[i] === column) {
      m[i] = message;
    }
  });
  return rules;
};

const saveStorage = (key, data) => localStorage.setItem(key, data);
const getStorage = (key) => localStorage.getItem(key);
const clearStorage = () => localStorage.clear();

const pageSlugParams = (slug, access_page) => {
  let pageFromSlugReady = false;
  let error = false;
  if (!access_page[slug[0]]) {
    error = true;
    return [null, null, error];
  }
  return [slug[0], slug[1], false];
};

const checkNotAuthorized = (response) => {
  if (response && response.error && parseInt(response.error) === 403) {
    clearStorage();
    window.location.href = "/login";
  }
};

const initAccessMethod = async (
  page_url,
  params,
  paramstr,
  pathname,
  all_params
) => {
  // page_url => url | api_path
  // const pathname = usePathname()
  const page_url_asli = page_url
  const custom_api_path = page_url_asli && page_url_asli.includes('|') ? page_url_asli.split('|')[1] : null
  // console.log('initAccessMethod');
  // console.log(page_url_asli);
  // console.log(custom_api_path);

  page_url = page_url && page_url.includes('|') ? page_url.split('|')[0] : page_url
  page_url = resolveEofficePage(page_url)

  const page_mute_edit = [
    "risk_profile_analisa_risiko_inheren",
    "risk_profile_analisa_risiko_residual",
    "risk_profile_rencana_perlakuan_risiko",
    "risk_profile_realisasi_risiko_residual",
    "risk_profile_realisasi_pelaksanaan_perlakuan_risiko_dan_biaya",
  ];
  if (paramstr == undefined) paramstr = "";

  const path_arr = ["index", "add", "edit", "detail"];
  const user_loginObj = await getStorage("user_login");
  const user_login = JSON.parse(user_loginObj);

  let page_muted = false;
  if (pathname) {
    page_muted = checkPathnameMuted(pathname, page_mute_edit);
  }
  let path_error = true;
  let path = "index";
  let id = "";
  if (params && params.slug) {
    path = params.slug[0];
    if (params.slug[1]) {
      id = params.slug[1];
    }
  }

  if (!params) {
    path = "index";
  }

  if (path_arr[path]) path_error = false;

  for (let m in path_arr) {
    if (path_arr[m] === path) {
      path_error = false;
      break;
    }
  }

  if (path_error) {
    window.location.pathname = `/${page_url}${paramstr}`;
  }

  let res = {};
  if (user_login?.accessmethod?.[page_url]) {
    res = user_login.accessmethod[page_url];
  }

  if (eofficeDevPages.includes(page_url) && Object.keys(res).length === 0) {
    res = getEofficeAccessForPage(page_url, user_login);
  }

  let btn_top = [];
  let btn_bottom = [];
  let btn_edit_delete = {};
  let editdelete = [];
  // let breadcrumbs = []

  // console.log('user_login.accessmethod[page_url]')
  // console.log(page_url)
  // console.log(user_login.accessmethod[page_url])

  // console.log('user_login.accessmethod[page_url]')
  // console.log(res)

  if (
    path === "index" &&
    res &&
    res["add"] === true
  ) {
    btn_top.push({
      icon: "add",
      label: "Add",
      url: `/${page_url}${paramstr}/add`,
    });

  }
  if (
    path === "index" &&
    res &&
    res["edit"] === true
  ) {

    btn_edit_delete["edit"] = res["edit"];

    if (btn_edit_delete["edit"]) {
      editdelete.push({
        label: "Edit",
        icon: "edit",
        url: `${page_url}${paramstr}`,
      });
    }

  }
  if (
    path === "index" &&
    res &&
    res["delete"] === true
  ) {

    btn_edit_delete["delete"] = res["delete"];
    if (btn_edit_delete["delete"]) {
      editdelete.push({
        label: "Delete",
        icon: "delete",
        url: `${page_url}${paramstr}`,
      });
    }
  }
  if (
    path === "add" &&
    res &&
    res["add"] &&
    res["add"] === true
  ) {
    if (page_muted == false) {
      btn_top.push({
        icon: "arrow_back",
        label: "Back",
        url: `/${page_url}${paramstr}`,
      });
      btn_bottom.push({
        icon: "save",
        label: "Save",
        url: `/${page_url}${paramstr}/${path}`,
      });
    }
  }
  if (
    path === "edit" &&
    res &&
    res["edit"] &&
    res["edit"] === true
  ) {
    if (page_muted == false) {
      btn_top.push({
        icon: "visibility",
        label: "Detail",
        url: `/${page_url}${paramstr}/detail/${id}`,
      });
      btn_top.push({
        icon: "arrow_back",
        label: "Back",
        url: `/${page_url}${paramstr}`,
      });
      btn_bottom.push({
        icon: "save",
        label: "Save",
        url: `/${page_url}${paramstr}/${path}`,
      });
    }
  }
  if (path === "detail") {
    btn_top.push({
      icon: "edit",
      label: "Edit",
      url: `/${page_url}${paramstr}/edit/${id}`,
    });

    if (page_url == "lost_event" || page_url == "internal_control_testing") {
      btn_top.push({
        icon: "delete",
        label: "Delete",
        onDelete: true,
        urldelete: `/${page_url}${paramstr}`,
        id,
      });
    } else {
      if (res && res["delete"]) {

        btn_top.push({
          icon: "delete",
          label: "Delete",
          onDelete: true,
          urldelete: `/${custom_api_path ? custom_api_path : page_url}`,
          id,
          urlredirect: `/${page_url}`
        });
      }
    }
    btn_top.push({
      icon: "arrow_back",
      label: "Back",
      url: `/${page_url}${paramstr}`,
    });
  }

  // console.log('btn_top')
  // console.log(btn_top)

  // console.log('paramstr')
  // console.log(page_url)
  // console.log(paramstr)
  // if(paramstr) {

  // }

  if (all_params) {
    btn_top = [];
    btn_bottom = [];
    const btn_res = paramSpesificPage(all_params, pathname, path);
    if (btn_res) {
      const { btn_top_res, btn_bottom_res } = btn_res;
      btn_top = btn_top_res;
      btn_bottom = btn_bottom_res;
    }
  }

  // console.log('btn_top')
  // console.log(btn_top)

  res["btn_top"] = btn_top;
  res["btn_bottom"] = btn_bottom;
  res["btn_edit_delete"] = btn_edit_delete;
  res["editdelete"] = editdelete;

  // console.log('LOG=>')
  // console.log(params)
  // console.log(pathname)
  // console.log(page_muted)
  // console.log(user_login.accessmethod)
  // console.log(path_error)
  // console.log(path)
  // console.log(id)
  // console.log(page_url)
  // console.log(user_login.accessmethod[page_url])
  // console.log("LOGEND=>");
  // console.log(res);
  // console.log("LOGEND=>");

  const access_method = res;
  // console.log('Utils=>access_method');
  // console.log(access_method);
  return { access_method, path, id };
};

const combokategoridampak = (event) => {
  let combo = {};
  if (!event) {
    combo = [];

    combo.push({ label: "Dampak Kuantitatif", value: 1 });
    combo.push({ label: "Dampak Kualitatif", value: 0 });
  } else {
    combo["0"] = "Kualitatif";
    combo["1"] = "Kuantitatif";
  }

  return combo;
};

function angkaKeHuruf(angka) {
  if (angka < 1) {
    return null;
  }
  let kodeHuruf = String.fromCharCode(96 + angka);
  return kodeHuruf;
}

const comboBK = (event) => {
  let combo = {};
  if (!event) {
    combo = [];

    combo.push({ label: "BK 1", value: "bk1" });
    combo.push({ label: "BK 2", value: "bk2" });
    combo.push({ label: "BK 3", value: "bk3" });
    combo.push({ label: "BK 4", value: "bk4" });
    combo.push({ label: "BK 5", value: "bk5" });
    combo.push({ label: "BK 6", value: "bk6" });
    combo.push({ label: "BK 7", value: "bk7" });
    combo.push({ label: "BK 8", value: "bk8" });
    combo.push({ label: "BK 9", value: "bk9" });
    combo.push({ label: "BK 10", value: "bk10" });
  } else {
    if (event == "list") {
      combo["bk1"] = "BK 1";
      combo["bk2"] = "BK 2";
      combo["bk3"] = "BK 3";
      combo["bk4"] = "BK 4";
      combo["bk5"] = "BK 5";
      combo["bk6"] = "BK 6";
      combo["bk7"] = "BK 7";
      combo["bk8"] = "BK 8";
      combo["bk9"] = "BK 9";
      combo["bk10"] = "BK 10";
    } else if (event == "combobox") {
      combo = [];

      combo.push({ text: "BK 1", value: "bk1" });
      combo.push({ text: "BK 2", value: "bk2" });
      combo.push({ text: "BK 3", value: "bk3" });
      combo.push({ text: "BK 4", value: "bk4" });
      combo.push({ text: "BK 5", value: "bk5" });
      combo.push({ text: "BK 6", value: "bk6" });
      combo.push({ text: "BK 7", value: "bk7" });
      combo.push({ text: "BK 8", value: "bk8" });
      combo.push({ text: "BK 9", value: "bk9" });
      combo.push({ text: "BK 10", value: "bk10" });
    }
  }

  return combo;
};

const paramSpesificPage = (all_params, pathname, path) => {
  const pages = {
    risk_metrik_strategi_risiko: {
      index: ["id_register"],
      add: ["id_register", "add"],
      edit: ["id_register", "edit", "id_metrik_strategi_risiko"],
      detail: ["id_register", "detail", "id_metrik_strategi_risiko"],
    },
    risk_sasaran: {
      index: ["id_register"],
      add: ["id_register", "add"],
      edit: ["id_register", "edit", "id_sasaran"],
      detail: ["id_register", "detail", "id_sasaran"],
    },
    risk_capacity_limit: {
      index: ["id_register"],
      add: ["id_register", "add"],
      edit: ["id_register", "edit", "id_capacity_limit"],
      detail: ["id_register", "detail", "id_capacity_limit"],
    },
    risk_profile: {
      index: ["id_register"],
      add: ["id_register", "add", "jenis"],
      edit: ["id_register", "edit", "jenis", "id_risk_profile"],
      detail: ["id_register", "detail", "jenis", "id_risk_profile"],
    },
    risk_profile_analisa_risiko_inheren: {
      index: ["id_register"],
      add: ["id_register", "add", "jenis"],
      edit: ["id_register", "edit", "jenis", "id_risk_profile"],
      detail: ["id_register", "detail", "jenis", "id_risk_profile"],
    },
    risk_profile_analisa_risiko_residual: {
      index: ["id_register"],
      add: ["id_register", "add", "jenis"],
      edit: ["id_register", "edit", "jenis", "id_risk_profile"],
      detail: ["id_register", "detail", "jenis", "id_risk_profile"],
    },
    risk_profile_rencana_perlakuan_risiko: {
      index: ["id_register"],
      add: [
        "id_register",
        "add",
        "id_risk_profile",
        "id_profile_penyebab",
        "jenis",
      ],
      edit: [
        "id_register",
        "add",
        "id_risk_profile",
        "id_profile_penyebab",
        "jenis",
        "id_mitigasi",
      ],
      detail: [
        "id_register",
        "add",
        "id_risk_profile",
        "id_profile_penyebab",
        "jenis",
        "id_mitigasi",
      ],
    },
    risk_profile_realisasi_risiko_residual: {
      index: ["id_register"],
      add: ["id_register", "add", "jenis"],
      edit: ["id_register", "edit", "jenis", "id_risk_profile"],
      detail: ["id_register", "detail", "jenis", "id_risk_profile"],
    },
    risk_profile_realisasi_pelaksanaan_perlakuan_risiko_dan_biaya: {
      index: ["id_register"],
      add: ["id_register", "add", "id_risk_profile", "id_mitigasi", "jenis"],
      edit: ["id_register", "add", "id_risk_profile", "id_mitigasi", "jenis"],
      detail: ["id_register", "add", "id_risk_profile", "id_mitigasi", "jenis"],
    },
  };

  const page_url = checkPathnameReady(pathname, pages);
  if (!page_url) {
    return false;
  }

  const slug = all_params.slug;
  const id_register = all_params["id_register"];
  const id = all_params["id"];

  let btn_top = [];
  let btn_bottom = [];

  if (!pages[page_url] || !pages[page_url][path]) {
    return false;
  }

  console.log("paramSpesificPage");
  console.log(all_params);
  console.log(pathname);
  console.log(path);

  // console.log(pages[page_url][path].length)
  if (slug.length + 1 !== pages[page_url][path].length) {
    return false;
  }

  if (path == "add") {
    btn_top.push({
      icon: "arrow_back",
      label: "Back",
      url: `/${page_url}/${id_register}`,
    });
    btn_bottom.push({
      icon: "save",
      label: "Save",
    });
  }
  if (path == "edit") {
    let url = `/${page_url}/${id_register}`;
    slug.map((m) => {
      let mstr = m;
      if (m == "edit") {
        mstr = "detail";
      }
      url += `/${mstr}`;
    });
    btn_top.push({
      icon: "visibility",
      label: "Detail",
      url,
    });
    btn_top.push({
      icon: "arrow_back",
      label: "Back",
      url: `/${page_url}/${id_register}`,
    });
    btn_bottom.push({
      icon: "save",
      label: "Save",
    });
  }
  if (path == "detail") {
    let url = `/${page_url}/${id_register}`;
    slug.map((m) => {
      let mstr = m;
      if (m == "detail") {
        mstr = "edit";
      }
      url += `/${mstr}`;
    });
    btn_top.push({
      icon: "edit",
      label: "Edit",
      url,
    });

    if (page_url == "risk_profile_rencana_perlakuan_risiko") {
      btn_top.push({
        icon: "delete",
        label: "Delete",
        onDelete: true,
        urldelete: `/risk_profile_mitigasi/${all_params.slug[1]}`,
        id: all_params.slug[all_params.slug.length - 1],
        urlback: `/risk_profile_rencana_perlakuan_risiko/${id_register}`,
      });
    } else if (
      page_url == "lost_event" ||
      page_url == "risk_sasaran" ||
      page_url == "risk_metrik_strategi_risiko" ||
      page_url == "risk_capacity_limit" ||
      page_url == "risk_profile"
    ) {
      btn_top.push({
        icon: "delete",
        label: "Delete",
        onDelete: true,
        urldelete: `/${page_url}/${id_register}`,
        id,
      });
    }

    btn_top.push({
      icon: "arrow_back",
      label: "Back",
      url: `/${page_url}/${id_register}`,
    });
  }

  // console.log('paramSpesificPage=>')
  // console.log(btn_top)
  // console.log(btn_bottom)

  const btn_top_res = btn_top;
  const btn_bottom_res = btn_bottom;

  return {
    btn_top_res,
    btn_bottom_res,
  };
};

const checkPathnameReady = (pathname, pages) => {
  const pathname_arr = pathname.split("/");

  for (let x = 0; x < pathname_arr.length; x++) {
    if (pages[pathname_arr[x]]) {
      return pathname_arr[x];
    }
  }
  return false;
};

const checkPathnameMuted = (pathname, pagemuted) => {
  const pathname_arr = pathname.split("/");
  // console.log('checkPathnameMuted')
  // console.log(pathname_arr)
  // console.log(pagemuted)

  // let returnfnc = false
  for (let i = 0; i < pagemuted.length; i++) {
    for (let x = 0; x < pathname_arr.length; x++) {
      if (pathname_arr[x] == pagemuted[i]) {
        return true;
      }
    }
  }
  // pagemuted.forEach(m => {
  //   console.log('m')
  //   console.log(m)
  //   pathname_arr.forEach(x => {
  //     // console.log('x')
  //     // console.log(x)
  //     if (x == m) {
  //       returnfnc = true;
  //     }
  //   })
  // })
  return false;
};

const arrayToTree = (data, parentId = null) => {
  let menuTree = [];

  data.forEach((menuItem) => {
    if (menuItem.id_parent_menu === parentId) {
      const children = arrayToTree(data, menuItem.id_menu);
      if (children.length) {
        menuItem.children = children;
      } else {
        menuItem.children = [];
      }
      menuTree.push(menuItem);
    }
  });

  return menuTree;
};

const arrayToTree1 = (data, parentId = null) => {
  let menuTree = [];

  data.forEach((menuItem) => {
    menuItem.text = menuItem.nama;
    menuItem.id = menuItem.id_register;
    if (menuItem.id_parent_register === parentId) {
      const children = arrayToTree1(data, menuItem.id_register);
      if (children.length) {
        // menuItem.state = 'closed'
        menuItem.children = children;
      } else {
        if (menuItem.navigasi == "0") {
          // menuItem.state = 'closed'
          menuItem.children = [{ nama: "" }];
        } else menuItem.children = [];
      }
      menuTree.push(menuItem);
    }
  });

  return menuTree;
};
const arrayToTreeFilterRiskRegister = (data, parentId = null) => {
  let menuTree = [];

  data.forEach((menuItem) => {
    menuItem.text = menuItem.nama;
    menuItem.id = menuItem.id_register;
    menuTree.push(menuItem);
  });

  return menuTree;
};

const arrayToTree2 = (data) => {
  let menuTree = [];
  data.forEach((menuItem) => {
    menuItem.id = menuItem.id_menu;
    menuItem.text = menuItem.label;
    menuItem.checkState =
      parseInt(menuItem.selected) == 1 ? "checked" : "unchecked";
    menuItem.children = [];

    if (menuItem.action && menuItem.action.length > 0) {
      menuItem.action.map((m) => {
        menuItem.children.push({
          id: m.id_action,
          id_action: m.id_action,
          id_menu: m.id_menu,
          text: m.nama,
          checkState: parseInt(m.selected) == 1 ? "checked" : "unchecked",
        });
      });
    }

    menuTree.push(menuItem);

    if (menuItem.submenu && menuItem.submenu.length > 0) {
      const res = arrayToTree2(menuItem.submenu);
      res.map((m) => {
        menuItem.children.push(m);
      });
    }
    delete menuItem.selected;

    delete menuItem.action;
    delete menuItem.submenu;
  });
  return menuTree;
};

const arrayToTree3 = (data) => {
  let menuTree = [];
  data.forEach((menuItem) => {
    menuItem.action = [];
    menuItem.submenu = [];

    menuItem.selected = menuItem.checkState == "checked" ? 1 : 0;

    if (menuItem.children && menuItem.children.length > 0) {
      menuItem.children.map((m) => {
        if (m.id_action) {
          menuItem.action.push({
            id_action: m.id_action,
            nama: m.text,
            id_menu: m.id_menu,
            selected: m.checkState == "checked" ? 1 : 0,
          });
        }
      });
    }

    let childrenobj = [];
    if (menuItem.children && menuItem.children.length > 0) {
      menuItem.children.map((m) => {
        if (m.id_menu && !m.id_action) {
          childrenobj.push(m);
        }
      });
    }
    if (childrenobj && childrenobj.length > 0) {
      const res = arrayToTree3(childrenobj);
      res.map((m) => {
        menuItem.submenu.push(m);
      });
    }

    menuTree.push({
      id_menu: menuItem.id_menu,
      page: menuItem.text,
      action: menuItem.action,
      selected: menuItem.selected,
      submenu: menuItem.submenu,
    });

    delete menuItem.checkState;
    delete menuItem.icon;
    delete menuItem.label;
    delete menuItem.text;
    delete menuItem.id;

    delete menuItem.children;
  });

  return menuTree;
};

const arrayToTreeJabatan = (data, parentId = null) => {
  let menuTree = [];

  data.forEach((menuItem) => {
    if (menuItem.id_jabatan_parent === parentId) {
      const children = arrayToTreeJabatan(data, menuItem.id_jabatan);
      if (children.length) {
        menuItem.state = "open";
        menuItem.children = children;
      } else {
        if (menuItem.navigasi == "0") {
          menuItem.state = "open";
          menuItem.children = [{ nama: "" }];
        } else menuItem.children = [];
      }
      menuTree.push(menuItem);
    }
  });

  return menuTree;
};

const initFilterUrl = (data, customUrl) => {
  if (customUrl !== undefined) {
    return customUrl;
  }
  return buildFilterUrl(data);
};

const initFilterUrlLikelihood = (data, customUrl) => {
  if (customUrl !== undefined) {
    return customUrl;
  }
  return buildFilterUrl(data);
};

const buildFilterUrl = ({ url, filter } = {}) => {
  if (!filter) return `${url}`;

  const params = new URLSearchParams();
  const pagination = filter.paginate || {};
  if (pagination.page !== undefined && pagination.page !== null) params.set("page", pagination.page);
  if (pagination.pagesize !== undefined && pagination.pagesize !== null) params.set("pagesize", pagination.pagesize);
  if (filter.q !== undefined && filter.q !== null && filter.q !== "") params.set("q", filter.q);
  if (filter.order) params.set("order", filter.order);

  Object.entries(filter.filter || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && typeof value !== "object") {
      params.set(`q[${key}]`, value);
    }
  });

  const query = params.toString();
  return query ? `${url}?${query}` : `${url}`;
};

// function serialize(obj, prefix) {
//   return Object.keys(obj)
//     .map((key) => {
//       const fullKey = prefix ? `${prefix}[${key}]` : key;
//       if (typeof obj[key] === "object" && obj[key] !== null) {
//         return serialize(obj[key], fullKey);
//       } else {
//         return (
//           encodeURIComponent(`q[${fullKey}]`) +
//           "=" +
//           encodeURIComponent(obj[key])
//         );
//       }
//     })
//     .join("&");
// }

// function serialize(obj, prefix) {
//   return Object.keys(obj)
//     .map((key) => {
//       const fullKey = prefix ? `${prefix}[${key}]` : key;
//       if (typeof obj[key] === "object" && obj[key] !== null) {
//         const subKeys = Object.keys(obj[key]);
//         return subKeys.map((subKey) => {
//           const subFullKey = `${fullKey}[${subKey}]`;
//           return encodeURIComponent(`q[${subFullKey}]`) + "=" + encodeURIComponent(obj[key][subKey]);
//         }).join("&");
//       } else {
//         return encodeURIComponent(`q[${fullKey}]`) + "=" + encodeURIComponent(obj[key]);
//       }
//     })
//     .join("&");
// }

function serialize(obj, prefix) {
  return Object.keys(obj)
    .map((key) => {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (typeof value === "object" && value !== null) {
        return serialize(value, fullKey);
      } else {
        return encodeURIComponent(`q[${fullKey}]`) + "=" + encodeURIComponent(value);
      }
    })
    .filter(Boolean) // remove empty strings from array before joining
    .join("&");
}

const initBreadcrumbs = async (id, data) => {
  const databreadcrumbs = await handlefncgetrisk_registerid(id, [], data);
  // console.log('databreadcrumbs')
  // console.log(databreadcrumbs)

  let breadcrumbs = databreadcrumbs.reverse();
  // breadcrumbs.push({ label: 'Identifikasi Risiko' })
  return breadcrumbs;
};

const handlefncgetrisk_registerid = async (id, res, data) => {
  await handlegetrisk_registerid(id, res, data);
  return res;
};

const handlegetrisk_registerid = async (id, res, data) => {
  const response = await data.func({
    api_path: "/risk_register",
    id,
  });
  // console.log('getrisk_registerid=>parent')
  // console.log(response)

  checkNotAuthorized(response);
  if (response.error || response.code) return;

  res.push({
    label: response.nama,
    url: `/risk_profile/${response.id_register}`,
    response,
  });

  if (response.id_parent_register === null) return;

  await handlegetrisk_registerid(response.id_parent_register, res, data);
};

const createTableHeader = (headerData) => {
  let tableHead = "<thead>";

  // First row of headers
  tableHead += "<tr>";
  for (let i = 0; i < headerData.length; i++) {
    const { label, colspan, rowspan } = headerData[i];
    tableHead += `<th colspan="${colspan}" rowspan="${rowspan}">${label}</th>`;
  }
  tableHead += "</tr>";

  // Second row of headers (for rowspan = 2)
  tableHead += "<tr>";
  for (let i = 0; i < headerData.length; i++) {
    const { rowspan } = headerData[i];
    if (rowspan === 2) {
      tableHead += `<th colspan="1" rowspan="1"></th>`;
    }
  }
  tableHead += "</tr>";

  tableHead += "</thead>";
  return tableHead;
};

const showToastr = (event, message) => {
  if (event == "success") {
    toast.success(message);
  } else if (event == "error") {
    toast.error(message);
  } else {
    toast(message);
  }
};

// --primary: #064EB0;
// --danger: #ED3833;
// --warning: orange;
// --success: rgb(2, 170, 2);
// --info: rgb(68, 178, 252);
// --secondary: grey;
// --color-text: #333;

const colorsPallette = {
  success: "#99CC00",
  warning: "#FFFF00",
  danger: "#ed3833",
  // info: '#44b2fc',
  info: "#333399",
  grey: "#a0a8b0",
  primary: "#333399",
  lightsuccess: "#9ff79f",
  lightwarning: "#f9f3b1",
  lightdanger: "#fba99d",
  secondary: '#a0a8b0',
  lightgrey: '#f7f7f7',
  blue: '#51A6FD',
  purple: '#F825FD',
  lightblue: '#00b0f0'
};

const formatDateApp = (date, format) => {
  return moment(date).format(format);
};

const datacolorapply = {
  Aman: colorsPallette.success,
  Hati_hati: colorsPallette.warning,
  "Hati-hati": colorsPallette.warning,
  Bahaya: colorsPallette.danger,
};

const combostatuswarna = () => {
  const combo = [
    { label: "Aman", value: "Aman", colorapply: colorsPallette.success },
    {
      label: "Hati-hati",
      value: "Hati-hati",
      colorapply: colorsPallette.warning,
    },
    { label: "Bahaya", value: "Bahaya", colorapply: colorsPallette.danger },
  ];
  return combo;
};

const bulanNumbValueVar = {
  "01": "januari",
  "02": "februar",
  "03": "maret",
  "04": "april",
  "05": "mei",
  "06": "juni",
  "07": "juli",
  "08": "agustus",
  "09": "septembe",
  10: "oktober",
  11: "november",
  12: "desember",
};

const bulanTextValueVar = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
};

const bulanTextVar = {
  januari: "",
  februari: "",
  maret: "",
  april: "",
  mei: "",
  juni: "",
  juli: "",
  agustus: "",
  september: "",
  oktober: "",
  november: "",
  desember: "",
};

const bulanTextToBulanNumber = (bulanText, event) => {
  return bulanTextValueVar[bulanText];
};

const bulanIntToBulanText = (bulanInt, event) => {
  let bulantextstring = "";
  Object.keys(bulanTextValueVar).map((m, i) => {
    if (parseInt(bulanTextValueVar[m]) == bulanInt) {
      bulantextstring = m;
    }
  });
  return bulantextstring;
};

const statusKriOtomatis = (item, nilai) => {
  // $status = "";
  // if ($row->polaritas == '+') {
  //     if ($nilai < $row["target_sampai"])
  //         $status = "Aman";

  //     if ($nilai >= $row["batas_atas"])
  //         $status = "Bahaya";
  // } else {
  //     if ($nilai > $row["target_mulai"])
  //         $status = "Aman";

  //     if ($nilai <= $row["batas_bawah"])
  //         $status = "Bahaya";
  // }

  // if ($row["target_mulai"] && $row["target_sampai"]) {
  //     if ($nilai > $row["target_mulai"] or $nilai < $row["target_sampai"])
  //         $status = "Aman";
  // }

  // if ($row["batas_bawah"] && $row["batas_atas"]) {
  //     if ($nilai <= $row["batas_bawah"] or $nilai >= $row["batas_atas"])
  //         $status = "Bahaya";
  // }

  // if (!$status)
  //     $status = "Hati-hati";

  // console.log('statusKriOtomatis')
  // console.log(item)
  // console.log(nilai)

  if (Object.keys(item).length == 0 || nilai == "") {
    return "";
  }

  let status = "";
  if (item["polaritas"] == "+") {
    if (parseFloat(nilai) <= parseFloat(item["target_sampai"])) {
      status = "Aman";
    }
    if (parseFloat(nilai) >= parseFloat(item["batas_bawah"])) {
      status = "Bahaya";
    }
  } else if (item["polaritas"] == "-") {
    if (parseFloat(nilai) >= parseFloat(item["target_mulai"])) {
      status = "Aman";
    }
    if (parseFloat(nilai) <= parseFloat(item["batas_atas"])) {
      status = "Bahaya";
    }
  } else if (item["polaritas"] == "+-") {
    if (parseFloat(item["target_mulai"]) && parseFloat(item["target_sampai"])) {
      if (
        parseFloat(nilai) >= parseFloat(item["target_mulai"]) &&
        parseFloat(nilai) <= parseFloat(item["target_sampai"])
      ) {
        status = "Aman";
      }
    }

    if (parseFloat(item["batas_bawah"]) && parseFloat(item["batas_atas"])) {
      if (
        parseFloat(nilai) <= parseFloat(item["batas_bawah"]) ||
        parseFloat(nilai) >= parseFloat(item["batas_atas"])
      ) {
        status = "Bahaya";
      }
    }
  }

  if (status == "") {
    status = "Hati-hati";
  }

  return status;
};

const levelRisikoVar = (event) => {
  let dataarr = [];
  if (event == "referensi") {
    dataarr["Low"] = "Low";
    dataarr["Low to Moderate"] = "Low to Moderate";
    dataarr["Moderate"] = "Moderate";
    dataarr["Moderate to High"] = "Moderate to High";
    dataarr["High"] = "High";
  } else {
    let data = [
      { label: "Low", value: "Low", color: "green" },
      {
        label: "Low to Moderate",
        value: "Low to Moderate",
        color: "lightgreen",
      },
      { label: "Moderate", value: "Moderate", color: "yellow" },
      {
        label: "Moderate to High",
        value: "Moderate to High",
        color: "lightred",
      },
      { label: "High", value: "High", color: "red" },
    ];
    dataarr = data;
  }

  return dataarr;
};

const nilaiEksposurOtomatis = (nilai_dampak, nilai_kemungkinan) => {
  return nilai_dampak * (nilai_kemungkinan / 100);
};

const nilaiEksposurKualitatifOtomatis = (
  id_dampak,
  nilai_kemungkinan,
  master,
  nilai_sasaran
) => {
  // nilai eksposur = risklimit/100*nilai_kemungkinan*id_dampak
  const { risk_limit } = master;
  // if (!risk_limit) {
  //     return null
  // }

  if (nilai_sasaran) {
    return (
      (((parseFloat(nilai_sasaran) / 100) * parseFloat(nilai_kemungkinan)) /
        100) *
      parseFloat(id_dampak)
    );
  }
  return (
    (((parseFloat(risk_limit) / 100) * parseFloat(nilai_kemungkinan)) / 100) *
    parseFloat(id_dampak)
  );
};

const initMasterDB = async (data) => {
  const master = await initmasterlevel_risiko(data);
  return master;
};

const initmasterlevel_risiko = async (data) => {
  // const masterObj = await getStorage("master")
  // if (masterObj != null) {
  //   const master = JSON.parse(masterObj)
  //   return master
  // }
  let url = `/level_risiko/${data.id}/${data.tahun}/${data.jenis ? data.jenis : ""
    }`;

  let paramfunc = {
    api_path: url,
  };
  if (data.id_kriteria_dampak) {
    paramfunc.filter = {
      filter: {
        id_kriteria_dampak: data.id_kriteria_dampak,
      },
    };
  }
  const response = await data.func(paramfunc);
  // console.log('handlegetlevel_risiko=>')
  // console.log(response)

  checkNotAuthorized(response);
  if (response.error) {
    return false;
  }

  await saveStorage("master", JSON.stringify(response));
  return response;
};

const nilaiDampakOtomatis = (eksposur, nilai_kemungkinan) => {
  if (!eksposur || !nilai_kemungkinan) {
    return null;
  }
  // console.log('nilaiDampakOtomatis')
  // console.log(eksposur)
  // console.log(nilai_kemungkinan)
  return (eksposur / nilai_kemungkinan) * 100;
};

const skalaDampakOtomatis = (master, nilai, nilai_sasaran) => {
  console.log("skalaDampakOtomatis");
  console.log(master);
  console.log(nilai);
  console.log(nilai_sasaran);
  // const { dampak } = await initmasterlevel_risiko(data)
  if (Object.keys(master).length == 0) {
    return null;
  }
  const { dampak } = master;
  if (!dampak || dampak.length == 0) {
    return null;
  }
  if (nilai_sasaran) {
    for (let i = 0; i < dampak.length; i++) {
      if (
        (dampak[i].id_dampak == 1
          ? true
          : parseFloat(nilai) >=
          (parseFloat(dampak[i].mulai) / 100) * parseFloat(nilai_sasaran)) &&
        (dampak[i].id_dampak == 5
          ? true
          : parseFloat(nilai) <
          (parseFloat(dampak[i].sampai) / 100) * parseFloat(nilai_sasaran))
      ) {
        return dampak[i].id_dampak;
      }
    }
  } else {
    for (let i = 0; i < dampak.length; i++) {
      if (
        (dampak[i].id_dampak == 1
          ? true
          : parseFloat(nilai) >= parseFloat(dampak[i].nilai_mulai)) &&
        (dampak[i].id_dampak == 5
          ? true
          : parseFloat(nilai) < parseFloat(dampak[i].nilai_sampai))
      ) {
        return dampak[i].id_dampak;
      }
    }
  }
  return null;
};

const skalaProbabilitasOtomatis = (master, nilai) => {
  // const { kemungkinan } = await initmasterlevel_risiko(data)
  if (Object.keys(master).length == 0) {
    return null;
  }
  const { kemungkinan } = master;
  if (!kemungkinan || kemungkinan.length == 0) {
    return null;
  }
  for (let i = 0; i < kemungkinan.length; i++) {
    if (
      (kemungkinan[i].id_kemungkinan == 1
        ? true
        : parseFloat(nilai) > parseFloat(kemungkinan[i].persentase_mulai)) &&
      (kemungkinan[i].id_kemungkinan == 5
        ? true
        : parseFloat(nilai) <= parseFloat(kemungkinan[i].persentase_sampai))
    ) {
      return kemungkinan[i].id_kemungkinan;
    }
  }
  return null;
};

const skalaRisikoOtomatis = (master, id_dampak, id_kemungkinan) => {
  // console.log('skalaRisikoOtomatis')
  // console.log(id_dampak)
  // console.log(id_kemungkinan)
  // const { matrix } = await initmasterlevel_risiko(data)
  if (Object.keys(master).length == 0) {
    return null;
  }

  const { matrix } = master;
  if (!matrix || matrix.length == 0) {
    return null;
  }

  if (!id_dampak || !id_kemungkinan) {
    return null;
  }

  return matrix[id_kemungkinan][id_dampak];
  // console.log('matrix')
  // console.log(matrix)

  let hasil = null;
  Object.keys(matrix).map((m, i) => {
    Object.keys(matrix[m]).map((x, y) => {
      // console.log('===========>')
      // console.log(i)
      // console.log(m)
      // console.log(matrix[m][x])
      if (
        matrix[m][x].id_dampak == id_dampak &&
        matrix[m][x].id_kemungkinan == id_kemungkinan
      ) {
        hasil = matrix[m][x];
        return hasil;
      }
    });
  });

  return hasil;
};

const menuChildWithParent = (data, targetPage) => {
  let result = null
  data.forEach(item => {
    if (item.sub && Array.isArray(item.sub)) {
      const child = item.sub.find(subItem => subItem.page === targetPage);
      if (child) {
        // Jika ditemukan, simpan parent dan child-nya
        result = { parent: item, child: child };
      }
    }
    // Periksa jika item itu sendiri adalah target
    if (item.page === targetPage && !result) {
      result = { parent: null, child: item };
    }
  })
  return result
}


// master spesific:mt_risk_matrix,mt_risk_kriteria_dampak
const referensiSecurityPage = (menu, page, pathname_arr) => {
  const pages = {
    master: {
      list_2_page: {
        mt_sdm_jabatan: 1,
        mt_risk_capacity_limit: 1,
        mt_risk_kemungkinan: 1,
        mt_risk_dampak: 1
      },
      list_2_page_spesific: {
        mt_risk_matrix: 1,
        mt_risk_kriteria_dampak: 1
      }
    }
  }
  // console.log('referensiSecurityPage');
  // console.log(menu);
  // console.log(page);
  // console.log(pathname_arr);

  // const topParent = findTopParentWithPage(menu, page);
  const topParent = findTopParent(menu, page);
  // console.log('GET TOP PARENT');
  // console.log(topParent);
  if (topParent && topParent.page && topParent.page == 'master') {
    if (!pages.master.list_2_page[page] && !pages.master.list_2_page_spesific[page]) {
      // console.log("####111");
      let is_index = false
      if (pathname_arr.length !== 2) {
        return { is_error: true }
      }
      if (pathname_arr.length === 2) {
        is_index = true
      }
      if (is_index) {
        return { is_success: true }
      }

      if (!pathname_arr.includes('add') && !pathname_arr.includes('edit') && !pathname_arr.includes('detail')) {
        return { is_error: true }
      }

      if (pathname_arr.includes('add') && pathname_arr.length !== 3) {
        return { is_error: true }
      }
      if (pathname_arr.includes('edit') && pathname_arr.length !== 4) {
        return { is_error: true }
      }
      if (pathname_arr.includes('detail') && pathname_arr.length !== 4) {
        return { is_error: true }
      }
      return { is_success: true }
    }
    if (pages.master.list_2_page[page]) {
      // console.log("####222");
      let is_index = false
      if (pathname_arr.length === 2) {
        is_index = true
      }
      if (is_index) {
        return { is_success: true }
      }

      if (!pathname_arr.includes('add') && !pathname_arr.includes('edit') && !pathname_arr.includes('detail')) {
        return { is_error: true }
      }
      if (pathname_arr.includes('add') && pathname_arr.length !== 3) {
        return { is_error: true }
      }
      if (pathname_arr.includes('edit') && pathname_arr.length !== 4) {
        return { is_error: true }
      }
      if (pathname_arr.includes('detail') && pathname_arr.length !== 4) {
        return { is_error: true }
      }
      return { is_success: true }
    }
    if (pages.master.list_2_page_spesific[page]) {
      // console.log("####333");

      let is_index = false
      if (pathname_arr.length === 3) {
        is_index = true
      }
      if (is_index) {
        return { is_success: true }
      }

      if (!pathname_arr.includes('add') && !pathname_arr.includes('edit') && !pathname_arr.includes('detail')) {
        return { is_error: true }
      }
      if (pathname_arr.includes('add') && pathname_arr.length !== 4) {
        return { is_error: true }
      }
      if (pathname_arr.includes('edit') && pathname_arr.length !== 5) {
        return { is_error: true }
      }
      if (pathname_arr.includes('detail') && pathname_arr.length !== 5) {
        return { is_error: true }
      }
      return { is_success: true }
    }
  }

  return { is_success: true }
}

// if (item.page && item.page.includes('mt_risk_kriteria_dampak')) {
//   return currentParent || item;
// }

function findTopParent(data, targetPage) {
  let result = null;

  function traverse(menu, currentParent = null) {
    for (const item of menu) {
      if (item.page && item.page === targetPage) {
        result = currentParent;
        return;
      }

      if (item.submenu && item.submenu.length > 0) {
        traverse(item.submenu, currentParent || item);
        if (result) return;
      }
    }
  }

  traverse(data, null);
  return result;
}

function findDeepestChild(data) {
  let deepestChild = null;
  let maxDepth = 0;

  function traverse(menu, depth = 0) {
    for (const item of menu) {
      if (!item.submenu || item.submenu.length === 0) {
        if (depth > maxDepth) {
          maxDepth = depth;
          deepestChild = item;
        }
      }

      if (item.submenu && item.submenu.length > 0) {
        traverse(item.submenu, depth + 1);
      }
    }
  }

  traverse(data);
  return deepestChild;
}

const go_logout = async () => {
  await clearStorage()

  window.location.pathname = '/login'
}

const convertTlcToPlc = ruang_lingkup => {
  if (!ruang_lingkup) return ''
  return ruang_lingkup.toUpperCase() == 'TLC' ? 'PLC' : ruang_lingkup
}

export const line_icofr_combo = [
  { label: '1st Line', value: 1 },
  { label: '2nd Line', value: 2 },
  { label: '3rd Line', value: 3 },
]

const ruang_lingkup_id = {
  '5': 'tlc',
  '6': 'elc',
  '7': 'itgc',
}
const ruang_lingkup_nama = {
  'tlc': '5',
  'elc': '6',
  'itgc': '7',
}
const ruang_lingkup_combo = [
  { label: convertTlcToPlc(Object.keys(ruang_lingkup_nama)[0].toUpperCase()), value: Object.values(ruang_lingkup_nama)[0] },
  { label: Object.keys(ruang_lingkup_nama)[1].toUpperCase(), value: Object.values(ruang_lingkup_nama)[1] },
  { label: Object.keys(ruang_lingkup_nama)[2].toUpperCase(), value: Object.values(ruang_lingkup_nama)[2] },
]

const abjads = {
  '0': 'A',
  '1': 'B',
  '2': 'C',
  '3': 'D',
  '4': 'E',
  '5': 'F',
  '6': 'G',
  '7': 'H',
  '8': 'I',
  '9': 'J',
  '10': 'K',
  '11': 'L',
  '12': 'M',
  '13': 'N',
  '14': 'O',
  '15': 'P',
  '16': 'Q',
  '17': 'R',
  '18': 'S',
  '19': 'T',
  '20': 'U',
  '21': 'V',
  '22': 'W',
  '23': 'X',
  '24': 'Y',
  '25': 'Z',
  '26': 'AA',
  '27': 'AB',
  '28': 'AC',
  '29': 'AD',
  '30': 'AE',
  '31': 'AF',
  '32': 'AG',
  '33': 'AH',
  '34': 'AI',
  '35': 'AJ',
  '36': 'AK',
  '37': 'AL',
  '38': 'AM',
  '39': 'AN',
  '40': 'AO',
  '41': 'AP',
};

const saveFilterStorage = async (line, typeRcm, datafilter, page) => {
  const filter_storageObj = await getStorage('filter')
  const filter_storage = JSON.parse(filter_storageObj)


  // console.log('datafilter=>X');
  // console.log(datafilter);

  for (let m in datafilter) {
    if (typeof datafilter[m] === 'string' && datafilter[m].includes('%')) {
      const str = datafilter[m]
      datafilter[m] = str.replace(/%/g, '')
    }
  }

  if (!typeRcm) {
    filter_storage[line] = datafilter
    return await saveStorage('filter', JSON.stringify(filter_storage))
  }

  filter_storage[line][typeRcm] = datafilter
  if (page) {
    filter_storage[line][typeRcm]['page'] = page
  }

  await saveStorage('filter', JSON.stringify(filter_storage))
}

const getFilterStorage = async () => {

}

const kolom_yang_benar_di_risiko_itgc = 'komponen_coso'
const label_yang_benar_di_risiko_itgc = 'Komponen Coso'

const get_access_sakti = async (event, datas) => {
  // console.log('get_access_sakti');
  // console.log(datas);


  const user_loginobj = await getStorage('user_login')
  const user_login = JSON.parse(user_loginobj)
  const dashboard = user_login.accessmethod.dashboard
  if (user_login.id_unit) {
    dashboard.id_unit = user_login.id_unit
  }

  if (event && event == 'is_reviewer') {
    return user_login.id_group == 11 ? true : false
  }

  if (event && event == 'view_list_laporan') {
    if (datas && datas.page && ['laporan_sertifikasi', 'laporan_icofr'].includes(datas.page)) {
      return user_login.accessmethod[datas.page].view_list
    }
  }
  if (event && event == 'upload_sertifikasi') {
    if (datas && datas.page && ['laporan_sertifikasi', 'laporan_icofr'].includes(datas.page)) {
      return user_login.accessmethod[datas.page].add || user_login.accessmethod[datas.page].edit
    }
  }
  if (event && event == 'is_disabled') {
    if (datas && datas.page && user_login.accessmethod[datas.page]) {
      return user_login.accessmethod[datas.page].edit ? false : true
    }
    return true
  }

  return dashboard
}

const stringEnter = textp => {
  if (!textp) return ''

  let textparr = textp.split('\n')
  // console.log('TYPEOF');
  // console.log(typeof textparr);
  // console.log(textparr);

  if (typeof textparr == 'string') {
    textparr = textp.split('\\n')
  }
  if (typeof textparr == 'object' && textparr.length == 1) {
    textparr = textp.split('\\n')
  }

  let textparrtrim = []
  for (let m of textparr) {
    textparrtrim.push(m.trim())
  }

  return textparrtrim.join('<br />')

}

const fnc_is_disabled = async (event, datas) => {
  console.log('fnc_is_disabled');
  console.log(datas);


  let is_disabled = false
  if (datas.dt_readonly && datas.dt_readonly.length > 0) {
    is_disabled = true
  }
  const res_access_is_disabled = await get_access_sakti('is_disabled', { page: datas.page })
  console.log('res_access_is_disabled');
  console.log(res_access_is_disabled);


  if (res_access_is_disabled) {
    is_disabled = true
  }
  if (datas.resid.hasOwnProperty('is_edit') && datas.resid.is_edit === false) {
    is_disabled = true
  }

  console.log(is_disabled);


  return is_disabled
}


// 

export const signifikan_tidak_signifikan_combo = [
  { label: 'Signifikan', value: 'signifikan' },
  { label: 'Tidak Signifikan', value: 'tidak signifikan' },
]

export const signifikan_tidak_signifikan_material_combo = [
  { label: 'Signifikan', value: 'signifikan' },
  { label: 'Tidak Signifikan', value: 'tidak signifikan' },
  { label: 'Material', value: 'material' },
]

export const ya_tidak_combo = [
  { label: 'Ya', value: 'ya' },
  { label: 'Tidak', value: 'tidak' },
]

export const ya_tidak_na = [
  { label: 'Ya', value: 'ya' },
  { label: 'Tidak', value: 'tidak' },
  { label: 'N/A', value: 'n/a' },
]

export const pilihan_coso = [
  { label: '1. Demonstrate commitment to integrity and ethical values', value: '1. Demonstrate commitment to integrity and ethical values' },
  { label: '2. Exercise oversight responsibility', value: '2. Exercise oversight responsibility' },
  { label: '3. Establish structure, authority and responsibility', value: '3. Establish structure, authority and responsibility' },
  { label: '4. Demonstrate commitment to competence', value: '4. Demonstrate commitment to competence' },
  { label: '5. Enforce accountability', value: '5. Enforce accountability' },
  { label: '6. Specify suitable objectives ', value: '6. Specify suitable objectives' },
  { label: '7. Identify and analyze risk', value: '7. Identify and analyze risk' },
  { label: '8. Assess fraud risk', value: '8. Assess fraud risk' },
  { label: '9. Identify and analyze significant change', value: '9. Identify and analyze significant change' },
  { label: '10. Control activities selected and developed', value: '10. Control activities selected and developed' },
  { label: '11. General IT controls selected and developed', value: '11. General IT controls selected and developed' },
  { label: '12. Controls deployed through policies and procedures', value: '12. Controls deployed through policies and procedures' },
  { label: '13. Quality information obtained, generated and used', value: '13. Quality information obtained, generated and used' },
  { label: '14. Internal control information internally communicated', value: '14. Internal control information internally communicated' },
  { label: '15. Internal control information externally communicated.', value: '15. Internal control information externally communicated.' },
  { label: '16. Ongoing and / or separate evaluations conducted', value: '16. Ongoing and / or separate evaluations conducted' },
  { label: '17. Internal control deficiencies evaluated and communicated', value: '17. Internal control deficiencies evaluated and communicated' }
]
export const pilihan_kemungkinanterjadi = [
  { label: 'Remote', value: 'Remote' },
  { label: 'More remote', value: 'More remote' }
]
export const ya_tidak_idx = {
  'ya': 'Ya',
  'tidak': 'Tidak'
}
export const pilihan_triwulan = [
  { label: 'Triwulan 1', value: 1 },
  { label: 'Triwulan 2', value: 2 },
  { label: 'Triwulan 3', value: 3 },
  { label: 'Triwulan 4', value: 4 },
]

const convertImageUrlToBase64 = async (url, is_xml) => {
  let res = new Promise(async (resolve, reject) => {
    const response = await fetch(url);

    // console.log('convertImageUrlToBase64=>1');
    // console.log(response);

    if (!response.ok) {
      return resolve({ error: 'Gagal mengambil gambar.' });
    }

    const blob = await response.blob();

    // console.log('convertImageUrlToBase64=>2');
    // console.log(blob);

    if (['application/json', 'text/html'].includes(blob.type)) {
      return resolve({ error: 'Gagal mengambil gambar.' });
    }

    if (!is_xml) {

      if (blob.type !== 'image/png') {
        resolve({ error: 'File bukan PNG.' });
      }
    }

    if (is_xml && blob.type != 'image/png') {
      const base64 = await svgUrlToPng(url)
      // console.log('convertImageUrlToBase64=>base64');
      // console.log(base64);

      return resolve(base64)

    }

    // console.log('convertImageUrlToBase64=>3');
    // console.log(blob);

    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result)
    };

    reader.onerror = () => {
      resolve({ error: 'Error=>' })
    };

    reader.readAsDataURL(blob);
  })
  const ress = await res.then(m => m)

  // console.log('convertImageUrlToBase64=>res');
  // console.log(ress);

  if (ress.hasOwnProperty('error')) return null

  // console.log('convertImageUrlToBase64=>4');
  // console.log(ress);

  return ress
};


const svgUrlToPng = async (url, width = 200, height = 200) => {
  // Ambil konten SVG dari URL
  const response = await fetch(url);
  const svgText = await response.text();

  // Buat blob object untuk img
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // penting kalau URL beda domain
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Gambar ke canvas
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);

      // Hasil base64 PNG
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = svgUrl;
  });
};

const url_fully = async (url) => {
  // return `${import.meta.env.VITE_BACKEND_URL}${url}`

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
    method: 'GET',
    headers: {
      action: 'index',
      page: '',
    },
    credentials: 'include',

  });
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  return blobUrl
}

const kk_idx = {
  csa: 'Control Self Assessment',
  tod: 'Test Of Design Effectiveness',
  toe: 'Test of Operating Effectiveness',
  too: 'Test Of One',
  dod: 'Degree of Deficiency',

}

const ada_tidak_ada_combo = [
  { label: 'Ada', value: 'ada' },
  { label: 'Tidak Ada', value: 'tidak ada' },
  { label: 'Tidak Ada Transaksi', value: 'tat' },
]

const ada_tidak_ada_idx = {
  'ada': 'Ada',
  'tidak ada': 'Tidak Ada',
  'tat': 'Tidak Ada Transaksi'
}

const template_rcm_combo = [
  { label: 'Internal', value: 'internal' },
  { label: 'KBUMN', value: 'kbumn' },
]

const colToNum = (col) => {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num;
}

const numToCol = (num) => {
  let col = "";
  while (num > 0) {
    let remainder = (num - 1) % 26;
    col = String.fromCharCode(65 + remainder) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}


export const detectType = (val) => {
  // integer
  if (Number.isInteger(val)) {
    return "integer";
  }

  // object JSON (hasil API biasanya)
  if (typeof val === "object" && val !== null) {
    return "json";
  }

  // string (bisa JSON string atau string biasa)
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null) {
        return "json";
      }
    } catch (e) { }
    return "string";
  }

  return "unknown";
}


const is_visible_penanda_abjad_rcm = false

const status_ruang_lingkup_combo = [
  { label: '', value: '' }
]

const column_table_escape = [
  'created_at',
  'created_by',
  'created_by_desc',
  'deleted_at',
  'deleted_by',
  'deleted_by_desc',
  'updated_at',
  'updated_by',
  'updated_by_desc',
]

export const YaTidakCombo = [
  { label: 'Ya', value: 'Ya' },
  { label: 'Tidak', value: 'Tidak' },
]

export const JenisPengendalian = [
  { label: 'Automated Control', value: 'Automated Control' },
  { label: 'Automated Calculation ', value: 'Automated Calculation ' },
  { label: 'Restricted Access', value: 'Restricted Access' },
  { label: 'Interface', value: 'Interface' },
  { label: 'N/A', value: 'N/A' },
]


export const komponen_coso_combo = [
  // { label: 'Control Environment', value: 'Control Environment', },
  // { label: 'Risk Assessment', value: 'Risk Assessment', },
  // { label: 'Control Activities', value: 'Control Activities', },
  // { label: 'Information & Communication', value: 'Information & Communication', },
  // { label: 'Monitoring Activities', value: 'Monitoring Activities', },

  { label: 'Control Environment - Lingkungan pengendalian', value: 'Control Environment - Lingkungan pengendalian' },
  { label: 'Risk Assessment - Penilaian Risiko', value: 'Risk Assessment - Penilaian Risiko' },
  { label: 'Control Activities - Aktivitas Pengendalian', value: 'Control Activities - Aktivitas Pengendalian' },
  { label: 'Information & Communication - Informasi & Komunikasi', value: 'Information & Communication - Informasi & Komunikasi' },
  { label: 'Monitoring Activities - Pemantauan', value: 'Monitoring Activities - Pemantauan' },
]

export const asersi_combo = [
  // { label: 'Keberadaan atau Keterjadian', value: 'Keberadaan atau Keterjadian' },
  // { label: 'Kelengkapan', value: 'Kelengkapan' },
  // { label: 'Alokasi dan Penilaian', value: 'Alokasi dan Penilaian' },
  // { label: 'Hak dan Kewajiban', value: 'Hak dan Kewajiban' },
  // { label: 'Pengungkapan', value: 'Pengungkapan' },


  { label: 'Existence & Occurence', value: 'Existence & Occurence' },
  { label: 'Completeness', value: 'Completeness' },
  { label: 'Valuation & Allocation', value: 'Valuation & Allocation' },
  { label: 'Rights and Obligation', value: 'Rights and Obligation' },
  { label: 'Presentation & Disclosure', value: 'Presentation & Disclosure' },
]

export const dampak_combo = [
  { label: 'Material', value: 'Material' },
  { label: 'Signifikan', value: 'Signifikan' },
  { label: 'Tidak Signifikan', value: 'Tidak Signifikan' },
]

export const kemungkinan_terjadi_combo = [
  { label: 'Rendah', value: 'Rendah' },
  { label: 'Sedang', value: 'Sedang' },
  { label: 'Tinggi', value: 'Tinggi' },
  // { label: 'Sangat Besar', value: 'Sangat Besar' },
]

export const tingkat_risiko_combo = [
  { label: 'Tinggi', value: 'Tinggi' },
  { label: 'Sedang', value: 'Sedang' },
  { label: 'Rendah', value: 'Rendah' },
]

export const information_combo = [
  { label: 'Completeness', value: 'Completeness', kode_information: 'C' },
  { label: 'Accuracy', value: 'Accuracy', kode_information: 'A' },
  { label: 'Validity', value: 'Validity', kode_information: 'V' },
  { label: 'Restricted Access', value: 'Restricted Access', kode_information: 'RA' }
]


export const status_remediasi_edit_combo = [
  { label: 'Defisiensi', value: 'defisiensi' },
  { label: 'Teremediasi', value: 'teremediasi' },
  { label: 'Tidak Teremediasi', value: 'tidak teremediasi' },

]

export const status_remediasi_edit_idx = {

  'defisiensi': 'Defisiensi',
  'teremediasi': 'Teremediasi',
  'tidak teremediasi': 'Tidak Teremediasi'
}

export const status_remediasi_edit_hex = {

  'defisiensi': colorsPallette.warning,
  'teremediasi': colorsPallette.success,
  'tidak teremediasi': colorsPallette.danger
}


export const tipe_defisiensi_combo = [
  { label: 'Desain', value: 'desain' },
  { label: 'Operasi', value: 'operasi' },
  { label: 'Desain dan Operasi', value: 'desain dan operasi' },
]

export const tipe_defisiensi_idx = {
  'desain': 'Desain',
  'operasi': 'Operasi',
  'desain dan operasi': 'Desain dan Operasi'
}

export const prior_year_combo = [
  { label: 'Prior Year', value: 'prior year' },
  { label: 'Current Year', value: 'current year' },

]
export const prior_year_idx = {
  'prior year': 'Prior Year',
  'current year': 'Current Year'
}

export const id_pertanyaan_tod_pengujian_detail_var = {
  '8': {
    column: 'sifat_pengendalian',
    y: ['otomatis', 'itdm'],
    na: ['manual'],
  },
  '9': {
    column: 'sifat_pengendalian',
    y: ['otomatis', 'itdm'],
    na: ['manual'],
  },
  '10': {
    column: 'sifat_pengendalian',
    y: ['manual', 'itdm'],
    na: ['otomatis'],
  },
  '11': {
    column: 'sifat_pengendalian',
    y: ['manual', 'itdm'],
    na: ['otomatis'],
    placeholder: 'Preventive/Detective'
  },
  '15': {
    column: 'jenis_kontrol',
    y: ['detective', 'detectif', 'detektif'],
    na: ['preventive', 'preventif'],
  },
}

const is_tampil_disemua_halaman_modal_pemutakhiran = false

const is_apply_login_with_sso = import.meta.env.VITE_LOGIN_WITH_SSO == 1 ? true : false
export const delay_notif = import.meta.env.VITE_DELAY_NOTIF

const is_apply_column_ipe_hk = true

const is_euc_and_mrcipe_ditaruh_didepan = true
const user_testing_euc_and_mrcipe_ditaruh_didepan = () => {
  // return (((JSON.parse(getStorage('user_login') || {}))?.user?.email || '') == 'kuncoro.kusrianto@hutamakarya.com')
  return true
}

const kesimpulan_ipe_combo = [
  { label: 'Document Meets IPE Requirement', value: 'Document Meets IPE Requirement' },
  { label: 'Document Not Meets IPE Requirement', value: 'Document Not Meets IPE Requirement' }
]

const status_inquiries_combo = [
  { value: 'terkirim', label: 'Belum Dijawab' },
  { value: 'dijawab', label: 'Dijawab' }
]

export const isTrue = val => [1, true, "1"].includes(val)

export {
  user_testing_euc_and_mrcipe_ditaruh_didepan,
  is_euc_and_mrcipe_ditaruh_didepan,
  status_inquiries_combo,
  kesimpulan_ipe_combo,
  is_apply_column_ipe_hk,
  is_apply_login_with_sso,
  is_tampil_disemua_halaman_modal_pemutakhiran,
  column_table_escape,
  status_ruang_lingkup_combo,
  efektif_tidakefektif_remediasi_combo,
  is_visible_penanda_abjad_rcm,
  convertTlcToPlc,
  colToNum,
  numToCol,
  template_rcm_combo,
  url_api,
  fileUploadConfig,
  checkExtFileUpload,
  angkaKeHuruf,
  checkIsValid,
  urlPreview,
  checkRules,
  urlDownload,
  errorFormMessage,
  saveStorage,
  getStorage,
  clearStorage,
  pageSlugParams,
  checkNotAuthorized,
  initAccessMethod,
  arrayToTree,
  arrayToTree1,
  arrayToTreeJabatan,
  comboBK,
  extUploadFile,
  initFilterUrl,
  redirectAuth,
  createTableHeader,
  bulanNumbValueVar,
  combokategoridampak,
  arrayToTree2,
  arrayToTree3,
  initBreadcrumbs,
  showToastr,
  colorsPallette,
  formatDateApp,
  bulanTextVar,
  bulanTextValueVar,
  datacolorapply,
  fileToBase64,
  bulanTextToBulanNumber,
  nilaiDampakOtomatis,
  bulanIntToBulanText,
  statusKriOtomatis,
  levelRisikoVar,
  nilaiEksposurOtomatis,
  combostatuswarna,
  skalaRisikoOtomatis,
  skalaDampakOtomatis,
  skalaProbabilitasOtomatis,
  initMasterDB,
  nilaiEksposurKualitatifOtomatis,
  arrayToTreeFilterRiskRegister,
  menuChildWithParent,
  referensiSecurityPage,
  findTopParent,
  go_logout,
  ruang_lingkup_id,
  ruang_lingkup_nama,
  abjads,
  urlPreviewNew,
  saveFilterStorage,
  getFilterStorage,
  kolom_yang_benar_di_risiko_itgc,
  label_yang_benar_di_risiko_itgc,
  ruang_lingkup_combo,
  get_access_sakti,
  stringEnter,
  initFilterUrlLikelihood,
  fnc_is_disabled,
  convertImageUrlToBase64,
  url_fully,
  kk_idx,
  ada_tidak_ada_combo,
  ada_tidak_ada_idx,
  efektivitas_all_combo,
  pengajuan_all_combo,
};

// === Password Security Functions ===
export const checkPasswordStrength = (password) => {
    let score = 0;
    let errors = [];
    
    if (!password) {
        return { valid: false, errors: [], score: 0, level: 'Lemah' };
    }
    
    if (password.length < 8) {
        errors.push('Minimal 8 karakter');
    } else {
        score += 20;
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Huruf besar (A-Z)');
    } else {
        score += 20;
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Huruf kecil (a-z)');
    } else {
        score += 20;
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Angka (0-9)');
    } else {
        score += 20;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Karakter khusus (!@#$%)');
    } else {
        score += 20;
    }
    
    let level = 'Lemah';
    if (score >= 80) level = 'Sangat Kuat';
    else if (score >= 60) level = 'Kuat';
    else if (score >= 40) level = 'Cukup';
    
    return {
        valid: errors.length === 0,
        errors,
        score,
        level
    };
};

export const formatLastLogin = (dateString) => {
    if (!dateString) return 'Belum pernah login';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getPasswordStrengthClass = (level) => {
    switch(level) {
        case 'Sangat Kuat': return 'success';
        case 'Kuat': return 'info';
        case 'Cukup': return 'warning';
        default: return 'danger';
    }
};

// Password Security
