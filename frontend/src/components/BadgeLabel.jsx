const BadgeLabel = (props) => {
  if (props.dot) {
    return (
      <div className="d-flex align-items-center me-2">
        <div className="dot" style={{ backgroundColor: props.dot, border: props.dotBorder ? `1px solid ${props.dotBorder}` : `unset` }}></div>
        <div className="dot-value ms-1">{props.label}</div>
      </div>
    )
  }
  return (
    <div className={`${props.className ? props.className : ''} badge-item`} style={props.style} >{props.label}</div>
  )
}

export default BadgeLabel