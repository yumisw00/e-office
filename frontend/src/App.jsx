import NotFoundPage1 from "pages/notfound";
// import "./App.css";
import { Routes, Route, useLocation, useNavigation, useNavigate, BrowserRouter, useSearchParams } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";

import RootLayout from "pages/layout";
import Layout from "pages/(auth)/layout";
import AppLayout from "pages/(app)/layout";
import Loading from "pages/(app)/Loading";
import { usePathname, useRouter } from "components/Navigation";

const Login = lazy(() => import("pages/(auth)/login/page"));
const Authenticate = lazy(() => import("pages/(auth)/authenticate/page"));
const Dashboard = lazy(() => import("pages/(app)/dashboard/page"));
const GroupPage = lazy(() => import("pages/(app)/group/page"));

// Password pages
const ForgotPassword = lazy(() => import("pages/(auth)/forgot-password/page"));
// const PasswordReset = lazy(() => import("pages/(auth)/password-reset/page"));
const PasswordResetToken = lazy(() => import("pages/(auth)/password-reset/[token]/page"));
const ForcePasswordChange = lazy(() => import("pages/(auth)/force-password-change/page"));

let PageDinamic = {};

PageDinamic["/"] = lazy(() => import("pages/(app)/dashboard/page"));
PageDinamic["/dashboard"] = lazy(() => import("pages/(app)/dashboard/page"));
PageDinamic["/profile"] = lazy(() => import("pages/(app)/profile/page"));
PageDinamic["/profile/...slug"] = lazy(() =>
  import("pages/(app)/profile/[...slug]/page")
);

