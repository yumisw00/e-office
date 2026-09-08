

import React, { useState, useRef, useEffect } from 'react'
import BtnIcon from './BtnIcon'
import Select, { components } from 'react-select'
import { data } from 'autoprefixer'

const TableHeadTanpaNomor = props => {
    const [order, setOrder] = useState({
        name: '',
        sc: '',
    })

    const initialized = useRef(false)

    useEffect(() => {
        // console.log('filter')
        // console.log(filter)
        //first load
        if (!initialized.current) {
            initialized.current = true
        } 
        if(true) {
            // console.log('order')
            // console.log(order)
            if (props.setOrder) {
                if (order.name) props.setOrder(order.name + ' ' + order.sc)
            }
        }
    }, [order])

    return (
        <>
            <tr>
                {props.data.map((m, i) => {
                    if (m.type == 'list') {
                        // console.log('props.referensi')
                        // console.log(m.name);
                        // console.log(props.referensi)
                        let dataarr = []
                        if (props.referensi && props.referensi[m.name]) {
                            // console.log(props.referensi[m.name])
                            // console.log(props.referensi[m.name].length)
                            for (const [i, n] of Object.entries(
                                props.referensi[m.name],
                            )) {
                                // props.referensi[m.name].map((n, i) => {
                                // console.log({
                                //     label: n,
                                //     value: i,
                                // });
                                dataarr.push({
                                    label: n,
                                    value: i,
                                })
                            }
                        }
                        // console.log(dataarr)
                        return (
                            <td key={i} className="text-left ">
                                <Select
                                    classNamePrefix="custom-select-rn-dnd"
                                    placeholder="Filter..."
                                    isMulti={false}
                                    options={dataarr}
                                    // value={selected}
                                    isClearable={true}
                                    onChange={e => {
                                        if (e) props.onChange(m.name, e.value)
                                        else props.onChange(m.name, null)
                                    }}
                                    styles={{
                                        placeholder: (provided, state) => ({
                                            ...provided,
                                            fontSize: 14,
                                        }),
                                        option: (
                                            styles,
                                            {
                                                data,
                                                isDisabled,
                                                isFocused,
                                                isSelected,
                                            },
                                        ) => {
                                            return {
                                                ...styles,
                                                fontSize: 14,
                                            }
                                        },
                                        control: styles => ({
                                            ...styles,
                                            fontSize: 14,
                                        }),
                                    }}
                                />
                            </td>
                        )
                    } else
                        return (
                            <td key={i} style={{ maxWidth: m.width }}>
                                <input
                                    type="text"
                                    className="form-control-transparent"
                                    placeholder="Filter..."
                                    onChange={event =>
                                        props.onChange(
                                            m.name,
                                            event.target.value,
                                        )
                                    }
                                />
                            </td>
                        )
                })}
                <td className="">{/* <BtnIcon icon="search" onTap /> */}</td>
            </tr>
            <tr>
                {props.data.map((m, i) => (
                    <td key={i} className="text-left border">
                        <a
                            href="#"
                            onClick={() =>
                                setOrder({
                                    name: m.name,
                                    sc:
                                        order.sc == '' || order.sc == 'desc'
                                            ? 'asc'
                                            : 'desc',
                                })
                            }>
                            {m.label}{' '}
                            {order.name == m.name
                                ? order.sc == 'asc'
                                    ? '⬇'
                                    : '⬆'
                                : ''}
                        </a>
                    </td>
                ))}
                <td className="border" />
            </tr>
        </>
    )
}

export default TableHeadTanpaNomor
