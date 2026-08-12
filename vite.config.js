import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
    plugins: [react()],
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
      // Unit files are isolated child processes; file-level parallelism stays
      // enabled, but the reference worker count stays at the two-vCPU hosted floor
      // so jsdom cannot oversubscribe a private-repository runner.
      pool: 'forks',
      isolate: true,
      fileParallelism: true,
      maxWorkers: Number(process.env.VITEST_WORKERS || 2),
      sequence: {
        concurrent: false,
        hooks: 'stack',
        setupFiles: 'list',
      },
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
        // V22: coverage now samples the actual runtime engines instead of only
        // three high-coverage leaf modules. The baseline is intentionally
        // realistic; critical modules are raised incrementally as tests grow.
        include: [
          'src/services/portfolioApi.js',
          'src/services/authApi.js',
          'src/components/admin/useAdminAsyncCoordinator.js',
          'src/localization/LanguageProvider.jsx',
          'src/components/NotFoundPage.jsx',
          'src/performance/performanceMetrics.js',
          'src/performance/runtimeScheduler.js',
          'src/animations/timelineMotion.js',
          'src/animations/timelineInspectionEngine.js',
          'src/animations/volcanoSimulationEngine.js',
          'src/animations/volcanoRockfallEngine.js',
          'src/ocean/oceanWorldEngine.js',
          'src/ocean/oceanTransitionTimings.js',
          'src/ocean/oceanRuntimePolicy.js',
          'src/utils/responsiveImage.js',
        ],
        exclude: ['src/test/**', 'e2e/**'],
        thresholds: {
          statements: 82,
          branches: 70,
          functions: 85,
          lines: 84,
        },
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
            if (id.includes('@mantine') || id.includes('@floating-ui') || id.includes('/clsx/') || id.includes('react-number-format') || id.includes('react-remove-scroll') || id.includes('react-remove-scroll-bar') || id.includes('react-style-singleton') || id.includes('use-callback-ref') || id.includes('use-sidecar') || id.includes('get-nonce') || id.includes('tabbable') || id.includes('detect-node-es') || id.includes('/tslib/')) return 'vendor-mantine'
            if (id.includes('react-router') || id.includes('/cookie/') || id.includes('set-cookie-parser')) return 'vendor-router'
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react'
            return 'vendor'
          },
        },
      },
    },
  }
})