PageDinamic["/group/...slug"] = lazy(() =>
  import("pages/(app)/group/[...slug]/page")
);
PageDinamic["/group"] = GroupPage;
PageDinamic["/hak_akses_role/...slug"] = lazy(() =>
  import("pages/(app)/group/[...slug]/page")
);
PageDinamic["/hak_akses_role"] = GroupPage;
PageDinamic["/sys_group_menu/...slug"] = lazy(() =>
  import("pages/(app)/group/[...slug]/page")
);
PageDinamic["/sys_group_menu"] = GroupPage;
PageDinamic["/sys_log/...slug"] = lazy(() =>
  import("pages/(app)/sys_log/[...slug]/page")
);
PageDinamic["/sys_log"] = lazy(() => import("pages/(app)/sys_log/page"));
PageDinamic["/log_sistem/...slug"] = lazy(() =>
  import("pages/(app)/sys_log/[...slug]/page")
);
PageDinamic["/log_sistem"] = lazy(() => import("pages/(app)/sys_log/page"));
PageDinamic["/log_sistem_audit/...slug"] = lazy(() =>
  import("pages/(app)/sys_log/[...slug]/page")
);
PageDinamic["/log_sistem_audit"] = lazy(() => import("pages/(app)/sys_log/page"));
PageDinamic["/sys_menu/...slug"] = lazy(() =>
  import("pages/(app)/sys_menu/[...slug]/page")
);
PageDinamic["/sys_menu"] = lazy(() => import("pages/(app)/sys_menu/page"));
PageDinamic["/manajemen_menu/...slug"] = lazy(() =>
  import("pages/(app)/sys_menu/[...slug]/page")
);
PageDinamic["/manajemen_menu"] = lazy(() => import("pages/(app)/sys_menu/page"));
PageDinamic["/sys_setting/...slug"] = lazy(() =>
  import("pages/(app)/sys_setting/[...slug]/page")
);
PageDinamic["/sys_setting"] = lazy(() =>
  import("pages/(app)/sys_setting/page")
);
PageDinamic["/pengaturan_sistem/...slug"] = lazy(() =>
  import("pages/(app)/sys_setting/[...slug]/page")
);
PageDinamic["/pengaturan_sistem"] = lazy(() =>
  import("pages/(app)/sys_setting/page")
);
PageDinamic["/keamanan_sistem/...slug"] = lazy(() =>
  import("pages/(app)/sys_setting/[...slug]/page")
);
PageDinamic["/keamanan_sistem"] = lazy(() =>
  import("pages/(app)/sys_setting/page")
);
PageDinamic["/backup_database"] = lazy(() =>
  import("pages/(app)/backup_database/page")
);
PageDinamic["/surat_template"] = lazy(() => import("pages/(app)/surat_template/page"));
PageDinamic["/template_surat"] = lazy(() => import("pages/(app)/surat_template/page"));
PageDinamic["/audit_trail_immutable"] = lazy(() => import("pages/(app)/audit_trail_immutable/page"));
PageDinamic["/digital_signature"] = lazy(() => import("pages/(app)/digital_signature/page"));
PageDinamic["/informasi_tanda_tangan_surat"] = lazy(() => import("pages/(app)/informasi_tanda_tangan_surat/page"));
PageDinamic["/ai_document_job"] = lazy(() => import("pages/(app)/ai_document_job/page"));
PageDinamic["/sys_notification"] = lazy(() => import("pages/(app)/sys_notification/page"));
PageDinamic["/surat_distribusi"] = lazy(() => import("pages/(app)/surat_distribusi/page"));
PageDinamic["/master_organisasi"] = lazy(() => import("pages/(app)/master_organisasi/page"));
PageDinamic["/master_jenis_surat"] = lazy(() => import("pages/(app)/master_jenis_surat/page"));
PageDinamic["/workflow_surat"] = lazy(() => import("pages/(app)/workflow_surat/page"));
PageDinamic["/surat_approval"] = lazy(() => import("pages/(app)/surat_approval/page"));
PageDinamic["/tracking_surat"] = lazy(() => import("pages/(app)/tracking_surat/page"));
PageDinamic["/notifikasi"] = lazy(() => import("pages/(app)/notifikasi/page"));
PageDinamic["/agenda"] = lazy(() => import("pages/(app)/agenda/page"));
PageDinamic["/agenda_kegiatan"] = lazy(() => import("pages/(app)/agenda/page"));
PageDinamic["/pengumuman"] = lazy(() => import("pages/(app)/pengumuman/page"));
PageDinamic["/news_announcement"] = lazy(() => import("pages/(app)/pengumuman/page"));
PageDinamic["/sys_user/...slug"] = lazy(() =>
  import("pages/(app)/sys_user/[...slug]/page")
);
PageDinamic["/sys_user"] = lazy(() => import("pages/(app)/sys_user/page"));
PageDinamic["/manajemen_pengguna/...slug"] = lazy(() =>
  import("pages/(app)/sys_user/[...slug]/page")
);
PageDinamic["/manajemen_pengguna"] = lazy(() => import("pages/(app)/sys_user/page"));
PageDinamic["/surat_masuk/...slug"] = lazy(() =>
  import("pages/(app)/surat_masuk/[...slug]/page")
);
PageDinamic["/surat_masuk"] = lazy(() => import("pages/(app)/surat_masuk/page"));
PageDinamic["/surat_masuk_pegawai"] = lazy(() => import("pages/(app)/surat_masuk_pegawai/page"));
PageDinamic["/pegawai_surat_masuk"] = lazy(() => import("pages/(app)/surat_masuk_pegawai/page"));
PageDinamic["/surat_keluar/...slug"] = lazy(() =>
  import("pages/(app)/surat_keluar/[...slug]/page")
);
PageDinamic["/surat_keluar"] = lazy(() => import("pages/(app)/surat_keluar/page"));
PageDinamic["/surat_arsip/...slug"] = lazy(() =>
  import("pages/(app)/surat_arsip/[...slug]/page")
);
PageDinamic["/surat_arsip"] = lazy(() => import("pages/(app)/surat_arsip/page"));
PageDinamic["/arsip_surat/...slug"] = lazy(() =>
  import("pages/(app)/surat_arsip/[...slug]/page")
);
PageDinamic["/arsip_surat"] = lazy(() => import("pages/(app)/surat_arsip/page"));
PageDinamic["/pengarsipan/...slug"] = lazy(() =>
  import("pages/(app)/surat_arsip/[...slug]/page")
);
PageDinamic["/pengarsipan"] = lazy(() => import("pages/(app)/surat_arsip/page"));
PageDinamic["/disposisi/...slug"] = lazy(() =>
  import("pages/(app)/disposisi/[...slug]/page")
);
PageDinamic["/disposisi"] = lazy(() => import("pages/(app)/disposisi/page"));
PageDinamic["/surat_disposisi/...slug"] = lazy(() =>
  import("pages/(app)/disposisi/[...slug]/page")
);
PageDinamic["/surat_disposisi"] = lazy(() => import("pages/(app)/disposisi/page"));
PageDinamic["/pelaporan_disposisi/...slug"] = lazy(() =>
  import("pages/(app)/disposisi/[...slug]/page")
);
PageDinamic["/pelaporan_disposisi"] = lazy(() => import("pages/(app)/disposisi/page"));







let PageSpesific = {}



PageSpesific["/preview_document_with_authenticate/...slug"] = lazy(() => import("pages/(app)/preview/page"));

