// import Link from 'components/Link'
import { Link as Link1, NavLink } from 'react-router-dom';

const Link = ({ children, ...props }) => {
    var link_to = props.href;
    delete props.href;

    if (props.blank) {
        return <Link1
            target='_blank'
            to={link_to}
            {...props}>
            {children}
        </Link1>
    }
    return <Link1
        to={link_to}
        {...props}>
        {children}
    </Link1>
};

export default Link;