import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/website': env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        '/manager': env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        '/uploads': env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('@mantine')) return 'vendor-mantine'
            if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui'
            if (id.includes('@react-three') || id.includes('three') || id.includes('@dimforge') || id.includes('@react-spring') || id.includes('postprocessing') || id.includes('rapier')) return 'vendor-three'
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
            return 'vendor'
          },
        },
      },
    },
  }
})
