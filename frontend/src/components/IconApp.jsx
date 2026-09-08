

const IconApp = (props) => {
    return (
        <span className='material-icons' style={{ fontSize: props.size ? props.size : 24 }}>{props.icon}</span>
    )
}

export default IconApp