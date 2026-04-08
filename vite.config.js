import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'recipe-icon.svg'],
      manifest: {
        name: 'RecipeSnap',
        short_name: 'RecipeSnap',
        description: 'Bloat-free recipe extractor and cookbook.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'recipe-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'recipe-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true
      }
    }
  }
})
