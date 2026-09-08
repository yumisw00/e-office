import React, { useState } from "react";

// RadioInputComponent.jsx
// - Tailwind-based single-file React component + demo App
// - Export default App for quick preview

const InputRadio = ({
    name,
    data = [],
    value: controlledValue,
    onChange,
    orientation = "horizontal", // "vertical" or "horizontal"
    label,
    required = false,
    ...props
}) => {
    const isControlled = controlledValue !== undefined;
    const [value, setValue] = useState(controlledValue ?? "");

    const selected = isControlled ? controlledValue : value;

    function handleChange(e) {
        const next = e.target.value;
        if (!isControlled) setValue(next);
        if (onChange) onChange(next);
    }

    return (
        <fieldset className="mb-4">
            {label && (
                <legend className="mb-2 text-sm font-medium text-gray-700">{label}{required ? " *" : ""}</legend>
            )}

            <div
                role="radiogroup"
                aria-label={label || name}
                className={orientation === "horizontal" ? "flex gap-4" : "flex flex-col gap-2"}
            >
                {data.map((opt, i) => (
                    <label
                        key={i}
                        className="inline-flex items-center gap-2 cursor-pointer select-none"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={String(selected) === String(opt.value)}
                            onChange={handleChange}
                            className="form-radio h-4 w-4"
                            aria-checked={String(selected) === String(opt.value)}
                        />
                        <span className="text-sm">{opt.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

export default InputRadio