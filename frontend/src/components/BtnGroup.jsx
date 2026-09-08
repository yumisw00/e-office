import React, { useEffect } from 'react'
import Button from './Button'
import Link from 'components/Link'
import { api_services } from 'hooks/api_services';
import { usePathname, useRouter } from 'components/Navigation'
import { useSelector, useDispatch } from 'react-redux'
import InputCheckbox from './InputCheckbox';

const BtnGroup = (props) => {
    const is_page_readonly = useSelector(state => state.is_page_readonly)
    const router = useRouter()

    useEffect(() => {
        // console.log('props.data')
        // console.log(props.data)
    }, [props.data])


    const { deleteapi_services } = api_services({
        api_path: ``
    })

    const handleDelete = (item) => {
        if (confirm('Anda yakin menghapus data ini?')) {
            handleDeleteFnc(item)
        }
    }

    const handleDeleteFnc = async (item) => {
        // router.push(item.urldelete)
        // return
        // console.log('item')
        // console.log(item)
        const response = await deleteapi_services({ api_path: item.urldelete, id: item.id })
        // console.log('deleteapi_services')
        // console.log(response)

        if (response.error) return

        router.push(item.urlback ? item.urlback : item.urlredirect ? item.urlredirect : item.urldelete)
    }

    return (
        <>
            {is_page_readonly ? null : (
                <div className='d-flex flex-direction-row'>
                    {props.data.map((m, i) => {
                        let btn = 'btn-info'
                        if (m.label == 'Delete') {
                            btn = 'btn-danger'
                        }
                        if (m.label == 'Edit') {
                            btn = 'btn-warning'
                        }
                        if (m.label == 'Save' || m.label == 'SAVE') {
                            btn = 'btn-success'
                        }
                        if (props.btn_top && m.url) {
                            if (m.label == 'Add' && props.onAdd) {
                                return (
                                    <button key={i} className={`ml-2 btn-default-app ${btn}`} onClick={props.onAdd}>
                                        {m.icon ? (<span className='material-icons mr-1' style={{ fontSize: 16, marginTop: 0 }}>{m.icon}</span>) : null}
                                        {m.label}
                                    </button>
                                )
                            }
                            return (
                                <Link key={i} className={`ml-2 btn-default-app ${btn}`} href={m.url}>
                                    {m.icon ? (<span className='material-icons mr-1' style={{ fontSize: 16, marginTop: 0 }}>{m.icon}</span>) : null}
                                    {m.label}
                                </Link>
                            )
                        }
                        if (props.btn_top && m.onDelete) {
                            return (
                                <button key={i} className={`ml-2 btn-default-app ${btn}`} onClick={() => {
                                    if (m.urldelete) {
                                        handleDelete(m)
                                    } else {
                                        props.onDelete()
                                    }
                                    // m.urldelete ? handleDelete : props.onDelete
                                }}>
                                    {m.icon ? (<span className='material-icons mr-1' style={{ fontSize: 16, marginTop: 0 }}>{m.icon}</span>) : null}
                                    {m.label}
                                </button>
                            )
                        }
                        if (props.btn_top && m.checkbox) {
                            return (
                                <div className='d-flex align-items-center ms-3'>
                                    <label className={`flex flex-row`}>
                                        <input
                                            type={'checkbox'}
                                            value="1"
                                            disabled={false}
                                            checked={m.value}
                                            className={`me-2 rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                                            onChange={e => {
                                                props.oncheck(e.target.checked)
                                            }}
                                            style={{ width: 15 }}
                                        />
                                        {m.label ? m.label : ''}
                                    </label>
                                </div>

                            )
                        }
                        if (props.btn_bottom) {
                            return (
                                <Button key={i} className={`ml-2 btn-default-app ${btn}`}>
                                    {m.icon ? (<span className='material-icons mr-1' style={{ fontSize: 16, marginTop: 0 }}>{m.icon}</span>) : null}
                                    {m.label}
                                </Button>
                            )
                        }
                    })}
                </div>
            )}
        </>
    )
}

export default BtnGroup