"use client"

import React, { useState, useRef, useEffect } from 'react'
import Select from 'react-select'
import AsyncSelect from 'react-select/async'

const TableHeadCustom = ({
  data = [],
  referensi = {},
  filter = {},
  onChange = () => { },
  setOrder = () => { },
  loadOptions = () => { },
  noNumber = false,
  ...props
}) => {
  const [order, setLocalOrder] = useState({ name: '', sc: '' })
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current && order.name) {
      setOrder(`${order.name} ${order.sc}`)
    }
    initialized.current = true
  }, [order])

  const renderFilterCell = (col) => {
    if (col.nofilter) {
      return <td key={`f-${col.name}`}></td>
    }

    if (col.type === 'list') {
      const dataarr = referensi[col.name]
        ? Object.entries(referensi[col.name]).map(([value, label]) => ({ value, label }))
        : []

      return (
        <td key={`f-${col.name}`}>
          <Select
            classNamePrefix="custom-select"
            placeholder="Filter..."
            isClearable
            options={dataarr}
            value={
              filter[col.name]
                ? dataarr.find(x => x.value === filter[col.name])
                : null
            }
            onChange={(e) => onChange(col.name, e ? e.value : null)}
          />
        </td>
      )
    }

    if (col.is_async) {
      return (
        <td key={`f-${col.name}`}>
          <AsyncSelect
            classNamePrefix="custom-select"
            placeholder="Filter..."
            isClearable
            defaultOptions
            loadOptions={(inputValue, callback) => loadOptions(inputValue, callback, col.name)}
            value={filter[col.name] ? { value: filter[col.name], label: filter[col.name] } : null}
            onChange={(e) => onChange(col.name, e ? e.value : null)}
          />
        </td>
      )
    }

    return (
      <td key={`f-${col.name}`}>
        <input
          type="text"
          className="form-control-transparent w-full"
          placeholder="Filter..."
          value={filter[col.name] || ''}
          onChange={(e) => onChange(col.name, e.target.value)}
        />
      </td>
    )
  }

  const row1 = []
  const row2 = []

  if (!noNumber) {
    row1.push(<th key="no" rowSpan={2} className="border text-center">No</th>)
  }

  // data.forEach(col => {
  //   if (col.children) {
  //     row1.push(
  //       <th key={col.label} colSpan={col.colspan || col.children.length} className="border text-center">
  //         {col.label}
  //       </th>
  //     )
  //     col.children.forEach(child => {
  //       row2.push(<th key={child.name} className="border text-center">{child.label}</th>)
  //     })
  //   } else {
  //     row1.push(
  //       <th key={col.name} rowSpan={2} className="border text-center">
  //         <a
  //           href="#"
  //           onClick={(e) => {
  //             e.preventDefault()
  //             setLocalOrder({
  //               name: col.name,
  //               sc: order.sc === 'asc' ? 'desc' : 'asc'
  //             })
  //           }}
  //         >
  //           {col.label}{' '}
  //           {order.name === col.name
  //             ? order.sc === 'asc' ? '⬇' : '⬆'
  //             : ''}
  //         </a>
  //       </th>
  //     )
  //   }
  // })


  data.forEach((col, idx) => {
    if (col.children) {
      row1.push(
        <th
          key={`${col.name || col.id || 'col'}-${idx}`}
          colSpan={col.colspan || col.children.length}
          className="border text-center"
        >
          {col.label}
        </th>
      )
      col.children.forEach((child, cIdx) => {
        row2.push(
          <th
            key={`${child.name || child.id || 'child'}-${idx}-${cIdx}`}
            className="border text-center"
          >
            {child.label}
          </th>
        )
      })
    } else {
      row1.push(
        <th
          key={`${col.name || col.id || 'col'}-${idx}`}
          rowSpan={2}
          className="border text-center"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setLocalOrder({
                name: col.name,
                sc: order.sc === 'asc' ? 'desc' : 'asc'
              })
            }}
          >
            {col.label}{' '}
            {order.name === col.name
              ? order.sc === 'asc' ? '⬇' : '⬆'
              : ''}
          </a>
        </th>
      )
    }
  })


  row1.push(<th key="aksi" rowSpan={2} className="border text-center"></th>)

  return (
    <>
      <tr>{row1}</tr>
      <tr>{row2}</tr>
      {props.nofilter ? null : (
        <tr>
          {!noNumber ? <td></td> : null}
          {data.map((col, idx) => {
            if (col.children) {
              return col.children.map(child => renderFilterCell(child))
            } else {
              return renderFilterCell(col)
            }
          })}
          <td></td>
        </tr>
      )}
    </>
  )
}

export default TableHeadCustom
