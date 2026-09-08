import { id_status_first_line_color_grey_arr, is_activated_first_line_status_color_grey, status_line_tod_arr, status_line_toe_arr, status_line_too_arr } from "pages/(app)/CsaIndexPage"
import { colorsPallette } from "pages/Utils"

const Badges = (props) => {
    let hex = ''

    if (props.hexColor) {
        hex = props.hexColor
    }
    if (is_activated_first_line_status_color_grey && props.hasOwnProperty('line') && props.hasOwnProperty('id_status')) {
        if (
            (props.line == 'too' && status_line_too_arr[0] == props.id_status) ||
            (props.line == 'tod' && status_line_tod_arr[0] == props.id_status) ||
            (props.line == 'toe' && status_line_toe_arr[0] == props.id_status)) {
            hex = colorsPallette.grey
        }
    }
    let hexText = 'white'
    if (props.textColor) {
        hexText = props.textColor
    }

    if (props.label && props.label === 'Ajukan') {
        hexText = 'black'
    }
    return (
        <span
            style={!hex ? null : {
                backgroundColor: hex,
                color: hexText
            }}
            className={`badge ${!hex ? `badge-${props.type ? props.type : 'warning'}` : ``} `}>{props.label}</span>
    )
}

export default Badges