function App() {
  let params = {};
  let pathnameimport = useLocation().pathname;


  let pathname = pathnameimport;

  let pathnamearr = pathnameimport.split("/");

  let pathname_asli = pathnamearr[1]

  if (pathnamearr.length > 2) {

    let keyarr = Object.keys(PageDinamic).filter((str) => {
      let sstr = str.split("/");
      let spth = pathname.split("/");
      if (spth[1] == sstr[1]) return true;
    });
    // console.log(keyarr);
    if (keyarr.length) {
      let key = keyarr[0].split("/")[2];
      if (key == "...slug") key = keyarr[1].split("/")[2];

      if (key !== "...slug") {
        let pathidregister = "/" + pathnamearr[1] + "/" + key;
        // console.log("key")
        // console.log(key)
        if (PageDinamic[pathidregister]) {
          params[key] = pathnamearr[2];
          pathnameimport = pathidregister;
          let i = 3;
          while (pathnamearr[i]) {
            pathnameimport += "/" + pathnamearr[i];
            i++;
          }
        }
      }
    }
  }

  // console.log('APP')
  // console.log("pathnameimport")
  // console.log(pathnameimport)
  pathnameimport = pathnameimport
    .replace("/add", "/...slug/add")
    .replace("/edit", "/...slug/edit")
    .replace("/detail", "/...slug/detail");
  const paramarr = pathnameimport.split("/...slug/");
  if (paramarr[1]) {
    params.slug = paramarr[1].split("/");
    if (params.slug) pathnameimport = paramarr[0] + "/...slug";
  }

  // console.log('APP2')
  // console.log("pathnameimport2")
  // console.log(pathnameimport)

  let PageComponen = PageDinamic[pathnameimport];
  // console.log('PageComponen')
  // console.log(pathnameimport)
  // console.log(PageComponen)
  // console.log(pathnamearr.length)
  // console.log(pathnamearr)
  // console.log(pathname_asli)
  if (
    !PageComponen &&
    pathnameimport == "/mt_risk_kriteria_dampak/jenis/...slug"
  ) {
    PageComponen = PageDinamic["/mt_risk_kriteria_dampak/...slug"];
  }




  const router = useRouter()
  const pathname_param = usePathname()
  const pathname_param_arr = pathname_param.split('/')
  const addprops = {
    // router, pathname: pathname_param, pathaccess: paramarr[0].substring(1)
    router, pathname: pathname_param, pathaccess: pathname_param_arr[1]
  }


  if (!PageComponen && pathnamearr.length > 2 && PageSpesific[`/${pathnamearr[1]}/...slug`]) {
    PageComponen = PageSpesific[`/${pathnamearr[1]}/...slug`]

    params.slug = []
    pathname_param_arr.map((m, i) => {
      if (i > 1) {
        params.slug.push(m)
      }
    })

    console.log('path====>');
    console.log(pathnamearr);
    console.log(pathname_param_arr);
    console.log(params);
    console.log(addprops);
  }

 



  const [searchParams] = useSearchParams();
  addprops.searchParams = searchParams

  useEffect(() => {
    // init_url()
  }, [])

  const init_url = async () => {
    let urlsaved = ''
    if (!window.location.href.includes('/') || !window.location.href.includes('/login')) {
      urlsaved = window.location.href
    }
    if (urlsaved) {
      sessionStorage.setItem('urlsaved', urlsaved)
    }
  }

  return (
    <RootLayout>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route
            path="/login"
            element={
              <Layout {...addprops} >
                <Login />
              </Layout>
            }
          />
          <Route
            path="/authenticate"
            element={
              <Layout {...addprops} >
                <Authenticate />
              </Layout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Layout {...addprops} title="Lupa Password?">
                <ForgotPassword />
              </Layout>
            }
          />
          <Route
            path="/password-reset"
            element={
              <Layout {...addprops} title="Perbarui Password">
                <PasswordResetToken />
              </Layout>
            }
          />
          <Route
            path="/password-reset/:token"
            element={
              <Layout {...addprops} title="Perbarui Password">
                <PasswordResetToken />
              </Layout>
            }
          />
          <Route
            path="/force-password-change"
            element={
              <Layout {...addprops} >
                <ForcePasswordChange />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppLayout {...addprops} >
                <Dashboard {...addprops} />
              </AppLayout>
            }
          />
          <Route
            path="/sys_group_menu"
            element={
              <AppLayout {...addprops} >
                <GroupPage {...addprops} />
              </AppLayout>
            }
          />
          <Route
            path="/"
            element={
              <AppLayout {...addprops}>
                <Dashboard {...addprops} />
              </AppLayout>
            }
          />
          {PageComponen ? (
            <Route
              path={pathname}
              element={
                <AppLayout  {...addprops} >
                  <PageComponen params={params} {...addprops} />
                </AppLayout>
              }
            />
          ) : null}

          <Route path="*" element={<NotFoundPage1 />} />
        </Routes>
      </Suspense>
    </RootLayout>
  );
}

export default App;
