/// <reference types="vite/client" />

export {}

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
  }
}

interface ImportMetaEnv {
  /** 高德开放平台 Key */
  readonly VITE_AMAP_KEY: string
  /** 高德安全密钥 */
  readonly VITE_AMAP_SECURITY_CODE: string
}
