/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}

declare module 'lottie-miniprogram' {
  const lottie: {
    setup: (canvas: unknown) => void
    loadAnimation: (options: Record<string, unknown>) => { destroy?: () => void }
  }
  export default lottie
}
