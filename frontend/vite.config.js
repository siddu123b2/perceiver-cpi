import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The backend runs on :8000. Proxying means the browser only ever talks to :5173,
// so there are no cross-origin surprises during the demo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
})
