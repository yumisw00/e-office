


const BtnRemove = (props) => {
    return (
        <div className={`btn-remove ${props.className || ''}`} onClick={props.onTap ? props.onTap : null}>
            <span className='material-icons' style={{ fontSize: props.size ? props.size : 24, color: props.color ? props.color : 'white' }}>{props.icon}</span>
        </div>
    )
}

export default BtnRemove