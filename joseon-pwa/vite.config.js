import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icons/joseonlog_log_192.png',
        'icons/joseonlog_log_512.png'
      ],
      manifest: {
        name: '조선로그',
        short_name: '조선.LOG',
        description: '조선왕조 역사 공간 탐방 가이드',
        theme_color: '#1A1208',
        background_color: '#F5F1EB',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/joseonlog_log_192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/joseonlog_log_512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/joseonlog_log_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: 60 * 60
              }
            }
          }
        ]
      }
    })
  ]
})