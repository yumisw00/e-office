import Dropdown from 'react-bootstrap/Dropdown'
import { api_services } from 'hooks/api_services'
import Link from 'components/Link'
import { useSelector, useDispatch } from 'react-redux'

const EditDeleteIdx = props => {

    return (
        <Dropdown>
            <Dropdown.Toggle variant="" id="dropdown-basic">
                <span className="material-icons">more_vert</span>
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <Dropdown.Item
                    onClick={props.onEdit}
                    className="d-flex align-items-center">
                    <span
                        className="material-icons"
                        style={{ fontSize: 18, marginRight: 7 }}>
                        edit
                    </span>{' '}
                    Edit
                </Dropdown.Item>
                <Dropdown.Item
                    onClick={props.onDelete}
                    className="d-flex align-items-center">
                    <span
                        className="material-icons"
                        style={{ fontSize: 18, marginRight: 7 }}>
                        delete
                    </span>{' '}
                    Delete
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>

    )
}

export default EditDeleteIdx
