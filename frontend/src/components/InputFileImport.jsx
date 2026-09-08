import { showToastr } from 'pages/Utils';
import React from 'react'

const InputFileImport = (props) => {
    let validImageTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    return (
        <div className='container-input-import'>
            {props.is_loading ? 'Loading...' : (props?.title || `Import RCM ${props.typeRcm}`)}
            <input
                type='file'
                onChange={e => {
                    const file = e.target.files[0];
                    // console.log(file)

                    // if (!validImageTypes.includes(file['type'])) {
                    //     showToastr('error', 'File harus *.xls atau *.xlsx')
                    //     return;
                    // }

                    props.onChange(file)
                }}
                value={props.value}
                className='form-control input-import'
            />
        </div>
    )
}

export default InputFileImport