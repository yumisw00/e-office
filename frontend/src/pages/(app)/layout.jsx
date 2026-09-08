// "use client"

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "hooks/auth";
import Navigation from "pages/(app)/Navigation";
import Loading from "pages/(app)/Loading";
import "bootstrap/dist/css/bootstrap.min.css";
import { clearStorage, getStorage } from "pages/Utils";
import { usePathname, useRouter } from "components/Navigation";
import NotFoundPage from "pages/not-found";
import axios from "lib/axios";
import { saveStorage, showToastr } from "pages/Utils";
import { api_services } from "hooks/api_services";
import { useSelector, useDispatch } from "react-redux";
import Sidebar from "components/Sidebar";
import { VAR_IS_PAGE_404 } from "hooks/redux";

const is_activated_page404 = false;

const AppLayout = ({ children, header }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const [user, setuser] = useState(null);

  const [accessrendered, setaccessrendered] = useState(false);
  const [errors, setErrors] = useState({});
  const is_upgrade_fitur = useSelector((state) => state.is_upgrade_fitur);
  const is_page_404 = useSelector((state) => state.is_page_404);
  const is_page_preview = useSelector((state) => state.is_page_preview);
  const isLetterDetailPage = /^\/(?:surat_(masuk|keluar)|surat_arsip|disposisi)\/detail\/[^/]+\/?$/.test(pathname || '');


  const { postapi_services, getapi_services } = api_services({
    api_path: "/get_session",
  });

  const initialized = useRef(false);
  useEffect(() => {
    dispatch({
      type: VAR_IS_PAGE_404,
      value: false,
    });
  }, [pathname, dispatch]);

  useEffect(() => {
    if (!initialized.current) {

      // console.log('user=>layout=>')
      // console.log(user)

      cekAccessFromSSO();
      // const user_loginObj = getStorage("user_login");
      initialized.current = true;

      // checking_page_error();
    }
  }, [pathname]);


  const cekAccessFromSSO = async () => {
    const user_loginObj = getStorage("user_login");

    // console.log('cekAccessFromSSO');
    // console.log(user_loginObj);

    // return
    if (!user_loginObj) {
      await clearStorage()
      router.push('/login')
      return
    }

    try {
      const user_login = JSON.parse(user_loginObj);

      if (!user_login || !user_login.user) {
        // Session invalid or missing user data — try to refresh from API
        const response = await getapi_services({ setErrors });
        if (response && response.user) {
          console.log(response);
          saveStorage("user_login", JSON.stringify(response));
          setuser(response.user);
        }
        setaccessrendered(true);
      } else {
        // Valid session from localStorage
        setuser(user_login.user);
        setaccessrendered(true);
      }
    } catch (err) {
      // JSON parse error or other issue — clear and redirect
      console.error('Session validation failed:', err);
      await clearStorage();
      setaccessrendered(true);
      router.push('/login');
    }
  };


  if (!user || !accessrendered) {
    return <Loading />;
  }

  if (is_page_preview) return children

  return (
    <div className="min-h-screen bg-gray-100 layout-app ">
      {is_page_404 ? (
        <NotFoundPage />
      ) : (
        <>
          {accessrendered && !isLetterDetailPage && <Navigation user={user} />}

          <main
            className={isLetterDetailPage ? "d-flex" : "d-flex layout-app-body"}
            style={isLetterDetailPage ? { minHeight: '100vh', width: '100%' } : undefined}
          >
            {accessrendered && !isLetterDetailPage && <Sidebar />}

            <div
              className="flex-1 overflow-y-auto"
              style={isLetterDetailPage ? { width: '100%', padding: 2, background: '#fff' } : undefined}
            >
              {children}
            </div>
          </main>
        </>
      )}
      <div className="is-loading-global-lyt d-flex justify-content-center align-items-center">
        <div className="d-flex flex-column justify-content-center align-items-center">
          <div className="spinner-border"
            style={{
              width: 70,
              height: 70
            }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="spinner-border-message text-center">Sedang memuat data...</div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
