import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:5002'

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
            icons: ['react-icons'],
          },
        },
      },
    },
    server: {
      proxy: {
        // Keep cookies same-origin in dev (required for httpOnly refresh-token sessions).
        '/api': {
          target,
          changeOrigin: true,
        },
        '/uploads': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
