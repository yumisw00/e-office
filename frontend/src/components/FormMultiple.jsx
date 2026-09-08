import BtnIconAct from "./BtnIconAct";

const FormMultiple = ({ ...props }) => {

    let no = 1;
    return <>
        {(props.rows ? props.rows.map((r, i) => {
            return (props.form(i, no++, !props.disabled ? <BtnIconAct icon="delete" className="btn-danger" onTap={() => {
                var newrows = props.rows.filter((v, k) => { console.log('k'); console.log(k); return k != i });
                props.onChange([...newrows])
            }} /> : null))
        }) : null)}
        {!props.disabled ? props.buttonAdd(
            <BtnIconAct icon="add" className="btn-info" onTap={
                () => {
                    props.onChange([...props.rows, {}]);
                }
            } />) : null
        }
    </ >
}

export default FormMultiple