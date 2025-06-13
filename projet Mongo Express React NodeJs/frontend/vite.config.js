import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Toutes les requêtes commençant par /api seront redirigées vers le backend
      '/api': 'http://localhost:4000'
    }
  }
})

