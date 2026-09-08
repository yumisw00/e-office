import ApplicationLogo from "components/ApplicationLogo";
import Dropdown from "react-bootstrap/Dropdown";
import Link from "components/Link";
import $ from "jquery";

import ResponsiveNavLink, {
  ResponsiveNavButton,
} from "components/ResponsiveNavLink";
import { useAuth } from "hooks/auth";
import { useState, useRef, useEffect } from "react";
import BtnIcon from "components/BtnIcon";
import IconApp from "components/IconApp";
import Configs from "../Configs";

import { checkNotAuthorized, colorsPallette, delay_notif, getStorage, saveStorage, showToastr } from "../Utils";
import { api_services } from "hooks/api_services";
import { useSelector, useDispatch } from "react-redux";
import { VAR_SET_NAME, VAR_SET_TOTAL_EWS } from "hooks/redux";
import { usePathname, useRouter } from "components/Navigation";
import { ModalChooseGroup, ModalLoginLoading, ModalTwoFactor } from "pages/(auth)/login/page";
import { getEofficeRole, getStoredUserLogin } from "lib/eofficeAccess";

const Navigation = ({ user }) => {
  const input_search_global = useRef();
  const { logout, choose_group, verify_two_factor, resend_two_factor } = useAuth();

  const { getapi_services, postapi_services } =
    api_services({});
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [search_open, setsearch_open] = useState(false);

  const [is_arr_group, setis_arr_group] = useState(false);
  const [dropdown, setdropdown] = useState([]);
  const [keyword, setkeyword] = useState("");
  const [count_notif, setcount_notif] = useState(0);
  const [nama_group, setnama_group] = useState('')
  const delay = delay_notif;

  const name = useSelector((state) => state.name);
  const [is_sedang_login_as, setis_sedang_login_as] = useState(false)

  const [modalChooseGroup, setmodalChooseGroup] = useState(false)
  const [groups, setgroups] = useState([])
  const [groups_item, setgroups_item] = useState(null)
  const [is_login_role, setis_login_role] = useState(false)
  const [btn_popup_loading, setbtn_popup_loading] = useState(false)
  const [modalTwoFactor, setmodalTwoFactor] = useState(false)
  const [twoFactorData, settwoFactorData] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [twoFactorErrors, setTwoFactorErrors] = useState({})
  const [btn_two_factor_loading, setbtn_two_factor_loading] = useState(false)
  const [btn_resend_loading, setbtn_resend_loading] = useState(false)
  const [btn_loading, setbtn_loading] = useState(false)
  const [loginLoadingText, setLoginLoadingText] = useState('Memverifikasi role dan menyiapkan OTP...')


  const timer = useRef(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initUserLogin();
      restorePendingTwoFactor();
    }
  }, []);

  useEffect(() => {
    handlegetnotifikasi();
    timer.current = setInterval(handlegetnotifikasi, Number(delay) || 30000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);


  const sidebarExpandCollapse = () => {
    $("body").toggleClass("sidebar-collapsed");
  };

  const handleExpandCollapseSearch = () => {
    setsearch_open(!search_open);

    let is_focus = search_open === true ? false : true;
    if (is_focus) {
      input_search_global.current.focus();
    }
  };

  const initUserLogin = async () => {
    const userLoginObj = await getStorage("user_login");
    const user_login = JSON.parse(userLoginObj);

    // console.log('initUserLogin=>user_login');
    // console.log(user_login);


    const is_arr_groupObj = await getStorage("is_arr_group");
    const is_arr_group = JSON.parse(is_arr_groupObj);

    let nama_group = ''
    if (user_login.nama_group) {
      nama_group = user_login.nama_group

    }
    if (user_login.nama_jabatan) {
      nama_group += ` - ${user_login.nama_jabatan}`
    }

    setnama_group(nama_group);
    setis_arr_group(is_arr_group == 1 ? true : false);

    dispatch({
      type: VAR_SET_NAME,
      value: user_login.user.name,
    });

    if (user_login.id_user_old && user_login.id_group_old) {
      setis_sedang_login_as(true)
    }

    const is_login_role = user_login?.groups || false
    let groups = []
    if (is_login_role) {
      groups = user_login.groups
    }

    let groups_item = null
    if (is_login_role && groups.length > 0) {
      groups_item = groups.find(m => m.id_group == user_login.id_group && m.id_jabatan == user_login.id_jabatan)
    }
    setis_login_role(is_login_role)
    setgroups(groups)
    setgroups_item(groups_item)
  };

  const normalizeNotificationItem = (item = {}) => {
    const id = item.id_notification ??
      item.id_notifikasi ??
      item.id_msg_penerima ??
      item.id

    const isRead = item.is_read ??
      item.read ??
      (item.read_at || item.tanggal_dibaca ? 1 : 0)

    const rawUrl = item.url || item.link || item.path || '/notifikasi'
    const incomingSuratMatch = typeof rawUrl === 'string'
      ? rawUrl.match(/^\/surat_masuk(?:\/detail)?\/([^/?#]+)(?:[?#].*)?$/)
        || rawUrl.match(/^\/surat_masuk_pegawai\?(?:[^#]*&)?surat_id=([^&#]+)/)
      : null
    const activeRole = getEofficeRole(getStoredUserLogin())
    const isAdmin = ['admin_sistem', 'admin_konten'].includes(activeRole)

    // Tujuan dipilih menurut role aktif, bukan URL yang tersimpan pada saat
    // notifikasi dibuat. Dengan demikian akun multi-role juga diarahkan ke
    // halaman yang sesuai dengan role yang sedang digunakan.
    const url = incomingSuratMatch
      ? isAdmin
        ? `/surat_masuk/detail/${incomingSuratMatch[1]}`
        : `/surat_masuk_pegawai?surat_id=${incomingSuratMatch[1]}`
      : rawUrl

    return {
      ...item,
      id_notification: id,
      id_msg_penerima: id,
      id_msg: item.id_msg ?? id,
      msg: item.msg || item.message || item.title || item.judul || 'Notifikasi E-Office',
      note: item.note || item.keterangan || item.description || item.deskripsi || '',
      url,
      is_read: isRead ? 1 : 0,
      created_at: item.created_at || item.tanggal || item.time || item.waktu || '',
      created_by_desc: item.created_by_desc || item.sender || item.pengirim || 'E-Office',
    }
  }

  const normalizeNotificationResponse = response => {
    const data = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : []

    const normalized = data.map(normalizeNotificationItem)
    const countUnread = response?.count_not_read ??
      response?.total_unread ??
      response?.unread_count ??
      normalized.filter(item => item.is_read != 1).length

    return {
      data: normalized,
      countUnread,
    }
  }

  const handlegetnotifikasi = async () => {
    const response = await getapi_services({
      api_path: "/eoffice/notifications",
    });

    checkNotAuthorized(response);
    if (response.error) return;

    const normalized = normalizeNotificationResponse(response);

    setcount_notif(normalized.countUnread);
    setdropdown({ data: normalized.data });

    // dispatch({
    //   type: VAR_SET_TOTAL_EWS,
    //   value: response.total_ews,
    // });
  };

  const handlereadnotifikasi = async (item) => {
    const id = item.id_notification || item.id_msg_penerima || item.id
    if (!id) return

    const response = await postapi_services({
      api_path: `/eoffice/notifications/${id}/read`,
      disabledAlert: true,
    });

    checkNotAuthorized(response);
    if (response.error || response.code) return;

    setdropdown(current => ({
      data: (current?.data || []).map(notification => {
        const notificationId = notification.id_notification || notification.id_msg_penerima || notification.id
        return notificationId == id ? { ...notification, is_read: 1 } : notification
      })
    }))
    setcount_notif(count => Math.max(0, count - 1))
  };

  const handleSearch = () => {
    router.push(`/search/${keyword}`);
  };

  const login_on_group = async () => {
    if (!groups_item?.id_group) return

    setLoginLoadingText('Memverifikasi role dan menyiapkan OTP...')
    setbtn_loading(true)
    setbtn_popup_loading(true)
    choose_group({
      id_group: groups_item.id_group,
      id_user_delegasi: groups_item.id_user_delegasi,
      id_user: groups_item.id_user,
      id_jabatan: groups_item?.id_jabatan || '',
      setErrors: setTwoFactorErrors,
      onRequireTwoFactor: handleRequireTwoFactor
    })
  }

  const handleRequireTwoFactor = data => {
    setbtn_loading(false)
    setbtn_popup_loading(false)
    setOtpCode('')
    setTwoFactorErrors({})
    saveStorage('pending_2fa', JSON.stringify(data))
    settwoFactorData(data)
    setmodalChooseGroup(false)
    setmodalTwoFactor(true)
    showToastr('success', `OTP sedang dikirim ke ${data.masked_destination || 'email Anda'}.`)
  }

  const restorePendingTwoFactor = async () => {
    const pendingTwoFactor = await getStorage('pending_2fa')
    if (!pendingTwoFactor) return

    try {
      const parsed = JSON.parse(pendingTwoFactor)
      if (parsed?.challenge_id) {
        settwoFactorData(parsed)
        setmodalTwoFactor(true)
      }
    } catch (error) {
      localStorage.removeItem('pending_2fa')
    }
  }

  const verifyOtp = async event => {
    event?.preventDefault()
    if (!twoFactorData?.challenge_id) return

    setbtn_two_factor_loading(true)
    verify_two_factor({
      challenge_id: twoFactorData.challenge_id,
      otp_code: otpCode,
      setErrors: setTwoFactorErrors,
    })
  }

  const resendOtp = async () => {
    if (!twoFactorData?.challenge_id) return

    setbtn_resend_loading(true)
    resend_two_factor({
      challenge_id: twoFactorData.challenge_id,
      setErrors: setTwoFactorErrors,
      onRequireTwoFactor: handleRequireTwoFactor
    })
  }

  useEffect(() => {
    const hasErrors = Array.isArray(twoFactorErrors)
      ? twoFactorErrors.length > 0
      : Object.keys(twoFactorErrors || {}).length > 0

    if (!hasErrors) return

    setbtn_loading(false)
    setbtn_popup_loading(false)
    setbtn_two_factor_loading(false)
  }, [twoFactorErrors])

  useEffect(() => {
    setbtn_resend_loading(false)
  }, [twoFactorData])

  return (
    <>
      <nav className="bg-white border-gray-100 navbar-app">
        <div className=" mx-auto px-0 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="hidden sm:flex sm:items-center profile-user-login">


                <div className="flex-1 container-top-user-login ps-3">

                  <Link href="/dashboard" className="flex items-center">
                    <ApplicationLogo
                      height={30}
                      width={30}
                      className="block h-10 w-auto fill-current text-gray-600"
                      src="/logo.png"
                    />

                    <div className={`company-name ml-3`}>
                      E-Office
                    </div>
                  </Link>

                </div>

                <BtnIcon onTap={sidebarExpandCollapse} icon="menu" color={'#333'} />
              </div>

              <div className="flex-shrink-0 flex items-center navbar-logo">
                {is_sedang_login_as ? (
                  <div className="login-as-alert d-flex align-items-center">
                    <span className="material-icons">warning</span>
                    <div className="flex-1">
                      <div>Warning!</div>
                      <div>Anda sedang menggunakan fitur login as mohon berhati-hati!</div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden  navbar-icons">

                {/* <div className={`navbar-search ${search_open ? "active" : ""}`}>
                <div className="flex align-items-center">
                  <IconApp icon="search" />
                  <form className="flex-1" onSubmit={handleSearch}>
                    <div className="flex-1">
                      <input
                        ref={input_search_global}
                        id="search_global"
                        type="text"
                        placeholder="Cari risiko..."
                        value={keyword}
                        className="block mt-1 w-full"
                        onChange={(event) => {
                          setkeyword(event.target.value);
                        }}
                        required
                        autoFocus
                      />
                    </div>
                  </form>
                </div>

                <BtnIcon onTap={handleExpandCollapseSearch} icon="close" />
              </div>

              <BtnIcon
                onTap={handleExpandCollapseSearch}
                icon="search"
              /> */}

                {/* <BtnIcon
                onTap={() => null}
                icon="warning"
              /> */}

                {/* <div className="login-as-alert d-flex">
                <span className="material-icons">warning</span>
                <div className="flex-1">
                  <div>Warning!</div>
                  <div>Anda sedang menggunakan fitur login as mohon berhati-hati!</div>
                </div>
              </div> */}

                <BtnIcon
                  icon="notifications"
                  notif={count_notif}
                  onRead={handlereadnotifikasi}
                  dropdown={dropdown}
                />
                <BtnIcon
                  icon="help"
                  is_user_guide
                />

                <div className='d-flex align-items-center'>

                </div>
                <Dropdown>
                  <Dropdown.Toggle variant="" id="dropdown-basic" className="dropdown-toggle-profile">
                    <div className="d-flex align-items-center">
                      <div className="container-name-user-login">
                        <div className="profile-user-login-name">{name}</div>
                        <div className="profile-user-login-desc">
                          {nama_group}
                        </div>
                      </div>
                      <div className="icon-logo-profile">
                        <span className="material-icons material-icons-person">person</span>
                      </div>
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="dropdown-user-profile-topbar">

                    {/* 
                    <Link
                      href={`/profile/detail`}
                      className="d-flex align-items-center link-edit"
                    >
                      <span
                        className="material-icons"
                        style={{ fontSize: 18, marginRight: 7 }}
                      >
                        person
                      </span>{" "}
                      Profile
                    </Link> */}


                    <Dropdown.Item
                      onClick={() => {
                        router.push(`/profile/detail`)
                      }}
                      className="d-flex align-items-center">
                      <span
                        className="material-icons"
                        style={{ fontSize: 18, marginRight: 7 }}>
                        person
                      </span>
                      Profile
                    </Dropdown.Item>

                    {is_login_role ? (
                      <Dropdown.Item
                        onClick={() => {
                          setmodalChooseGroup(true)
                        }}
                        className="d-flex align-items-center">
                        <span
                          className="material-icons"
                          style={{ fontSize: 18, marginRight: 7 }}>
                          person
                        </span>
                        Login Role
                      </Dropdown.Item>
                    ) : null}


                    {is_arr_group ? (
                      <>

                        <Link
                          href={`/akses`}
                          className="d-flex align-items-center link-edit"
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: 18, marginRight: 7 }}
                          >
                            person
                          </span>{" "}
                          Login Role
                        </Link>
                      </>
                    ) : null}

                    <Dropdown.Item
                      onClick={logout}
                      className="d-flex align-items-center">
                      <span
                        className="material-icons"
                        style={{ fontSize: 18, marginRight: 7 }}>
                        logout
                      </span>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

              </div>
            </div>

            <div className=" flex items-center sm:hidden navbar-right">
              <button
                onClick={() => setOpen((open) => !open)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {open ? (
                    <path
                      className="inline-flex"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      className="inline-flex"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

          </div>
        </div>





      </nav >
      <ModalChooseGroup
        show={modalChooseGroup}
        onHide={() => {
          setmodalChooseGroup(false)
          // logout()
        }}
        btn_popup_loading={btn_popup_loading}
        groups={groups}
        groups_item={groups_item}
        setgroups_item={setgroups_item}
        onlogin_on_group={login_on_group}
      />

      <ModalTwoFactor
        show={modalTwoFactor}
        canClose={false}
        onHide={() => null}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        twoFactorData={twoFactorData}
        errors={twoFactorErrors}
        btn_loading={btn_two_factor_loading}
        btn_resend_loading={btn_resend_loading}
        onVerify={verifyOtp}
        onResend={resendOtp}
      />

      <ModalLoginLoading
        show={btn_loading}
        text={loginLoadingText}
      />
    </>

  );
};

export default Navigation;

