import { api_services } from 'hooks/api_services'
import BtnIconAct from 'components/BtnIconAct'
import { useSelector } from 'react-redux'

const EditDelete = props => {
    const is_page_readonly = useSelector(state => state.is_page_readonly)
    const { deleteapi_services } = api_services({
        api_path: ``,
    })

    const handleDelete = url => {
        let alertDelete = 'Anda yakin menghapus data ini?'
        if (props.alertDelete) {
            alertDelete = props.alertDelete

        }
        if (confirm(alertDelete)) {
            if (props.onDelete) {
                props.onDelete()
                return
            }
            handleDeleteFnc(url, props.id)
            if (props.otherUrl) {
                handleDeleteFnc(props.otherUrl, props.id)
            }
        }
    }

    const handleDeleteFnc = async (url, id) => {
        // router.push(item.urldelete)
        // return
        // console.log('item')
        // console.log(url)
        // console.log(item)
        // return
        const response = await deleteapi_services({ api_path: `/${url}`, id })
        // console.log('deleteapi_services')
        // console.log(response)

        if (response.error) return

        props.onLoad()
    }

    if (is_page_readonly) return null

    return (
        <div className="flex align-center justify-center td-action" style={{ gap: 2 }}>
            {(props.data || []).map((m, i) => {
                const isEdit = m.label === 'Edit'
                const isDelete = ['Delete', 'Hapus'].includes(m.label)
                const className = isEdit ? 'btn-warning' : isDelete ? 'btn-danger' : 'btn-info'
                const onTap = m.onClick || (isEdit ? props.onEdit : () => handleDelete(m.url))
                const href = m.href || (isEdit && !props.onEdit && !m.onClick
                    ? (m.url_full ? `/${m.url_full}` : `/${m.url}/edit/${props.addurledit ? `${props.addurledit}/` : ''}${props.id}`)
                    : undefined)

                return (
                    <BtnIconAct
                        key={i}
                        className={className}
                        icon={m.icon}
                        href={href}
                        blank={m.blank === true}
                        onTap={href ? undefined : onTap}
                        tooltips={m.label}
                    />
                )
            })}
        </div>
    )
}

export default EditDelete
