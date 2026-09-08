import { urlPreviewNew } from 'pages/Utils'
import React, { Component } from 'react'
import { usePathname } from 'components/Navigation'

export default class page extends Component {
    constructor(props) {
        super(props)
        // inisialisasi state
        this.state = {
            is_loading: false,
            jenis: 'pdf',
            fileurl: null
        }
    }
    componentDidMount() {
        this.init()
    }

    init = async () => {
        // const pathname = usePathname()
        const pathname = this.props?.pathname || null
        if (!pathname) return
        const pathname_arr = pathname.split('/')
        let path = pathname_arr[pathname_arr.length - 2]
        let id = pathname_arr[pathname_arr.length - 1]

        const url = `${urlPreviewNew(`${path}/${id}`)}`

        console.log('INIT=>INIT');
        console.log(pathname.split('/'));
        console.log('url');
        console.log(url);

        this.setState(state => ({
            is_loading: true
        }))

        const fileurl = await this.fetchPDFwithBlob(url)
        this.setState(state => ({
            is_loading: false,
            fileurl
        }))
    }

    fetchPDFwithBlob = async (url) => {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                action: 'index',
                page: '',
            },
            credentials: 'include',

        });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        return blobUrl
    };

    render() {
        if (this.state.is_loading) {
            <div className='w-full d-flex align-items-center' style={{ height: '100vh' }}>
                <div className='text-center'>Loading...</div>
            </div>
        }
        if (this.state.fileurl) {
            return (
                <iframe
                    src={this.state.fileurl}
                    className="w-full"
                    style={{
                        // height: 'calc(100vh - 59.02px)',
                        height: '100%',
                        minHeight: '100vh'
                    }}>

                </iframe>
            )
        }
        // if (this.state.fileurl) {
        //     return (
        //         <img src={this.state.fileurl} alt="Preview" className="w-full" />
        //     )
        // }
    }
}
