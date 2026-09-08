

import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'pages/global.css'
import { colorsPallette } from './Utils';

import { Provider } from 'react-redux';
import store from 'hooks/redux';


const RootLayout = ({ children }) => {
    return (
        <Provider store={store}>
            {children}
            <Toaster
                toastOptions={{
                    success: {
                        style: {
                            background: colorsPallette.success,
                            color: 'white'
                        },
                    },
                    error: {
                        style: {
                            background: colorsPallette.danger,
                            color: 'white'
                        },
                    },
                }}

            />
        </Provider>
    )
}

export default RootLayout
