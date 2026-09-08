import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
// import 'bootstrap/dist/css/bootstrap.min.css';

const TooltipsApp = ({ id, children, title }) => {
    return (
        <OverlayTrigger overlay={<Tooltip id={id} style={{ position: 'fixed' }}>{title}</Tooltip>}>
            <div className='cursor-pointer' style={{ display: 'inline-block', position: 'relative', width: 'fit-content' }}>{children}</div>
        </OverlayTrigger>
    )
}

export default TooltipsApp