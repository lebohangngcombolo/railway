import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'https://server-batm.onrender.com',
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Example: Split vendor code
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Example: Split out admin pages
          admin: ['./src/pages/AdminDashboard.tsx', './src/pages/AdminTeam.tsx'],
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://server-batm.onrender.com')
  }
})
