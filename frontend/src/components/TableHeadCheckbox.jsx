

import React, { useState, useRef, useEffect } from 'react'
import BtnIcon from './BtnIcon'
import Select, { components } from 'react-select'
import { data } from 'autoprefixer'

const TableHeadCheckbox = props => {
    const [order, setOrder] = useState({
        name: '',
        sc: '',
    })

    const initialized = useRef(0)

    useEffect(() => {
        // console.log('filter')
        // console.log(filter)
        //first load

        if (!initialized.current) {
        } else {
            // console.log('order')
            // console.log(order)
            if (props.setOrder) {
                if (order.name) props.setOrder(order.name + ' ' + order.sc)
            }
        }
        // console.log('initialized.current')
        // console.log(initialized.current)
        if (initialized.current == 1) {
        }

        initialized.current++
    }, [order])

    var trs = document.querySelectorAll('tr')
    for (var i = 0; i < trs.length; i++) {
        trs[i].addEventListener('click', function () {
            // console.log('this')
            // console.log(this)
            for (var k = 0; k < trs.length; k++) {
                if (k != i) {
                    var cn = trs[k].className,
                        thc = ' selected'
                    cn = cn.replace(thc, '')
                    trs[k].className = cn
                }
            }

            this.className += ' selected'
        })
    }

    if (props.customheaders) {
        return (
            <>
                {props.customheaders.map((m, i) => (
                    <tr key={i}>
                        {i == 0 ? (
                            <th
                                className="border"
                                rowSpan={
                                    props.customheaders.length > 0
                                        ? props.customheaders.length
                                        : null
                                }>
                                No
                            </th>
                        ) : null}
                        {m.tr.map((x, y) => (
                            <th
                                className={`border ${x.align ? x.align : ''}`}
                                key={y}
                                colSpan={x.colSpan ? x.colSpan : null}
                                rowSpan={x.rowSpan ? x.rowSpan : null}>
                                {x.label}
                            </th>
                        ))}
                    </tr>
                ))}
            </>
        )
    }

    return (
        <>
            <tr>
                {/* {!props.noNumber ? (
                    <th className="border text-center" style={{ width: '1px' }}>
                        No
                    </th>
                ) : null} */}
                <th className="border text-center" style={{ width: '1px' }}>
                    <input
                        type='checkbox'
                        value={''}
                        onChange={e => {
                            props.onChecked(e.target.checked)
                        }}
                        disabled={props.checkboxDisabled}
                        checked={props.checked}
                    />
                </th>
                {props.data.map((m, i) => {
                    return (
                        <th
                            key={i}
                            className={
                                m.type == 'decimal'
                                    ? 'border text-right '
                                    : 'border text-left '
                            }>
                            {m.nofilter ? (
                                m.label
                            ) : (
                                <a
                                    href="#"
                                    onClick={() =>
                                        setOrder({
                                            name: m.name,
                                            sc:
                                                order.sc == '' ||
                                                    order.sc == 'desc'
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
                            )}
                        </th>
                    )
                })}
                <th className="border" style={{ width: '1px' }}></th>
            </tr>

            {props.showfilter || true ? (
                <>
                    <tr>
                        <td></td>
                        {props.data.map((m, i) => {
                            if (m.nofilter) {
                                return <td key={i} className="text-left "></td>
                            } else if (m.type == 'list') {
                                // console.log('props.referensi')
                                // console.log(m.name);
                                // console.log(props.referensi)
                                let dataarr = []
                                if (
                                    props.referensi &&
                                    props.referensi[m.name]
                                ) {
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
                                    <td key={i} style={{ maxWidth: m.width }}>
                                        <Select
                                            classNamePrefix="custom-select-rn-dnd"
                                            placeholder={`Filter...`}
                                            isMulti={false}
                                            options={dataarr}
                                            // value={selected}
                                            isClearable={true}
                                            onChange={e => {
                                                if (e)
                                                    props.onChange(
                                                        m.name,
                                                        e.value,
                                                    )
                                                else
                                                    props.onChange(m.name, null)
                                            }}
                                            styles={{
                                                placeholder: (
                                                    provided,
                                                    state,
                                                ) => ({
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
                                            style={{ width: '100%' }}
                                            type="text"
                                            className="form-control-transparent"
                                            // placeholder={`${m.label}...`}
                                            placeholder={`Filter...`}
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
                        <td className="" style={{ width: '1px' }}>
                            {/* <BtnIcon icon="search" onTap /> */}
                        </td>
                    </tr>
                </>
            ) : null}
        </>
    )
}

export default TableHeadCheckbox
