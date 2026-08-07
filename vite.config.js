import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  const backendProxy = {
    target: backendTarget,
    changeOrigin: false,
    secure: false,
    configure(proxy) {
      proxy.on('proxyRes', (proxyRes) => {
        const location = proxyRes.headers.location
        if (!location) return

        try {
          const targetOrigin = new URL(backendTarget).origin
          if (location.startsWith(targetOrigin)) {
            proxyRes.headers.location = location.slice(targetOrigin.length) || '/'
          }
        } catch {
          // Keep the original Location header when the target is not a valid URL.
        }
      })
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/website': backendProxy,
        '/manager': backendProxy,
        '/api': backendProxy,
        '/uploads': backendProxy,
        '/csrf': backendProxy,
        '/login': backendProxy,
        '/logout': backendProxy,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          url: 'http://localhost/',
        },
      },
      setupFiles: './src/test/setup.js',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      restoreMocks: true,
      clearMocks: true,
      mockReset: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        reportsDirectory: './coverage',
        include: [
          'src/services/portfolioApi.js',
          'src/localization/LanguageProvider.jsx',
          'src/components/NotFoundPage.jsx',
        ],
        exclude: ['src/test/**', 'e2e/**'],
      },
    },
    build: {
      manifest: true,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('/gsap/')) return 'vendor-gsap'
            if (id.includes('@mantine')) return 'vendor-mantine'
            if (id.includes('@react-three') || id.includes('/three/') || id.includes('@dimforge') || id.includes('@react-spring') || id.includes('postprocessing') || id.includes('rapier') || id.includes('/zustand/') || id.includes('/suspend-react/') || id.includes('/tunnel-rat/') || id.includes('/maath/')) return 'vendor-three'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react'
            return 'vendor'
          },
        },
      },
    },
  }
})
