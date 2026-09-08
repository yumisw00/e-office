

import Button from 'components/Button'
import Input from 'components/Input'
import InputError from 'components/InputError'
import Label from 'components/Label'
import Link from 'components/Link'
import { useAuth } from 'hooks/auth'
import axios from 'lib/axios'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'components/Navigation'
import AuthSessionStatus from 'pages/(auth)/AuthSessionStatus'
import { getStorage, saveStorage } from 'pages/Utils'
import { api_services } from 'hooks/api_services'

const Akses = () => {
    // console.log('Akses =>')
    const router = useRouter()

    const {
        getapi_services,
        getapi_servicesid,
        postapi_services,
        putapi_services,
        deleteapi_services,
    } = api_services({
        api_path: `/akses`,
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [shouldRemember, setShouldRemember] = useState(false)
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [btn_loading, setbtn_loading] = useState(false)

    const initialized = useRef(false)
    useEffect(() => {
        //first load
        if (!initialized.current) {
            initialized.current = true
            getStorageGroup()
            getJabatan()
            getGroup()
        }
    }, [])

    const [dataGroup, setDataGroup] = useState([])
    const [dataUser, setDataUser] = useState([])
    const [dataPassword, setDataPassword] = useState([])

    const getStorageGroup = async () => {
        const getStorageDataGroup = await getStorage('user_login')
        const data_group = JSON.parse(getStorageDataGroup)
        // console.log('data_group')
        // console.log(data_group)
        let dataarr = []
        data_group.groups.map((e, i) => {
            dataarr.push({
                id_jabatan: e.id_jabatan,
                id_group: e.id_group,
            })
        })

        // console.log('get storage data')
        // console.log(dataarr)
        // console.log(data_group)
        setDataUser(data_group.user)
        setDataGroup(data_group.groups)
    }

    const [dataIdJabatan, setDataIdJabatan] = useState([])
    const getJabatan = async () => {
        const responseJabatan = await getapi_services({
            setErrors,
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 200,
                },
            },
            api_path: '/mt_sdm_jabatan',
        })
        let dataarr = []
        responseJabatan.data.map((v, i) => {
            dataarr[v.id_jabatan] = v.nama
        })
        // console.log(dataarr)
        setDataIdJabatan(dataarr)
    }

    const [dataIdGroup, setDataIdGroup] = useState([])
    const getGroup = async () => {
        const responseGroup = await getapi_services({
            setErrors,
            filter: {
                paginate: {
                    page: 1,
                    pagesize: 200,
                },
            },
            api_path: '/sys_group',
        })
        let dataarr = []
        responseGroup.data.map((v, i) => {
            dataarr[v.id_group] = v.nama
        })
        // console.log(dataarr)
        setDataIdGroup(dataarr)
        // console.log(responseGroup)
    }

    const handleSaveStorage = async (key, data) => {
        await saveStorage(key, JSON.stringify(data))
    }

    // const [saveStatus, setSaveStatus] = useState(false)
    const submitForm = async (id_group, id_user) => {
        axios
            .post('/choseGroup', {
                id_group,
            })
            .then(async res => {
                const user_loginObj = await getStorage('user_login')
                const user_login = JSON.parse(user_loginObj)
                const groups = user_login.groups

                const merge = { ...res.data, user: dataUser, groups }
                
                await handleSaveStorage('user_login', merge)
                await handleSaveStorage('is_arr_group', '1')
                // console.log(merge)

                window.location.href = '/dashboard'
                // router.push('/dashboard')
            })
            .catch(error => {
                // if (error.response.status !== 422) throw error
                // setErrors(error.response.data.errors)
            })

        // router.push('/dashboard')
        // window.location.href = '/'
    }

    return (
        <>
            {dataGroup.map((e, i) => {
                return (
                    <button
                        key={i}
                        onClick={() => {
                            submitForm(e.id_group, e.id_user)
                        }}
                        className="bg-gray-900 mb-2 w-full rounded-md text-center text-white font-semibold ">
                        {dataIdGroup[e.id_group]} <br />
                        {`${dataUser.name} - ${dataIdJabatan[e.id_jabatan]}`}
                    </button>
                )
            })}
        </>
    )
}

export default Akses
