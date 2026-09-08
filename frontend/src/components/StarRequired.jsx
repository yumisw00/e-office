import { colorsPallette } from 'pages/Utils'
import React from 'react'

const StarRequired = (props) => {
    if (props.disabled) return null
    return (
        <span style={{ color: colorsPallette.danger }}>*</span>
    )
}

export default StarRequired