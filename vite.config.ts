import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.BASE_PATH ? process.env.BASE_PATH.replace(/\/?$/, '/') : '/campaign-dashboard0-v2-4/',
  plugins: [react()],
  server: {
    proxy: {
      '/campaign-dashboard0-v2-4/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})