import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
const path = require('path');

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_PROXY_BACKEND_URL || env.VITE_BACKEND_URL
  const backendProxy = {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
    rewrite: proxyPath => proxyPath.replace(/^\/_backend/, ''),
    configure: proxy => {
      proxy.on('proxyRes', proxyRes => {
        const cookies = proxyRes.headers['set-cookie']

        if (!cookies) return

        proxyRes.headers['set-cookie'] = cookies.map(cookie =>
          cookie
            .replace(/;\s*domain=[^;]+/ig, '')
            .replace(/;\s*secure/ig, '')
            .replace(/;\s*samesite=none/ig, '; SameSite=Lax')
        )
      })
    },
  }

  return defineConfig({
    appType: 'spa',
    server: {
      hmr: false,
      proxy: {
        '/_backend': backendProxy,
      },
    },
    plugins: [react()],
    define: {
      "process.env.NODE_ENV": `"${mode}"`,
    },
    resolve: {
      alias: {
        'components': path.resolve('src/components/'),
        'pages': path.resolve('src/pages/'),
        'lib': path.resolve('src/lib/'),
        'hooks': path.resolve('src/hooks/'),
        // 'images': path.resolve('src/images/'),
      }
    }
  })
}
