import IconApp from "./IconApp"


const InputRadioDescArr = (props) => {
    return (
        <div>
            {props.data.map((m, i) => (
                <div
                    onClick={() => {
                        if (props.disabled) return
                        props.onChange(m.value)
                    }}
                    className="d-flex cursor-pointer mb-1"
                    key={i}
                >
                    <IconApp
                        icon={m.value == props.value ? "radio_button_checked" : "radio_button_unchecked"}
                        onTap={() => null}
                    />
                    <div className="flex-1 ps-2">
                        <div className="bold">{m.label}</div>
                        {m.desc_arr && m.desc_arr.length > 0 ? m.desc_arr.map((a, b) => (
                            <p key={b} className={m.value == props.value ? "color-black" : "color-grey"}>{a}</p>
                        )) : null}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default InputRadioDescArr