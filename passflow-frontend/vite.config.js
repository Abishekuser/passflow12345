import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/student': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/parent': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/gate': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/warden': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
