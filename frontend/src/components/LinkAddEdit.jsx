import Link from 'components/Link'
import { useSelector, useDispatch } from 'react-redux'

const LinkAddEdit = (props) => {
    // const is_page_readonly = useSelector(state => state.is_page_readonly)
    // if (is_page_readonly) {
    //     return props.label
    // }
    return (
        <Link href={props.href}>
            {props.label}
        </Link>
    )
}

export default LinkAddEdit