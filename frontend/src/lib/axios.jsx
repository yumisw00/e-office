import Axios from 'axios'

const axios = Axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    },
    withCredentials: true,
    withXSRFToken: true,
})

axios.interceptors.response.use(
    response => response,
    error => {
        const status = error?.response?.status

        if (
            typeof window !== 'undefined' &&
            [401, 419].includes(status) &&
            !window.location.pathname.includes('/login')
        ) {
            localStorage.clear()
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)

export default axios

export const CancelToken = Axios.CancelToken;
