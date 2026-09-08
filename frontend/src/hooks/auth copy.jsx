
import axios from "lib/axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clearStorage, getStorage, saveStorage, showToastr } from "pages/Utils";
import { usePathname, useRouter } from "components/Navigation";
import useSWR from 'swr'

export const useAuth = ({
  middleware,
  redirectIfAuthenticated,
  onRequestDone,
} = {}) => {
  let navigate = useNavigate();
  let params = useParams();
  const router = useRouter();

  const { data: user, error, mutate } = useSWR('/api/user', () =>
    axios
        .get('/api/user')
        .then(res => {
            return res.data
        })
        // .then(async res => {
        //     const isLoggedIn = await getStorage("isLoggedIn")
        //     if(!isLoggedIn) {
        //         window.location.href = '/login'
        //     }
        //     return res.data
        // })
        .catch(error => {
            if (error.response.status !== 409) throw error

            router.push('/verify-email')
        }),
)

  // const mutate = async () => {
  //   const user_loginObj = getStorage("user_login");
  //   if (user_loginObj) {
  //     const user_login = JSON.parse(user_loginObj)
  //     if (user_login.user && user_login.user.id_user) {
  //       navigate(redirectIfAuthenticated);
  //     }
  //   }
  // }

  // const csrf = () => axios.get("/token");
  const csrf = () => axios.get('/sanctum/csrf-cookie')

  const register = async ({ setErrors, ...props }) => {
    await csrf();
    if(setErrors) {

      setErrors([]);
    }
    return axios
      .post("/register", props)
      // .then(() => mutate())
      .then((res) => res.data)
      .catch((error) => {
        return error.response.data
    
      });
  };

  const [responDataLogin, setResponDataLogin] = useState();
  const login = async ({ setErrors, setStatus, ...props }) => {
    await csrf();
    setErrors([]);
    setStatus(null);
    axios
      .post("/login", props)
      .then(async (res) => {
        console.log('res')
        console.log(res)
        if (res.data.groups) {
          setResponDataLogin(res.data);
        } else {
          await handleSaveStorage("isLoggedIn", "1");
          await handleSaveStorage("is_arr_group", "0");
        }
        await handleSaveStorage("user_login", res.data);
        return mutate();
      })
      .catch((error) => {
      
        if (
          error.response.data &&
          error.response.data.messages &&
          error.response.data.messages.errors
        ) {
          showToastr("error", error.response.data.messages.errors);
        }
        if (
          error.response.data &&
          error.response.data.message &&
          error.response.data.code
        ) {
       
          showToastr("error", error.response.data.message);
        }
    
        setErrors(Object.values(error.response.data.errors).flat());
        if (onRequestDone) {
          onRequestDone();
        }
      });
  };

  const forgotPassword = async ({ setErrors, setStatus, email }) => {
    await csrf();
    setErrors([]);
    setStatus(null);
    axios
      .post("/forgot-password", { email })
      .then((response) => setStatus(response.data.status))
      .catch((error) => {
        if (error.response.status !== 422) throw error;
        setErrors(Object.values(error.response.data.errors).flat());
      });
  };

  const resetPassword = async ({ setErrors, setStatus, ...props }) => {
    await csrf();
    setErrors([]);
    setStatus(null);
    axios
      .post("/reset-password", { token: params.token, ...props })
      .then((response) =>
        navigate(`/login?reset=${btoa(response.data.status)}`)
      )
      .catch((error) => {
        if (error.response.status !== 422) throw error;
        setErrors(Object.values(error.response.data.errors).flat());
      });
  };

  const resendEmailVerification = ({ setStatus }) => {
    axios
      .post("/email/verification-notification")
      .then((response) => setStatus(response.data.status));
  };

  const logout = async () => {
 

    // await clearStorage()
    // navigate('/login');

    await axios.post('/logout').then(() => mutate())
  };

  const handleSaveStorage = async (key, data) => {
    await saveStorage(key, JSON.stringify(data));
  };

  

  return {
    user,
    register,
    login,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
    logout,
  };
};
