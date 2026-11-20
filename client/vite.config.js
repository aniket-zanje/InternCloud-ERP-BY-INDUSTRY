import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Keep your existing plugin line if you use @vitejs/plugin-react-swc instead.
// The important part is the `server.proxy` block: it forwards API + upload
// requests to Express, so the browser never hits CORS problems in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
})
