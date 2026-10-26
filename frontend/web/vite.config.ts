import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:8080'
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        // 开发环境把接口转到本地 Spring Boot。本地覆盖写在 .env.local 的 API_PROXY_TARGET。
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    // 直接编译 workspace 里的 TypeScript 源码
    optimizeDeps: {
      exclude: ['@our-pact/shared'],
    },
  }
})
